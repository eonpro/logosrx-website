"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { SITE } from "@/lib/constants";

const TABS = [
  { href: "/dashboard", label: "Storefront" },
  { href: "/dashboard/account", label: "Account" },
] as const;

function isActive(pathname: string, href: string): boolean {
  // "/dashboard" must match exactly so it doesn't light up on sub-routes.
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

/**
 * Chrome for the authenticated clinic portal: brand, primary tab nav
 * (Storefront / Account), a persistent "Prescribe" hand-off to LifeFile, and
 * the Clerk user button. Rendered once in the dashboard layout so every portal
 * page shares it.
 */
export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="theme-ink min-h-screen bg-cream">
      <header className="sticky top-0 z-20 border-b border-beige bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" aria-label="Logos RX portal home">
              <Image
                src="/images/logo.svg"
                alt="Logos RX"
                width={120}
                height={38}
                className="h-7 w-auto sm:h-8"
              />
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              {TABS.map((t) => {
                const active = isActive(pathname, t.href);
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-navy text-white"
                        : "text-navy/60 hover:bg-beige hover:text-navy"
                    }`}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={SITE.lifefilePortal}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-full bg-magenta px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-magenta-dark sm:inline-flex"
            >
              Prescribe in LifeFile
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M3 1.5L9 6L3 10.5V1.5Z" fill="currentColor" />
              </svg>
            </a>
            <UserButton />
          </div>
        </div>

        {/* Mobile tab bar */}
        <nav className="flex items-center gap-1 px-4 pb-2 sm:hidden">
          {TABS.map((t) => {
            const active = isActive(pathname, t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex-1 rounded-full px-4 py-1.5 text-center text-sm font-semibold transition-colors ${
                  active
                    ? "bg-navy text-white"
                    : "text-navy/60 hover:bg-beige hover:text-navy"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {children}
    </div>
  );
}
