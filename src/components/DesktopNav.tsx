"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NAV_GROUPS, type MegaMenuLink } from "@/lib/constants";

/**
 * Per-card abstract artwork for the mega-menu feature cards. Each design pairs a
 * distinct mesh-gradient background with its own SVG shape motif so every card
 * reads as a unique, modern abstract composition. Designs are assigned by a
 * GLOBAL card index (see GROUP_CARD_OFFSETS) so the cards visible in any single
 * panel are always different from one another.
 */
const CARD_GRADIENTS = [
  // 0 — warm coral → cool blue (glossy oil-bubble hero)
  "radial-gradient(95% 95% at 16% 18%, #E2637A 0%, transparent 60%), radial-gradient(95% 95% at 86% 90%, #5F86C4 0%, transparent 60%), linear-gradient(135deg, #C62E88, #262262)",
  // 1 — aurora: sky → purple → navy
  "radial-gradient(90% 90% at 82% 6%, #6EA3D7 0%, transparent 55%), linear-gradient(160deg, #5F86C4 0%, #6E469B 58%, #1A1750 100%)",
  // 2 — soft dreamy mesh (Sessions)
  "radial-gradient(80% 80% at 14% 12%, #E2637A 0%, transparent 55%), radial-gradient(78% 78% at 88% 10%, #6EA3D7 0%, transparent 55%), radial-gradient(95% 95% at 82% 96%, #6E469B 0%, transparent 60%), radial-gradient(95% 95% at 8% 96%, #262262 0%, transparent 62%), linear-gradient(135deg, #C62E88, #35307A)",
  // 3 — magenta bloom → deep purple (concentric rings)
  "radial-gradient(100% 100% at 84% 16%, #C62E88 0%, transparent 55%), linear-gradient(140deg, #6E469B, #1A1750)",
  // 4 — sky bloom → purple (liquid blob)
  "radial-gradient(95% 95% at 18% 84%, #6EA3D7 0%, transparent 55%), linear-gradient(135deg, #7357A4, #262262)",
  // 5 — coral → purple → navy (glass panels)
  "linear-gradient(135deg, #E2637A 0%, #6E469B 52%, #1A1750 100%)",
] as const;

const DESIGN_COUNT = CARD_GRADIENTS.length;

/** Starting global card index for each nav group, so designs never repeat within one panel. */
const GROUP_CARD_OFFSETS = (() => {
  let acc = 0;
  return NAV_GROUPS.map((g) => {
    const start = acc;
    acc += g.cards?.length ?? 0;
    return start;
  });
})();

const ART_CLASS =
  "absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105";

/** Routes a global design index to its unique abstract motif. */
function CardArtwork({ design, uid }: { design: number; uid: string }) {
  switch (design % DESIGN_COUNT) {
    case 0:
      return <BubblesArt uid={uid} />;
    case 1:
      return <AuroraArt uid={uid} />;
    case 2:
      return <MeshArt uid={uid} />;
    case 3:
      return <RingsArt />;
    case 4:
      return <BlobArt uid={uid} />;
    default:
      return <PanelsArt />;
  }
}

/** Glossy oil-bubbles — radial-shaded circles with rim light + specular dot. */
function BubblesArt({ uid }: { uid: string }) {
  const g = `${uid}-b`;
  const bubbles = [
    { x: 190, y: 54, r: 54 },
    { x: 148, y: 142, r: 30 },
    { x: 216, y: 152, r: 20 },
    { x: 108, y: 60, r: 16 },
    { x: 70, y: 168, r: 27 },
    { x: 198, y: 202, r: 12 },
    { x: 132, y: 198, r: 9 },
  ];
  return (
    <svg aria-hidden="true" viewBox="0 0 240 220" preserveAspectRatio="xMidYMid slice" className={ART_CLASS}>
      <defs>
        <radialGradient id={g} cx="34%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="24%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="66%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#1A1750" stopOpacity="0.28" />
        </radialGradient>
      </defs>
      {bubbles.map((b, k) => (
        <g key={k}>
          <circle cx={b.x} cy={b.y} r={b.r} fill={`url(#${g})`} stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1" />
          <circle cx={b.x - b.r * 0.34} cy={b.y - b.r * 0.4} r={Math.max(b.r * 0.14, 1.5)} fill="#ffffff" fillOpacity="0.75" />
        </g>
      ))}
    </svg>
  );
}

/** Aurora ribbons — soft translucent flowing bands. */
function AuroraArt({ uid }: { uid: string }) {
  const g = `${uid}-a`;
  return (
    <svg aria-hidden="true" viewBox="0 0 240 220" preserveAspectRatio="xMidYMid slice" className={ART_CLASS}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g fill={`url(#${g})`}>
        <path d="M-20 58 C 60 8, 130 104, 260 36 L 260 64 C 130 132, 60 36, -20 86 Z" opacity="0.35" />
        <path d="M-20 118 C 70 70, 140 168, 260 104 L 260 128 C 140 192, 70 96, -20 146 Z" opacity="0.22" />
      </g>
      <g fill="#ffffff">
        <circle cx="202" cy="44" r="4" fillOpacity="0.6" />
        <circle cx="56" cy="182" r="3" fillOpacity="0.5" />
      </g>
    </svg>
  );
}

