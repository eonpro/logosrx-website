/**
 * LifeFile shipping-service codes provisioned for the Logos Pharmacy account
 * (`logospharmacy`, Location ID 110396). Provided by LifeFile at API
 * activation; the ids are account-specific, not global LifeFile constants.
 *
 * Sent as `order.shipping.service` on `POST /order`. An unrecognized code on
 * LifeFile's side falls back to the account default rather than rejecting the
 * order, but the wizard only offers this vetted list.
 */
export interface LifeFileShippingService {
  id: number;
  name: string;
}

export const LIFEFILE_SHIPPING_SERVICES: readonly LifeFileShippingService[] = [
  { id: 9, name: "Patient pickup" },
  { id: 8065, name: "Provider pickup" },
  { id: 8086, name: "Provider delivery" },
  { id: 8097, name: "UPS Next Day (Florida)" },
  { id: 8152, name: "UPS Next Day (outside Florida)" },
  { id: 8200, name: "UPS 2nd Day Air" },
  { id: 8113, name: "UPS Saturday delivery" },
] as const;

export function isKnownShippingService(id: number): boolean {
  return LIFEFILE_SHIPPING_SERVICES.some((s) => s.id === id);
}

export function shippingServiceName(id: number | null | undefined): string {
  if (id == null) return "Account default";
  return (
    LIFEFILE_SHIPPING_SERVICES.find((s) => s.id === id)?.name ??
    `Service ${id}`
  );
}

/**
 * DEA schedule codes LifeFile accepts on `rxs[].scheduleCode`. Schedules 2–5
 * stay blocked from in-app ordering for now (compliance / product gate). Every
 * order already attaches `order.document.pdfBase64`, which LifeFile requires
 * for controlled substances when that gate is lifted.
 */
export const CONTROLLED_SCHEDULE_CODES = ["2", "3", "4", "5"] as const;

export function isControlledSchedule(code: string | null | undefined): boolean {
  return (
    code != null &&
    (CONTROLLED_SCHEDULE_CODES as readonly string[]).includes(code.trim())
  );
}
