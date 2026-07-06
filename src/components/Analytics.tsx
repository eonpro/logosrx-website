"use client";

import { useEffect } from "react";
import Script from "next/script";
import { useReportWebVitals } from "next/web-vitals";
import { GA_ID, initAmplitude, reportWebVital } from "@/lib/analytics";

/**
 * Sitewide measurement. Three concerns, one client boundary:
 *   1. Loads the GA4 gtag.js bundle (only when `NEXT_PUBLIC_GA_ID` is set), using
 *      `next/script` with `afterInteractive` so it never blocks first paint.
 *   2. Initializes Amplitude (only when `NEXT_PUBLIC_AMPLITUDE_API_KEY` is set)
 *      after mount, via a lazy dynamic import so the SDK never sits in the
 *      critical bundle. Autocaptures page views + sessions; custom events go
 *      through `track()` in `lib/analytics`.
 *   3. Reports Core Web Vitals (LCP/CLS/INP/FCP/TTFB) via `useReportWebVitals`.
 *
 * `useReportWebVitals` always runs (it's cheap and dev-loggable), but each
 * provider only mounts when configured — so this is a safe no-op in
 * local/preview.
 */
export default function Analytics() {
  useReportWebVitals(reportWebVital);

  useEffect(() => {
    void initAmplitude(); // no-op unless NEXT_PUBLIC_AMPLITUDE_API_KEY is set
  }, []);

  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
