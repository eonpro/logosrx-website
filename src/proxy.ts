import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, generateNonce } from "@/lib/security/csp";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isAdminSignInRoute = createRouteMatcher(["/admin/sign-in(.*)"]);
// The clinic dashboard requires a signed-in user. `/onboarding` is public:
// it is the account-creation flow itself, so anonymous visitors must reach it.
const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);
// The full catalog is gated behind an approved clinic account. The per-account
// verification check lives in the page (it needs the DB); here we only do the
// edge fast-path: bounce anonymous visitors into account creation.
const isCatalogRoute = createRouteMatcher(["/catalog(.*)"]);
// Affiliate partner portal. The `/partners` index (public marketing landing
// page), `/partners/apply` (the application form), and `/partners/sign-in`
// stay open; every other sub-route requires a session. The partner-identity
// check (org owner vs rep, suspension) needs the DB, so it's enforced
// server-side via `requirePartner()` in the pages, not here.
const isPartnerRoute = createRouteMatcher(["/partners(.*)"]);
const isPublicPartnerRoute = createRouteMatcher([
  "/partners",
  "/partners/apply(.*)",
  "/partners/sign-in(.*)",
]);

// Sensitive route groups that handle auth and/or customer data. These are all
// dynamically rendered, so we can serve a strict, nonce-based CSP that drops
// `script-src 'unsafe-inline'`. The static marketing surface stays on the
// relaxed CSP (it's emitted at build time and can't carry a per-request nonce).
const isStrictCspRoute = createRouteMatcher([
  "/admin(.*)",
  "/dashboard(.*)",
  "/partners(.*)",
  "/onboarding(.*)",
  "/quote(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

/**
 * Builds the outgoing response with the appropriate Content-Security-Policy.
 *
 *   - Sensitive routes get a fresh nonce + strict CSP. The nonce is also placed
 *     on the *request* headers (and an `x-nonce` header) so Next.js can read it
 *     during SSR and stamp it onto every framework/page script it emits, and so
 *     server components can forward it to <ClerkProvider nonce={…}>.
 *   - Everything else gets the relaxed (unsafe-inline) CSP, preserving static
 *     generation and CDN caching for the marketing site.
 */
function withCsp(req: NextRequest): NextResponse {
  if (!isStrictCspRoute(req)) {
    const res = NextResponse.next();
    res.headers.set("Content-Security-Policy", buildCsp());
    return res;
  }

  const nonce = generateNonce();
  const csp = buildCsp({ nonce });

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

function redirectTo(req: NextRequest, pathname: string, withRedirectParam = true) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  if (withRedirectParam) {
    url.searchParams.set("redirect_url", req.nextUrl.pathname);
  }
  return NextResponse.redirect(url);
}

export default clerkMiddleware(async (auth, req) => {
  // --- Auth gating (may short-circuit with a redirect) ---------------------

  // Profile dashboard: require a signed-in user; bounce anonymous visitors to
  // the public sign-in, preserving the intended destination.
  if (isDashboardRoute(req)) {
    const { userId } = await auth();
    if (!userId) return redirectTo(req, "/sign-in");
  } else if (isCatalogRoute(req)) {
    // Full catalog: anonymous visitors must create an account first. Approval
    // is enforced in the catalog page itself for signed-in users.
    const { userId } = await auth();
    if (!userId) return redirectTo(req, "/onboarding", false);
  } else if (isPartnerRoute(req) && !isPublicPartnerRoute(req)) {
    // Partner portal: require a signed-in user; bounce anonymous visitors to
    // the partner sign-in, preserving the intended destination.
    const { userId } = await auth();
    if (!userId) return redirectTo(req, "/partners/sign-in");
  } else if (isAdminRoute(req) && !isAdminSignInRoute(req)) {
    // Admin: require a session; the email-allowlist check requires Clerk's
    // backend client + env vars (Node runtime), so it's enforced server-side
    // via `requireAdmin()` in the admin layout/pages, not here.
    const { userId } = await auth();
    if (!userId) return redirectTo(req, "/admin/sign-in");
  }

  // --- Attach the Content-Security-Policy to the response ------------------
  return withCsp(req);
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
