import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cardUpdateLinks } from "@/lib/db/schema";
import {
  cardLinkRecipientName,
  getCardUpdateLinkByToken,
  isCardLinkExpired,
} from "@/lib/payment-links/data";
import { SITE } from "@/lib/constants";
import AuthShell from "@/components/auth/AuthShell";
import CardUpdateForm from "./CardUpdateForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Update Your Payment Card | Logos RX",
  description: "Securely update the payment card on file for your clinic.",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

function Closed({ title, body }: { title: string; body: string }) {
  return (
    <AuthShell subtitle="Payment Update">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-navy">{title}</h1>
        <p className="mt-3 text-sm text-navy/60">{body}</p>
        <Link
          href="/"
          className="mx-auto mt-6 inline-block rounded-xl bg-magenta px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-magenta-dark"
        >
          Go to {SITE.name}
        </Link>
      </div>
    </AuthShell>
  );
}

export default async function UpdateCardPage({ params }: PageProps) {
  const { token } = await params;
  const data = await getCardUpdateLinkByToken(token);

  if (!data) {
    return (
      <Closed
        title="Link not found"
        body="This link may be incorrect or was removed. Please contact Logos RX for a new payment-update link."
      />
    );
  }

  const { link } = data;

  if (link.status === "used") {
    return (
      <Closed
        title="This link has already been used"
        body="A new card was already submitted through this link. If you need to update your card again, please contact Logos RX for a fresh link."
      />
    );
  }
  if (link.status === "revoked") {
    return (
      <Closed
        title="This link is no longer active"
        body="Please contact Logos RX for a new payment-update link."
      />
    );
  }
  if (isCardLinkExpired(link)) {
    return (
      <Closed
        title="This link has expired"
        body="For your security, payment-update links expire. Please contact Logos RX for a fresh link."
      />
    );
  }

  // Stamp first-view time (best-effort, once) so the admin can see it landed.
  if (!link.viewedAt) {
    try {
      await db
        .update(cardUpdateLinks)
        .set({ viewedAt: new Date() })
        .where(eq(cardUpdateLinks.id, link.id));
    } catch {
      // non-critical
    }
  }

  const clinicName = cardLinkRecipientName(data);

  return (
    <AuthShell subtitle="Payment Update">
      <CardUpdateForm token={link.token} clinicName={clinicName} />
    </AuthShell>
  );
}
