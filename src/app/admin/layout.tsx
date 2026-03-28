"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, Show } from "@clerk/nextjs";

const navItems = [
  {
    label: "Overview",
    href: "/admin",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="7" height="7" rx="1.5" strokeLinecap="round" />
        <rect x="11" y="2" width="7" height="7" rx="1.5" strokeLinecap="round" />
        <rect x="2" y="11" width="7" height="7" rx="1.5" strokeLinecap="round" />
        <rect x="11" y="11" width="7" height="7" rx="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Applications",
    href: "/admin/applications",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" strokeLinecap="round" />
        <path d="M7 7h6M7 10h6M7 13h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Clinic Sign-ups",
    href: "/admin/clinic-signups",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 10h4v7H3zM8 6h4v11H8zM13 3h4v14h-4z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Email Sign-ups",
    href: "/admin/email-signups",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="16" height="12" rx="2" strokeLinecap="round" />
        <path d="M2 6l8 5 8-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-cream">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-deep text-white">
        <div className="flex h-16 items-center gap-3 px-6 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-magenta flex items-center justify-center font-bold text-sm">
            LX
          </div>
          <div>
            <p className="text-sm font-bold">Logos RX</p>
            <p className="text-[11px] text-white/40">Admin Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                }`}
              >
                <span className={isActive ? "text-magenta" : "text-white/40"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <Show when="signed-in">
            <div className="flex items-center gap-3">
              <UserButton
                appearance={{
                  elements: { avatarBox: "w-8 h-8" },
                }}
              />
              <span className="text-xs text-white/50">Admin</span>
            </div>
          </Show>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 pl-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
