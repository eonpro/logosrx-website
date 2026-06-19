import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isAdminSignInRoute = createRouteMatcher(["/admin/sign-in(.*)"]);
// The clinic dashboard requires a signed-in user. `/onboarding` is public:
// it is the account-creation flow itself, so anonymous visitors must reach it.
const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);
// The full catalog is gated behind an approved clinic account. The per-account
// verification check lives in the page (it needs the DB); here we only do the
// edge fast-path: bounce anonymous visitors into account creation.
const isCatalogRoute = createRouteMatcher(["/catalog(.*)"]);
// Affiliate partner portal. `/partners/apply` (the public application form)
// and `/partners/sign-in` stay open; everything else requires a session. The
// partner-identity check (org owner vs rep, suspension) needs the DB, so it's
// enforced server-side via `requirePartner()` in the pages, not here.
const isPartnerRoute = createRouteMatcher(["/partners(.*)"]);
const isPublicPartnerRoute = createRouteMatcher([
  "/partners/apply(.*)",
  "/partners/sign-in(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Profile dashboard: require a signed-in user; bounce anonymous visitors to
  // the public sign-in, preserving the intended destination.
  if (isDashboardRoute(req)) {
    const session = await auth();
    if (!session.userId) {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("redirect_url", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    return;
  }

  // Full catalog: anonymous visitors must create an account first. Approval is
  // enforced in the catalog page itself for signed-in users.
  if (isCatalogRoute(req)) {
    const session = await auth();
    if (!session.userId) {
      const url = req.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
    return;
  }

  // Partner portal: require a signed-in user; bounce anonymous visitors to the
  // partner sign-in, preserving the intended destination.
  if (isPartnerRoute(req) && !isPublicPartnerRoute(req)) {
    const session = await auth();
    if (!session.userId) {
      const url = req.nextUrl.clone();
      url.pathname = "/partners/sign-in";
      url.searchParams.set("redirect_url", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    return;
  }

  if (!isAdminRoute(req) || isAdminSignInRoute(req)) {
    return;
  }

  const session = await auth();

  // Not signed in → bounce to admin sign-in. Preserve the intended destination.
  if (!session.userId) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/sign-in";
    url.searchParams.set("redirect_url", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // The email-allowlist check requires Clerk's backend client + env vars, which
  // are only reliable in the Node runtime — so it's enforced server-side via
  // `requireAdmin()` in the admin layout/pages, not here in edge middleware.
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
