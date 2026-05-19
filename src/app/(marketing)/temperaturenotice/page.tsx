import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT, SITE } from "@/lib/constants";
import Reveal from "@/components/Reveal";
import CollapsibleSection from "@/components/CollapsibleSection";

export const metadata: Metadata = {
  title: "Medication Shipping & Temperature Notice",
  description:
    "How Logos RX ships compounded medication, the temperature ranges your prescription tolerates, what your shipment should contain, and the safety checks to perform before use.",
  alternates: { canonical: `${SITE.url}/temperaturenotice` },
  openGraph: {
    title: `Medication Shipping & Temperature Notice — ${SITE.name}`,
    description:
      "Warm vials are expected. Here is exactly how your compounded medication is shipped and what to check on arrival.",
    url: `${SITE.url}/temperaturenotice`,
    type: "article",
  },
};

/* ------------------------------------------------------------------ */
/*  Inline icon library — kept local to this page to avoid promoting  */
/*  one-off glyphs to the shared component tree.                      */
/* ------------------------------------------------------------------ */

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M14 3l9.5 4.75v12.5L14 25l-9.5-4.75V7.75L14 3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 7.75L14 12.5l9.5-4.75M14 12.5V25"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.25 5.375L18.75 10.125"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ThermometerIcon({ className }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M14 4a3 3 0 0 0-3 3v9.6a5 5 0 1 0 6 0V7a3 3 0 0 0-3-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="20.5" r="2.5" fill="currentColor" />
      <path d="M14 9v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SunHotIcon({ className }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="14" cy="14" r="4.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M14 3.5v2.25M14 22.25V24.5M3.5 14h2.25M22.25 14H24.5M5.7 5.7l1.6 1.6M20.7 20.7l1.6 1.6M5.7 22.3l1.6-1.6M20.7 7.3l1.6-1.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FridgeIcon({ className }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="6"
        y="3.5"
        width="16"
        height="21"
        rx="2.25"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M6 11.25h16" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9.25 7.25v2M9.25 14.5v3.25"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NoFreezeIcon({ className }: { className?: string }) {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="22" cy="22" r="20" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M22 9v26M9 22h26M13 13l18 18M31 13L13 31"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 8l28 28"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SyringeIcon({ className }: { className?: string }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M21 4l7 7M22.5 5.5l4 4M19 7l6 6M14 12l6 6-8 8H7v-5l7-7z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M9 23l-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SwabIcon({ className }: { className?: string }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="5"
        y="9"
        width="22"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 13.5h14M9 18.5h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VialIcon({ className }: { className?: string }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M11 4h10v3H11zM12 7h8v18a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3V7z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 16.5h8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function AlertXIcon({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="9.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M7.75 7.75l6.5 6.5M14.25 7.75l-6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 10.5l4 4 8-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SnowflakeIcon({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2v20M2 12h20M4.5 4.5l15 15M19.5 4.5l-15 15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M9 4l3 3 3-3M9 20l3-3 3 3M4 9l3 3-3 3M20 9l-3 3 3 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------
 *  Decorative dot-pattern. SVG <pattern> tile sized 18x18 with a
 *  3px circle — mirrors the halftone backgrounds on the printed
 *  insert. Stroked at currentColor with low opacity in the parent
 *  so the same SVG can recolor against navy or cream backgrounds.
 * ----------------------------------------------------------------*/
function DotsPattern({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="tn-dots"
          x="0"
          y="0"
          width="18"
          height="18"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="3" cy="3" r="1.5" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#tn-dots)" />
    </svg>
  );
}

/* ------------------------------------------------------------------
 *  Custom hero illustration — insulated shipping box, gel pack, and
 *  vials. Pure SVG so it scales crisply and adds zero KB to the JS
 *  bundle. Uses the brand palette via Tailwind text colors and
 *  CSS variables (`var(--color-...)`).
 * ----------------------------------------------------------------*/
function ShippingBoxIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 360"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-labelledby="shipping-box-title"
    >
      <title id="shipping-box-title">
        Insulated Logos RX shipping box with cold packs and medication vials.
      </title>

      {/* Background halo */}
      <defs>
        <radialGradient id="tn-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-magenta)" stopOpacity="0.18" />
          <stop offset="60%" stopColor="var(--color-magenta)" stopOpacity="0.05" />
          <stop offset="100%" stopColor="var(--color-magenta)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tn-box-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FAF9F6" />
          <stop offset="100%" stopColor="#EAE7E0" />
        </linearGradient>
        <linearGradient id="tn-box-side" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8E6E1" />
          <stop offset="100%" stopColor="#CFCBC1" />
        </linearGradient>
        <linearGradient id="tn-gel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9FC8F2" />
          <stop offset="100%" stopColor="#5F86C4" />
        </linearGradient>
        <linearGradient id="tn-vial-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#EDEAFE" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="tn-vial-fluid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-magenta-light)" />
          <stop offset="100%" stopColor="var(--color-magenta)" />
        </linearGradient>
      </defs>

      <circle cx="180" cy="180" r="170" fill="url(#tn-halo)" />

      {/* Halftone dots — top right */}
      <g opacity="0.18" fill="var(--color-navy)">
        {Array.from({ length: 7 }).map((_, row) =>
          Array.from({ length: 7 }).map((_, col) => (
            <circle
              key={`dot-tr-${row}-${col}`}
              cx={260 + col * 10}
              cy={30 + row * 10}
              r={1.5 - (row + col) * 0.05}
            />
          )),
        )}
      </g>

      {/* Halftone dots — bottom left */}
      <g opacity="0.14" fill="var(--color-magenta)">
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 8 }).map((_, col) => (
            <circle
              key={`dot-bl-${row}-${col}`}
              cx={20 + col * 10}
              cy={250 + row * 10}
              r={1.6 - row * 0.1}
            />
          )),
        )}
      </g>

      {/* --- Shipping box (isometric-ish) --- */}
      {/* Back / side panel */}
      <path
        d="M88 122 L180 96 L272 122 L272 268 L180 296 L88 268 Z"
        fill="url(#tn-box-side)"
        stroke="var(--color-navy)"
        strokeOpacity="0.18"
        strokeWidth="1.5"
      />
      {/* Front panel */}
      <path
        d="M88 122 L180 150 L180 296 L88 268 Z"
        fill="url(#tn-box-front)"
        stroke="var(--color-navy)"
        strokeOpacity="0.22"
        strokeWidth="1.5"
      />
      {/* Top inner shadow */}
      <path
        d="M88 122 L180 150 L272 122"
        fill="none"
        stroke="var(--color-navy)"
        strokeOpacity="0.18"
        strokeWidth="1.5"
      />

      {/* Box tape stripe */}
      <rect
        x="118"
        y="195"
        width="35"
        height="6"
        transform="rotate(11 130 198)"
        fill="var(--color-magenta)"
        opacity="0.9"
        rx="1"
      />
      {/* Box label */}
      <rect
        x="108"
        y="218"
        width="52"
        height="28"
        rx="3"
        fill="#FFFFFF"
        stroke="var(--color-navy)"
        strokeOpacity="0.15"
        strokeWidth="1"
      />
      <text
        x="134"
        y="233"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill="var(--color-navy)"
        fontFamily="inherit"
      >
        LOGOS RX
      </text>
      <text
        x="134"
        y="242"
        textAnchor="middle"
        fontSize="5"
        fill="var(--color-navy)"
        opacity="0.6"
        fontFamily="inherit"
      >
        KEEP UPRIGHT
      </text>

      {/* Up arrows on side */}
      <g
        transform="translate(208 200)"
        stroke="var(--color-navy)"
        strokeOpacity="0.45"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M0 22 L0 4 M-4 8 L0 4 L4 8" />
        <path d="M14 26 L14 8 M10 12 L14 8 L18 12" />
      </g>

      {/* --- Gel pack peeking above box --- */}
      <g transform="translate(150 70)">
        <rect
          x="0"
          y="0"
          width="60"
          height="40"
          rx="6"
          fill="url(#tn-gel)"
          stroke="#3F6BB2"
          strokeOpacity="0.4"
          strokeWidth="1.2"
        />
        {/* gel bubbles */}
        <circle cx="14" cy="14" r="3" fill="#FFFFFF" opacity="0.55" />
        <circle cx="32" cy="22" r="2.4" fill="#FFFFFF" opacity="0.55" />
        <circle cx="46" cy="12" r="3.4" fill="#FFFFFF" opacity="0.55" />
        <circle cx="22" cy="30" r="2" fill="#FFFFFF" opacity="0.5" />
      </g>

      {/* --- Vials standing in box --- */}
      <g transform="translate(174 56)">
        {/* Vial 1 */}
        <g transform="translate(0 0)">
          <rect
            x="-8"
            y="0"
            width="16"
            height="4"
            rx="1"
            fill="var(--color-navy)"
            opacity="0.85"
          />
          <rect
            x="-7"
            y="4"
            width="14"
            height="44"
            rx="2"
            fill="url(#tn-vial-glass)"
            stroke="var(--color-navy)"
            strokeOpacity="0.35"
            strokeWidth="1"
          />
          <rect x="-6" y="24" width="12" height="22" rx="1" fill="url(#tn-vial-fluid)" />
          <rect
            x="-7"
            y="34"
            width="14"
            height="10"
            fill="#FFFFFF"
            stroke="var(--color-navy)"
            strokeOpacity="0.2"
            strokeWidth="0.7"
          />
          <line
            x1="-5"
            y1="38"
            x2="5"
            y2="38"
            stroke="var(--color-navy)"
            strokeOpacity="0.35"
            strokeWidth="0.8"
          />
          <line
            x1="-5"
            y1="41"
            x2="3"
            y2="41"
            stroke="var(--color-navy)"
            strokeOpacity="0.35"
            strokeWidth="0.8"
          />
        </g>
        {/* Vial 2 (slightly behind/right) */}
        <g transform="translate(22 6)">
          <rect
            x="-7"
            y="0"
            width="14"
            height="3.5"
            rx="1"
            fill="var(--color-navy)"
            opacity="0.85"
          />
          <rect
            x="-6"
            y="3.5"
            width="12"
            height="40"
            rx="2"
            fill="url(#tn-vial-glass)"
            stroke="var(--color-navy)"
            strokeOpacity="0.35"
            strokeWidth="1"
          />
          <rect x="-5" y="22" width="10" height="20" rx="1" fill="url(#tn-vial-fluid)" />
        </g>
      </g>

      {/* --- Floating snowflake (decorative) --- */}
      <g
        transform="translate(60 110)"
        stroke="var(--color-sky)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      >
        <line x1="0" y1="-12" x2="0" y2="12" />
        <line x1="-12" y1="0" x2="12" y2="0" />
        <line x1="-8.5" y1="-8.5" x2="8.5" y2="8.5" />
        <line x1="-8.5" y1="8.5" x2="8.5" y2="-8.5" />
        <path d="M-3 -10 L0 -7 L3 -10 M-3 10 L0 7 L3 10 M-10 -3 L-7 0 L-10 3 M10 -3 L7 0 L10 3" />
      </g>

      {/* --- Floating sun (decorative) --- */}
      <g transform="translate(310 250)" fill="none" opacity="0.9">
        <circle
          cx="0"
          cy="0"
          r="9"
          stroke="var(--color-magenta)"
          strokeWidth="1.6"
        />
        <g stroke="var(--color-magenta)" strokeWidth="1.4" strokeLinecap="round">
          <line x1="0" y1="-15" x2="0" y2="-12" />
          <line x1="0" y1="12" x2="0" y2="15" />
          <line x1="-15" y1="0" x2="-12" y2="0" />
          <line x1="12" y1="0" x2="15" y2="0" />
          <line x1="-11" y1="-11" x2="-9" y2="-9" />
          <line x1="9" y1="9" x2="11" y2="11" />
          <line x1="-11" y1="11" x2="-9" y2="9" />
          <line x1="9" y1="-9" x2="11" y2="-11" />
        </g>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

const ARRIVAL_STEPS = [
  {
    title: "Inspect the outer box",
    detail:
      "Check the packaging for visible damage. Even if the gel packs feel warm, the insulated lining has been protecting the vials inside throughout transit.",
    icon: PackageIcon,
  },
  {
    title: "Examine the vials",
    detail:
      "Confirm the seals are intact, the glass is undamaged, and the contents are clear (or red, if your formulation includes vitamin B12). The labels should match your prescription.",
    icon: VialIcon,
  },
  {
    title: "Refrigerate for storage",
    detail:
      "Move the medication vials into your refrigerator inside the plastic containers provided. This maintains optimal long-term stability between doses.",
    icon: FridgeIcon,
  },
] as const;

const TOLERANCES = [
  {
    icon: ThermometerIcon,
    eyebrow: "Room temperature",
    headline: "Up to 21 days",
    detail:
      "Remains effective if stored at room temperature below 86 °F (30 °C) for up to 21 days.",
  },
  {
    icon: SunHotIcon,
    eyebrow: "In transit",
    headline: "Up to 3 days at 120 °F",
    detail:
      "Can tolerate short-term exposure to temperatures as high as 120 °F (49 °C) for up to 3 days during transit.",
  },
  {
    icon: FridgeIcon,
    eyebrow: "Long-term storage",
    headline: "Refrigerate at home",
    detail:
      "Refrigerate in the plastic containers provided to maintain optimal long-term stability.",
  },
] as const;

/**
 * Temperature spectrum markers. Each marker is positioned along a
 * 0–100 scale that maps °F → percent (we plot from 0 °F to 130 °F so
 * the danger zones bracket the safe band visually).
 */
const TEMP_MARKERS: Array<{
  label: string;
  sub: string;
  pct: number;
  tone: "danger" | "ok" | "warn";
}> = [
  { label: "32 °F", sub: "Freezing", pct: 24, tone: "danger" },
  { label: "36–46 °F", sub: "Refrigerator", pct: 33, tone: "ok" },
  { label: "68–77 °F", sub: "Room temp", pct: 55, tone: "ok" },
  { label: "86 °F", sub: "21-day max", pct: 66, tone: "ok" },
  { label: "120 °F", sub: "3-day transit max", pct: 92, tone: "warn" },
];

const DO_NOT_USE = [
  "The glass vials are cracked or leaking (usually a 3-month supply shipped together).",
  "The cap or seal appears broken or tampered with.",
  "The contents appear cloudy, discolored, or contain particles.",
  "The markings on the labels do not match your prescription.",
] as const;

const SHIPMENT_CONTENTS = [
  {
    icon: SyringeIcon,
    title: "Syringes",
    detail: "Sterile, single-use, sized for your prescribed dose.",
  },
  {
    icon: SwabIcon,
    title: "Alcohol Swabs",
    detail: "Individually sealed 70% isopropyl prep pads.",
  },
  {
    icon: VialIcon,
    title: "Medication Vial(s)",
    detail: "Your compounded formulation, labeled with patient and dosing instructions.",
  },
] as const;

const FAQS = [
  {
    label: "Why are the gel packs warm when my package arrives?",
    content:
      "Gel and ice packs are added to help maintain a stable temperature during the first leg of shipping. It is completely normal for them to warm to ambient temperature by the time the box reaches your door. Your medication is stability-tested for these exact conditions and is safe to use.",
  },
  {
    label: "My package sat in a hot mailbox or porch — is the medication still good?",
    content:
      "Yes, as long as the exposure was within the documented tolerance: up to 120 °F (49 °C) for up to 3 days during transit. If you suspect exposure beyond that range, contact us so a pharmacist can review the situation with you.",
  },
  {
    label: "Why does my medication look red or pink?",
    content:
      "If your formulation includes vitamin B12 (cyanocobalamin or methylcobalamin), the solution will have a red or pink hue. This is expected and does not indicate a problem with the medication.",
  },
  {
    label: "What if my medication arrived frozen?",
    content:
      "Do not use medication that has been frozen. Freezing can damage both the active ingredients and the glass vial. Set the shipment aside and contact our pharmacy team immediately so we can arrange a replacement.",
  },
  {
    label: "Where should I store my medication once it arrives?",
    content:
      "Refrigerate the vials in the plastic container provided. Keep them away from the freezer compartment and out of direct sunlight. Bring the vial to room temperature before drawing your dose, per your provider's instructions.",
  },
  {
    label: "How long does the medication remain effective?",
    content:
      "Refrigerated vials remain stable through their printed beyond-use date (typically a 3-month supply). At room temperature below 86 °F (30 °C), the medication remains effective for up to 21 days.",
  },
];

const RELATED = [
  {
    href: "/product-insert/intramuscular-injections",
    title: "Intramuscular Injections",
    detail:
      "Site selection, draw technique, and safety protocols for IM injections.",
  },
  {
    href: "/product-insert/subcutaneous-injections",
    title: "Subcutaneous Injections",
    detail:
      "Site rotation, technique, and proper disposal for SubQ injections.",
  },
  {
    href: "/support",
    title: "Support & Education Center",
    detail:
      "Articles, FAQs, and direct contact with our pharmacy team.",
  },
] as const;

export default function TemperatureNoticePage() {
  return (
    <>
      {/* -------------------- Hero -------------------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cream to-white py-20 sm:py-28">
        {/* decorative dot pattern (top-right) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 -right-10 h-80 w-80 text-navy/15"
        >
          <DotsPattern className="h-full w-full" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <Reveal className="lg:col-span-7">
              <Link
                href="/support"
                className="inline-flex items-center gap-2 text-sm font-medium text-navy/65 hover:text-magenta transition-colors mb-8"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M10 4L6 8l4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Support Center
              </Link>

              <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-magenta mb-3">
                Shipping &amp; Storage
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-tight mb-6">
                Medication Shipping &amp;<br className="hidden sm:block" />{" "}
                Temperature Notice
              </h1>
              <p className="text-lg text-navy/65 leading-relaxed max-w-2xl mb-8">
                Your medication is packaged in insulated shipping materials with gel
                or ice packs to keep the contents stable in transit. It is normal for
                those packs to warm over time and arrive at ambient temperature — your
                compounded formulation is built for it.
              </p>

              {/* Quick reference chips */}
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white border border-beige px-4 py-2 text-sm font-medium text-navy/80 shadow-sm">
                  <CheckIcon className="w-4 h-4 text-magenta" />
                  Warm gel packs are expected
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white border border-beige px-4 py-2 text-sm font-medium text-navy/80 shadow-sm">
                  <SnowflakeIcon className="w-4 h-4 text-magenta" />
                  Do not freeze
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white border border-beige px-4 py-2 text-sm font-medium text-navy/80 shadow-sm">
                  <FridgeIcon className="w-4 h-4 text-magenta" />
                  Refrigerate after inspection
                </span>
              </div>
            </Reveal>

            <Reveal delay={150} className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <ShippingBoxIllustration className="w-full h-auto" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* -------------------- Arrival timeline -------------------- */}
      <section className="bg-white py-20 sm:py-24 border-b border-beige">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal className="mb-12 max-w-3xl">
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-magenta mb-3">
              When your shipment arrives
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
              A three-step inspection on delivery day
            </h2>
            <p className="text-base sm:text-lg text-navy/65 leading-relaxed">
              The full inspection takes under two minutes. Most patients can complete
              it before unboxing the rest of their day.
            </p>
          </Reveal>

          <ol className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {/* Connector line on md+ */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute left-[8.333%] right-[8.333%] top-7 h-px bg-beige"
            />

            {ARRIVAL_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal
                  as="li"
                  key={step.title}
                  delay={i * 100}
                  className="relative flex flex-col items-start"
                >
                  <div className="relative z-10 flex items-center gap-4 mb-5">
                    <span className="flex items-center justify-center w-14 h-14 rounded-full bg-navy text-white text-base font-bold shadow-sm">
                      {i + 1}
                    </span>
                    <span className="text-magenta">
                      <Icon className="w-8 h-8" />
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-navy mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-sm text-navy/70 leading-relaxed">
                    {step.detail}
                  </p>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </section>

      {/* -------------------- Reassurance + temperature spectrum -------------------- */}
      <section className="relative overflow-hidden bg-cream py-20 sm:py-24 border-b border-beige">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-12 -left-12 h-72 w-72 text-magenta/15"
        >
          <DotsPattern className="h-full w-full" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal className="mb-12 max-w-3xl">
            <span className="inline-block rounded-full bg-sky/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-sky mb-4">
              Why warm vials are fine
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
              Cold medicine is not expected or necessary.
            </h2>
            <p className="text-base sm:text-lg text-navy/65 leading-relaxed">
              Your compounded medication is stability-tested across the temperature
              swings shipping can throw at it. Here is what your formulation can
              safely tolerate.
            </p>
          </Reveal>

          {/* Tolerance tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOLERANCES.map((t, i) => {
              const Icon = t.icon;
              return (
                <Reveal
                  key={t.eyebrow}
                  delay={i * 100}
                  className="flex flex-col rounded-2xl bg-white p-7 border border-beige hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-magenta/10 flex items-center justify-center text-magenta shrink-0 mb-5">
                    <Icon className="w-7 h-7" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-navy/55 mb-2">
                    {t.eyebrow}
                  </p>
                  <p className="text-lg font-bold text-navy mb-2 leading-snug">
                    {t.headline}
                  </p>
                  <p className="text-sm text-navy/70 leading-relaxed">{t.detail}</p>
                </Reveal>
              );
            })}
          </div>

          {/* Temperature spectrum visualization */}
          <Reveal delay={200} className="mt-12 rounded-3xl bg-white p-7 sm:p-10 border border-beige shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-navy/55 mb-2">
                  Temperature spectrum
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-navy leading-snug">
                  Where your compound is safe — at a glance
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs text-navy/65">
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky/70" /> Safe
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-magenta-light" /> Caution
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-navy" /> Do not use
                </span>
              </div>
            </div>

            {/*
             *  Markers are staggered above/below the bar (even indices
             *  on top, odd indices below). This keeps the cluster of
             *  freezer ↔ refrigerator readings legible on narrow
             *  viewports where horizontal-only labels would overlap.
             */}

            {/* Above-bar labels (even indices: 0, 2, 4) */}
            <div className="relative h-14">
              {TEMP_MARKERS.map((m, i) =>
                i % 2 === 0 ? (
                  <div
                    key={m.label}
                    className="absolute bottom-0 -translate-x-1/2 text-center"
                    style={{ left: `${m.pct}%` }}
                  >
                    <p className="text-xs font-bold text-navy whitespace-nowrap">
                      {m.label}
                    </p>
                    <p className="text-[10px] text-navy/60 whitespace-nowrap">
                      {m.sub}
                    </p>
                    <div
                      className={`mx-auto mt-1 w-px h-3 ${
                        m.tone === "danger"
                          ? "bg-navy"
                          : m.tone === "warn"
                            ? "bg-magenta"
                            : "bg-sky"
                      }`}
                    />
                  </div>
                ) : null,
              )}
            </div>

            {/* The bar */}
            <div className="relative h-3 rounded-full overflow-hidden bg-navy/10">
              <div
                className="absolute inset-y-0 left-0 right-0"
                style={{
                  background:
                    "linear-gradient(to right, var(--color-navy) 0%, var(--color-navy) 18%, var(--color-sky-light) 22%, var(--color-sky-light) 38%, var(--color-sky) 42%, var(--color-sky) 60%, var(--color-magenta-light) 70%, var(--color-magenta-light) 88%, var(--color-magenta) 92%, var(--color-magenta) 100%)",
                }}
              />
            </div>

            {/* Below-bar labels (odd indices: 1, 3) */}
            <div className="relative h-14">
              {TEMP_MARKERS.map((m, i) =>
                i % 2 === 1 ? (
                  <div
                    key={m.label}
                    className="absolute top-0 -translate-x-1/2 text-center"
                    style={{ left: `${m.pct}%` }}
                  >
                    <div
                      className={`mx-auto w-px h-3 mb-1 ${
                        m.tone === "danger"
                          ? "bg-navy"
                          : m.tone === "warn"
                            ? "bg-magenta"
                            : "bg-sky"
                      }`}
                    />
                    <p className="text-xs font-bold text-navy whitespace-nowrap">
                      {m.label}
                    </p>
                    <p className="text-[10px] text-navy/60 whitespace-nowrap">
                      {m.sub}
                    </p>
                  </div>
                ) : null,
              )}
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-navy/55">
              <span>Colder</span>
              <span>Hotter</span>
            </div>
          </Reveal>

          {/* B12 note */}
          <Reveal
            delay={300}
            className="mt-8 flex items-start gap-4 rounded-2xl border border-beige bg-white p-5 sm:p-6"
          >
            <div className="w-10 h-10 rounded-full bg-magenta/10 flex items-center justify-center shrink-0 text-magenta">
              <VialIcon className="w-5 h-5" />
            </div>
            <p className="text-sm sm:text-base text-navy/70 leading-relaxed">
              <span className="font-semibold text-navy">A note on color: </span>
              your medication may appear red if vitamin B12 has been added. This is
              expected and does not indicate a problem with the product.
            </p>
          </Reveal>
        </div>
      </section>

      {/* -------------------- DO NOT FREEZE -------------------- */}
      <section
        className="relative overflow-hidden bg-navy-deep py-20 sm:py-24"
        data-header-theme="dark"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 text-white/10"
        >
          <DotsPattern className="h-full w-full" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <Reveal className="lg:col-span-4 flex justify-center lg:justify-start">
              <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-magenta/25 blur-3xl" />
                <NoFreezeIcon className="relative w-32 h-32 sm:w-44 sm:h-44 text-magenta-light" />
              </div>
            </Reveal>

            <Reveal delay={150} className="lg:col-span-8">
              <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-magenta-light mb-3">
                Critical
              </p>
              <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">
                Do not freeze.
              </h2>
              <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl mb-6">
                Freezing can damage the active ingredients and the glass vial itself.
                If your shipment arrives frozen — or you suspect it was frozen at any
                point in transit — set the medication aside and contact us so we can
                arrange a replacement.
              </p>

              {/* Inline checklist */}
              <ul className="mb-7 space-y-2.5 max-w-xl">
                <li className="flex items-start gap-3 text-sm sm:text-base text-white/75">
                  <CheckIcon className="w-5 h-5 text-magenta-light shrink-0 mt-0.5" />
                  Refrigeration is fine — even ideal for long-term storage.
                </li>
                <li className="flex items-start gap-3 text-sm sm:text-base text-white/75">
                  <CheckIcon className="w-5 h-5 text-magenta-light shrink-0 mt-0.5" />
                  Warm gel packs on arrival? Still fine.
                </li>
                <li className="flex items-start gap-3 text-sm sm:text-base text-white/75">
                  <AlertXIcon className="w-5 h-5 text-magenta-light shrink-0 mt-0.5" />
                  Freezer, freezer compartment, or below 32 °F — do not use.
                </li>
              </ul>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={CONTACT.phoneHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-magenta px-7 py-3.5 text-sm font-semibold text-white hover:bg-magenta-dark transition-colors"
                >
                  Call {CONTACT.phone}
                </a>
                <a
                  href={CONTACT.emailHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/15 px-7 py-3.5 text-sm font-semibold text-white/80 hover:border-magenta hover:text-white transition-colors"
                >
                  Email Support
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* -------------------- Do not use checklist -------------------- */}
      <section className="bg-white py-20 sm:py-24 border-b border-beige">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <Reveal className="mb-10">
            <span className="inline-block rounded-full bg-magenta/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-magenta mb-4">
              Inspect on arrival
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
              Do not use the medication if…
            </h2>
            <p className="text-base text-navy/65 leading-relaxed">
              Take a moment to inspect each vial before storing or using it. If any
              of the following are true, set the medication aside and contact our
              pharmacy team for a replacement.
            </p>
          </Reveal>

          <ul className="space-y-3">
            {DO_NOT_USE.map((item, i) => (
              <Reveal
                as="li"
                key={item}
                delay={i * 80}
                className="flex items-start gap-4 rounded-2xl bg-cream p-5 sm:p-6"
              >
                <span className="shrink-0 mt-0.5 text-magenta">
                  <AlertXIcon className="w-6 h-6" />
                </span>
                <p className="text-sm sm:text-base text-navy/80 leading-relaxed">
                  {item}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* -------------------- Shipment contents -------------------- */}
      <section className="bg-white py-20 sm:py-24 border-b border-beige">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal className="mb-10 max-w-3xl">
            <span className="inline-block rounded-full bg-sky/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-sky mb-4">
              What&apos;s in the box
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
              Your shipment should include
            </h2>
            <p className="text-base text-navy/65 leading-relaxed">
              Every Logos RX delivery is built to be a complete kit so you can dose
              at home without a separate trip to the pharmacy.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {SHIPMENT_CONTENTS.map((item, i) => {
              const Icon = item.icon;
              return (
                <Reveal
                  key={item.title}
                  delay={i * 100}
                  className="flex flex-col items-start rounded-2xl border border-beige bg-white p-7 hover:shadow-md transition-shadow"
                >
                  <div className="w-14 h-14 rounded-2xl bg-magenta/10 flex items-center justify-center text-magenta mb-5">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-navy mb-2">{item.title}</h3>
                  <p className="text-sm text-navy/65 leading-relaxed">
                    {item.detail}
                  </p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* -------------------- FAQ -------------------- */}
      <section className="bg-cream py-20 sm:py-24 border-b border-beige">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-magenta mb-3">
                Common questions
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-navy leading-tight mb-5">
                Patient questions, answered.
              </h2>
              <p className="text-base text-navy/65 leading-relaxed mb-6">
                If you have a question not covered here, our pharmacy team is one
                call away. We&rsquo;re available Monday through Saturday and online
                chat is staffed around the clock.
              </p>
              <a
                href={CONTACT.phoneHref}
                className="inline-flex items-center gap-2 rounded-full border-2 border-magenta px-6 py-2.5 text-sm font-semibold text-magenta hover:bg-magenta hover:text-white transition-colors"
              >
                Call {CONTACT.phone}
              </a>
            </Reveal>

            <Reveal delay={120} className="lg:col-span-7">
              <div className="rounded-2xl bg-white border border-beige px-6 sm:px-8">
                {FAQS.map((faq, i) => (
                  <CollapsibleSection
                    key={faq.label}
                    label={faq.label}
                    content={faq.content}
                    defaultOpen={i === 0}
                  />
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* -------------------- Related resources -------------------- */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal className="mb-10 max-w-3xl">
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-magenta mb-3">
              Keep learning
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
              Related resources
            </h2>
            <p className="text-base text-navy/65 leading-relaxed">
              Step-by-step guides and additional support from our pharmacy team.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {RELATED.map((r, i) => (
              <Reveal
                key={r.href}
                delay={i * 100}
                className="h-full"
              >
                <Link
                  href={r.href}
                  className="group flex h-full flex-col rounded-2xl bg-cream p-7 hover:-translate-y-1 hover:shadow-lg hover:shadow-navy/5 transition-all duration-300"
                >
                  <h3 className="text-base font-bold text-navy group-hover:text-magenta transition-colors mb-2 leading-snug">
                    {r.title}
                  </h3>
                  <p className="text-sm text-navy/70 leading-relaxed mb-6">
                    {r.detail}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-magenta uppercase tracking-wider">
                    View
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2 6h8M7 3l3 3-3 3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>

          {/* Final CTA */}
          <Reveal
            delay={300}
            className="mt-20 rounded-3xl bg-navy-deep p-10 sm:p-14 text-center"
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Something looks off?
            </h3>
            <p className="text-sm text-white/75 mb-8 max-w-md mx-auto">
              Our pharmacy team can answer questions about storage, replace damaged
              vials, and walk you through what to expect with your next refill.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={CONTACT.emailHref}
                className="inline-flex items-center gap-2 rounded-full bg-magenta px-7 py-3.5 text-sm font-semibold text-white hover:bg-magenta-dark transition-colors"
              >
                Contact Our Team
              </a>
              <a
                href={CONTACT.phoneHref}
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/15 px-7 py-3.5 text-sm font-semibold text-white/70 hover:border-magenta hover:text-white transition-colors"
              >
                Call {CONTACT.phone}
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
