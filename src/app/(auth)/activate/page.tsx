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
  searchParams: Promise<{ ticket?: string | string[] }>;
}) {
  const { ticket } = await searchParams;
  const value = Array.isArray(ticket) ? ticket[0] : ticket;
  return <ActivateClient ticket={value ?? ""} />;
}
