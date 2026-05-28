import * as Sentry from "@sentry/nextjs";

/**
 * Edge runtime Sentry init. The Edge runtime (middleware + edge route
 * handlers) ships a tiny subset of Node APIs, so we skip integrations that
 * depend on `process` / `fs`.
 */
const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,

    sendDefaultPii: true,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  });
}
