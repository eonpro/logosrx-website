"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { displayFont } from "@/lib/fonts";

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** Match the route exactly (used for the "overview" root item). */
  exact?: boolean;
  /**
   * Optional group label. Rendered as an uppercase micro-heading whenever it
   * differs from the previous item's section, giving the nav an information
   * architecture instead of one flat list.
   */
  section?: string;
}

/**
 * Shared chrome for the internal sidebar portals (Admin, Partner). On desktop
 * (lg+) it's a persistent fixed sidebar; on smaller screens it collapses into a
 * slide-in drawer behind a hamburger button in a sticky top bar.
 *
 * Visual language (hims-inspired): warm off-white workspace, floating white
 * sidebar panel, pill nav with a warm-black active state, soft shadows, and a
 * profile card pinned to the bottom. The `.theme-ink` scope (globals.css)
 * re-maps brand tokens for everything rendered inside.
 *
 * The drawer closes on navigation, on Escape, and on overlay click. Nav items
 * and the footer slot are supplied by each portal so this stays purely
 * presentational.
 */
export default function SidebarShell({
  subtitle,
  navItems,
  footer,
  children,
}: {
  subtitle: string;
  navItems: SidebarNavItem[];
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Escape closes the drawer; lock body scroll while it's open on mobile.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function isActive(item: SidebarNavItem): boolean {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  const sidebarBody = (
    <>
      <div className="flex flex-col gap-1 px-6 pb-2 pt-7">
        <Image
          src="/images/logo.svg"
          alt="Logos RX"
          width={116}
          height={37}
          className="h-8 w-auto"
          priority
        />
        <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-navy/35">
          {subtitle}
        </p>
      </div>

      <nav className="mt-3 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {navItems.map((item, i) => {
          const active = isActive(item);
          const sectionLabel =
            item.section && item.section !== navItems[i - 1]?.section
              ? item.section
              : null;
          return (
            <div key={item.href}>
              {sectionLabel && (
                <p className="mb-1.5 mt-5 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-navy/30">
                  {sectionLabel}
                </p>
              )}
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-all ${
                  active
                    ? "bg-plum font-semibold text-white shadow-soft"
                    : "font-medium text-navy/60 hover:bg-navy/[0.05] hover:text-navy"
                }`}
              >
                <span
                  className={
                    active
                      ? "text-white"
                      : "text-navy/35 transition-colors group-hover:text-navy/60"
                  }
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="space-y-2.5 px-4 pb-5">
        <a
          href="mailto:support@logosrx.com"
          className="block rounded-2xl bg-plum px-4 py-3.5 text-white transition-transform hover:-translate-y-0.5"
        >
          <p className="font-display text-[15px] font-medium">Need a hand?</p>
          <p className="mt-0.5 text-[12px] text-white/60">
            Our team answers within a day.
          </p>
        </a>
        <div className="rounded-2xl bg-cream/80 px-4 py-3.5 ring-1 ring-beige/80">
          {footer}
        </div>
      </div>
    </>
  );

  return (
    <div className={`theme-ink ${displayFont.variable} flex min-h-screen bg-cream`}>
      {/* Desktop: persistent floating sidebar panel */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[268px] p-3 lg:block">
        <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-beige/70 bg-white shadow-soft">
          {sidebarBody}
        </div>
      </aside>

      {/* Mobile: overlay + slide-in drawer */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-navy/25 backdrop-blur-[2px] lg:hidden"
        />
      )}
      <aside
        className={`theme-ink fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-white shadow-soft-lg transition-transform duration-200 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        {sidebarBody}
      </aside>

      <div className="flex-1 lg:pl-[268px]">
        {/* Mobile: sticky top bar with the menu toggle */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-beige bg-cream/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-beige-dark bg-white text-navy"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M2 4.5h14M2 9h14M2 13.5h14" strokeLinecap="round" />
            </svg>
          </button>
          <Image src="/images/logo.svg" alt="Logos RX" width={92} height={29} className="h-6 w-auto" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy/35">
            {subtitle}
          </span>
        </div>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
