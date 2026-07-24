/** Formats clinic practice location fields for admin / list display. */
export function formatPracticeAddress(parts: {
  addressLine1?: string | null;
  addressSuite?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZip?: string | null;
}): string {
  const street = [parts.addressLine1, parts.addressSuite]
    .filter(Boolean)
    .join(", ");
  const cityState = [parts.addressCity, parts.addressState]
    .filter(Boolean)
    .join(", ");
  const cityStateZip = [cityState, parts.addressZip].filter(Boolean).join(" ");
  return [street, cityStateZip].filter(Boolean).join(", ");
}
