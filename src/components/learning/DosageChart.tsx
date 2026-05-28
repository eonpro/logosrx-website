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
  const tickStep = Math.round(maxUnits / 10);
  const ticks = Array.from({ length: 10 }, (_, i) => maxUnits - i * tickStep);

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

function SyringeSvg({
  ticks,
  highlightTickIndex,
}: {
  ticks: number[];
  highlightTickIndex?: number;
}) {
  return (
    <svg
      width="120"
      height="380"
      viewBox="0 0 120 380"
      fill="none"
      role="img"
      aria-label="Insulin syringe with unit markings from 10 to 100"
      className="text-navy/70"
    >
      {/* Barrel */}
      <rect
        x="40"
        y="20"
        width="40"
        height="280"
        rx="6"
        fill="white"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Tick marks + labels */}
      {ticks.map((t, i) => {
        const y = 40 + i * 26;
        const isHighlight = i === highlightTickIndex;
        return (
          <g key={t}>
            <line
              x1="40"
              x2={i % 1 === 0 ? "55" : "50"}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeWidth="1"
            />
            <text
              x="60"
              y={y + 5}
              fontSize="15"
              fontWeight={isHighlight ? "700" : "600"}
              fill="currentColor"
              textAnchor="middle"
              className={isHighlight ? "text-navy" : "text-navy/70"}
            >
              {t}
            </text>
          </g>
        );
      })}
      {/* Plunger */}
      <rect
        x="40"
        y="300"
        width="40"
        height="14"
        fill="currentColor"
        opacity="0.15"
      />
      <rect
        x="48"
        y="314"
        width="24"
        height="48"
        fill="currentColor"
        opacity="0.6"
      />
      <ellipse cx="60" cy="372" rx="22" ry="5" fill="currentColor" opacity="0.35" />
      {/* Needle */}
      <line
        x1="60"
        y1="20"
        x2="60"
        y2="4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
