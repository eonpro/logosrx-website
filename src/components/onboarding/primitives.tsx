"use client";

import type { Option } from "@/lib/onboarding/steps";

export const fieldClass =
  "w-full rounded-xl border border-beige-dark bg-cream/60 px-4 py-3 text-sm text-navy placeholder:text-navy/45 focus:border-magenta focus:ring-1 focus:ring-magenta outline-none transition-colors";

export function StepHeading({
  title,
  subtitle,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="mb-7">
      <h1 className="text-2xl font-bold leading-tight text-navy">{title}</h1>
      {subtitle && (
        <p className="mt-3 text-sm leading-relaxed text-navy/60">{subtitle}</p>
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
          props.value ? "text-navy" : "text-navy/45"
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
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-navy/50"
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

/** Radio-style single-select or checkbox-style multi-select option list. */
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
    <div className="flex flex-col gap-2.5">
      {options.map((o) => {
        const isSelected = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={isSelected}
            onClick={() => onToggle(o.value)}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-colors ${
              isSelected
                ? "border-magenta bg-magenta/5"
                : "border-beige-dark bg-cream/60 hover:border-navy/30"
            }`}
          >
            <span>
              <span className="block text-sm font-medium text-navy">
                {o.label}
              </span>
              {o.description && (
                <span className="mt-0.5 block text-xs text-navy/50">
                  {o.description}
                </span>
              )}
            </span>
            <span
              className={`ml-3 flex h-5 w-5 shrink-0 items-center justify-center border ${
                multiple ? "rounded-md" : "rounded-full"
              } ${
                isSelected
                  ? "border-magenta bg-magenta text-white"
                  : "border-navy/25"
              }`}
            >
              {isSelected && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6.5L5 9l4.5-5"
                    stroke="currentColor"
                    strokeWidth="1.8"
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
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-beige-dark bg-cream/60 px-4 py-3.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-magenta"
      />
      <span className="text-xs leading-relaxed text-navy/70">{children}</span>
    </label>
  );
}

export function DisclosureBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-h-64 overflow-y-auto rounded-xl border border-magenta/40 bg-white p-4 text-xs leading-relaxed text-navy/70">
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
    <div className="mt-8 flex items-center gap-3">
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-beige text-navy transition-colors hover:bg-beige-dark"
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
        className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
          submit
            ? "bg-magenta hover:bg-magenta-dark"
            : "bg-sky hover:bg-sky-light"
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
