"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

/**
 * Partner-portal error boundary. Renders inside `partners/layout.tsx`
 * (ClerkProvider + PartnersShell), so portal chrome survives and a transient
 * server fault (DB connection blip, Clerk hiccup, a thrown `requirePartner()`
 * downstream) degrades in place instead of escalating to the full-screen
 * `global-error`.
 *
 * `digest` is the production-only server error fingerprint; surface it so a
 * partner can quote it to support for fast correlation with a Sentry trace.
 */
export default function PartnersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { surface: "partners" } });
    console.error("[partners] render error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-5 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-magenta/10 text-magenta">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-navy">
        Couldn&rsquo;t load this page
      </h2>
      <p className="max-w-md text-navy/70">
        The server hit an unexpected error. This is usually temporary — retry to
        reload, or return to the partner portal home.
      </p>
      {error.digest && (
        <p className="text-xs font-mono text-navy/65">Reference: {error.digest}</p>
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
          href="/partners"
          className="rounded-full border border-navy/15 px-6 py-3 text-sm font-semibold text-navy hover:bg-navy/5 transition-colors"
        >
          Back to portal
        </Link>
      </div>
    </div>
  );
}
