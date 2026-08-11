/**
 * Shape returned to the admin clinics table. Intentionally omits the large
 * `providers` JSONB (and other unused columns) — those live on the clinic
 * detail page. Keeping this projection small is what stops `/admin/clinics`
 * from timing out under the serverless Aurora pool.
 *
 * Pure module (no DB / server-only) so the client table can import the type.
 */
export type AdminClinicListRow = {
  id: number;
  clinicName: string | null;
  practiceLegalName: string | null;
  practiceDba: string | null;
  ein: string | null;
  practiceType: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  addressLine1: string | null;
  addressSuite: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZip: string | null;
  practicePhone: string | null;
  website: string | null;
  productsOfInterest: string[];
  orderVolume: "0_5000" | "5000_15000" | "15000_50000" | "50000_plus" | null;
  referralSource: string | null;
  shippingMethod: "direct_to_patient" | "ship_to_practice" | null;
  verificationStatus: "pending" | "verified" | "rejected";
  createdAt: Date;
  cardLast4: string | null;
};

export type AdminClinicListResult = {
  list: AdminClinicListRow[];
  total: number;
  pending: number;
};

/**
 * Strip the window-aggregate columns off a raw admin clinic list row.
 * Pure helper so the page loader and unit tests share the same shaping.
 */
export function stripClinicListAggregates<
  T extends { total: number; pending: number },
>(row: T): Omit<T, "total" | "pending"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit aggregates
  const { total, pending, ...clinic } = row;
  return clinic;
}
