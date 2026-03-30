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
        href: "/sign-up",
      }}
    >
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/"
        appearance={clerkDarkAppearance}
      />
    </AuthShell>
  );
}
