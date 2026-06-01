import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { roleForEmail } from "@/lib/auth/admin";

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

  // Signed in but not on the admin email allowlist → 403.
  let email: string | null = null;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(session.userId);
    const primary =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ??
      user.emailAddresses[0];
    email = primary?.emailAddress ?? null;
  } catch {
    email = null;
  }

  if (!roleForEmail(email)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
