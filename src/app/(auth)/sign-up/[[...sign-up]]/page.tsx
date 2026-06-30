"use client";

import { SignUp } from "@clerk/nextjs";
import AuthShell from "@/components/auth/AuthShell";
import { clerkDarkAppearance } from "@/components/auth/clerk-dark-appearance";

export default function SignUpPage() {
  return (
    <AuthShell
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
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/onboarding"
        appearance={clerkDarkAppearance}
      />
    </AuthShell>
  );
}
