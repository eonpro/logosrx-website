"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";

/** Serializable page metadata — content itself arrives as `children`. */
export interface BookPageMeta {
  id: string;
  tocLabel?: string;
  tocGroup?: string;
}

interface CatalogBookProps {
  /** Page metadata, same order as `children`. */
  pages: BookPageMeta[];
  /** Server-rendered page contents, one node per page. */
  children: ReactNode[];
  /** Token-gated PDF download link. */
  pdfHref: string;
  /** Back to the catalog landing page. */
  backHref: string;
}

/**
 * Client pager shell for the native catalog book. One full-screen page at a
 * time with direction-aware slide transitions, a reading progress bar, a
 * clickable page-dot rail (desktop), prev/next with page-name previews,
 * arrow keys + Home/End, swipe, a searchable table-of-contents drawer, and
 * `#page-id` hash deep links. Page content is server-rendered and passed in
 * as children; only the current page and its neighbors stay mounted.
 */
export default function CatalogBook({
  pages,
  children,
  pdfHref,
  backHref,
}: CatalogBookProps) {
  const total = pages.length;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"fwd" | "back">("fwd");
  const [tocOpen, setTocOpen] = useState(false);
  const [tocQuery, setTocQuery] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const hashSynced = useRef(false);

  const clamp = useCallback(
    (i: number) => Math.min(Math.max(i, 0), total - 1),
    [total],
  );

  const goTo = useCallback(
    (i: number) => {
      setIndex((prev) => {
        const nextIndex = clamp(i);
        if (nextIndex !== prev) setDirection(nextIndex > prev ? "fwd" : "back");
        return nextIndex;
      });
    },
    [clamp],
  );
  const next = useCallback(() => {
    setDirection("fwd");
    setIndex((i) => clamp(i + 1));
  }, [clamp]);
  const prev = useCallback(() => {
    setDirection("back");
    setIndex((i) => clamp(i - 1));
  }, [clamp]);

  // Open on the deep-linked page when a known #hash is present.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) {
      hashSynced.current = true;
      return;
    }
    const target = pages.findIndex((p) => p.id === id);
    if (target >= 0) setIndex(target);
    hashSynced.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL hash pointing at the current page (skips the initial render
  // so a bare URL stays bare until the reader actually navigates).
  useEffect(() => {
    if (!hashSynced.current) return;
    const id = pages[index]?.id;
    if (!id) return;
    if (window.location.hash.slice(1) !== id) {
      history.replaceState(null, "", `#${id}`);
    }
    stageRef.current?.scrollTo({ top: 0 });
  }, [index, pages]);

  // Keyboard: arrows flip, Home/End jump, Escape closes the TOC. Disabled
  // while the TOC drawer is open so its search input can be typed into.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (tocOpen) {
        if (e.key === "Escape") setTocOpen(false);
        return;
      }
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Home") goTo(0);
      else if (e.key === "End") goTo(total - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, goTo, total, tocOpen]);

  const tocGroups = useMemo(() => {
    const needle = tocQuery.trim().toLowerCase();
    const groups: { group: string; entries: { label: string; index: number }[] }[] = [];
    pages.forEach((page, i) => {
      if (!page.tocLabel) return;
      if (needle && !page.tocLabel.toLowerCase().includes(needle)) return;
      const groupName = page.tocGroup ?? "Pages";
      let bucket = groups.find((g) => g.group === groupName);
      if (!bucket) {
        bucket = { group: groupName, entries: [] };
        groups.push(bucket);
      }
      bucket.entries.push({ label: page.tocLabel, index: i });
    });
    return groups;
  }, [pages, tocQuery]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      // Horizontal swipe only — vertical drags are page-content scrolling.
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) next();
      else prev();
    },
    [next, prev],
  );

  // Static pages can embed "flip forward" CTAs (e.g. the cover's Browse
  // button) by marking any element with data-book-next.
  const onStageClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-book-next]")) next();
    },
    [next],
  );

  const current = pages[index];
  const nextLabel = pages[index + 1]?.tocLabel;
  const prevLabel = pages[index - 1]?.tocLabel;

  return (
    <div className="flex h-dvh flex-col bg-navy-deep">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
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

        {/* Live page title: section + page name */}
        <div className="hidden min-w-0 text-center sm:block" aria-live="polite">
          {current?.tocGroup && (
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
              {current.tocGroup}
            </p>
          )}
          <p className="truncate text-sm font-semibold uppercase tracking-[0.14em] text-white/90">
            {current?.tocLabel ?? "2026 Catalog"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTocQuery("");
              setTocOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white/20"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M3 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm1 4a1 1 0 1 0 0 2h12a1 1 0 1 0 0-2H4Z" />
            </svg>
            Contents
          </button>
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
        </div>
      </header>

      {/* Reading progress */}
      <div className="mx-4 h-0.5 overflow-hidden rounded-full bg-white/10 sm:mx-6">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky via-magenta to-purple transition-[width] duration-500 ease-out"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      {/* Page stage — scrolls vertically when a page is taller than the viewport */}
      <div
        ref={stageRef}
        className="relative flex-1 overflow-y-auto px-2 pb-2 pt-2 sm:px-6 sm:pt-3"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={onStageClick}
      >
        <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col">
          {children.map((page, i) => {
            // Keep neighbors mounted (hidden) so flips feel instant.
            if (Math.abs(i - index) > 1) return null;
            return (
              <div
                key={pages[i]?.id ?? i}
                hidden={i !== index}
                className={
                  i === index
                    ? // Flex (not percentage heights) so short pages still fill
                      // the stage; [&>*]:flex-1 stretches the page root.
                      `flex flex-1 flex-col overflow-hidden rounded-2xl shadow-2xl shadow-black/40 [&>*]:flex-1 ${
                        direction === "fwd"
                          ? "animate-book-in-right"
                          : "animate-book-in-left"
                      }`
                    : undefined
                }
              >
                {page}
              </div>
            );
          })}
        </div>

        {/* Page-dot rail (desktop): one dot per page, click to jump */}
        <nav
          aria-label="Pages"
          className="fixed right-2 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-[5px] lg:flex"
        >
          {pages.map((p, i) => (
            <button
              key={p.id}
              type="button"
              title={p.tocLabel}
              aria-label={`Go to page ${i + 1}${p.tocLabel ? ` — ${p.tocLabel}` : ""}`}
              aria-current={i === index ? "page" : undefined}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === index
                  ? "h-5 w-1.5 bg-magenta"
                  : "h-1.5 w-1.5 bg-white/25 hover:scale-150 hover:bg-white/70"
              }`}
            />
          ))}
        </nav>
      </div>

      {/* Bottom controls */}
      <footer className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3.5 sm:px-6">
        <div className="flex items-center justify-end gap-3">
          <span className="hidden max-w-[180px] truncate text-right text-xs text-white/45 md:block">
            {prevLabel}
          </span>
          <button
            type="button"
            onClick={prev}
            disabled={index <= 0}
            aria-label="Previous page"
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M12.7 4.3a1 1 0 0 1 0 1.4L8.42 10l4.3 4.3a1 1 0 0 1-1.42 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.4 0Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <span
          aria-live="polite"
          className="min-w-[5.5rem] text-center text-sm font-medium tabular-nums text-white/80"
        >
          {index + 1} / {total}
        </span>

        <div className="flex items-center justify-start gap-3">
          <button
            type="button"
            onClick={next}
            disabled={index >= total - 1}
            aria-label="Next page"
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M7.3 15.7a1 1 0 0 1 0-1.4l4.3-4.3-4.3-4.3a1 1 0 0 1 1.42-1.4l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 0 1-1.4 0Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <span className="hidden max-w-[180px] truncate text-xs text-white/45 md:block">
            {nextLabel}
          </span>
        </div>
      </footer>

      {/* Table of contents drawer */}
      {tocOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Table of contents">
          <button
            type="button"
            aria-label="Close table of contents"
            onClick={() => setTocOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-beige px-5 py-4">
              <span className="text-sm font-bold uppercase tracking-wider text-navy">
                Contents
              </span>
              <button
                type="button"
                onClick={() => setTocOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-navy/60 transition-colors hover:bg-navy/5 hover:text-navy"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M5.3 5.3a1 1 0 0 1 1.4 0L10 8.59l3.3-3.3a1 1 0 1 1 1.4 1.42L11.41 10l3.3 3.3a1 1 0 0 1-1.42 1.4L10 11.41l-3.3 3.3a1 1 0 0 1-1.4-1.42L8.59 10l-3.3-3.3a1 1 0 0 1 0-1.4Z" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="border-b border-beige px-5 py-3">
              <div className="flex items-center gap-2 rounded-full bg-cream px-4 py-2">
                <svg className="h-4 w-4 flex-none text-navy/40" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.45 4.4l3.07 3.08a1 1 0 0 1-1.41 1.41l-3.08-3.07A7 7 0 0 1 2 9Z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  type="search"
                  value={tocQuery}
                  onChange={(e) => setTocQuery(e.target.value)}
                  placeholder="Search products…"
                  autoFocus
                  className="w-full bg-transparent text-sm text-navy placeholder:text-navy/40 focus:outline-none"
                />
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {tocGroups.length === 0 && (
                <p className="px-2 py-6 text-center text-sm text-navy/50">
                  No pages match &ldquo;{tocQuery}&rdquo;
                </p>
              )}
              {tocGroups.map(({ group, entries }) => (
                <div key={group} className="mb-5">
                  <p className="px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-navy/50">
                    {group}
                  </p>
                  <ul className="mt-1.5">
                    {entries.map(({ label, index: i }) => (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => {
                            goTo(i);
                            setTocOpen(false);
                          }}
                          aria-current={i === index ? "page" : undefined}
                          className={`flex w-full items-baseline justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-cream ${
                            i === index
                              ? "bg-cream font-semibold text-magenta"
                              : "text-navy/80"
                          }`}
                        >
                          <span>{label}</span>
                          <span className="text-xs tabular-nums text-navy/40">
                            {i + 1}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
