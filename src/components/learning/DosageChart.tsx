"use client";

import { useId, useState } from "react";
import type { DosageChartRow } from "@/data/learning";

interface DosageChartProps {
  rows: DosageChartRow[];
  /** Centered syringe value label, e.g. "100" or "50". */
  maxUnits?: number;
}

/**
 * Units drawn on a U-100 insulin syringe for a given mL volume
 * (1 mL = 100 units). Returns `null` when the string has no parsable number.
 */
function unitsForMl(ml: string): number | null {
  const match = /([\d.]+)/.exec(ml);
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

/**
 * Interactive dosage chart: two dose columns (mg | mL) around a realistic
 * insulin-syringe illustration. Selecting any dose row animates the syringe
 * to that fill level — stopper on the graduation, liquid to match, and a
 * magenta units callout — so patients can see exactly what "0.5 mL" looks
 * like on the syringe in their hand.
 */
export default function DosageChart({ rows, maxUnits = 100 }: DosageChartProps) {
  // Ascending top→bottom (10 … 100) so each unit mark lines up with its
  // mg/mL row — the reference row (1 mL) sits beside the 100-unit mark,
  // matching the print catalog's chart.
  const tickStep = Math.round(maxUnits / 10);
  const ticks = Array.from({ length: 10 }, (_, i) => (i + 1) * tickStep);

  // Start on the emphasized reference row (falls back to the last row).
  const emphasisIndex = rows.findIndex((r) => r.emphasis);
  const [selected, setSelected] = useState(
    emphasisIndex >= 0 ? emphasisIndex : rows.length - 1,
  );

  const selectedUnits = rows[selected] ? unitsForMl(rows[selected].ml) : null;

  const chipClass = (isSelected: boolean, align: "left" | "right") =>
    `w-full min-w-[110px] cursor-pointer rounded-lg px-4 py-2 text-sm transition-colors duration-200 ${
      align === "right" ? "text-right" : "text-left"
    } ${
      isSelected
        ? "bg-magenta/10 font-semibold text-magenta ring-1 ring-magenta/30"
        : "bg-cream text-navy/80 hover:bg-beige/70"
    } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta`;

  return (
    <div>
      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-6">
        {/* Left column — MG header + rows */}
        <div className="flex flex-col items-end gap-2">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-navy/70">
            MG
          </p>
          {rows.map((r, i) => (
            <button
              key={`mg-${r.mg}`}
              type="button"
              aria-pressed={i === selected}
              onClick={() => setSelected(i)}
              onMouseEnter={() => setSelected(i)}
              className={chipClass(i === selected, "right")}
            >
              {r.mg}
            </button>
          ))}
        </div>

        {/* Center — Syringe SVG */}
        <div className="flex flex-col items-center justify-end self-stretch pb-2">
          <SyringeSvg
            ticks={ticks}
            tickStep={tickStep}
            selectedUnits={selectedUnits}
          />
        </div>

        {/* Right column — ML header + rows */}
        <div className="flex flex-col items-start gap-2">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-navy/70">
            ML
          </p>
          {rows.map((r, i) => (
            <button
              key={`ml-${r.ml}`}
              type="button"
              aria-pressed={i === selected}
              onClick={() => setSelected(i)}
              onMouseEnter={() => setSelected(i)}
              className={chipClass(i === selected, "left")}
            >
              {r.ml}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-navy/50">
        Tap or hover a dose to see it drawn on the syringe.
      </p>
    </div>
  );
}

/**
 * Realistic vertical insulin syringe: hair-thin beveled needle + hub, slim
 * glass barrel with cylindrical shading, printed unit graduations (major
 * ticks labeled, 5-unit minor ticks between), and an animated rubber stopper
 * + medication fill that tracks the selected dose. Pure SVG, no assets.
 */
function SyringeSvg({
  ticks,
  tickStep,
  selectedUnits,
}: {
  ticks: number[];
  tickStep: number;
  selectedUnits: number | null;
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

  /** Y of the graduation line for a unit value (continuous, clamped). */
  const yForUnits = (units: number) => {
    const y = TICK_TOP + (units / tickStep - 1) * TICK_STEP;
    const last = TICK_TOP + (ticks.length - 1) * TICK_STEP;
    return Math.min(Math.max(y, TICK_TOP), last);
  };

  const maxUnits = ticks[ticks.length - 1];
  const levelY = yForUnits(selectedUnits ?? maxUnits);
  const stopperY = levelY + 2; // rubber stopper sits right on the graduation
  const move = { transition: "all 450ms cubic-bezier(0.4, 0, 0.2, 1)" } as const;

  return (
    <svg
      width="140"
      height="436"
      viewBox="0 0 140 436"
      fill="none"
      role="img"
      aria-label={
        selectedUnits === null
          ? `Insulin syringe with unit markings from ${ticks[0]} to ${maxUnits}`
          : `Insulin syringe drawn to ${selectedUnits} units`
      }
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

      {/* ── Plunger rod (behind the liquid, visible through the glass) ── */}
      <rect
        x={CX - 4}
        y={stopperY + 18}
        width="8"
        height={BARREL_BOT + 60 - (stopperY + 18)}
        rx="1.5"
        fill={`url(#${rodId})`}
        stroke="#262262"
        strokeOpacity="0.35"
        strokeWidth="0.7"
        style={move}
      />

      {/* ── Medication fill: needle end down to the rubber stopper ── */}
      <rect
        x={BARREL_L + 2}
        y={BARREL_TOP + 4}
        width={BARREL_R - BARREL_L - 4}
        height={Math.max(stopperY - BARREL_TOP - 4, 0)}
        rx="4"
        fill={`url(#${liquidId})`}
        style={move}
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
        const isHighlight = t === selectedUnits;
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
              style={{ transition: "fill 250ms" }}
            >
              {t}
            </text>
          </g>
        );
      })}

      {/* ── Dose level: magenta line + units callout (moves via transform,
            which transitions reliably across browsers) ── */}
      {selectedUnits !== null && (
        <g style={move} transform={`translate(0 ${levelY})`}>
          <line
            x1={BARREL_L - 4}
            x2={BARREL_R + 2}
            y1={0}
            y2={0}
            stroke="#C62E88"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <text
            x={BARREL_L - 8}
            y={4}
            fontSize="11.5"
            fontWeight={800}
            fill="#C62E88"
            textAnchor="end"
          >
            {selectedUnits}u
          </text>
        </g>
      )}

      {/* ── Rubber stopper (two ribs), riding the dose level ── */}
      <g style={move} transform={`translate(0 ${stopperY})`}>
        <rect
          x={BARREL_L + 2.5}
          y={0}
          width={BARREL_R - BARREL_L - 5}
          height="8"
          rx="2.5"
          fill="#1a1750"
          opacity="0.85"
        />
        <rect
          x={BARREL_L + 2.5}
          y={11}
          width={BARREL_R - BARREL_L - 5}
          height="8"
          rx="2.5"
          fill="#1a1750"
          opacity="0.85"
        />
        <rect
          x={BARREL_L + 4}
          y={1.5}
          width={BARREL_R - BARREL_L - 8}
          height="2"
          rx="1"
          fill="white"
          opacity="0.25"
        />
      </g>

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

      {/* ── Thumb pad (fixed, below the barrel) ── */}
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
