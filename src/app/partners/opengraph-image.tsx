import { OG_SIZE, PARTNER_OG_ALT, renderPartnerOg } from "@/lib/brand-og";

export const alt = PARTNER_OG_ALT;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderPartnerOg();
}
