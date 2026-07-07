"use client";

import { SignIn } from "@clerk/nextjs";
import AuthShellDark from "@/components/auth/AuthShellDark";
import { clerkDarkAppearance } from "@/components/auth/clerk-dark-appearance";

export default function PartnerSignInPage() {
  return (
    <AuthShellDark
      subtitle="Partner Portal"
      footerLink={{
        text: "Want to become a partner?",
        label: "Apply",
        href: "/partners/apply",
      }}
      crossLink={{
        text: "Clinic or provider?",
        label: "Sign in to the provider portal",
        href: "/sign-in",
      }}
    >
      <SignIn
        routing="path"
        path="/partners/sign-in"
        signUpUrl="/partners/apply"
        fallbackRedirectUrl="/partners"
        appearance={clerkDarkAppearance}
      />
    </AuthShellDark>
  );
}
