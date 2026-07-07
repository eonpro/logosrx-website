import Link from "next/link";

/**
 * Portal design system — hims-inspired warm minimalism for every internal
 * surface (admin, partners, clinic dashboard). Server-safe (no hooks).
 *
 * Rules of the look:
 *  - warm off-white page (`bg-cream`), white cards, sand hairlines
 *  - big, tight-tracked headings; uppercase micro-labels
 *  - pill (rounded-full) buttons — primary is warm black, magenta is reserved
 *    for the single hero action of a page
 *  - soft diffuse shadows (`shadow-soft`) instead of heavy borders
 */

/* ---------------------------------- class recipes --------------------------------- */

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-plum px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-plum-deep active:scale-[0.98] disabled:opacity-50";

export const btnAccent =
  "inline-flex items-center justify-center gap-2 rounded-full bg-magenta px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-magenta-dark active:scale-[0.98] disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full border border-beige-dark bg-white px-5 py-2.5 text-sm font-semibold text-navy transition-all hover:border-navy/40 active:scale-[0.98] disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-navy/60 transition-colors hover:bg-navy/5 hover:text-navy disabled:opacity-50";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition-all hover:bg-red-50 active:scale-[0.98] disabled:opacity-50";

export const inputClass =
  "w-full rounded-2xl border border-beige-dark bg-white px-4 py-3 text-sm text-navy outline-none transition-all placeholder:text-navy/35 focus:border-plum focus:ring-2 focus:ring-plum/10";

export const selectClass = `${inputClass} appearance-none`;

export const cardClass =
  "rounded-3xl border border-beige/70 bg-white shadow-soft";

export const tableWrapClass =
  "overflow-hidden rounded-3xl border border-beige/70 bg-white shadow-soft";

export const theadClass =
  "border-b border-beige bg-cream/50 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/45";

export const rowClass =
  "border-b border-beige/60 last:border-0 transition-colors hover:bg-cream/50";

/* ---------------------------------- components ------------------------------------ */

/**
 * Standard page header: eyebrow (optional), big tight title, supporting copy,
 * and a right-aligned action slot. Gives every portal page the same confident
 * hims-like opening instead of a bare `<h1>`.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy/40">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-4xl font-medium text-navy sm:text-[2.85rem] sm:leading-[1.05]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-[15px] leading-relaxed text-navy/55">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}

/** White card with soft elevation. `pad` off for tables/media. */
export function Card({
  children,
  pad = true,
  className = "",
}: {
  children: React.ReactNode;
  pad?: boolean;
  className?: string;
}) {
  return (
    <div className={`${cardClass} ${pad ? "p-6 sm:p-7" : ""} ${className}`}>
      {children}
    </div>
  );
}

/** KPI / stat card: micro-label, big number, optional delta/sub line. */
export function StatCard({
  label,
  value,
  sub,
  accent = false,
  href,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: boolean;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
        {label}
      </p>
      <p className="mt-3 font-display text-[2.1rem] font-medium leading-none tabular-nums text-navy">
        {value}
      </p>
      {sub != null && (
        <p className="mt-1.5 text-[13px] text-navy/50">{sub}</p>
      )}
    </>
  );
  const cls = `rounded-3xl p-6 transition-all ${
    accent
      ? "bg-plum text-white shadow-soft-lg [&_p]:text-white/60 [&_p:nth-child(2)]:text-white"
      : `${cardClass}`
  } ${href ? "hover:-translate-y-0.5 hover:shadow-soft-lg" : ""}`;
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

const BADGE_TONES = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  danger: "bg-red-50 text-red-700 ring-red-600/15",
  neutral: "bg-navy/[0.06] text-navy/70 ring-navy/10",
  accent: "bg-magenta/10 text-magenta ring-magenta/20",
  ink: "bg-plum text-white ring-plum",
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

/** Rounded status pill with a subtle ring, replacing ad-hoc color-100 badges. */
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** Friendly empty state for tables/lists with no rows yet. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-8 py-16 text-center">
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-cream text-navy/30">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M3 10h18" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-[15px] font-semibold text-navy">{title}</p>
      {body && <p className="max-w-sm text-sm text-navy/50">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Circle with initials — used in tables so rows feel like people, not data. */
export function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-xs font-bold text-navy/70 ring-1 ring-beige">
      {initials || "•"}
    </span>
  );
}
