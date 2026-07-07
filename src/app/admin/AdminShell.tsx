"use client";

import { usePathname } from "next/navigation";
import { UserButton, Show } from "@clerk/nextjs";
import SidebarShell, { type SidebarNavItem } from "@/components/portal/SidebarShell";

const navItems: SidebarNavItem[] = [
  {
    label: "Overview",
    href: "/admin",
    exact: true,
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
        <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 00-2-2z" strokeLinecap="round" />
        <path d="M7 7h6M7 10h6M7 13h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Clinics",
    href: "/admin/clinics",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 17V5a1 1 0 011-1h10a1 1 0 011 1v12" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 17h16M10 4V2m-1.5 5h3M8.5 10h3M8.5 13h3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Catalog",
    href: "/admin/catalog",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="14" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 8h14M8 8v9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Quotes",
    href: "/admin/quotes",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 2h7l3 3v13a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 2v4h4M7 11h6M7 14h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Merchandising",
    href: "/admin/merchandising",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 7l1.5-3h11L17 7M3 7v9a1 1 0 001 1h12a1 1 0 001-1V7M3 7h14M8 11h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Partners",
    href: "/admin/partners",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="10" cy="5" r="2.5" />
        <circle cx="4.5" cy="14" r="2.5" />
        <circle cx="15.5" cy="14" r="2.5" />
        <path d="M8.5 7l-2.5 4.5M11.5 7l2.5 4.5M7 14h6" strokeLinecap="round" />
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
  {
    label: "Audit Log",
    href: "/admin/audit",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 3h9l3 3v11a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 3v4h4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // The admin sign-in page renders full-bleed (no portal chrome).
  if (pathname.startsWith("/admin/sign-in")) {
    return <>{children}</>;
  }

  return (
    <SidebarShell
      subtitle="Admin Portal"
      navItems={navItems}
      footer={
        <Show when="signed-in">
          <div className="flex items-center gap-3">
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            <span className="text-xs text-navy/60">Admin</span>
          </div>
        </Show>
      }
    >
      {children}
    </SidebarShell>
  );
}
