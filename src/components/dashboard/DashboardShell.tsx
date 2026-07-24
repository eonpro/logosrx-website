"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { displayFont } from "@/lib/fonts";

const TABS = [
  { href: "/dashboard", label: "Catalog" },
  { href: "/dashboard/account", label: "Account" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    // Catalog owns the home route plus product detail / pricing-request.
    return (
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/products") ||
      pathname.startsWith("/dashboard/pricing-request")
    );
  }
  return pathname.startsWith(href);
}

/**
 * Chrome for the authenticated clinic portal: brand, primary tab nav
 * (Catalog / Account), and the Clerk user button. Prescribe is intentionally
 * hidden until in-portal ordering works end-to-end.
 */
export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className={`theme-ink ${displayFont.variable} min-h-screen bg-cream`}>
      <header className="sticky top-0 z-20 border-b border-beige/80 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" aria-label="Logos RX portal home">
              <Image
                src="/images/logo.svg"
                alt="Logos RX"
                width={120}
                height={38}
                className="h-7 w-auto sm:h-8"
              />
            </Link>
            <nav className="hidden items-center gap-1 rounded-full border border-beige/80 bg-white p-1 shadow-soft sm:flex">
              {TABS.map((t) => {
                const active = isActive(pathname, t.href);
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-all ${
                      active
                        ? "bg-plum text-white shadow-soft"
                        : "text-navy/55 hover:text-navy"
                    }`}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <UserButton />
          </div>
        </div>

        {/* Mobile tab bar */}
        <nav className="mx-4 mb-3 flex items-center gap-1 rounded-full border border-beige/80 bg-white p-1 shadow-soft sm:hidden">
          {TABS.map((t) => {
            const active = isActive(pathname, t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex-1 rounded-full px-4 py-1.5 text-center text-sm font-semibold transition-all ${
                  active ? "bg-plum text-white" : "text-navy/55"
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
