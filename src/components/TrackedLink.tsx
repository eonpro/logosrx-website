"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/**
 * A link/anchor that fires a typed analytics event on click. Lets server
 * components instrument conversion CTAs without becoming client components
 * themselves — only this leaf is interactive.
 *
 * Routing rules:
 *   - `tel:` / `mailto:` / `newTab` / absolute URLs → plain `<a>`.
 *   - everything else → Next `<Link>` for client-side nav + prefetch.
 * Tracking is a no-op when analytics isn't configured (see `lib/analytics`).
 */
export interface TrackedLinkProps {
  href: string;
  event: AnalyticsEvent;
  eventParams?: Record<string, unknown>;
  newTab?: boolean;
  className?: string;
  children: ReactNode;
}

export default function TrackedLink({
  href,
  event,
  eventParams,
  newTab,
  className,
  children,
}: TrackedLinkProps) {
  const onClick = () => track(event, eventParams);

  const isBareAnchor =
    newTab ||
    href.startsWith("tel:") ||
    href.startsWith("mailto:") ||
    href.startsWith("http://") ||
    href.startsWith("https://");

  if (isBareAnchor) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={className}
        {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}
