"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

/**
 * Admin-segment error boundary. Keeps the sidebar visible (since the admin
 * layout wraps this) and exposes the `digest` so admins can quote it to ops.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { surface: "admin" } });
    console.error("[admin] render error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-red-900">
            Couldn&rsquo;t load this view
          </h2>
          <p className="mt-1 text-sm text-red-800/80">
            The server returned an unexpected error. Retry to refetch, or open
            the overview to continue.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs font-mono text-red-700/60">
              Reference: {error.digest}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800 transition-colors"
            >
              Retry
            </button>
            <Link
              href="/admin"
              className="rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
            >
              Back to overview
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