/** Soft mesh — a single diagonal light streak over the dreamy gradient. */
function MeshArt({ uid }: { uid: string }) {
  const g = `${uid}-m`;
  return (
    <svg aria-hidden="true" viewBox="0 0 240 220" preserveAspectRatio="xMidYMid slice" className={ART_CLASS}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="-60" y="40" width="360" height="46" fill={`url(#${g})`} transform="rotate(-24 120 110)" />
      <circle cx="60" cy="60" r="2.5" fill="#ffffff" fillOpacity="0.5" />
      <circle cx="186" cy="150" r="2" fill="#ffffff" fillOpacity="0.45" />
    </svg>
  );
}

/** Concentric rings radiating from a corner. */
function RingsArt() {
  return (
    <svg aria-hidden="true" viewBox="0 0 240 220" preserveAspectRatio="xMidYMid slice" className={ART_CLASS}>
      <g fill="none" stroke="#ffffff" strokeWidth="1.5">
        <circle cx="224" cy="14" r="34" strokeOpacity="0.4" />
        <circle cx="224" cy="14" r="66" strokeOpacity="0.3" />
        <circle cx="224" cy="14" r="100" strokeOpacity="0.2" />
        <circle cx="224" cy="14" r="138" strokeOpacity="0.13" />
        <circle cx="224" cy="14" r="180" strokeOpacity="0.08" />
      </g>
      <g fill="#ffffff" stroke="none">
        <circle cx="52" cy="160" r="6" fillOpacity="0.5" />
        <circle cx="96" cy="186" r="3" fillOpacity="0.4" />
      </g>
    </svg>
  );
}

/** Liquid organic blob with accent specks. */
function BlobArt({ uid }: { uid: string }) {
  const g = `${uid}-l`;
  return (
    <svg aria-hidden="true" viewBox="0 0 240 220" preserveAspectRatio="xMidYMid slice" className={ART_CLASS}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path
        d="M168 26 C 208 36, 232 78, 220 118 C 210 152, 232 178, 198 196 C 164 214, 120 196, 92 200 C 52 206, 18 184, 26 146 C 32 116, 8 96, 26 66 C 44 36, 96 44, 124 32 C 142 24, 150 22, 168 26 Z"
        fill={`url(#${g})`}
        stroke="#ffffff"
        strokeOpacity="0.22"
        strokeWidth="1.2"
      />
      <circle cx="186" cy="64" r="3" fill="#ffffff" fillOpacity="0.6" />
      <circle cx="70" cy="170" r="2.5" fill="#ffffff" fillOpacity="0.5" />
    </svg>
  );
}

/** Stacked glassmorphic panels at angles. */
function PanelsArt() {
  return (
    <svg aria-hidden="true" viewBox="0 0 240 220" preserveAspectRatio="xMidYMid slice" className={ART_CLASS}>
      <g stroke="#ffffff">
        <rect x="120" y="-10" width="150" height="150" rx="22" fill="#ffffff" fillOpacity="0.10" strokeOpacity="0.22" strokeWidth="1.2" transform="rotate(18 195 65)" />
        <rect x="40" y="70" width="150" height="150" rx="22" fill="#ffffff" fillOpacity="0.08" strokeOpacity="0.2" strokeWidth="1.2" transform="rotate(18 115 145)" />
        <rect x="-30" y="20" width="110" height="110" rx="18" fill="#ffffff" fillOpacity="0.06" strokeOpacity="0.16" strokeWidth="1.2" transform="rotate(18 25 75)" />
      </g>
    </svg>
  );
}

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
            groupIndex={active}
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
  groupIndex: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onItemClick: () => void;
}

function MegaPanel({ id, group, groupIndex, onMouseEnter, onMouseLeave, onItemClick }: MegaPanelProps) {
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
              {group.cards.map((card, i) => {
                const design = (GROUP_CARD_OFFSETS[groupIndex] + i) % DESIGN_COUNT;
                return (
                <Link
                  key={card.href + card.label}
                  href={card.href}
                  onClick={onItemClick}
                  {...(card.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group relative flex flex-1 flex-col justify-end overflow-hidden rounded-xl bg-navy min-h-[190px] focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2"
                >
                  <div
                    className="absolute -inset-12 blur-2xl transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: CARD_GRADIENTS[design] }}
                    aria-hidden="true"
                  />
                  <CardArtwork design={design} uid={`art-${groupIndex}-${i}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/60 via-transparent to-transparent" aria-hidden="true" />
                  <div className="relative flex items-center justify-between gap-2 p-4">
                    <span className="text-sm font-semibold text-white">{card.label}</span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors group-hover:bg-magenta">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M3 9L9 3M9 3H4M9 3V8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </Link>
                );
              })}
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
