/**
 * Content-Security-Policy builder. Edge-safe (no Node APIs) so it can run in
 * the proxy/middleware as well as at build time.
 *
 * Two variants:
 *   - Relaxed (no nonce): `script-src` keeps `'unsafe-inline'`. Used for the
 *     statically-generated marketing surface, which is emitted at build time
 *     and therefore cannot carry a per-request nonce.
 *   - Strict (with nonce): `script-src` drops `'unsafe-inline'` in favor of
 *     `'nonce-…' 'strict-dynamic'`. Applied by the proxy to the sensitive,
 *     already-dynamic route groups (/admin, /dashboard, /partners,
 *     /onboarding, /quote, /sign-in, /sign-up) where we handle auth + data.
 *
 * `style-src` keeps `'unsafe-inline'` in both variants: Tailwind and inline
 * style attributes make style nonces impractical, and inline styles are a far
 * lower XSS risk than inline scripts.
 */

const TYPEKIT = ["https://use.typekit.net", "https://p.typekit.net"];

/**
 * Production Clerk instances serve their Frontend API from a custom domain
 * encoded (base64) inside the publishable key. Decode it here so the CSP
 * allow-lists the real origin (and auth layouts can preconnect). `atob` keeps
 * this edge-compatible.
 */
export function clerkFrontendApiOrigin(): string | null {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!pk) return null;
  const encoded = pk.replace(/^pk_(test|live)_/, "");
  try {
    const host = atob(encoded).replace(/\$+$/, "").trim();
    return host.includes(".") ? `https://${host}` : null;
  } catch {
    return null;
  }
}

export interface CspOptions {
  /** When set, emits a strict `script-src` (`'nonce-…' 'strict-dynamic'`). */
  nonce?: string;
  isDev?: boolean;
}

export function buildCsp(options: CspOptions = {}): string {
  const { nonce } = options;
  const isDev = options.isDev ?? process.env.NODE_ENV !== "production";

  const clerkFapi = clerkFrontendApiOrigin();
  const CLERK = [
    "https://*.clerk.com",
    "https://*.clerk.accounts.dev",
    "https://*.clerk.services",
    "https://challenges.cloudflare.com",
    ...(clerkFapi ? [clerkFapi] : []),
  ];
  const VERCEL = [
    "https://*.public.blob.vercel-storage.com",
    "https://vercel.com",
    "https://*.vercel-storage.com",
  ];

  // Amplitude Browser SDK: event ingestion (api2.amplitude.com) + remote
  // config fetch (sr-client-cfg.amplitude.com) both live under *.amplitude.com.
  const AMPLITUDE = ["https://*.amplitude.com"];

  // LeadConnector (GoHighLevel) chat widget (components/ChatWidget.tsx):
  //   - loader + web-component bundle from widgets.leadconnectorhq.com, which
  //     then dynamically imports helper modules from sibling subdomains
  //     (services.…/user-session.js, stcdn.…/intl-tel-input) — so script-src
  //     needs the wildcard, not just widgets.
  //   - config/messaging APIs + live-chat socket across other GHL subdomains
  //   - uploaded branding assets (agent avatars, sounds) served from the GHL
  //     media library on *.msgsndr.com and storage.googleapis.com/msgsndr/
  const LEADCONNECTOR_SCRIPT = ["https://*.leadconnectorhq.com"];
  const LEADCONNECTOR_CONNECT = [
    "https://*.leadconnectorhq.com",
    "wss://*.leadconnectorhq.com",
  ];
  const LEADCONNECTOR_ASSETS = [
    "https://*.leadconnectorhq.com",
    "https://*.msgsndr.com",
    "https://storage.googleapis.com/msgsndr/",
  ];

  const connectSrc = [
    "'self'",
    ...CLERK,
    "https://*.clerk-telemetry.com",
    ...AMPLITUDE,
    ...LEADCONNECTOR_CONNECT,
  ];

  // With a nonce we use 'strict-dynamic': supporting browsers ignore the host
  // allow-list and trust only nonce'd scripts (and scripts they load), so the
  // CLERK hosts below are a fallback for older browsers without strict-dynamic.
  const scriptSrc = nonce
    ? [
        "'self'",
        `'nonce-${nonce}'`,
        "'strict-dynamic'",
        ...(isDev ? ["'unsafe-eval'"] : []),
        ...CLERK,
        ...LEADCONNECTOR_SCRIPT,
      ]
    : [
        "'self'",
        "'unsafe-inline'",
        ...(isDev ? ["'unsafe-eval'"] : []),
        ...CLERK,
        ...LEADCONNECTOR_SCRIPT,
      ];

  const styleSrc = ["'self'", "'unsafe-inline'", ...TYPEKIT];
  const fontSrc = ["'self'", "data:", ...TYPEKIT, ...LEADCONNECTOR_ASSETS];
  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    "https://img.clerk.com",
    ...VERCEL,
    ...LEADCONNECTOR_ASSETS,
  ];
  const frameSrc = ["'self'", ...CLERK, ...LEADCONNECTOR_SCRIPT];
  const workerSrc = ["'self'", "blob:"];
  const mediaSrc = ["'self'", ...LEADCONNECTOR_ASSETS];

  return [
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
    "upgrade-insecure-requests",
    "report-to csp-endpoint",
    "report-uri /api/csp-report",
  ].join("; ");
}

/** Generates a base64 nonce using Web Crypto (edge + node compatible). */
export function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
