"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NAV_GROUPS, type MegaMenuLink } from "@/lib/constants";

/**
 * Abstract, on-brand "mesh gradient" fields for the mega-menu feature cards —
 * soft overlapping color blooms (warm coral → sky → purple → navy) that read as
 * dreamy brand artwork rather than literal photos. Cycled by card index per
 * panel. A slight blur on the layer (see card markup) softens the blooms.
 */
const ABSTRACT_GRADIENTS = [
  // coral TL · sky TR · purple BR · navy BL
  "radial-gradient(80% 80% at 14% 12%, #E2637A 0%, transparent 55%), radial-gradient(78% 78% at 88% 10%, #6EA3D7 0%, transparent 55%), radial-gradient(95% 95% at 82% 96%, #6E469B 0%, transparent 60%), radial-gradient(95% 95% at 8% 96%, #262262 0%, transparent 62%), linear-gradient(135deg, #C62E88, #35307A)",
  // sky TR · purple TL · coral bottom
  "radial-gradient(82% 82% at 86% 14%, #6EA3D7 0%, transparent 55%), radial-gradient(85% 85% at 10% 18%, #7357A4 0%, transparent 55%), radial-gradient(100% 100% at 50% 102%, #E2637A 0%, transparent 60%), linear-gradient(160deg, #5F86C4, #262262)",
  // coral TL · sky right · deep purple bottom
  "radial-gradient(85% 85% at 18% 14%, #E2637A 0%, transparent 52%), radial-gradient(80% 80% at 92% 32%, #5F86C4 0%, transparent 52%), radial-gradient(110% 110% at 60% 104%, #6E469B 0%, transparent 60%), linear-gradient(135deg, #C62E88, #1A1750)",
] as const;

interface DesktopNavProps {
  /** When the header is over a dark hero section, invert the trigger colors. */
  onDark: boolean;
}

/**
 * Desktop primary navigation with a hover/focus mega menu.
 *
 * Each top-level group is a real link (click navigates to its hub), while
 * hover or keyboard focus reveals a panel of grouped links plus visual cards.
 * The panel is anchored to the header container (its nearest positioned
 * ancestor) so it spans the full content width regardless of where the nav
 * sits in the bar. Closing is debounced so the cursor can cross the gap
 * between a trigger and its panel without it collapsing.
 */
export default function DesktopNav({ onDark }: DesktopNavProps) {
  const [active, setActive] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const openGroup = useCallback(
    (index: number) => {
      clearCloseTimer();
      setActive(index);
    },
    [clearCloseTimer],
  );

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setActive(null), 120);
  }, [clearCloseTimer]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  // Escape closes the menu from anywhere (covers hover-opened panels too).
  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  // Close when keyboard focus leaves the nav entirely (tab-out).
  const onBlurCapture = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setActive(null);
    }
  }, []);

  const triggerClass = (index: number) =>
    `inline-flex items-center gap-1 text-sm font-semibold tracking-wide transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 rounded ${
      onDark
        ? "text-white/80 hover:text-white focus-visible:ring-offset-navy-deep"
        : "text-navy hover:text-magenta focus-visible:ring-offset-white"
    } ${active === index ? (onDark ? "text-white" : "text-magenta") : ""}`;

  return (
    <div
      onMouseLeave={scheduleClose}
      onBlurCapture={onBlurCapture}
      className="hidden lg:block"
    >
      <nav aria-label="Primary">
        <ul className="flex items-center gap-7 xl:gap-9">
          {NAV_GROUPS.map((group, index) => {
            const hasMega = Boolean(group.columns?.length);
            const panelId = `mega-${index}`;
            return (
              <li
                key={group.label}
                className="static"
                onMouseEnter={() => (hasMega ? openGroup(index) : scheduleClose())}
              >
                <Link
                  href={group.href}
                  className={triggerClass(index)}
                  aria-haspopup={hasMega ? "true" : undefined}
                  aria-expanded={hasMega ? active === index : undefined}
                  aria-controls={hasMega ? panelId : undefined}
                  onFocus={() => (hasMega ? openGroup(index) : setActive(null))}
                >
                  {group.label}
                  {hasMega && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      aria-hidden="true"
                      className={`transition-transform duration-200 ${active === index ? "rotate-180" : ""}`}
                    >
                      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <AnimatePresence>
        {active !== null && NAV_GROUPS[active]?.columns?.length ? (
          <MegaPanel
            key={active}
            id={`mega-${active}`}
            group={NAV_GROUPS[active]}
            onMouseEnter={clearCloseTimer}
            onMouseLeave={scheduleClose}
            onItemClick={() => setActive(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

interface MegaPanelProps {
  id: string;
  group: (typeof NAV_GROUPS)[number];
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onItemClick: () => void;
}

function MegaPanel({ id, group, onMouseEnter, onMouseLeave, onItemClick }: MegaPanelProps) {
  return (
    <motion.div
      id={id}
      role="region"
      aria-label={`${group.label} menu`}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute left-0 right-0 top-full z-50"
    >
      <div className="border-b border-beige bg-white shadow-2xl shadow-navy/10 rounded-b-2xl">
        <div className="mx-auto grid max-w-7xl grid-cols-12 gap-8 px-6 py-8 lg:px-8">
          <div className="col-span-7 grid grid-cols-2 gap-x-8 gap-y-6">
            {group.columns?.map((column) => (
              <div key={column.title}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-magenta">
                  {column.title}
                </p>
                <ul className="space-y-1">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <MegaLink link={link} onClick={onItemClick} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {group.cards?.length ? (
            <div className="col-span-5 flex gap-4">
              {group.cards.map((card, i) => (
                <Link
                  key={card.href + card.label}
                  href={card.href}
                  onClick={onItemClick}
                  {...(card.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group relative flex flex-1 flex-col justify-end overflow-hidden rounded-xl bg-navy min-h-[180px] focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2"
                >
                  <div
                    className="absolute -inset-12 blur-2xl transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: ABSTRACT_GRADIENTS[i % ABSTRACT_GRADIENTS.length] }}
                    aria-hidden="true"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/55 via-transparent to-transparent" aria-hidden="true" />
                  <div className="relative flex items-center justify-between gap-2 p-4">
                    <span className="text-sm font-semibold text-white">{card.label}</span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors group-hover:bg-magenta">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M3 9L9 3M9 3H4M9 3V8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function MegaLink({ link, onClick }: { link: MegaMenuLink; onClick: () => void }) {
  const className =
    "group inline-flex items-center gap-1.5 rounded py-1.5 text-sm font-medium text-navy/80 transition-colors hover:text-magenta focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta";

  if (link.newTab) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={className}>
        {link.label}
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="opacity-0 transition-opacity group-hover:opacity-100">
          <path d="M3 9L9 3M9 3H4M9 3V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    );
  }

  return (
    <Link href={link.href} onClick={onClick} className={className}>
      {link.label}
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="-translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
        <path d="M2 6H10M10 6L6.5 2.5M10 6L6.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
