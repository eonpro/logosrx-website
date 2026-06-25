"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PageFlip } from "page-flip";

interface FlipbookProps {
  /** Ordered page-image URLs. */
  pages: string[];
  /** Token-gated PDF download link. */
  pdfHref: string;
  /** Back to the catalog landing page. */
  backHref: string;
}

/**
 * Client-side page-flip viewer for the catalog. Wraps the framework-agnostic
 * `page-flip` (StPageFlip) library: instantiates it against a DOM node, loads
 * the catalog page images, and wires up prev/next + keyboard + a page counter.
 *
 * Pages are landscape slides, so we run in single-page ("portrait") mode — one
 * page on screen with a corner-curl flip — which reads better than a very wide
 * two-up spread.
 */
export default function Flipbook({ pages, pdfHref, backHref }: FlipbookProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const [page, setPage] = useState(0);
  const [ready, setReady] = useState(false);
  const total = pages.length;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // The pages are landscape (3300×2550 ≈ 1.294:1). We force single-page
    // ("portrait") mode so one full slide shows at a time and flips, rather
    // than a very wide two-up spread. page-flip switches to single page when
    // blockWidth < 2*minWidth; the container box is capped at 1100px wide
    // (below), so minWidth 700 → 1400 > 1100 guarantees single page on every
    // screen. It still refits to the container height, so the page never
    // overflows vertically.
    const pf = new PageFlip(el, {
      width: 1294,
      height: 1000, // defines the 1.294 aspect ratio
      size: "stretch",
      minWidth: 700,
      maxWidth: 1100,
      minHeight: 300,
      maxHeight: 1000,
      maxShadowOpacity: 0.5,
      drawShadow: true,
      flippingTime: 800,
      usePortrait: true,
      showCover: true,
      mobileScrollSupport: false,
      useMouseEvents: true,
      showPageCorners: true,
    });
    flipRef.current = pf;
    pf.on("flip", (e) => setPage(Number(e.data)));
    pf.on("init", () => setReady(true));
    pf.loadFromImages(pages);

    return () => {
      pf.destroy();
      flipRef.current = null;
    };
  }, [pages]);

  const next = useCallback(() => flipRef.current?.flipNext(), []);
  const prev = useCallback(() => flipRef.current?.flipPrev(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div className="flex min-h-screen flex-col bg-[#1a1750]">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href={backHref}
          prefetch={false}
          className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M12.7 4.3a1 1 0 0 1 0 1.4L8.42 10l4.3 4.3a1 1 0 0 1-1.42 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.4 0Z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </Link>

        <span className="text-sm font-semibold uppercase tracking-[0.14em] text-white/90">
          2026 Catalog
        </span>

        <Link
          href={pdfHref}
          prefetch={false}
          className="inline-flex items-center gap-2 rounded-full bg-magenta px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-magenta-dark"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 2a1 1 0 0 1 1 1v8.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.42l2.3 2.3V3a1 1 0 0 1 1-1Z" />
            <path d="M4 15a1 1 0 0 1 1 1v1h10v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
          </svg>
          <span className="hidden sm:inline">Download PDF</span>
          <span className="sm:hidden">PDF</span>
        </Link>
      </header>

      {/* Flipbook stage */}
      <div className="relative flex flex-1 items-center justify-center px-2 py-2 sm:px-6 sm:py-4">
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-white/50">Loading catalog…</span>
          </div>
        )}
        <div
          ref={containerRef}
          className="mx-auto"
          style={{
            width: "min(1100px, 94vw)",
            height: "min(820px, calc(100dvh - 160px))",
          }}
        />
      </div>

      {/* Bottom controls */}
      <footer className="flex items-center justify-center gap-6 px-4 py-4">
        <button
          type="button"
          onClick={prev}
          disabled={page <= 0}
          aria-label="Previous page"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M12.7 4.3a1 1 0 0 1 0 1.4L8.42 10l4.3 4.3a1 1 0 0 1-1.42 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.4 0Z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <span className="min-w-[5.5rem] text-center text-sm font-medium tabular-nums text-white/80">
          {Math.min(page + 1, total)} / {total}
        </span>

        <button
          type="button"
          onClick={next}
          disabled={page >= total - 1}
          aria-label="Next page"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M7.3 15.7a1 1 0 0 1 0-1.4l4.3-4.3-4.3-4.3a1 1 0 0 1 1.42-1.4l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 0 1-1.4 0Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </footer>
    </div>
  );
}
