import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  catalogProducts,
  clinics,
  orders,
  orderRxs,
  patients,
  type Clinic,
  type ClinicProvider,
  type Order,
} from "@/lib/db/schema";
import { getLifeFileClient } from "@/lib/lifefile/client";
import { isControlledSchedule } from "@/lib/lifefile/constants";
import {
  buildLifeFileOrderPayload,
  type BuildOrderInput,
  type BuildRxInput,
} from "@/lib/lifefile/payload";
import { log } from "@/lib/observability/logger";
import { recordAudit } from "@/lib/audit/log";
import { notifyOrderProblem } from "@/lib/notifications/slack";
import { runAfterResponse } from "@/lib/runtime/after";
import {
  firstZodIssue,
  orderSubmissionSchema,
  type OrderSubmission,
} from "./validation";

/**
 * The single order pipeline: dashboard submissions today, clinic API keys
 * later — both funnel through `submitClinicOrder`.
 *
 * Clinic isolation is enforced here, not in callers: the clinic row is
 * resolved from the authenticated Clerk user, the patient must belong to that
 * clinic, the prescriber must be a provider on that clinic's profile, and the
 * order row is stamped with the clinic id that every later read filters on.
 */

export type SubmitOrderResult =
  | {
      ok: true;
      orderId: number;
      lfOrderId: string | null;
      status: Order["status"];
      /** True when this call returned a previously stored submission. */
      deduped: boolean;
    }
  | { ok: false; error: string };

interface HydratedRx extends BuildRxInput {
  catalogProductId: string;
}

function hydrateRxs(
  submission: OrderSubmission,
  products: Map<string, typeof catalogProducts.$inferSelect>,
): { ok: true; rxs: HydratedRx[] } | { ok: false; error: string } {
  const rxs: HydratedRx[] = [];
  for (const [i, rx] of submission.rxs.entries()) {
    const product = products.get(rx.productId);
    if (!product || !product.active) {
      return { ok: false, error: `Medication ${i + 1} is not available.` };
    }
    if (product.lfProductId == null) {
      return {
        ok: false,
        error:
          `${product.name} is not enabled for online ordering yet — ` +
          "contact us to order it.",
      };
    }
    if (isControlledSchedule(product.scheduleCode)) {
      return {
        ok: false,
        error:
          `${product.name} is a controlled substance and cannot be ` +
          "ordered online. Please use the LifeFile portal.",
      };
    }
    rxs.push({
      catalogProductId: product.id,
      lfProductId: product.lfProductId,
      drugName: product.name,
      drugStrength: product.strength,
      drugForm: product.form,
      directions: rx.directions,
      quantity: rx.quantity ?? product.defaultQuantity,
      quantityUnits: product.quantityUnits,
      daysSupply: rx.daysSupply ?? null,
      refills: rx.refills,
      dateWritten: new Date().toISOString().slice(0, 10),
      scheduleCode: product.scheduleCode,
      clinicalDifferenceStatement: rx.clinicalDifferenceStatement,
    });
  }
  return { ok: true, rxs };
}

function findPrescriber(
  clinic: Clinic,
  npi: string,
): ClinicProvider | null {
  return clinic.providers.find((p) => p.npi.replace(/\D/g, "") === npi) ?? null;
}

/**
 * Postgres unique-violation (the idempotency index firing on a retry).
 * Walks the `cause` chain because drizzle wraps driver errors in
 * `DrizzleQueryError` with the original pg error as `cause`.
 */
function isUniqueViolation(err: unknown, depth = 0): boolean {
  if (typeof err !== "object" || err === null || depth > 5) return false;
  const candidate = err as { code?: unknown; cause?: unknown };
  if (candidate.code === "23505") return true;
  return isUniqueViolation(candidate.cause, depth + 1);
}

