"use client";

import type { Option } from "@/lib/onboarding/steps";

export const fieldClass =
  "w-full rounded-2xl border border-beige-dark bg-white px-4.5 py-3.5 text-[15px] text-navy placeholder:text-navy/35 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10";

export function StepHeading({
  title,
  subtitle,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-[28px] font-bold leading-[1.15] tracking-tight text-navy sm:text-[32px]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 text-[15px] leading-relaxed text-navy/55">{subtitle}</p>
      )}
    </div>
  );
}

export function TextField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input aria-label={label} className={fieldClass} {...props} />
    </label>
  );
}

export function SelectField({
  label,
  options,
  placeholder,
  ...props
}: {
  label: string;
  options: Option[];
  placeholder?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className={`${fieldClass} appearance-none pr-10 ${
          props.value ? "text-navy" : "text-navy/35"
        }`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-navy">
            {o.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-navy/40"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
      >
        <path
          d="M3.5 5.5L7 9L10.5 5.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </label>
  );
}

/**
 * Radio-style single-select or checkbox-style multi-select option list.
 * Hims-style: large tappable cards, warm-black selected state with a filled
 * check, gentle hover lift.
 */
export function OptionList({
  options,
  selected,
  onToggle,
  multiple = false,
}: {
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
  multiple?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((o) => {
        const isSelected = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={isSelected}
            onClick={() => onToggle(o.value)}
            className={`flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all active:scale-[0.99] ${
              isSelected
                ? "border-navy bg-navy/[0.03] shadow-soft"
                : "border-beige bg-white hover:border-navy/30 hover:shadow-soft"
            }`}
          >
            <span>
              <span className="block text-[15px] font-semibold text-navy">
                {o.label}
              </span>
              {o.description && (
                <span className="mt-0.5 block text-[13px] leading-snug text-navy/50">
                  {o.description}
                </span>
              )}
            </span>
            <span
              className={`ml-4 flex h-6 w-6 shrink-0 items-center justify-center border-2 transition-colors ${
                multiple ? "rounded-lg" : "rounded-full"
              } ${
                isSelected
                  ? "border-navy bg-navy text-white"
                  : "border-navy/20 bg-white"
              }`}
            >
              {isSelected && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6.5L5 9l4.5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ConsentCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-beige bg-white px-5 py-4 transition-colors hover:border-navy/25">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-navy"
      />
      <span className="text-[13px] leading-relaxed text-navy/65">{children}</span>
    </label>
  );
}

export function DisclosureBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-h-64 overflow-y-auto rounded-2xl border border-beige bg-cream/60 p-5 text-[13px] leading-relaxed text-navy/70">
      {children}
    </div>
  );
}

export function NavButtons({
  onBack,
  onNext,
  nextLabel = "Continue",
  showBack = true,
  loading = false,
  submit = false,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  showBack?: boolean;
  loading?: boolean;
  submit?: boolean;
}) {
  return (
    <div className="mt-9 flex items-center gap-3">
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-beige-dark bg-white text-navy transition-all hover:border-navy/40 active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M11 4L6 9l5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={loading}
        className={`flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-white transition-all active:scale-[0.99] disabled:opacity-60 ${
          submit
            ? "bg-magenta hover:bg-magenta-dark"
            : "bg-navy hover:bg-navy-light"
        }`}
      >
        {loading ? "Saving..." : nextLabel}
        {!loading && (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d={submit ? "M2 8h12M9 3l5 5-5 5" : "M3 8h10M8 3l5 5-5 5"}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
