import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCatalogDownloadConfig,
  verifyCatalogToken,
} from "@/lib/catalog/download";
import { buildBookPriceIndex, type BookPriceItem } from "@/data/catalog-book";
import { getCatalogProducts } from "@/lib/catalog/store";
import CatalogBook from "@/components/catalog-book/CatalogBook";
import { buildBookPages } from "@/components/catalog-book/buildBookPages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "2026 Catalog — Online",
  description:
    "Browse the Logos RX 2026 catalog of compounded medications with provider pricing.",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ key?: string | string[] }>;
}

/**
 * `/download/catalog/view?key=…` — the native online catalog book. Same
 * private token gate as the PDF download; an invalid/absent key renders the
 * site 404. Pages are composed from `products.ts` / `learning.ts`, and
 * suggested-retail prices come live from the catalog DB.
 */
export default async function CatalogViewPage({ searchParams }: PageProps) {
  const { token } = getCatalogDownloadConfig();
  const params = await searchParams;
  const key =
    typeof params.key === "string"
      ? params.key
      : Array.isArray(params.key)
        ? params.key[0]
        : undefined;

  if (!token || !verifyCatalogToken(key, token)) {
    notFound();
  }

  // Live suggested-retail pricing. A DB hiccup must never take down the
  // viewer — pages simply render without their pricing blocks.
  let priceIndex: Record<string, BookPriceItem> = {};
  try {
    priceIndex = buildBookPriceIndex(await getCatalogProducts());
  } catch {
    priceIndex = {};
  }

  const { meta, nodes } = buildBookPages(priceIndex);
  const safeKey = encodeURIComponent(key as string);

  return (
    <CatalogBook
      pages={meta}
      pdfHref={`/download/catalog/file?key=${safeKey}`}
      backHref={`/download/catalog?key=${safeKey}`}
    >
      {nodes}
    </CatalogBook>
  );
}
