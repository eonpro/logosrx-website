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

/** Routes a global design index to its unique abstract molecule motif. */
function CardArtwork({ design, uid }: { design: number; uid: string }) {
  switch (design % DESIGN_COUNT) {
    case 0:
      return <HexLatticeMolecule uid={uid} />;
    case 1:
      return <MoleculeCluster uid={uid} />;
    case 2:
      return <PolymerChain uid={uid} />;
    case 3:
      return <FusedRings uid={uid} />;
    case 4:
      return <NetworkGraph uid={uid} />;
    default:
      return <AtomOrbit uid={uid} />;
  }
}

/* ──────────────── Molecule artwork primitives ──────────────── */

type Pt = [number, number];
interface AtomSpec {
  x: number;
  y: number;
  r: number;
}

function hexVerts(cx: number, cy: number, r: number): Pt[] {
  return Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 180) * (60 * k - 90);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as Pt;
  });
}

function ringBonds(v: Pt[]): [Pt, Pt][] {
  return v.map((p, k) => [p, v[(k + 1) % 6]] as [Pt, Pt]);
}

function dedupAtoms(list: AtomSpec[]): AtomSpec[] {
  const m = new Map<string, AtomSpec>();
  for (const a of list) {
    const key = `${Math.round(a.x)},${Math.round(a.y)}`;
    const cur = m.get(key);
    if (!cur || a.r > cur.r) m.set(key, a);
  }
  return [...m.values()];
}

function dedupBonds(list: [Pt, Pt][]): [Pt, Pt][] {
  const m = new Map<string, [Pt, Pt]>();
  for (const [a, b] of list) {
    const ka = `${Math.round(a[0])},${Math.round(a[1])}`;
    const kb = `${Math.round(b[0])},${Math.round(b[1])}`;
    m.set([ka, kb].sort().join("|"), [a, b]);
  }
  return [...m.values()];
}

/** Shared renderer: glowing bonds beneath glossy atom spheres. */
function MoleculeSVG({
  uid,
  atoms,
  bonds,
  underlay,
}: {
  uid: string;
  atoms: AtomSpec[];
  bonds: [Pt, Pt][];
  underlay?: React.ReactNode;
}) {
  const g = `${uid}-atom`;
  return (
    <svg aria-hidden="true" viewBox="0 0 240 220" preserveAspectRatio="xMidYMid slice" className={ART_CLASS}>
      <defs>
        <radialGradient id={g} cx="34%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="28%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="64%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#1A1750" stopOpacity="0.4" />
        </radialGradient>
      </defs>
      {underlay}
      <g stroke="#ffffff" strokeLinecap="round">
        {bonds.map(([a, b], k) => (
          <g key={k}>
            <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeOpacity="0.14" strokeWidth="5" />
            <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeOpacity="0.5" strokeWidth="1.6" />
          </g>
        ))}
      </g>
      {atoms.map((a, k) => (
        <g key={k}>
          <circle cx={a.x} cy={a.y} r={a.r} fill={`url(#${g})`} stroke="#ffffff" strokeOpacity="0.35" strokeWidth="0.8" />
          <circle cx={a.x - a.r * 0.32} cy={a.y - a.r * 0.34} r={Math.max(a.r * 0.24, 1)} fill="#ffffff" fillOpacity="0.85" />
        </g>
      ))}
    </svg>
  );
}

/** 0 — Honeycomb lattice (graphene-like cluster). */
function HexLatticeMolecule({ uid }: { uid: string }) {
  const r = 30;
  const dx = Math.sqrt(3) * r;
  const centers: Pt[] = [
    [56, 78],
    [56 + dx, 78],
    [56 + 2 * dx, 78],
    [56 + dx / 2, 78 + 1.5 * r],
    [56 + 1.5 * dx, 78 + 1.5 * r],
  ];
  const bonds = dedupBonds(centers.flatMap((c) => ringBonds(hexVerts(c[0], c[1], r))));
  const atoms = dedupAtoms(centers.flatMap((c) => hexVerts(c[0], c[1], r)).map(([x, y]) => ({ x, y, r: 5 })));
  return <MoleculeSVG uid={uid} atoms={atoms} bonds={bonds} />;
}

