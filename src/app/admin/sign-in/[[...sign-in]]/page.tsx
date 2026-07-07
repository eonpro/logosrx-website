"use client";

import { SignIn } from "@clerk/nextjs";
import AuthShellDark from "@/components/auth/AuthShellDark";
import { clerkDarkAppearance } from "@/components/auth/clerk-dark-appearance";

export default function AdminSignInPage() {
  return (
    <AuthShellDark subtitle="Admin Portal">
      <SignIn
        routing="path"
        path="/admin/sign-in"
        signUpUrl={undefined}
        forceRedirectUrl="/admin"
        appearance={clerkDarkAppearance}
      />
    </AuthShellDark>
  );
}
