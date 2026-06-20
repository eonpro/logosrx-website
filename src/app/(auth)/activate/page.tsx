import type { Metadata } from "next";
import ActivateClient from "./ActivateClient";

export const metadata: Metadata = {
  title: "Activate your account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string | string[]; next?: string | string[] }>;
}) {
  const { ticket, next } = await searchParams;
  const value = Array.isArray(ticket) ? ticket[0] : ticket;
  const rawNext = Array.isArray(next) ? next[0] : next;
  // Only allow same-site relative destinations (default: clinic dashboard).
  const safeNext =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/dashboard";
  return <ActivateClient ticket={value ?? ""} next={safeNext} />;
}
