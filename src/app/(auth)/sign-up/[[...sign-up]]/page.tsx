"use client";

import { SignUp } from "@clerk/nextjs";
import AuthShellDark from "@/components/auth/AuthShellDark";
import ClerkAuthSlot from "@/components/auth/ClerkAuthSlot";
import { clerkDarkAppearance } from "@/components/auth/clerk-dark-appearance";

export default function SignUpPage() {
  return (
    <AuthShellDark
      subtitle="Provider Portal"
      footerLink={{
        text: "Already have an account?",
        label: "Sign in",
        href: "/sign-in",
      }}
      crossLink={{
        text: "Affiliate partner?",
        label: "Apply to the partner program",
        href: "/partners/apply",
      }}
    >
      <ClerkAuthSlot>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/onboarding"
          appearance={clerkDarkAppearance}
        />
      </ClerkAuthSlot>
    </AuthShellDark>
  );
}
