import * as Sentry from "@sentry/nextjs";

/**
 * Node.js runtime Sentry init. Loaded by `instrumentation.ts` when Next.js
 * boots the server runtime. No-ops when `SENTRY_DSN` is unset.
 */
const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,

    sendDefaultPii: true,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    // Include local variable snapshots in stack frames so 500-level errors
    // are diagnosable without round-trips. Disabled in dev because the noise
    // outweighs the benefit on hot reloads.
    includeLocalVariables: process.env.NODE_ENV === "production",

    beforeSend(event) {
      if (event.request?.data) delete event.request.data;
      // Don't ship Authorization / Cookie headers to Sentry.
      if (event.request?.headers) {
        const h = event.request.headers as Record<string, string>;
        delete h.authorization;
        delete h.cookie;
        delete h["x-clerk-auth-token"];
      }
      return event;
    },
  });
}
