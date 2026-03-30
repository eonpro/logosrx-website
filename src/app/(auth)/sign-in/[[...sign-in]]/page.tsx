"use client";

import { SignIn } from "@clerk/nextjs";
import AuthShell from "@/components/auth/AuthShell";
import { clerkDarkAppearance } from "@/components/auth/clerk-dark-appearance";

export default function SignInPage() {
  return (
    <AuthShell>
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
