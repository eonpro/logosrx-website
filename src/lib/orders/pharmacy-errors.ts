/**
 * Clinic-facing copy for LifeFile rejection bodies — strip API jargon the
 * provider can't act on, keep a clear next step.
 */
export function humanizePharmacyRejection(message: string): string {
  if (/practice/i.test(message) && /api network id/i.test(message)) {
    return (
      "The pharmacy could not accept this order because this clinic's " +
      "LifeFile practice ID is not on Logos Pharmacy's billing network. " +
      "Contact LogosRx support — we need the practice ID created under " +
      "our LifeFile API account before orders can bill correctly."
    );
  }
  return `The pharmacy could not accept this order: ${message}`;
}
