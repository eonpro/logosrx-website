/**
 * Provider-agnostic analytics layer.
 *
 * Fans out to Google Analytics 4 (`gtag`) and Amplitude, but is written so the
 * rest of the app never touches `window.gtag` or the Amplitude SDK directly —
 * call `track()` for events and let this module decide where they go. Each
 * provider is a SAFE NO-OP when:
 *   - running on the server (no `window`), or
 *   - its env var (`NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_AMPLITUDE_API_KEY`) is
 *     unset (e.g. local dev / preview).
 *
 * This keeps measurement opt-in via env (no fabricated IDs in the repo) and
 * means instrumented CTAs never throw when analytics isn't configured.
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const AMPLITUDE_API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;

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

/** True only in the browser with a configured Amplitude API key. */
export function amplitudeEnabled(): boolean {
  return typeof window !== "undefined" && Boolean(AMPLITUDE_API_KEY);
}

type AmplitudeModule = typeof import("@amplitude/analytics-browser");

let amplitudePromise: Promise<AmplitudeModule | null> | null = null;

/**
 * Lazily loads + initializes the Amplitude Browser SDK. The dynamic import
 * keeps the SDK out of the shared client bundle — it's only fetched when a
 * key is configured. Safe to call repeatedly (memoized), and events fired
 * before init completes are queued by the SDK itself.
 */
export function initAmplitude(): Promise<AmplitudeModule | null> {
  if (!amplitudeEnabled()) return Promise.resolve(null);
  amplitudePromise ??= import("@amplitude/analytics-browser")
    .then((amplitude) => {
      amplitude.init(AMPLITUDE_API_KEY as string, {
        // Privacy-conservative autocapture: page views, sessions, and marketing
        // attribution only. Form/element interaction capture stays OFF — the
        // onboarding flow handles payment + clinic PII and we never want field
        // contents or click text leaving the page.
        autocapture: {
          attribution: true,
          pageViews: true,
          sessions: true,
          formInteractions: false,
          fileDownloads: false,
          elementInteractions: false,
        },
        // Don't collect IP-derived precise data beyond Amplitude defaults.
        trackingOptions: { ipAddress: false },
      });
      return amplitude;
    })
    .catch(() => null); // Ad-blockers may reject the chunk; analytics is best-effort.
  return amplitudePromise;
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
  | "location_view" // location page viewed (optional manual fire)
  | "chat_open"; // visitor opens the LeadConnector chat widget

/** Fire a typed analytics event to every configured provider. No-op otherwise. */
export function track(
  event: AnalyticsEvent,
  params?: Record<string, unknown>,
): void {
  if (analyticsEnabled()) {
    window.gtag?.("event", event, params);
  }
  if (amplitudeEnabled()) {
    void initAmplitude().then((amplitude) => amplitude?.track(event, params));
  }
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
