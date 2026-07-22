import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  orders,
  orderRxs,
  patients,
  type Order,
  type OrderRx,
  type Patient,
} from "@/lib/db/schema";
import { log } from "@/lib/observability/logger";
import { firstZodIssue, patientInputSchema } from "./validation";

/**
 * Clinic-scoped reads and patient CRUD for in-app prescribing.
 *
 * Every function takes the resolved `clinicId` (derived server-side from the
 * authenticated Clerk user — never from client input) and filters on it, so a
 * clinic can only ever see its own patients and orders.
 */

export interface OrderListItem {
  id: number;
  referenceId: string;
  lfOrderId: string | null;
  status: Order["status"];
  patientName: string;
  drugs: string[];
  createdAt: Date;
}

export async function listClinicOrders(
  clinicId: number,
  limit = 50,
): Promise<OrderListItem[]> {
  const rows = await db
    .select({
      id: orders.id,
      referenceId: orders.referenceId,
      lfOrderId: orders.lfOrderId,
      status: orders.status,
      createdAt: orders.createdAt,
      patientFirstName: patients.firstName,
      patientLastName: patients.lastName,
    })
    .from(orders)
    .innerJoin(patients, eq(orders.patientId, patients.id))
    .where(eq(orders.clinicId, clinicId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  if (rows.length === 0) return [];

  const rxRows = await db
    .select({
      orderId: orderRxs.orderId,
      drugName: orderRxs.drugName,
    })
    .from(orderRxs)
    .where(
      inArray(
        orderRxs.orderId,
        rows.map((r) => r.id),
      ),
    );

  const drugsByOrder = new Map<number, string[]>();
  for (const rx of rxRows) {
    const list = drugsByOrder.get(rx.orderId) ?? [];
    list.push(rx.drugName);
    drugsByOrder.set(rx.orderId, list);
  }

  return rows.map((r) => ({
    id: r.id,
    referenceId: r.referenceId,
    lfOrderId: r.lfOrderId,
    status: r.status,
    patientName: `${r.patientFirstName} ${r.patientLastName}`,
    drugs: drugsByOrder.get(r.id) ?? [],
    createdAt: r.createdAt,
  }));
}

export interface OrderDetail {
  order: Order;
  patient: Patient;
  rxs: OrderRx[];
}

/** Returns null when the order doesn't exist OR belongs to another clinic. */
export async function getClinicOrderDetail(
  clinicId: number,
  orderId: number,
): Promise<OrderDetail | null> {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.clinicId, clinicId)))
    .limit(1);
  if (!order) return null;

  const [patient] = await db
    .select()
    .from(patients)
    .where(eq(patients.id, order.patientId))
    .limit(1);
  if (!patient) return null;

  const rxs = await db
    .select()
    .from(orderRxs)
    .where(eq(orderRxs.orderId, order.id));

  return { order, patient, rxs };
}

export async function listClinicPatients(
  clinicId: number,
): Promise<Patient[]> {
  return db
    .select()
    .from(patients)
    .where(eq(patients.clinicId, clinicId))
    .orderBy(patients.lastName, patients.firstName);
}

export type PatientResult =
  | { ok: true; patient: Patient }
  | { ok: false; error: string };

export async function createClinicPatient(
  clinicId: number,
  rawInput: unknown,
): Promise<PatientResult> {
  const parsed = patientInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: firstZodIssue(parsed.error) };

  try {
    const [patient] = await db
      .insert(patients)
      .values({ ...parsed.data, clinicId })
      .returning();
    return { ok: true, patient };
  } catch (err) {
    log.error("patient create failed", { clinicId, error: err });
    return { ok: false, error: "Could not save the patient. Try again." };
  }
}

export async function updateClinicPatient(
  clinicId: number,
  patientId: number,
  rawInput: unknown,
): Promise<PatientResult> {
  const parsed = patientInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: firstZodIssue(parsed.error) };

  try {
    const [patient] = await db
      .update(patients)
      .set({ ...parsed.data, updatedAt: new Date() })
      // Both conditions: a clinic can only edit its own patients.
      .where(and(eq(patients.id, patientId), eq(patients.clinicId, clinicId)))
      .returning();
    if (!patient) return { ok: false, error: "Patient not found." };
    return { ok: true, patient };
  } catch (err) {
    log.error("patient update failed", { clinicId, patientId, error: err });
    return { ok: false, error: "Could not save the patient. Try again." };
  }
}
