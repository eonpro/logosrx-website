"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

/**
 * Marketing-route error boundary. Catches uncaught render-time exceptions
 * thrown by server or client components beneath the (marketing) segment so
 * the header / footer chrome still renders even when the body blows up.
 *
 * `digest` is the production-only error fingerprint Next.js exposes for
 * correlating with server logs. Surface it so support can match a user's
 * report to a stack trace without us having to dump the raw error.
 */
export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    // Echo to console so contributors notice during local dev even when
    // Sentry isn't configured. Avoid logging PII — `error.message` is the
    // safest payload to print.
    console.error("[marketing] render error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
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
      <h1 className="text-3xl sm:text-4xl font-bold text-navy">
        Something went wrong
      </h1>
      <p className="text-navy/70 max-w-md">
        We hit an unexpected error loading this page. Our team has been notified.
        Try again, or head back to the home page.
      </p>
      {error.digest && (
        <p className="text-xs text-navy/65 font-mono">Reference: {error.digest}</p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-magenta px-6 py-3 text-sm font-semibold text-white hover:bg-magenta-dark transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-navy/15 px-6 py-3 text-sm font-semibold text-navy hover:bg-navy/5 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}
