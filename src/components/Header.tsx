"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import MobileMenu from "./MobileMenu";
import { SITE } from "@/lib/constants";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-beige">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2" aria-label={SITE.name}>
            <Image
              src="/images/logo.svg"
              alt={SITE.name}
              width={180}
              height={57}
              priority
              className="h-10 w-auto sm:h-12"
            />
          </Link>

          <div className="flex items-center gap-4">
            <a
              href={SITE.onboarding}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-magenta transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-60">
                <path d="M3 2L11 7L3 12V2Z" fill="currentColor" />
              </svg>
              LOG IN
            </a>

            <button
              onClick={() => setMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-[5px] w-10 h-10 rounded-lg hover:bg-beige/60 transition-colors"
              aria-label="Open menu"
            >
              <span className="block w-5 h-[2px] bg-navy rounded-full" />
              <span className="block w-5 h-[2px] bg-navy rounded-full" />
              <span className="block w-5 h-[2px] bg-navy rounded-full" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
