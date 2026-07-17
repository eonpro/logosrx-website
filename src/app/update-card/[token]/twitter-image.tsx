import { OG_SIZE, PAYMENT_OG_ALT, renderPaymentUpdateOg } from "@/lib/brand-og";

export const alt = PAYMENT_OG_ALT;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderPaymentUpdateOg();
}
