import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  getQuoteWithItemsByToken,
  isQuoteExpired,
  isQuoteOpenable,
} from "@/lib/quotes/data";
import { QUOTE_ACCESS_COOKIE, verifyQuoteAccess } from "@/lib/quotes/crypto";
import { resolveDetailSlug, standardCatalogPrice } from "@/data/catalog";
import { getCatalogProducts } from "@/lib/catalog/store";
import { products } from "@/data/products";
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

// Resolve each catalog SKU to its marketing product image (same mapping the
// clinic storefront uses), so quote line items can show the product photo.
const detailSlugs = products.map((p) => p.slug);
const productBySlug = new Map(products.map((p) => [p.slug, p]));

/** Per-request lookups for standard price + product image, keyed by SKU id. */
async function buildCatalogLookups() {
  const catalogProducts = await getCatalogProducts();
  const standardCentsById = new Map<string, number | null>(
    catalogProducts.map((p) => {
      const dollars = standardCatalogPrice(p);
      return [p.id, dollars === null ? null : Math.round(dollars * 100)];
    }),
  );
  const imageById = new Map<string, { url: string; alt: string } | null>(
    catalogProducts.map((p) => {
      const slug = resolveDetailSlug(p.id, detailSlugs);
      const prod = slug ? productBySlug.get(slug) : undefined;
      return [
        p.id,
        prod?.image
          ? { url: prod.image, alt: prod.imageAlt ?? prod.name }
          : null,
      ];
    }),
  );
  return { standardCentsById, imageById };
}

function Closed({ title, body }: { title: string; body: string }) {
  return (
    <AuthShell subtitle="Pricing Quote">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        <p className="mt-3 text-sm text-white/55">{body}</p>
        <Link
          href="/"
          className="mx-auto mt-6 inline-block rounded-xl bg-gradient-to-r from-magenta to-magenta-dark px-6 py-3 text-[15px] font-semibold text-white shadow-[0_0_24px_rgba(198,46,136,0.3)] transition-all hover:shadow-[0_0_32px_rgba(198,46,136,0.5)]"
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
