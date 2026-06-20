"use client";

import { SignIn } from "@clerk/nextjs";
import AuthShell from "@/components/auth/AuthShell";
import { clerkDarkAppearance } from "@/components/auth/clerk-dark-appearance";

export default function PartnerSignInPage() {
  return (
    <AuthShell
      subtitle="Partner Portal"
      footerLink={{
        text: "Want to become a partner?",
        label: "Apply",
        href: "/partners/apply",
      }}
    >
      <SignIn
        routing="path"
        path="/partners/sign-in"
        signUpUrl="/partners/apply"
        fallbackRedirectUrl="/partners"
        appearance={clerkDarkAppearance}
      />
    </AuthShell>
  );
}
