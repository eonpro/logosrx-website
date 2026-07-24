/**
 * Client-safe validation for clinic volume/custom pricing requests.
 */

export const VOLUME_BANDS = [
  "0_5000",
  "5000_15000",
  "15000_50000",
  "50000_plus",
] as const;

export type VolumeBand = (typeof VOLUME_BANDS)[number];

export const VOLUME_BAND_LABELS: Record<VolumeBand, string> = {
  "0_5000": "$0 – $5,000 / month",
  "5000_15000": "$5,000 – $15,000 / month",
  "15000_50000": "$15,000 – $50,000 / month",
  "50000_plus": "$50,000+ / month",
};

export const MAX_MESSAGE_LEN = 2000;
export const MAX_PRODUCT_IDS = 40;

export interface PricingRequestInput {
  volumeBand: string;
  productIds: string[];
  message: string;
}

export function isVolumeBand(v: string): v is VolumeBand {
  return (VOLUME_BANDS as readonly string[]).includes(v);
}

/** Returns an error message, or null when the form is submittable. */
export function validatePricingRequestInput(
  input: PricingRequestInput,
): string | null {
  if (!isVolumeBand(input.volumeBand)) {
    return "Select your expected monthly order volume.";
  }
  if (input.productIds.length > MAX_PRODUCT_IDS) {
    return `Select at most ${MAX_PRODUCT_IDS} products.`;
  }
  for (const id of input.productIds) {
    if (typeof id !== "string" || !id.trim() || id.length > 120) {
      return "One of the selected products is invalid.";
    }
  }
  if (input.message.length > MAX_MESSAGE_LEN) {
    return `Notes must be ${MAX_MESSAGE_LEN} characters or fewer.`;
  }
  return null;
}
