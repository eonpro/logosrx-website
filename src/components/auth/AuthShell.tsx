"use client";

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

export default function AuthShell({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0c0a1d]">
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

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 w-full max-w-[420px] px-6">
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
          {subtitle && (
            <p className="text-white/25 text-[11px] tracking-[0.25em] uppercase font-medium">
              {subtitle}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          {children}
        </motion.div>

        <motion.div
          className="mt-12 flex flex-col items-center gap-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-white/15">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="6" width="8" height="6" rx="1.5" strokeLinecap="round" />
                <path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" strokeLinecap="round" />
              </svg>
              <span className="text-[11px] tracking-wide">Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/15">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M7 1L2 3.5v3c0 3.5 2.1 5.5 5 7 2.9-1.5 5-3.5 5-7v-3L7 1z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[11px] tracking-wide">HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/15">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="7" cy="7" r="5.5" />
                <path d="M4.5 7l1.5 1.5L9.5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[11px] tracking-wide">SOC 2</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">
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
