import { useId } from "react";
import type { DosageChartRow } from "@/data/learning";

interface DosageChartProps {
  rows: DosageChartRow[];
  /** Centered syringe value label, e.g. "100" or "50". */
  maxUnits?: number;
}

/**
 * Two-column dosage chart with a centered insulin-syringe illustration.
 *
 * Left column = mg dose; right column = mL volume. The number column on
 * the syringe SVG ticks from `0` to `maxUnits` (default 100) so the
 * mg ↔ mL ↔ Units triad reads at a glance — mirroring the print catalog.
 */
export default function DosageChart({ rows, maxUnits = 100 }: DosageChartProps) {
  // Ascending top→bottom (10 … 100) so each unit mark lines up with its
  // mg/mL row — the reference row (1 mL) sits beside the 100-unit mark,
  // matching the print catalog's chart.
  const tickStep = Math.round(maxUnits / 10);
  const ticks = Array.from({ length: 10 }, (_, i) => (i + 1) * tickStep);

  return (
    <div className="relative grid grid-cols-[1fr_auto_1fr] gap-4 sm:gap-6 items-center">
      {/* Left column — MG header + rows */}
      <div className="flex flex-col items-end gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-navy/70 mb-2">
          MG
        </p>
        {rows.map((r) => (
          <div
            key={`mg-${r.mg}`}
            className={`rounded-lg px-4 py-2 text-sm w-full text-right min-w-[110px] ${
              r.emphasis
                ? "bg-magenta/10 text-magenta font-semibold"
                : "bg-cream text-navy/80"
            }`}
          >
            {r.mg}
          </div>
        ))}
      </div>

      {/* Center — Syringe SVG */}
      <div className="flex flex-col items-center self-stretch justify-end pb-2">
        <SyringeSvg ticks={ticks} highlightTickIndex={9} />
      </div>

      {/* Right column — ML header + rows */}
      <div className="flex flex-col items-start gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-navy/70 mb-2">
          ML
        </p>
        {rows.map((r) => (
          <div
            key={`ml-${r.ml}`}
            className={`rounded-lg px-4 py-2 text-sm w-full min-w-[110px] ${
              r.emphasis
                ? "bg-magenta/10 text-magenta font-semibold"
                : "bg-cream text-navy/80"
            }`}
          >
            {r.ml}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Realistic vertical insulin syringe: beveled needle + hub, glass barrel with
 * cylindrical shading and a faint medication fill, printed unit graduations
 * (major ticks labeled, 5-unit minor ticks between), rubber stopper, finger
 * flange, and plunger rod with thumb pad. Pure SVG, no external assets.
 */
function SyringeSvg({
  ticks,
  highlightTickIndex,
}: {
  ticks: number[];
  highlightTickIndex?: number;
}) {
  // Unique gradient ids so multiple charts can coexist on one page.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const glassId = `syr-glass-${uid}`;
  const liquidId = `syr-liquid-${uid}`;
  const metalId = `syr-metal-${uid}`;
  const rodId = `syr-rod-${uid}`;

  const CX = 70; // barrel center line
  const BARREL_L = 56;
  const BARREL_R = 84;
  const BARREL_TOP = 64;
  const BARREL_BOT = 352;
  const TICK_TOP = 84;
  const TICK_STEP = 26;
  const STOPPER_Y = 326; // rubber stopper, below the last graduation (y=318)

  return (
    <svg
      width="140"
      height="436"
      viewBox="0 0 140 436"
      fill="none"
      role="img"
      aria-label={`Insulin syringe with unit markings from ${ticks[0]} to ${ticks[ticks.length - 1]}`}
    >
      <defs>
        {/* Glass barrel: darker edges, bright center highlight */}
        <linearGradient id={glassId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#262262" stopOpacity="0.14" />
          <stop offset="0.12" stopColor="#262262" stopOpacity="0.04" />
          <stop offset="0.3" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#f6f8fc" stopOpacity="0.85" />
          <stop offset="0.72" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.9" stopColor="#262262" stopOpacity="0.05" />
          <stop offset="1" stopColor="#262262" stopOpacity="0.16" />
        </linearGradient>
        {/* Medication fill inside the barrel */}
        <linearGradient id={liquidId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5F86C4" stopOpacity="0.28" />
          <stop offset="0.35" stopColor="#6EA3D7" stopOpacity="0.12" />
          <stop offset="0.65" stopColor="#6EA3D7" stopOpacity="0.12" />
          <stop offset="1" stopColor="#5F86C4" stopOpacity="0.3" />
        </linearGradient>
        {/* Brushed metal for the needle + hub */}
        <linearGradient id={metalId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8e94a3" />
          <stop offset="0.35" stopColor="#e8eaef" />
          <stop offset="0.55" stopColor="#c3c8d2" />
          <stop offset="1" stopColor="#7d8493" />
        </linearGradient>
        {/* Plunger rod plastic */}
        <linearGradient id={rodId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#262262" stopOpacity="0.55" />
          <stop offset="0.4" stopColor="#35307a" stopOpacity="0.35" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#262262" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* ── Needle (hair-thin, beveled tip) ── */}
      <path
        d={`M${CX - 0.4} 10 L${CX + 0.4} 4 L${CX + 0.4} 48 L${CX - 0.4} 48 Z`}
        fill="#7d8493"
      />
      <line
        x1={CX - 0.15}
        y1={6}
        x2={CX - 0.15}
        y2={48}
        stroke="#e8eaef"
        strokeWidth="0.25"
      />
      {/* ── Needle hub ── */}
      <path
        d={`M${CX - 2} 48 L${CX + 2} 48 L${CX + 6} 64 L${CX - 6} 64 Z`}
        fill={`url(#${metalId})`}
        stroke="#9aa0ad"
        strokeWidth="0.5"
      />
      <rect x={CX - 6} y={60} width="12" height="2.5" rx="1.25" fill="#8e94a3" opacity="0.55" />

      {/* ── Barrel (glass) ── */}
      <rect
        x={BARREL_L}
        y={BARREL_TOP}
        width={BARREL_R - BARREL_L}
        height={BARREL_BOT - BARREL_TOP}
        rx="7"
        fill={`url(#${glassId})`}
        stroke="#262262"
        strokeOpacity="0.35"
        strokeWidth="1.2"
      />

      {/* Medication fill: needle end down to the rubber stopper */}
      <rect
        x={BARREL_L + 2}
        y={BARREL_TOP + 4}
        width={BARREL_R - BARREL_L - 4}
        height={STOPPER_Y - BARREL_TOP - 4}
        rx="4"
        fill={`url(#${liquidId})`}
      />
      {/* Meniscus at the top of the liquid */}
      <ellipse
        cx={CX}
        cy={BARREL_TOP + 5}
        rx={(BARREL_R - BARREL_L) / 2 - 3}
        ry="2.5"
        fill="#5F86C4"
        opacity="0.22"
      />
      {/* Long vertical glass highlight */}
      <rect
        x={BARREL_L + 3.5}
        y={BARREL_TOP + 8}
        width="2.5"
        height={BARREL_BOT - BARREL_TOP - 20}
        rx="1.25"
        fill="white"
        opacity="0.75"
      />

      {/* ── Graduations ── */}
      {ticks.map((t, i) => {
        const y = TICK_TOP + i * TICK_STEP;
        const isHighlight = i === highlightTickIndex;
        return (
          <g key={t}>
            {/* Major tick: printed line on each wall */}
            <line
              x1={BARREL_L + 1.5}
              x2={BARREL_L + 7}
              y1={y}
              y2={y}
              stroke="#262262"
              strokeOpacity={isHighlight ? 0.9 : 0.55}
              strokeWidth={isHighlight ? 1.5 : 1}
            />
            <line
              x1={BARREL_R - 7}
              x2={BARREL_R - 1.5}
              y1={y}
              y2={y}
              stroke="#262262"
              strokeOpacity={isHighlight ? 0.9 : 0.55}
              strokeWidth={isHighlight ? 1.5 : 1}
            />
            {/* Minor 5-unit tick between majors */}
            {i < ticks.length - 1 && (
              <line
                x1={BARREL_L + 1.5}
                x2={BARREL_L + 4.5}
                y1={y + TICK_STEP / 2}
                y2={y + TICK_STEP / 2}
                stroke="#262262"
                strokeOpacity="0.3"
                strokeWidth="0.8"
              />
            )}
            <text
              x={CX}
              y={y + 4}
              fontSize="11"
              fontWeight={isHighlight ? 800 : 600}
              fill={isHighlight ? "#C62E88" : "#262262"}
              fillOpacity={isHighlight ? 1 : 0.75}
              textAnchor="middle"
            >
              {t}
            </text>
          </g>
        );
      })}

      {/* ── Rubber stopper (two ribs) ── */}
      <rect
        x={BARREL_L + 2.5}
        y={STOPPER_Y}
        width={BARREL_R - BARREL_L - 5}
        height="8"
        rx="2.5"
        fill="#1a1750"
        opacity="0.85"
      />
      <rect
        x={BARREL_L + 2.5}
        y={STOPPER_Y + 11}
        width={BARREL_R - BARREL_L - 5}
        height="8"
        rx="2.5"
        fill="#1a1750"
        opacity="0.85"
      />
      <rect
        x={BARREL_L + 4}
        y={STOPPER_Y + 1.5}
        width={BARREL_R - BARREL_L - 8}
        height="2"
        rx="1"
        fill="white"
        opacity="0.25"
      />

      {/* ── Finger flange ── */}
      <rect
        x={BARREL_L - 12}
        y={BARREL_BOT - 1}
        width={BARREL_R - BARREL_L + 24}
        height="6"
        rx="3"
        fill="#e9ebf2"
        stroke="#262262"
        strokeOpacity="0.3"
        strokeWidth="1"
      />

      {/* ── Plunger rod + thumb pad ── */}
      <rect
        x={CX - 4}
        y={BARREL_BOT + 5}
        width="8"
        height="53"
        rx="1.5"
        fill={`url(#${rodId})`}
        stroke="#262262"
        strokeOpacity="0.35"
        strokeWidth="0.7"
      />
      <ellipse cx={CX} cy={BARREL_BOT + 70} rx="20" ry="3.5" fill="#262262" opacity="0.12" />
      <rect
        x={CX - 17}
        y={BARREL_BOT + 60}
        width="34"
        height="8"
        rx="4"
        fill="#35307a"
        stroke="#1a1750"
        strokeOpacity="0.5"
        strokeWidth="0.8"
      />
      <rect
        x={CX - 14}
        y={BARREL_BOT + 61.5}
        width="28"
        height="2"
        rx="1"
        fill="white"
        opacity="0.3"
      />
    </svg>
  );
}
