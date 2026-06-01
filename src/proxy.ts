import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isAdminSignInRoute = createRouteMatcher(["/admin/sign-in(.*)"]);
// The clinic dashboard requires a signed-in user. `/onboarding` is public:
// it is the account-creation flow itself, so anonymous visitors must reach it.
const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);

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
