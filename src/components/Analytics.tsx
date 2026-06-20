"use client";

import Script from "next/script";
import { useReportWebVitals } from "next/web-vitals";
import { GA_ID, reportWebVital } from "@/lib/analytics";

/**
 * Sitewide measurement. Two concerns, one client boundary:
 *   1. Loads the GA4 gtag.js bundle (only when `NEXT_PUBLIC_GA_ID` is set), using
 *      `next/script` with `afterInteractive` so it never blocks first paint.
 *   2. Reports Core Web Vitals (LCP/CLS/INP/FCP/TTFB) via `useReportWebVitals`.
 *
 * `useReportWebVitals` always runs (it's cheap and dev-loggable), but GA only
 * mounts when configured — so this is a safe no-op in local/preview.
 */
export default function Analytics() {
  useReportWebVitals(reportWebVital);

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
