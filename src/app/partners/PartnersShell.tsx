"use client";

import { usePathname } from "next/navigation";
import { UserButton, Show } from "@clerk/nextjs";
import type { PartnerKind, PartnerRole } from "@/lib/auth/partner";
import { roleAtLeast } from "@/lib/auth/partner-roles";
import SidebarShell, { type SidebarNavItem } from "@/components/portal/SidebarShell";

interface PartnerNavItem extends SidebarNavItem {
  /** Restrict the item to a partner kind (undefined = everyone). */
  only?: PartnerKind;
  /** Only show when the org is on the margin model. */
  marginOnly?: boolean;
  /** Hide from org viewers (management-only nav). */
  adminOnly?: boolean;
}

const navItems: PartnerNavItem[] = [
  {
    label: "Overview",
    href: "/partners",
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
    label: "Transactions",
    href: "/partners/transactions",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 10h4v7H3zM8 6h4v11H8zM13 3h4v14h-4z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Network",
    href: "/partners/network",
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
    label: "Reports",
    href: "/partners/reports",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3v14h14" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 12l3-3 2 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Reps",
    href: "/partners/reps",
    only: "org",
    adminOnly: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="7" cy="7" r="3" />
        <path d="M2 17c0-2.8 2.2-5 5-5s5 2.2 5 5M14 8a2.5 2.5 0 100-5M13.5 12c2.5.3 4.5 2.4 4.5 5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Goals",
    href: "/partners/goals",
    only: "org",
    adminOnly: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="10" cy="10" r="7" />
        <circle cx="10" cy="10" r="3" />
        <circle cx="10" cy="10" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Team",
    href: "/partners/team",
    only: "org",
    adminOnly: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="6.5" cy="7" r="2.5" />
        <circle cx="13.5" cy="7" r="2.5" />
        <path d="M2 16c0-2.5 2-4.5 4.5-4.5S11 13.5 11 16M11 16c0-2.5 2-4.5 4.5-4.5S20 13.5 20 16" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "API & Webhooks",
    href: "/partners/api",
    only: "org",
    adminOnly: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M7 5l-4 5 4 5M13 5l4 5-4 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Referral Links",
    href: "/partners/links",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 12a4 4 0 010-5.7l2.3-2.3a4 4 0 015.7 5.7l-1.5 1.5M12 8a4 4 0 010 5.7l-2.3 2.3a4 4 0 01-5.7-5.7l1.5-1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Clinic Pricing",
    href: "/partners/pricing",
    marginOnly: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 2v16M6 5h6a2.5 2.5 0 010 5H6m0 0h7a2.5 2.5 0 010 5H5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Pricing Quotes",
    href: "/partners/quotes",
    marginOnly: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 2h7l3 3v13a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 2v4h4M7 11h6M7 14h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Payouts",
    href: "/partners/payouts",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="5" width="16" height="11" rx="2" strokeLinecap="round" />
        <circle cx="10" cy="10.5" r="2.5" />
        <path d="M2 8h16" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Agreement",
    href: "/partners/agreement",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 2h7l3 3v13a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 2v4h4M7 12l1.5 1.5L12 10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function PartnersShell({
  children,
  kind,
  role,
  orgName,
  repName,
  marginEnabled = false,
}: {
  children: React.ReactNode;
  kind: PartnerKind | null;
  role?: PartnerRole | null;
  orgName: string | null;
  repName: string | null;
  marginEnabled?: boolean;
}) {
  const pathname = usePathname();
  const isBareLayout =
    pathname.startsWith("/partners/sign-in") ||
    pathname.startsWith("/partners/apply");

  // Sign-in and the public application form render full-bleed (no sidebar).
  // Non-partners (kind null) also get no chrome: the page itself explains why.
  if (isBareLayout || !kind) {
    return <>{children}</>;
  }

  const items = navItems.filter(
    (i) =>
      (!i.only || i.only === kind) &&
      (!i.marginOnly || marginEnabled) &&
      // Management nav is hidden from org viewers (read-only members).
      (!i.adminOnly || kind !== "org" || roleAtLeast(role, "admin")),
  );

  return (
    <SidebarShell
      subtitle="Partner Portal"
      navItems={items}
      footer={
        <Show when="signed-in">
          <div className="flex items-center gap-3">
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white/90">
                {kind === "rep" ? repName : orgName}
              </p>
              <p className="text-[11px] text-white/60">
                {kind === "rep" ? `Rep · ${orgName}` : "Organization"}
              </p>
            </div>
          </div>
        </Show>
      }
    >
      {children}
    </SidebarShell>
  );
}
