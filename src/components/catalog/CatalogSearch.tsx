"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  parseCatalogSearchParams,
  serializeCatalogSearchParams,
} from "@/data/catalog";

interface CatalogSearchProps {
  /** Server-provided initial value so the input doesn't flash empty. */
  initialQuery: string;
  /** Total result count to render the inline hint. */
  resultCount: number;
}

/**
 * Debounced search input that updates the `?q=` URL search param via
 * `router.replace()`. We use `replace` (not `push`) so each keystroke does
 * NOT add a history entry — only navigations and filter toggles do.
 *
 * The input is fully controlled so it stays in sync with the URL when the
 * user uses the browser's back/forward buttons. Re-syncs on `initialQuery`
 * change.
 */
export default function CatalogSearch({
  initialQuery,
  resultCount,
}: CatalogSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputId = useId();
  const hintId = useId();

  // Re-sync when the URL changes externally (back button, filter clicks).
  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  // Clean up the pending debounce on unmount so we don't fire a stale push.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function commit(nextValue: string) {
    // Read the current URL fresh each time so we don't stomp filter changes
    // that happened between keystrokes.
    const current = parseCatalogSearchParams(
      Object.fromEntries(
        new URLSearchParams(window.location.search).entries(),
      ),
    );
    const next = { ...current, q: nextValue.trim().slice(0, 100), page: 1 };
    const qs = serializeCatalogSearchParams(next);
    startTransition(() => {
      router.replace(`${pathname}${qs}`, { scroll: false });
    });
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    setValue(nextValue);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => commit(nextValue), 250);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (timerRef.current) clearTimeout(timerRef.current);
    commit(value);
  }

  function handleClear() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setValue("");
    commit("");
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="relative w-full"
    >
      <label htmlFor={inputId} className="sr-only">
        Search the catalog
      </label>

      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/45"
      >
        <circle
          cx="7"
          cy="7"
          r="5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M14 14l-3-3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      <input
        id={inputId}
        type="search"
        inputMode="search"
        value={value}
        onChange={handleChange}
        placeholder="Search by drug, strength, or ingredient…"
        autoComplete="off"
        aria-describedby={hintId}
        maxLength={100}
        className="w-full rounded-full border border-beige bg-white py-2.5 pl-10 pr-24 text-sm text-navy placeholder:text-navy/55 transition-colors focus:border-magenta focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-navy/55 hover:bg-cream hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
          aria-label="Clear search"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M3 3l8 8M11 3l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      <span id={hintId} className="sr-only" aria-live="polite">
        {isPending ? "Updating results…" : `${resultCount} results`}
      </span>
    </form>
  );
}