export async function submitClinicOrder(
  clerkUserId: string,
  rawInput: unknown,
): Promise<SubmitOrderResult> {
  // --- Resolve + gate the clinic (isolation starts here) ---
  const [clinic] = await db
    .select()
    .from(clinics)
    .where(eq(clinics.clerkUserId, clerkUserId))
    .limit(1);

  if (!clinic) return { ok: false, error: "Clinic profile not found." };
  if (clinic.verificationStatus !== "verified") {
    return { ok: false, error: "Your account is not verified yet." };
  }
  if (!clinic.lifefileOrderingEnabled) {
    return {
      ok: false,
      error:
        "Online ordering is not enabled for your account yet. " +
        "Contact us to get set up.",
    };
  }

  // --- Validate the submission ---
  const parsed = orderSubmissionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: firstZodIssue(parsed.error) };
  }
  const submission = parsed.data;

  // --- Patient must belong to this clinic ---
  const [patient] = await db
    .select()
    .from(patients)
    .where(
      and(
        eq(patients.id, submission.patientId),
        eq(patients.clinicId, clinic.id),
      ),
    )
    .limit(1);
  if (!patient) return { ok: false, error: "Patient not found." };

  // --- Prescriber must be a provider on this clinic's profile ---
  const prescriber = findPrescriber(clinic, submission.prescriberNpi);
  if (!prescriber) {
    return {
      ok: false,
      error: "Prescriber not found on your clinic profile.",
    };
  }

  // --- Hydrate drug data from the catalog ---
  const productIds = [...new Set(submission.rxs.map((rx) => rx.productId))];
  const productRows = productIds.length
    ? await db
        .select()
        .from(catalogProducts)
        .where(eq(catalogProducts.active, true))
    : [];
  const productMap = new Map(
    productRows
      .filter((p) => productIds.includes(p.id))
      .map((p) => [p.id, p]),
  );
  const hydrated = hydrateRxs(submission, productMap);
  if (!hydrated.ok) return hydrated;

  const referenceId = `LGS-${submission.submissionKey}`;

  // --- Persist first (idempotency), then forward ---
  let orderRow: Order;
  try {
    orderRow = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(orders)
        .values({
          clinicId: clinic.id,
          patientId: patient.id,
          referenceId,
          status: "submitted",
          prescriber: {
            npi: submission.prescriberNpi,
            firstName: prescriber.firstName,
            lastName: prescriber.lastName,
            licenseState: prescriber.licenseState || undefined,
            licenseNumber: prescriber.medicalLicense || undefined,
            phone: clinic.practicePhone || undefined,
            email: clinic.contactEmail || undefined,
          },
          shipping: {
            recipientType: submission.shipping.recipientType,
            recipientFirstName: submission.shipping.recipientFirstName,
            recipientLastName: submission.shipping.recipientLastName,
            recipientPhone: submission.shipping.recipientPhone,
            recipientEmail: submission.shipping.recipientEmail,
            addressLine1: submission.shipping.addressLine1,
            addressLine2: submission.shipping.addressLine2,
            city: submission.shipping.city,
            state: submission.shipping.state,
            zipCode: submission.shipping.zipCode,
          },
          serviceId:
            submission.shipping.serviceId ??
            clinic.lifefileDefaultServiceId ??
            null,
          payorType: submission.payorType,
          memo: submission.memo ?? null,
          submittedBy: clerkUserId,
        })
        .returning();

      await tx.insert(orderRxs).values(
        hydrated.rxs.map((rx) => ({
          orderId: inserted.id,
          catalogProductId: rx.catalogProductId,
          lfProductId: rx.lfProductId,
          drugName: rx.drugName,
          drugStrength: rx.drugStrength ?? null,
          drugForm: rx.drugForm ?? null,
          directions: rx.directions,
          quantity: rx.quantity ?? null,
          quantityUnits: rx.quantityUnits ?? null,
          daysSupply: rx.daysSupply ?? null,
          refills: rx.refills ?? 0,
          dateWritten: rx.dateWritten,
          clinicalDifferenceStatement:
            rx.clinicalDifferenceStatement ?? null,
        })),
      );

      return inserted;
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      // Retry of a submission we already have — return the stored outcome
      // instead of double-submitting to the pharmacy.
      const [existing] = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.clinicId, clinic.id),
            eq(orders.referenceId, referenceId),
          ),
        )
        .limit(1);
      if (existing) {
        return {
          ok: true,
          orderId: existing.id,
          lfOrderId: existing.lfOrderId,
          status: existing.status,
          deduped: true,
        };
      }
    }
    log.error("order insert failed", { clinicId: clinic.id, error: err });
    return { ok: false, error: "Could not save the order. Try again." };
  }

  // --- Build the LifeFile payload and forward ---
  const buildInput: BuildOrderInput = {
    messageId: orderRow.id,
    referenceId,
    memo: submission.memo,
    practiceId: clinic.lifefilePracticeId,
    payorType: submission.payorType,
    prescriber: {
      npi: submission.prescriberNpi,
      firstName: prescriber.firstName,
      lastName: prescriber.lastName,
      licenseState: prescriber.licenseState,
      licenseNumber: prescriber.medicalLicense,
      phone: clinic.practicePhone,
      email: clinic.contactEmail,
    },
    patient: {
      firstName: patient.firstName,
      lastName: patient.lastName,
      middleName: patient.middleName,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth,
      address1: patient.address1,
      address2: patient.address2,
      city: patient.city,
      state: patient.state,
      zip: patient.zip,
      phoneHome: patient.phoneHome,
      phoneMobile: patient.phoneMobile,
      phoneWork: patient.phoneWork,
      email: patient.email,
    },
    shipping: {
      ...submission.shipping,
      serviceId:
        submission.shipping.serviceId ??
        clinic.lifefileDefaultServiceId ??
        null,
    },
    rxs: hydrated.rxs,
  };
  const payload = buildLifeFileOrderPayload(buildInput);

  const client = getLifeFileClient();
  const result = await client.submitOrder(payload);

  // --- Record the outcome ---
  const status: Order["status"] = result.ok
    ? "accepted"
    : result.kind === "rejected"
      ? "pharmacy_rejected"
      : "failed";

  await db
    .update(orders)
    .set({
      status,
      lfOrderId: result.ok && result.lfOrderId ? result.lfOrderId : null,
      messageId: orderRow.id,
      errorMessage: result.ok ? null : result.message.slice(0, 500),
      rawRequest: payload,
      rawResponse: result.ok ? result.raw : (result.raw ?? null),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderRow.id));

  runAfterResponse(
    recordAudit({
      actorType: "clinic",
      actorId: clerkUserId,
      action: result.ok ? "order.accepted" : "order.failed",
      targetType: "order",
      targetId: orderRow.id,
      // No PHI here on purpose: ids and drug names only.
      metadata: {
        clinicId: clinic.id,
        referenceId,
        lfOrderId: result.ok ? result.lfOrderId : null,
        status,
        drugs: hydrated.rxs.map((rx) => rx.drugName),
      },
    }),
  );

  if (!result.ok) {
    runAfterResponse(
      notifyOrderProblem({
        clinicName: clinic.clinicName || `Clinic #${clinic.id}`,
        orderId: orderRow.id,
        referenceId,
        status,
        reason: result.message,
      }),
    );
    // A pharmacy rejection / transport failure is an actionable outcome for
    // the clinic — the order is stored for support follow-up.
    return {
      ok: false,
      error:
        result.kind === "rejected"
          ? `The pharmacy could not accept this order: ${result.message}`
          : "The order was saved but could not reach the pharmacy. " +
            "Our team has been notified and will follow up.",
    };
  }

  return {
    ok: true,
    orderId: orderRow.id,
    lfOrderId: result.lfOrderId || null,
    status,
    deduped: false,
  };
}
