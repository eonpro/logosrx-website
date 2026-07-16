import * as Sentry from "@sentry/nextjs";

/**
 * Browser-runtime Sentry initialisation. Runs in every client bundle.
 *
 * No-ops cleanly when `NEXT_PUBLIC_SENTRY_DSN` is unset (e.g. local dev or
 * preview builds without secrets), so it's safe to ship without forcing
 * every contributor to wire up a Sentry project.
 *
 * `tracesSampleRate` is intentionally conservative in production (10 %) to
 * stay well under the free-tier quota while still surfacing perf regressions.
 * Session Replay records 10 % of all sessions + 100 % of sessions that hit
 * an error so we can debug the lead-up without flooding the quota.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

    // PII is required to associate errors with users in the admin dashboard,
    // but we never want to send raw resume bytes — `beforeSend` strips file
    // payloads if they ever sneak into a breadcrumb.
    sendDefaultPii: true,

    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.replayIntegration({
        // Privacy by default — text, inputs, and media are masked. We can
        // selectively unmask non-PII elements with `data-sentry-unmask`.
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],

    beforeSend(event, hint) {
      // Belt-and-braces: drop request bodies on the off chance they contain
      // form data with PII.
      if (event.request?.data) delete event.request.data;

      // WebKit reports a failed `response.json()` parse with the generic
      // "The string did not match the expected pattern." (DOMException 12).
      // clerk-js's session keep-alive does exactly that when Clerk's API
      // rate-limits it (429 + non-JSON body), surfacing as a stackless
      // unhandled rejection we can't act on (LOGOSRX-WEBSITE-C). Drop only
      // that precise signature — stackless + unhandled — so anything with a
      // traceable frame still reports.
      const exception = event.exception?.values?.[0];
      const isWebKitPatternNoise =
        exception?.value === "The string did not match the expected pattern." &&
        exception.mechanism?.handled === false &&
        !exception.stacktrace?.frames?.length;
      if (isWebKitPatternNoise) {
        if (process.env.NODE_ENV === "development") {
          console.debug("[sentry] dropped WebKit pattern noise", hint);
        }
        return null;
      }

      return event;
    },
  });
}

/**
 * Captures App Router client-side navigations as Sentry transactions.
 * Without this, only the initial page load is tracked.
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
