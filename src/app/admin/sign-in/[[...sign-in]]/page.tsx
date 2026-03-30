"use client";

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

function GradientOrb({
  className,
  delay = 0,
}: {
  className: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`absolute rounded-full blur-[120px] opacity-30 ${className}`}
      animate={{
        scale: [1, 1.2, 1],
        x: [0, 30, -20, 0],
        y: [0, -25, 15, 0],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

export default function AdminSignInPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0c0a1d]">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1a1750_0%,#0c0a1d_70%)]" />
        <GradientOrb
          className="w-[600px] h-[600px] bg-magenta/60 -top-48 -right-48"
          delay={0}
        />
        <GradientOrb
          className="w-[500px] h-[500px] bg-purple-deep/60 -bottom-32 -left-32"
          delay={4}
        />
        <GradientOrb
          className="w-[400px] h-[400px] bg-sky/40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          delay={8}
        />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[420px] px-6">
        {/* Logo */}
        <motion.div
          className="mb-10 flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Image
            src="/images/logo-white.svg"
            alt="Logos RX"
            width={200}
            height={64}
            className="h-14 w-auto mb-4"
            priority
          />
          <p className="text-white/25 text-[11px] tracking-[0.25em] uppercase font-medium">
            Admin Portal
          </p>
        </motion.div>

        {/* Sign-in form — no card, fully transparent */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <SignIn
            routing="path"
            path="/admin/sign-in"
            signUpUrl={undefined}
            forceRedirectUrl="/admin"
            appearance={{
              elements: {
                rootBox: "w-full clerk-dark-form",
                cardBox:
                  "!shadow-none w-full !border-0 !bg-transparent !rounded-none",
                card: "!shadow-none w-full !p-0 !bg-transparent !border-0 !rounded-none gap-5",
                header: "hidden",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                logoBox: "hidden",
                logoImage: "hidden",
                socialButtonsBlockButton:
                  "!border !border-white/10 !bg-white/5 hover:!bg-white/10 transition-all duration-200 !text-white/90 font-medium !rounded-xl !h-12",
                socialButtonsBlockButtonText:
                  "!text-white/90 font-medium !text-[14px]",
                socialButtonsBlockButtonArrow: "!text-white/40",
                dividerLine: "!bg-white/8",
                dividerText:
                  "!text-white/20 !text-xs uppercase tracking-[0.15em]",
                formFieldLabel:
                  "!text-white/40 font-medium !text-xs uppercase tracking-wider",
                formFieldInput:
                  "!border-white/10 !bg-white/5 focus:!border-magenta focus:!ring-1 focus:!ring-magenta/30 !rounded-xl !h-12 !text-white placeholder:!text-white/20",
                formFieldInputShowPasswordButton:
                  "!text-white/30 hover:!text-white/60",
                formButtonPrimary:
                  "!bg-gradient-to-r !from-magenta !to-magenta-dark hover:!from-magenta-dark hover:!to-magenta !text-white font-semibold !rounded-xl !shadow-[0_0_24px_rgba(198,46,136,0.3)] hover:!shadow-[0_0_32px_rgba(198,46,136,0.5)] transition-all duration-300 !h-12 !text-[15px]",
                footerAction: "hidden",
                footer: "hidden",
                formFieldAction:
                  "!text-magenta-light hover:!text-magenta !text-xs",
                identityPreviewEditButton:
                  "!text-magenta-light hover:!text-magenta",
                identityPreviewText: "!text-white/70",
                formResendCodeLink:
                  "!text-magenta-light hover:!text-magenta",
                alert:
                  "!bg-red-500/10 !border !border-red-500/20 !text-red-300 !rounded-xl",
                alertText: "!text-red-300",
                otpCodeFieldInput:
                  "!border-white/10 !bg-white/5 !text-white !rounded-lg",
                formHeaderTitle: "!text-white",
                formHeaderSubtitle: "!text-white/50",
                backLink: "!text-magenta-light hover:!text-magenta",
                phoneInputBox: "!border-white/10 !bg-white/5 !rounded-xl",
                formFieldInputGroup:
                  "!border-white/10 !bg-white/5 !rounded-xl",
                selectButton:
                  "!text-white/70 !border-white/10 hover:!bg-white/10",
                selectButtonIcon: "!text-white/50",
                selectSearchInput:
                  "!text-white !bg-white/5 !border-white/10 placeholder:!text-white/30",
                selectOptionsContainer:
                  "!bg-[#1a1750] !border-white/10 !rounded-xl",
                selectOption:
                  "!text-white/70 hover:!bg-white/10 hover:!text-white",
              },
            }}
          />
        </motion.div>

        {/* Footer */}
        <motion.div
          className="mt-12 flex flex-col items-center gap-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-white/15">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect
                  x="3"
                  y="6"
                  width="8"
                  height="6"
                  rx="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M4.5 6V4.5a2.5 2.5 0 015 0V6"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-[11px] tracking-wide">Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/15">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  d="M7 1L2 3.5v3c0 3.5 2.1 5.5 5 7 2.9-1.5 5-3.5 5-7v-3L7 1z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[11px] tracking-wide">
                HIPAA Compliant
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-white/15">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="7" cy="7" r="5.5" />
                <path
                  d="M4.5 7l1.5 1.5L9.5 5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[11px] tracking-wide">SOC 2</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-[11px] text-white/20 hover:text-white/40 transition-colors"
            >
              logosrx.com
            </Link>
            <span className="text-white/10 text-[11px]">&bull;</span>
            <span className="text-[11px] text-white/20">
              &copy; {new Date().getFullYear()} Logos RX
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
