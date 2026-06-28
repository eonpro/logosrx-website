"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

/**
 * Auth-routes error boundary (sign-in / sign-up / activate). Clerk's hosted
 * components occasionally throw on a network blip or config drift; catch it
 * here so the visitor sees a recoverable message instead of the full-screen
 * `global-error`.
 *
 * `digest` is the production-only server error fingerprint; surface it for
 * support correlation with a Sentry trace.
 */
export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { surface: "auth" } });
    console.error("[auth] render error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-6 px-6 py-16 text-center">
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
      <h1 className="text-3xl font-bold text-navy">Something went wrong</h1>
      <p className="max-w-sm text-navy/70">
        We couldn&rsquo;t load the sign-in screen. Please try again in a moment.
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
          href="/"
          className="rounded-full border border-navy/15 px-6 py-3 text-sm font-semibold text-navy hover:bg-navy/5 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}
