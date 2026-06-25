import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/constants";
import {
  getCatalogDownloadConfig,
  verifyCatalogToken,
} from "@/lib/catalog/download";

export const dynamic = "force-dynamic";

const SHARE_TITLE = "Logos RX — 2026 Catalog";
const SHARE_DESCRIPTION =
  "The complete catalog of Logos RX compounded medications with provider pricing — GLP-1, hormone therapy, peptides, longevity & more.";

export const metadata: Metadata = {
  title: "2026 Catalog",
  description: SHARE_DESCRIPTION,
  // Private share link — never index or follow (link unfurling still works).
  robots: { index: false, follow: false },
  // og:image / twitter:image are auto-wired from the segment's
  // opengraph-image.tsx / twitter-image.tsx files.
  openGraph: {
    type: "website",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
  },
};

/** High-level sections of the catalog, shown so recipients know what's inside. */
const HIGHLIGHTS = [
  "Weight management & GLP-1 therapy",
  "Hormone replacement therapy",
  "Peptide therapy",
  "Longevity & wellness",
  "Men's & women's health",
  "Dermatology & hair restoration",
] as const;

interface PageProps {
  searchParams: Promise<{ key?: string | string[] }>;
}

/**
 * `/download/catalog?key=…` — the private, unlisted landing page for the 2026
 * catalog. Shows what the catalog contains and a Download button rather than
 * force-downloading the 34 MB PDF on the bare link. The button points at the
 * token-gated streaming route (`/download/catalog/file`).
 *
 * A missing/invalid key (or unconfigured deployment) renders the site's 404 so
 * the link's validity isn't distinguishable from a non-existent page.
 */
export default async function CatalogDownloadPage({ searchParams }: PageProps) {
  const { token, pdfUrl, coverUrl } = getCatalogDownloadConfig();
  const params = await searchParams;
  const key =
    typeof params.key === "string"
      ? params.key
      : Array.isArray(params.key)
        ? params.key[0]
        : undefined;

  if (!token || !pdfUrl || !verifyCatalogToken(key, token)) {
    notFound();
  }

  const fileHref = `/download/catalog/file?key=${encodeURIComponent(key as string)}`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white via-white to-[#262262]/5 px-6 py-16">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-xl shadow-navy/5">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
          {/* Cover panel */}
          <div className="relative flex items-center justify-center bg-navy p-8">
            {coverUrl ? (
              // External blob image; next/image avoided to skip remote config.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt="Logos RX 2026 Catalog cover"
                className="h-auto w-full max-w-[280px] rounded-lg shadow-2xl shadow-black/40"
              />
            ) : (
              <div className="flex aspect-[3/4] w-full max-w-[280px] flex-col items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/15">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                  Logos RX
                </span>
                <span className="mt-2 text-4xl font-bold text-white">2026</span>
                <span className="mt-1 text-sm font-medium text-white/70">
                  Catalog
                </span>
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-magenta">
              {SITE.name} · Provider Pricing
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-navy sm:text-4xl">
              2026 Catalog
            </h1>
            <p className="mt-4 text-base leading-relaxed text-navy/70">
              The complete catalog of {SITE.legalName}&rsquo;s compounded
              medications with provider pricing across hormone therapy, weight
              management, peptides, longevity, and more.
            </p>

            <ul className="mt-6 space-y-2.5">
              {HIGHLIGHTS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-navy/80"
                >
                  <svg
                    className="mt-0.5 h-4 w-4 flex-none text-magenta"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.3 3.29 6.8-6.79a1 1 0 0 1 1.4 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link
                href={fileHref}
                prefetch={false}
                className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-magenta px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-magenta-dark sm:w-auto"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M10 2a1 1 0 0 1 1 1v8.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.42l2.3 2.3V3a1 1 0 0 1 1-1Z" />
                  <path d="M4 15a1 1 0 0 1 1 1v1h10v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
                </svg>
                Download PDF
              </Link>
              <p className="mt-3 text-xs text-navy/50">
                PDF · approx. 33 MB · valid through December 31, 2026
              </p>
            </div>

            <p className="mt-6 border-t border-navy/10 pt-4 text-xs leading-relaxed text-navy/45">
              This is a private link intended for licensed healthcare providers.
              Pricing is for providers only.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
