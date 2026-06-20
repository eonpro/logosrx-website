"use client";

import { usePathname } from "next/navigation";
import { UserButton, Show } from "@clerk/nextjs";
import type { PartnerKind } from "@/lib/auth/partner";
import SidebarShell, { type SidebarNavItem } from "@/components/portal/SidebarShell";

interface PartnerNavItem extends SidebarNavItem {
  /** Restrict the item to a partner kind (undefined = everyone). */
  only?: PartnerKind;
  /** Only show when the org is on the margin model. */
  marginOnly?: boolean;
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
    label: "Reps",
    href: "/partners/reps",
    only: "org",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="7" cy="7" r="3" />
        <path d="M2 17c0-2.8 2.2-5 5-5s5 2.2 5 5M14 8a2.5 2.5 0 100-5M13.5 12c2.5.3 4.5 2.4 4.5 5" strokeLinecap="round" />
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
];

export default function PartnersShell({
  children,
  kind,
  orgName,
  repName,
  marginEnabled = false,
}: {
  children: React.ReactNode;
  kind: PartnerKind | null;
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
      (!i.only || i.only === kind) && (!i.marginOnly || marginEnabled),
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
