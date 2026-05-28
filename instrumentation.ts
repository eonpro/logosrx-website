import * as Sentry from "@sentry/nextjs";

/**
 * Next.js boot hook. Dispatches the right Sentry init file per runtime so
 * we never accidentally pull Node-only APIs into the Edge bundle.
 *
 * `onRequestError` is the unified server-side error capture (Next.js >= 15
 * with `@sentry/nextjs` >= 8.28). It catches React render errors thrown on
 * the server, server action failures, and async errors in route handlers.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
