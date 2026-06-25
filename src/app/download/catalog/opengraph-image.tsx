import { CATALOG_OG_ALT, OG_SIZE, renderCatalogOg } from "@/lib/brand-og";

export const alt = CATALOG_OG_ALT;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderCatalogOg();
}
