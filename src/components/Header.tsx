"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import MobileMenu from "./MobileMenu";
import { SITE } from "@/lib/constants";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [onDark, setOnDark] = useState(false);

  useEffect(() => {
    const darkSections = document.querySelectorAll("[data-header-theme='dark']");
    if (!darkSections.length) return;

    const check = () => {
      const headerBottom = 80;
      const hit = Array.from(darkSections).some((sec) => {
        const rect = sec.getBoundingClientRect();
        return rect.top < headerBottom && rect.bottom > 0;
      });
      setOnDark(hit);
    };

    const observer = new IntersectionObserver(check, {
      rootMargin: "-1px 0px -90% 0px",
      threshold: [0, 0.01, 0.1, 0.5, 1],
    });

    darkSections.forEach((sec) => observer.observe(sec));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 border-b border-white/10 transition-colors duration-300 supports-backdrop-filter:backdrop-blur-md supports-backdrop-filter:bg-white/60">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="relative flex items-center gap-2" aria-label={SITE.name}>
            <Image
              src="/images/logo.svg"
              alt={SITE.name}
              width={180}
              height={57}
              priority
              className={`h-10 w-auto sm:h-12 transition-opacity duration-300 ${onDark ? "opacity-0" : "opacity-100"}`}
            />
            <Image
              src="/images/logo-white.svg"
              alt={SITE.name}
              width={180}
              height={57}
              className={`absolute inset-0 h-10 w-auto sm:h-12 transition-opacity duration-300 ${onDark ? "opacity-100" : "opacity-0"}`}
            />
          </Link>

          <div className="flex items-center gap-4">
            <a
              href="/sign-in"
              className={`hidden sm:inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-300 ${
                onDark ? "text-white hover:text-white/70" : "text-navy hover:text-magenta"
              }`}
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
              <span className={`block w-5 h-[2px] rounded-full transition-colors duration-300 ${onDark ? "bg-white" : "bg-navy"}`} />
              <span className={`block w-5 h-[2px] rounded-full transition-colors duration-300 ${onDark ? "bg-white" : "bg-navy"}`} />
              <span className={`block w-5 h-[2px] rounded-full transition-colors duration-300 ${onDark ? "bg-white" : "bg-navy"}`} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
