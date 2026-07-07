"use client";

import { SignIn } from "@clerk/nextjs";
import AuthShellDark from "@/components/auth/AuthShellDark";
import { clerkDarkAppearance } from "@/components/auth/clerk-dark-appearance";

export default function SignInPage() {
  return (
    <AuthShellDark
      subtitle="Provider Portal"
      footerLink={{
        text: "Don\u2019t have an account?",
        label: "Sign up",
        href: "/onboarding",
      }}
      crossLink={{
        text: "Affiliate partner?",
        label: "Sign in to the partner portal",
        href: "/partners/sign-in",
      }}
    >
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/onboarding"
        fallbackRedirectUrl="/dashboard"
        appearance={clerkDarkAppearance}
      />
    </AuthShellDark>
  );
}
