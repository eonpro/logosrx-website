"use client";

import { SignUp } from "@clerk/nextjs";
import AuthShell from "@/components/auth/AuthShell";
import { clerkDarkAppearance } from "@/components/auth/clerk-dark-appearance";

export default function SignUpPage() {
  return (
    <AuthShell
      footerLink={{
        text: "Already have an account?",
        label: "Sign in",
        href: "/sign-in",
      }}
    >
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/"
        appearance={clerkDarkAppearance}
      />
    </AuthShell>
  );
}
