import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";

/**
 * Allowed origins for third-party resources. Update here when integrating
 * additional analytics, payment, or auth providers.
 *
 *   - Adobe Typekit  → marketing fonts (use.typekit.net, p.typekit.net)
 *   - Clerk          → auth UI + telemetry
 *   - Vercel Blob    → private resume downloads (proxied through /api/admin)
 */
const TYPEKIT = ["https://use.typekit.net", "https://p.typekit.net"];

/**
 * Production Clerk instances serve their Frontend API from a custom domain on
 * the app's own root (e.g. `clerk.logosrx.com`), NOT from `*.clerk.com`. That
 * host is encoded (base64) inside the publishable key, so we decode it here and
 * add it to the CSP allow-list. Without this the browser blocks `clerk.browser.js`
 * in production and the `<SignIn>` / `<SignUp>` forms silently never mount.
 *
 * Development / keyless mode uses `*.clerk.accounts.dev`, which the static
 * wildcard below already covers, so this is a no-op locally.
 */
function clerkFrontendApiOrigin(): string | null {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!pk) return null;
  const encoded = pk.replace(/^pk_(test|live)_/, "");
  try {
    const host = Buffer.from(encoded, "base64")
      .toString("utf8")
      .replace(/\$+$/, "")
      .trim();
    return host.includes(".") ? `https://${host}` : null;
  } catch {
    return null;
  }
}

const clerkFapiOrigin = clerkFrontendApiOrigin();

const CLERK = [
  "https://*.clerk.com",
  "https://*.clerk.accounts.dev",
  "https://*.clerk.services",
  "https://challenges.cloudflare.com",
  ...(clerkFapiOrigin ? [clerkFapiOrigin] : []),
];
const VERCEL = [
  "https://*.public.blob.vercel-storage.com",
  "https://vercel.com",
  "https://*.vercel-storage.com",
];

const connectSrc = ["'self'", ...CLERK, "https://*.clerk-telemetry.com"];
const scriptSrc = [
  "'self'",
  // Next.js hydration uses inline bootstrap scripts. A future hardening step
  // will switch to per-request nonces via middleware.
  "'unsafe-inline'",
  ...(isProd ? [] : ["'unsafe-eval'"]),
  ...CLERK,
];
const styleSrc = [
  "'self'",
  // Tailwind injects build-time CSS, but Framer Motion / inline styles also
  // produce `<style>` attributes that need allowance.
  "'unsafe-inline'",
  ...TYPEKIT,
];
const fontSrc = ["'self'", "data:", ...TYPEKIT];
const imgSrc = ["'self'", "data:", "blob:", "https://img.clerk.com", ...VERCEL];
const frameSrc = ["'self'", ...CLERK];
const workerSrc = ["'self'", "blob:"];
// Marketing video assets are self-hosted under /public/videos (P1d). Explicit
// `media-src` so the CSP doesn't silently fall back to `default-src` if a
// reviewer tightens defaults later.
const mediaSrc = ["'self'"];

const csp = [
  "default-src 'self'",
  `script-src ${scriptSrc.join(" ")}`,
  `style-src ${styleSrc.join(" ")}`,
  `img-src ${imgSrc.join(" ")}`,
  `font-src ${fontSrc.join(" ")}`,
  `connect-src ${connectSrc.join(" ")}`,
  `frame-src ${frameSrc.join(" ")}`,
  `worker-src ${workerSrc.join(" ")}`,
  `media-src ${mediaSrc.join(" ")}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  // Block legacy mixed-content paths; upgrade-insecure-requests is a no-op on
  // HTTPS-only sites but defends if someone embeds an http:// URL by mistake.
  "upgrade-insecure-requests",
  // Forward violations to our sink (P2d). `report-to` is the modern
  // Reporting API target; `report-uri` is kept for browsers that haven't
  // implemented Reporting API yet (Safari < 16, older Firefox).
  "report-to csp-endpoint",
  "report-uri /api/csp-report",
].join("; ");

/*
 * Report-To group definition. Browsers that support the Reporting API will
 * POST violation reports (and other report types) here. We only declare a
 * CSP group for now; add a `nel` (Network Error Logging) group later if we
 * want to capture TLS / DNS failures too.
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
  { key: "Content-Security-Policy", value: csp },
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
      project: process.env.SENTRY_PROJECT ?? "javascript-nextjs",
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
