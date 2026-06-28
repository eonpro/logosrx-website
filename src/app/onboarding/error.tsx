"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

/**
 * Onboarding-flow error boundary. The wizard persists intake data and creates
 * the clinic account on submit, so an unhandled fault here previously dumped
 * the prospect onto the full-screen `global-error`. Catch it in-segment so they
 * can retry the current step (or restart) without losing the chrome.
 *
 * `digest` is the production-only server error fingerprint; surface it for
 * support correlation with a Sentry trace.
 */
export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { surface: "onboarding" } });
    console.error("[onboarding] render error", {
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
      <h1 className="text-3xl font-bold text-navy sm:text-4xl">
        Something went wrong
      </h1>
      <p className="max-w-md text-navy/70">
        We hit an unexpected error while setting up your account. Your progress
        on this step may not have saved — please try again, or call us if it
        keeps happening.
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
