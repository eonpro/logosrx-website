import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  ADMIN_ORG_SLUG,
  ADMIN_ROLE,
  VIEWER_ROLE,
} from "@/lib/auth/admin";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isAdminSignInRoute = createRouteMatcher(["/admin/sign-in(.*)"]);
// Authenticated clinic portal: the intake wizard and the profile dashboard.
const isClinicRoute = createRouteMatcher(["/onboarding(.*)", "/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Clinic portal: require a signed-in user; bounce anonymous visitors to the
  // public sign-in, preserving the intended destination.
  if (isClinicRoute(req)) {
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

  // Signed in but not in the admin org with an allowed role → 403.
  const isInAdminOrg = session.orgSlug === ADMIN_ORG_SLUG;
  const hasAdminRole =
    session.orgRole === ADMIN_ROLE || session.orgRole === VIEWER_ROLE;

  if (!isInAdminOrg || !hasAdminRole) {
    return new NextResponse("Forbidden", { status: 403 });
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
