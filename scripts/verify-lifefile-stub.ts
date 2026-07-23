/**
 * End-to-end verification of the in-app ordering pipeline against a real
 * Postgres and the LifeFile STUB client (no live pharmacy traffic).
 *
 *   DATABASE_URL=postgres://... LIFEFILE_MODE=stub \
 *     NODE_OPTIONS=--conditions=react-server npx tsx scripts/verify-lifefile-stub.ts
 *
 * Seeds a verified clinic (ordering enabled), a patient, and a mapped catalog
 * SKU, then exercises the pipeline: gate rejection, happy path, idempotent
 * retry, unmapped-product rejection, and clinic isolation. Exits non-zero on
 * the first failed assertion. Safe to re-run (uses throwaway identifiers).
 */

import { config } from "dotenv";
config({ path: ".env.local" });

process.env.LIFEFILE_MODE = process.env.LIFEFILE_MODE || "stub";

import { eq } from "drizzle-orm";

async function main() {
  const { db } = await import("../src/lib/db");
  const { clinics, catalogProducts, orders } = await import(
    "../src/lib/db/schema"
  );
  const { submitClinicOrder } = await import("../src/lib/orders/service");
  const { getClinicOrderDetail, createClinicPatient, listClinicOrders } =
    await import("../src/lib/orders/data");

  let failures = 0;
  function check(name: string, ok: boolean, extra?: unknown) {
    if (ok) {
      console.log(`  ✓ ${name}`);
    } else {
      failures++;
      console.error(`  ✗ ${name}`, extra ?? "");
    }
  }

  const runId = Date.now().toString(36);
  const clerkA = `user_verify_a_${runId}`;
  const clerkB = `user_verify_b_${runId}`;
  const skuId = `verify-semaglutide-${runId}`;

  console.log("Seeding clinic A (verified + ordering enabled), clinic B…");
  const [clinicA] = await db
    .insert(clinics)
    .values({
      clerkUserId: clerkA,
      clinicName: "Verify Clinic A",
      practicePhone: "(305) 555-0100",
      contactEmail: "verify-a@example.com",
      providers: [
        {
          firstName: "Ada",
          lastName: "Prescriber",
          specialty: "family_medicine",
          npi: "1003802901",
          medicalLicense: "ME123456",
          licenseState: "FL",
          dea: "",
          additionalLicenses: [],
        },
      ],
      onboardingCompleted: true,
      verificationStatus: "verified",
      lifefileOrderingEnabled: true,
      lifefilePracticeId: 424242,
    })
    .returning();
  const [clinicB] = await db
    .insert(clinics)
    .values({
      clerkUserId: clerkB,
      clinicName: "Verify Clinic B",
      onboardingCompleted: true,
      verificationStatus: "verified",
      lifefileOrderingEnabled: true,
    })
    .returning();

  console.log("Seeding mapped catalog SKU + unmapped SKU…");
  await db.insert(catalogProducts).values([
    {
      id: skuId,
      name: "Semaglutide / Cyanocobalamin (verify)",
      strength: "2.5mg/0.5mg per mL",
      form: "Injectable",
      unit: "5 mL vial",
      lfProductId: 100000001,
      scheduleCode: "L",
      quantityUnits: "ml",
      defaultQuantity: "1",
    },
    {
      id: `${skuId}-unmapped`,
      name: "Unmapped Product (verify)",
      form: "Injectable",
    },
  ]);

  console.log("Creating a patient through the clinic-scoped helper…");
  const patientResult = await createClinicPatient(clinicA.id, {
    firstName: "Pat",
    lastName: "Verify",
    gender: "f",
    dateOfBirth: "1990-01-02",
    address1: "100 Test Blvd",
    city: "Orlando",
    state: "FL",
    zip: "32801",
    phoneMobile: "212-867-5309",
    allergies: ["penicillin"],
    conditions: [],
  });
  check("patient created", patientResult.ok, patientResult);
  if (!patientResult.ok) process.exit(1);
  const patient = patientResult.patient;

  const submission = {
    patientId: patient.id,
    prescriberNpi: "1003802901",
    payorType: "doc",
    memo: "Verification order",
    shipping: {
      recipientType: "patient",
      recipientFirstName: "Pat",
      recipientLastName: "Verify",
      recipientPhone: "(212) 867-5309",
      addressLine1: "100 Test Blvd",
      city: "Orlando",
      state: "FL",
      zipCode: "32801",
      serviceId: 8097,
    },
    rxs: [
      {
        productId: skuId,
        directions: "Inject 10 units (0.10 mL) subcutaneously once weekly.",
        quantity: "1",
        daysSupply: 28,
        refills: 0,
      },
    ],
    submissionKey: `verify${runId}0001`,
  };

  console.log("\n1. Happy path (stub forward)…");
  const result = await submitClinicOrder(clerkA, submission);
  check("order accepted", result.ok, result);
  if (result.ok) {
    check("stub lfOrderId assigned", Boolean(result.lfOrderId), result);
    check("status is accepted", result.status === "accepted", result);
    check("not deduped on first submit", result.deduped === false);

    const [row] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, result.orderId));
    check("raw request persisted", row.rawRequest != null);
    check("raw response persisted", row.rawResponse != null);
    check(
      "practice id stamped in payload",
      JSON.stringify(row.rawRequest).includes('"practice":{"id":424242}'),
      row.rawRequest,
    );
    check("message id = order id", row.messageId === result.orderId);
  }

  console.log("\n2. Idempotent retry (same submissionKey)…");
  const retry = await submitClinicOrder(clerkA, submission);
  check("retry accepted", retry.ok, retry);
  if (retry.ok && result.ok) {
    check("retry deduped", retry.deduped === true, retry);
    check("same order id", retry.orderId === result.orderId);
  }

  console.log("\n3. Unmapped product rejected before forwarding…");
  const unmapped = await submitClinicOrder(clerkA, {
    ...submission,
    submissionKey: `verify${runId}0002`,
    rxs: [{ ...submission.rxs[0], productId: `${skuId}-unmapped` }],
  });
  check(
    "unmapped product rejected",
    !unmapped.ok && /not enabled for online ordering/.test(unmapped.error),
    unmapped,
  );

  console.log("\n4. Clinic isolation…");
  if (result.ok) {
    const crossRead = await getClinicOrderDetail(clinicB.id, result.orderId);
    check("clinic B cannot read clinic A's order", crossRead === null);
    const ownRead = await getClinicOrderDetail(clinicA.id, result.orderId);
    check("clinic A reads its own order", ownRead !== null);
  }
  const stolenPatient = await submitClinicOrder(clerkB, {
    ...submission,
    submissionKey: `verify${runId}0003`,
  });
  check(
    "clinic B cannot order for clinic A's patient",
    !stolenPatient.ok && stolenPatient.error === "Patient not found.",
    stolenPatient,
  );

  console.log("\n5. Ordering gate…");
  await db
    .update(clinics)
    .set({ lifefileOrderingEnabled: false })
    .where(eq(clinics.id, clinicA.id));
  const gated = await submitClinicOrder(clerkA, {
    ...submission,
    submissionKey: `verify${runId}0004`,
  });
  check(
    "disabled clinic is rejected",
    !gated.ok && /not enabled for your account/.test(gated.error),
    gated,
  );
  await db
    .update(clinics)
    .set({ lifefileOrderingEnabled: true })
    .where(eq(clinics.id, clinicA.id));

  console.log("\n6. Clinic-scoped order list…");
  const list = await listClinicOrders(clinicA.id);
  check(
    "list contains exactly the accepted order",
    list.length === 1 && list[0].status === "accepted",
    list,
  );
  const listB = await listClinicOrders(clinicB.id);
  check("clinic B's list is empty", listB.length === 0, listB);

  console.log("\n7. API path: inline patient (submitOrderForClinic)…");
  const { submitOrderForClinic } = await import("../src/lib/orders/service");
  const [clinicARow] = await db
    .select()
    .from(clinics)
    .where(eq(clinics.id, clinicA.id));
  const inlineSubmission = {
    ...submission,
    patientId: undefined,
    patient: {
      firstName: "Inline",
      lastName: "ApiPatient",
      gender: "m",
      dateOfBirth: "1985-05-05",
      phoneMobile: "(305) 555-0111",
    },
    submissionKey: `verify${runId}0005`,
  };
  const inlineResult = await submitOrderForClinic(
    clinicARow,
    inlineSubmission,
    "apikey:test",
  );
  check("inline-patient order accepted", inlineResult.ok, inlineResult);

  // Same patient again (different order): must reuse, not duplicate.
  const inlineResult2 = await submitOrderForClinic(
    clinicARow,
    { ...inlineSubmission, submissionKey: `verify${runId}0006` },
    "apikey:test",
  );
  check("second inline order accepted", inlineResult2.ok, inlineResult2);
  const { patients: patientsTable } = await import("../src/lib/db/schema");
  const { and: andOp, sql: sqlOp } = await import("drizzle-orm");
  const inlineRows = await db
    .select()
    .from(patientsTable)
    .where(
      andOp(
        eq(patientsTable.clinicId, clinicA.id),
        sqlOp`lower(${patientsTable.lastName}) = 'apipatient'`,
      ),
    );
  check(
    "inline patient created once and reused",
    inlineRows.length === 1,
    inlineRows.length,
  );

  // Failure codes surface for the API layer.
  const gatedCode = await submitOrderForClinic(
    { ...clinicARow, lifefileOrderingEnabled: false },
    { ...inlineSubmission, submissionKey: `verify${runId}0007` },
    "apikey:test",
  );
  check(
    "failure carries ORDERING_NOT_ENABLED code",
    !gatedCode.ok && gatedCode.code === "ORDERING_NOT_ENABLED",
    gatedCode,
  );

  console.log(
    failures === 0
      ? "\nAll verification checks passed."
      : `\n${failures} check(s) FAILED.`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Verification crashed:", err);
  process.exit(1);
});
