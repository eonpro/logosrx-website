import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/*
 * The Content-Security-Policy is set per-request by the proxy (`src/proxy.ts`)
 * so sensitive, dynamically-rendered routes (/admin, /dashboard, /partners,
 * /onboarding, /quote, /sign-in, /sign-up) can use a strict, nonce-based
 * `script-src` (no `'unsafe-inline'`) while the statically-generated marketing
 * pages keep a relaxed CSP and stay CDN-cacheable. Keeping CSP out of
 * next.config avoids emitting a second, conflicting CSP header. All other
 * (static) security headers remain here.
 */

/*
 * Report-To group definition. Browsers that support the Reporting API will
 * POST CSP violation reports here. The CSP itself (set in the proxy) references
 * this `csp-endpoint` group. Add a `nel` group later for Network Error Logging.
 */
const reportTo = JSON.stringify({
  group: "csp-endpoint",
  max_age: 10886400,
  endpoints: [{ url: "/api/csp-report" }],
});

const permissionsPolicy = [
  "accelerometer=()",
  "ambient-light-sensor=()",
  "autoplay=()",
  "battery=()",
  "camera=()",
  "display-capture=()",
  "encrypted-media=()",
  "geolocation=()",
  "gyroscope=()",
  "interest-cohort=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  "payment=()",
  "picture-in-picture=()",
  "publickey-credentials-get=(self)",
  "screen-wake-lock=()",
  "sync-xhr=()",
  "usb=()",
  "xr-spatial-tracking=()",
].join(", ");

const baselineSecurityHeaders = [
  { key: "Report-To", value: reportTo },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: permissionsPolicy },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  reactStrictMode: true,
  /*
   * The quote-PDF route reads brand/product images from /public at runtime
   * (rasterized with sharp for @react-pdf/renderer). Public files aren't
   * traced into serverless bundles automatically, so include them explicitly.
   */
  outputFileTracingIncludes: {
    "/quote/\\[token\\]/pdf": [
      "./public/images/logo.svg",
      "./public/images/products/**/*",
    ],
  },
  serverExternalPackages: ["@react-pdf/renderer"],
  images: {
    formats: ["image/avif", "image/webp"],
    // Reduce default device-pixel-ratio fallback set to keep optimized cache
    // sizes manageable without hurting perceived sharpness.
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1920, 2560],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    /*
     * Tree-shake barrel imports for big libraries we re-use across the
     * marketing surface. Without this, importing `motion` from
     * `framer-motion` drags every other animator (drag, layout, etc.) into
     * the route bundle. Next strips the unused exports at compile time.
     *
     * Re-check with `next build --profile` after each upgrade — Next.js
     * may add these libraries to its default optimization list and the
     * explicit entry becomes redundant.
     */
    optimizePackageImports: [
      "framer-motion",
      "lenis",
      "@clerk/nextjs",
      "@radix-ui/react-dialog",
    ],
  },
  async redirects() {
    return [
      // The standalone clinic lead form was replaced by the provider intake
      // flow. Permanently send the old path to account creation.
      {
        source: "/clinic-signup",
        destination: "/sign-up",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: baselineSecurityHeaders,
      },
      {
        // Defense-in-depth: never let admin / auth pages leak to search engines
        // or get cached by a shared proxy.
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/(sign-in|sign-up)/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
      {
        // Unlisted, privately-shared reports (e.g. the thermal stability
        // study). Reachable only via a direct link we hand out voluntarily —
        // keep it out of every search index and answer-engine crawl. Not
        // listed in the sitemap and not linked from any page.
        source: "/reports/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      {
        // Self-hosted marketing media (P1d). 30 days immutable cache —
        // filenames are version-pinned manually, so cache busting is opt-in.
        source: "/videos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, s-maxage=2592000, immutable",
          },
        ],
      },
    ];
  },
};

/**
 * Wrap with Sentry only when an auth token is present. The wrapper is a
 * no-op at runtime if the SDK isn't initialized, but the build step will
 * try to upload source maps unconditionally — gating on the token avoids
 * noisy warnings on contributor laptops that don't have Sentry creds.
 */
const shouldUploadSourceMaps =
  Boolean(process.env.SENTRY_AUTH_TOKEN) && process.env.NODE_ENV === "production";

export default shouldUploadSourceMaps
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG ?? "eonpro",
      project: process.env.SENTRY_PROJECT ?? "logosrx-website",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Upload a wider set of client bundles so prod stack traces don't
      // resolve to "<unknown>" for code-split chunks.
      widenClientFileUpload: true,
      // Tunnel events through our own origin so corporate ad-blockers /
      // privacy proxies don't swallow them.
      tunnelRoute: "/monitoring",
      // Suppress the Sentry plugin's verbose output unless we're in CI.
      silent: !process.env.CI,
      // Tree-shake the Sentry SDK to drop debug-only code in prod.
      disableLogger: true,
    })
  : nextConfig;
