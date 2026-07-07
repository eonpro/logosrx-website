"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** Match the route exactly (used for the "overview" root item). */
  exact?: boolean;
}

/**
 * Shared chrome for the internal sidebar portals (Admin, Partner). On desktop
 * (lg+) it's a persistent fixed sidebar; on smaller screens it collapses into a
 * slide-in drawer behind a hamburger button in a sticky top bar.
 *
 * Visual language: minimal light monochrome — white sidebar, near-black text,
 * hairline borders. The `.theme-ink` scope (globals.css) re-maps the brand
 * palette for everything rendered inside the portal.
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

  // Nav links close the drawer in their onClick (covers clicking the active
  // route too), so no pathname effect is needed here.

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
      <div className="flex h-16 items-center gap-3 border-b border-beige px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-sm font-bold text-white">
          LX
        </div>
        <div>
          <p className="text-sm font-bold text-navy">Logos RX</p>
          <p className="text-[11px] text-navy/50">{subtitle}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-navy/5 font-semibold text-navy"
                  : "font-medium text-navy/60 hover:bg-navy/[0.03] hover:text-navy"
              }`}
            >
              <span className={active ? "text-navy" : "text-navy/40"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-beige px-4 py-4">{footer}</div>
    </>
  );

  return (
    <div className="theme-ink flex min-h-screen bg-cream">
      {/* Desktop: persistent sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-beige bg-white lg:flex">
        {sidebarBody}
      </aside>

      {/* Mobile: overlay + slide-in drawer */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}
      <aside
        className={`theme-ink fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-beige bg-white shadow-xl transition-transform duration-200 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        {sidebarBody}
      </aside>

      <div className="flex-1 lg:pl-64">
        {/* Mobile: sticky top bar with the menu toggle */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-beige bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-beige text-navy"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M2 4.5h14M2 9h14M2 13.5h14" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-navy">Logos RX</span>
            <span className="text-xs text-navy/50">{subtitle}</span>
          </div>
        </div>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
