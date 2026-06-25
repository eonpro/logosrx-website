import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCatalogDownloadConfig,
  getFlipbookPages,
  verifyCatalogToken,
} from "@/lib/catalog/download";
import Flipbook from "./Flipbook";

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
 * `/download/catalog/view?key=…` — the page-flip online catalog. Same private
 * token gate as the download; an invalid/absent key (or unconfigured flipbook)
 * renders the site 404.
 */
export default async function CatalogViewPage({ searchParams }: PageProps) {
  const { token, flipbookUrl } = getCatalogDownloadConfig();
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

  const pages = await getFlipbookPages(flipbookUrl);
  if (!pages) {
    notFound();
  }

  const safeKey = encodeURIComponent(key as string);

  return (
    <Flipbook
      pages={pages}
      pdfHref={`/download/catalog/file?key=${safeKey}`}
      backHref={`/download/catalog?key=${safeKey}`}
    />
  );
}
