"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { CONTACT } from "@/lib/constants";

/**
 * Quote-view error boundary. The page is `force-dynamic` and DB-backed, so a
 * transient connection fault would otherwise surface to the customer as the
 * full-screen `global-error`. Catch it here and keep the message specific to
 * the quote context, with a phone fallback (these are sales-critical links).
 *
 * `digest` is the production-only server error fingerprint; surface it so the
 * recipient can quote it to their rep for correlation with a Sentry trace.
 */
export default function QuoteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { surface: "quote" } });
    console.error("[quote] render error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-magenta/10 text-magenta">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-navy">
        We couldn&rsquo;t load your quote
      </h1>
      <p className="max-w-md text-navy/70">
        This is usually temporary. Please try again in a moment — if it keeps
        happening, call us at{" "}
        <a href={CONTACT.phoneHref} className="font-semibold text-magenta">
          {CONTACT.phone}
        </a>{" "}
        and we&rsquo;ll resend your pricing.
      </p>
      {error.digest && (
        <p className="text-xs font-mono text-navy/65">Reference: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-magenta px-6 py-3 text-sm font-semibold text-white hover:bg-magenta-dark transition-colors"
      >
        Try again
      </button>
    </section>
  );
}
