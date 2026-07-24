/**
 * Clinic-facing copy for LifeFile rejection bodies — strip API jargon the
 * provider can't act on, keep a clear next step.
 */
export function humanizePharmacyRejection(message: string): string {
  if (/practice/i.test(message) && /api network id/i.test(message)) {
    return (
      "The pharmacy could not accept this order because the clinic's " +
      "LifeFile practice ID is not on our pharmacy network. " +
      "Please contact LogosRx support so we can fix the clinic setup."
    );
  }
  return `The pharmacy could not accept this order: ${message}`;
}
