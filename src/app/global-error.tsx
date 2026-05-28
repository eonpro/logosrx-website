"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Last-resort boundary. Renders its own `<html>` and `<body>` because the
 * root layout itself has crashed. Keep this dependency-free (no Tailwind
 * utilities that rely on the design tokens) so the site never serves a
 * white-screen-of-death.
 *
 * Forwards the exception to Sentry so the root-layout crash actually
 * surfaces — by default React swallows it once we render fallback UI.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[global] catastrophic error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          color: "#0f1d3b",
          background: "#fdfaf3",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          padding: 24,
        }}
      >
        <main
          style={{
            maxWidth: 560,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 12px" }}>
            We&rsquo;re having trouble loading the site
          </h1>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.5,
              opacity: 0.75,
              margin: "0 0 24px",
            }}
          >
            This is unexpected and our team has been notified. Please try again
            in a moment, or call us if it persists.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: 12,
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                opacity: 0.5,
                margin: "0 0 24px",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#d6356f",
              color: "white",
              border: "none",
              borderRadius: 999,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
