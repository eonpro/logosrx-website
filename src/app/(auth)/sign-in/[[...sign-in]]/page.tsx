"use client";

import { SignIn } from "@clerk/nextjs";
import AuthShell from "@/components/auth/AuthShell";
import { clerkDarkAppearance } from "@/components/auth/clerk-dark-appearance";

export default function SignInPage() {
  return (
    <AuthShell
      footerLink={{
        text: "Don\u2019t have an account?",
        label: "Sign up",
        href: "/onboarding",
      }}
    >
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/onboarding"
        fallbackRedirectUrl="/dashboard"
        appearance={clerkDarkAppearance}
      />
    </AuthShell>
  );
}