/** 1 — Radial molecule cluster (central atom + shell). */
function MoleculeCluster({ uid }: { uid: string }) {
  const cx = 148;
  const cy = 108;
  const outer = hexVerts(cx, cy, 72);
  const atoms: AtomSpec[] = [
    { x: cx, y: cy, r: 17 },
    ...outer.map(([x, y], k) => ({ x, y, r: k % 2 ? 8 : 13 })),
  ];
  const bonds: [Pt, Pt][] = [
    ...outer.map((p) => [[cx, cy], p] as [Pt, Pt]),
    [outer[0], outer[1]],
    [outer[2], outer[3]],
    [outer[4], outer[5]],
  ];
  return <MoleculeSVG uid={uid} atoms={atoms} bonds={bonds} />;
}

/** 2 — Polymer backbone (zig-zag chain with side branches). */
function PolymerChain({ uid }: { uid: string }) {
  const pts: Pt[] = [];
  for (let k = 0; k < 8; k++) pts.push([-6 + k * 36, k % 2 ? 128 : 84]);
  const bonds: [Pt, Pt][] = pts.slice(1).map((p, k) => [pts[k], p]);
  const atoms: AtomSpec[] = pts.map((p, k) => ({ x: p[0], y: p[1], r: k % 2 ? 8 : 11 }));
  pts.forEach((p, k) => {
    if (k % 2 === 0 && k > 0 && k < pts.length - 1) {
      const tip: Pt = [p[0], p[1] - 34];
      bonds.push([p, tip]);
      atoms.push({ x: tip[0], y: tip[1], r: 6 });
    }
  });
  return <MoleculeSVG uid={uid} atoms={atoms} bonds={bonds} />;
}

/** 3 — Fused hexagonal rings (naphthalene-like). */
function FusedRings({ uid }: { uid: string }) {
  const r = 46;
  const dx = Math.sqrt(3) * r;
  const c1: Pt = [86, 110];
  const c2: Pt = [86 + dx, 110];
  const v1 = hexVerts(c1[0], c1[1], r);
  const v2 = hexVerts(c2[0], c2[1], r);
  const bonds = dedupBonds([...ringBonds(v1), ...ringBonds(v2)]);
  const atoms = dedupAtoms([...v1, ...v2].map(([x, y]) => ({ x, y, r: 7 })));
  return <MoleculeSVG uid={uid} atoms={atoms} bonds={bonds} />;
}

/** 4 — Scattered molecular network graph. */
function NetworkGraph({ uid }: { uid: string }) {
  const nodes: AtomSpec[] = [
    { x: 40, y: 52, r: 10 },
    { x: 108, y: 30, r: 7 },
    { x: 182, y: 58, r: 13 },
    { x: 212, y: 142, r: 8 },
    { x: 150, y: 118, r: 15 },
    { x: 78, y: 112, r: 9 },
    { x: 120, y: 188, r: 10 },
    { x: 38, y: 168, r: 7 },
    { x: 204, y: 198, r: 6 },
  ];
  const edges: [number, number][] = [
    [0, 5], [5, 1], [1, 2], [2, 4], [4, 3], [4, 6], [5, 7], [6, 8], [6, 7], [4, 5], [2, 3],
  ];
  const bonds: [Pt, Pt][] = edges.map(([a, b]) => [[nodes[a].x, nodes[a].y], [nodes[b].x, nodes[b].y]]);
  return <MoleculeSVG uid={uid} atoms={nodes} bonds={bonds} />;
}

/** 5 — Atom with orbiting electrons. */
function AtomOrbit({ uid }: { uid: string }) {
  const cx = 150;
  const cy = 108;
  const underlay = (
    <g fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1.4">
      <ellipse cx={cx} cy={cy} rx="96" ry="42" transform={`rotate(20 ${cx} ${cy})`} />
      <ellipse cx={cx} cy={cy} rx="96" ry="42" transform={`rotate(80 ${cx} ${cy})`} />
      <ellipse cx={cx} cy={cy} rx="96" ry="42" transform={`rotate(-44 ${cx} ${cy})`} />
    </g>
  );
  const atoms: AtomSpec[] = [
    { x: cx, y: cy, r: 18 },
    { x: cx + 74, y: cy - 28, r: 7 },
    { x: cx - 64, y: cy + 40, r: 6 },
    { x: cx + 16, y: cy - 54, r: 6 },
  ];
  return <MoleculeSVG uid={uid} atoms={atoms} bonds={[]} underlay={underlay} />;
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
