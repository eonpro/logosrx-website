import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  getQuoteWithItemsByToken,
  isQuoteExpired,
  isQuoteOpenable,
} from "@/lib/quotes/data";
import { QUOTE_ACCESS_COOKIE, verifyQuoteAccess } from "@/lib/quotes/crypto";
import { buildCatalogLookups } from "@/lib/quotes/lookups";
import { SITE } from "@/lib/constants";
import AuthShell from "@/components/auth/AuthShell";
import QuoteGate from "./QuoteGate";
import QuoteView, { type QuoteViewItem } from "./QuoteView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Logos RX Pricing Quote",
  description: "A custom pricing quote prepared for your clinic.",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

function Closed({ title, body }: { title: string; body: string }) {
  return (
    <AuthShell subtitle="Pricing Quote">
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

export default async function QuotePage({ params }: PageProps) {
  const { token } = await params;
  const data = await getQuoteWithItemsByToken(token);

  if (!data) {
    return (
      <Closed
        title="Quote not found"
        body="This link may be incorrect or the quote was removed. Please check with your Logos RX representative."
      />
    );
  }

  const { quote, items } = data;

  if (quote.status === "claimed") {
    return (
      <Closed
        title="This quote has been used"
        body="An account was already created from this quote. Please sign in to your provider portal."
      />
    );
  }
  if (quote.status === "revoked") {
    return (
      <Closed
        title="This quote is no longer active"
        body="Please reach out to your Logos RX representative for an updated quote."
      />
    );
  }
  if (isQuoteExpired(quote)) {
    return (
      <Closed
        title="This quote has expired"
        body="Please reach out to your Logos RX representative for an updated quote."
      />
    );
  }
  if (!isQuoteOpenable(quote)) {
    return (
      <Closed
        title="This quote is no longer available"
        body="Please reach out to your Logos RX representative."
      />
    );
  }

  const store = await cookies();
  const hasAccess = verifyQuoteAccess(
    store.get(QUOTE_ACCESS_COOKIE)?.value,
    token.trim().toLowerCase(),
  );

  if (!hasAccess) {
    return (
      <AuthShell subtitle="Pricing Quote">
        <QuoteGate
          token={token}
          clinicName={quote.clinicName}
          contactName={quote.contactName}
        />
      </AuthShell>
    );
  }

  const { standardCentsById, imageById } = await buildCatalogLookups();
  const viewItems: QuoteViewItem[] = items.map((it) => {
    const standardCents = it.productId
      ? standardCentsById.get(it.productId) ?? null
      : null;
    const image = it.productId ? imageById.get(it.productId) ?? null : null;
    return {
      id: it.id,
      name: it.productName,
      unit: it.unit,
      priceCents: it.priceCents,
      standardCents,
      imageUrl: image?.url ?? null,
      imageAlt: image?.alt ?? null,
    };
  });

  return (
    <AuthShell subtitle="Pricing Quote" width="wide">
      <QuoteView
        token={token}
        clinicName={quote.clinicName}
        contactName={quote.contactName}
        intro={quote.intro}
        discountPct={quote.discountPct}
        expiresAt={quote.expiresAt ? quote.expiresAt.toISOString() : null}
        items={viewItems}
      />
    </AuthShell>
  );
}
