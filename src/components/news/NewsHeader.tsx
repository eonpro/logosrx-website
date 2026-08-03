"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { SITE } from "@/lib/constants";

interface NewsHeaderProps {
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
  showSearch?: boolean;
}

export default function NewsHeader({
  onSearchChange,
  searchQuery = "",
  showSearch = true,
}: NewsHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchId = useId();

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <Image
              src="/images/logo.svg"
              alt={SITE.name}
              width={140}
              height={44}
              className="h-8 w-auto sm:h-9"
              priority
            />
            <span className="shrink-0 rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-1 text-[11px] font-medium tracking-wide text-navy/70">
              Newsroom
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {showSearch && (
            <>
              <button
                type="button"
                aria-label={searchOpen ? "Close search" : "Search articles"}
                aria-expanded={searchOpen}
                aria-controls={searchId}
                onClick={() => setSearchOpen((v) => !v)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-navy/70 transition-colors hover:bg-black/[0.04] hover:text-navy"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
                  <path
                    d="M16.5 16.5 20 20"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              {searchOpen && (
                <label className="sr-only" htmlFor={searchId}>
                  Search articles
                </label>
              )}
              {searchOpen && (
                <input
                  id={searchId}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder="Search…"
                  autoFocus
                  className="h-10 w-36 sm:w-52 rounded-full border border-black/10 bg-black/[0.03] px-4 text-sm text-navy outline-none placeholder:text-navy/40 focus:border-navy/30"
                />
              )}
            </>
          )}

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-navy/70 transition-colors hover:bg-black/[0.04] hover:text-navy"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              {menuOpen ? (
                <path
                  d="M6 6l12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              ) : (
                <>
                  <path d="M5 9h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M5 15h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          aria-label="Newsroom menu"
          className="border-t border-black/5 bg-white"
        >
          <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4 sm:px-8">
            <li>
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-navy hover:bg-black/[0.03]"
              >
                All articles
              </Link>
            </li>
            <li>
              <a
                href="https://www.logosrx.com"
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-navy hover:bg-black/[0.03]"
              >
                Logos RX website
              </a>
            </li>
            <li>
              <a
                href="https://www.logosrx.com/onboarding"
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-navy hover:bg-black/[0.03]"
              >
                Become a provider
              </a>
            </li>
            <li>
              <a
                href="mailto:support@logosrx.com"
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-navy hover:bg-black/[0.03]"
              >
                Media &amp; press contact
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
