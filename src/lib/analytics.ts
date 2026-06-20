/**
 * Provider-agnostic analytics layer.
 *
 * Wraps Google Analytics 4 (`gtag`) but is written so the rest of the app never
 * touches `window.gtag` directly — call `track()` for events and let this module
 * decide where they go. Everything is a SAFE NO-OP when:
 *   - running on the server (no `window`), or
 *   - `NEXT_PUBLIC_GA_ID` is unset (e.g. local dev / preview).
 *
 * This keeps measurement opt-in via env (no fabricated IDs in the repo) and
 * means instrumented CTAs never throw when analytics isn't configured.
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/** Optional custom endpoint for raw Web Vitals beacons (RUM pipelines). */
export const VITALS_ENDPOINT = process.env.NEXT_PUBLIC_VITALS_ENDPOINT;

type GtagArgs =
  | [command: "js", date: Date]
  | [command: "config", targetId: string, config?: Record<string, unknown>]
  | [command: "event", eventName: string, params?: Record<string, unknown>]
  | [command: "set", params: Record<string, unknown>];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArgs) => void;
  }
}

/** True only in the browser with a configured GA measurement id. */
export function analyticsEnabled(): boolean {
  return typeof window !== "undefined" && Boolean(GA_ID);
}

/**
 * Named conversion/interaction events. Keeping these in a union (rather than
 * free-form strings) prevents typos from fragmenting reports and documents the
 * funnel in one place.
 */
export type AnalyticsEvent =
  | "cta_onboarding_start" // provider clicks "start onboarding"/"prescribe"
  | "cta_lifefile_login" // existing provider → LifeFile portal
  | "cta_call" // phone link click
  | "cta_email" // email link click
  | "service_view" // service page viewed (optional manual fire)
  | "location_view"; // location page viewed (optional manual fire)

/** Fire a typed analytics event. No-op when analytics is disabled. */
export function track(
  event: AnalyticsEvent,
  params?: Record<string, unknown>,
): void {
  if (!analyticsEnabled()) return;
  window.gtag?.("event", event, params);
}

/**
 * Report a single Web Vitals metric. Sends to GA4 (as a non-interaction event
 * with integer values, per Google's guidance) and/or to a custom RUM endpoint
 * via `sendBeacon`. In dev with nothing configured, logs to the console so the
 * pipeline is verifiable locally.
 */
export function reportWebVital(metric: {
  id: string;
  name: string;
  value: number;
  rating?: string;
  navigationType?: string;
}): void {
  // GA4 expects integers; CLS is a small float, so scale it.
  const value = Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value);

  if (analyticsEnabled()) {
    window.gtag?.("event", metric.name, {
      event_category: "Web Vitals",
      event_label: metric.id,
      value,
      metric_rating: metric.rating,
      non_interaction: true,
    });
  }

  if (VITALS_ENDPOINT && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    try {
      navigator.sendBeacon(VITALS_ENDPOINT, JSON.stringify(metric));
    } catch {
      // Beacon is best-effort; never let RUM break the page.
    }
  }

  if (process.env.NODE_ENV !== "production" && !analyticsEnabled() && !VITALS_ENDPOINT) {
    console.debug("[web-vitals]", metric.name, value, metric.rating ?? "");
  }
}
