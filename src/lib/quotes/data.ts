import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  pricingQuotes,
  pricingQuoteItems,
  type PricingQuote,
  type PricingQuoteItem,
} from "@/lib/db/schema";

export interface QuoteWithItems {
  quote: PricingQuote;
  items: PricingQuoteItem[];
}

/** True when a quote can still be opened/accepted by a recipient. */
export function isQuoteOpenable(q: PricingQuote): boolean {
  if (q.status === "revoked" || q.status === "claimed") return false;
  if (q.expiresAt && q.expiresAt.getTime() < Date.now()) return false;
  return true;
}

export function isQuoteExpired(q: PricingQuote): boolean {
  return Boolean(q.expiresAt && q.expiresAt.getTime() < Date.now());
}

/** Loads a quote and its line items by public token. */
export async function getQuoteWithItemsByToken(
  token: string,
): Promise<QuoteWithItems | null> {
  const clean = token.trim().toLowerCase();
  if (!clean) return null;
  const [quote] = await db
    .select()
    .from(pricingQuotes)
    .where(eq(pricingQuotes.token, clean))
    .limit(1);
  if (!quote) return null;
  const items = await db
    .select()
    .from(pricingQuoteItems)
    .where(eq(pricingQuoteItems.quoteId, quote.id))
    .orderBy(pricingQuoteItems.sortOrder, pricingQuoteItems.id);
  return { quote, items };
}

/** Loads a quote and its items by primary key (admin detail view). */
export async function getQuoteWithItemsById(
  id: number,
): Promise<QuoteWithItems | null> {
  const [quote] = await db
    .select()
    .from(pricingQuotes)
    .where(eq(pricingQuotes.id, id))
    .limit(1);
  if (!quote) return null;
  const items = await db
    .select()
    .from(pricingQuoteItems)
    .where(eq(pricingQuoteItems.quoteId, quote.id))
    .orderBy(pricingQuoteItems.sortOrder, pricingQuoteItems.id);
  return { quote, items };
}

export interface QuoteSummary extends PricingQuote {
  itemCount: number;
}

/** Lists all quotes for the admin index, newest first, with line-item counts. */
export async function listQuotes(): Promise<QuoteSummary[]> {
  const quotes = await db
    .select()
    .from(pricingQuotes)
    .orderBy(desc(pricingQuotes.createdAt));
  if (quotes.length === 0) return [];

  const counts = new Map<number, number>();
  const ids = quotes.map((q) => q.id);
  const itemRows = await db
    .select({ quoteId: pricingQuoteItems.quoteId })
    .from(pricingQuoteItems)
    .where(inArray(pricingQuoteItems.quoteId, ids));
  for (const r of itemRows) {
    counts.set(r.quoteId, (counts.get(r.quoteId) ?? 0) + 1);
  }

  return quotes.map((q) => ({ ...q, itemCount: counts.get(q.id) ?? 0 }));
}

export interface PartnerScope {
  orgId: number;
  /** When set, restrict to a single rep's quotes (rep sessions). */
  repId?: number | null;
}

/** Lists a partner's quotes (org owner sees the whole org; a rep sees only their own). */
export async function listQuotesForPartner(
  scope: PartnerScope,
): Promise<QuoteSummary[]> {
  const where =
    scope.repId != null
      ? and(
          eq(pricingQuotes.partnerOrgId, scope.orgId),
          eq(pricingQuotes.partnerRepId, scope.repId),
        )
      : eq(pricingQuotes.partnerOrgId, scope.orgId);

  const quotes = await db
    .select()
    .from(pricingQuotes)
    .where(where)
    .orderBy(desc(pricingQuotes.createdAt));
  if (quotes.length === 0) return [];

  const counts = new Map<number, number>();
  const itemRows = await db
    .select({ quoteId: pricingQuoteItems.quoteId })
    .from(pricingQuoteItems)
    .where(inArray(pricingQuoteItems.quoteId, quotes.map((q) => q.id)));
  for (const r of itemRows) {
    counts.set(r.quoteId, (counts.get(r.quoteId) ?? 0) + 1);
  }
  return quotes.map((q) => ({ ...q, itemCount: counts.get(q.id) ?? 0 }));
}

/**
 * Loads a quote + items by id, but only if it belongs to the partner's scope.
 * Returns null when the quote doesn't exist or isn't owned by the caller.
 */
export async function getPartnerQuoteWithItems(
  id: number,
  scope: PartnerScope,
): Promise<QuoteWithItems | null> {
  const data = await getQuoteWithItemsById(id);
  if (!data) return null;
  if (data.quote.partnerOrgId !== scope.orgId) return null;
  if (scope.repId != null && data.quote.partnerRepId !== scope.repId) return null;
  return data;
}

/** True when a partner has at least one quote in scope (for portal nav gating). */
export async function partnerHasQuotes(scope: PartnerScope): Promise<boolean> {
  const where =
    scope.repId != null
      ? and(
          eq(pricingQuotes.partnerOrgId, scope.orgId),
          eq(pricingQuotes.partnerRepId, scope.repId),
        )
      : eq(pricingQuotes.partnerOrgId, scope.orgId);
  const [row] = await db
    .select({ id: pricingQuotes.id })
    .from(pricingQuotes)
    .where(where)
    .limit(1);
  return Boolean(row);
}

/** Count of live (openable) quotes — for the admin overview card. */
export async function countActiveQuotes(): Promise<number> {
  const rows = await db
    .select({ id: pricingQuotes.id, status: pricingQuotes.status, expiresAt: pricingQuotes.expiresAt })
    .from(pricingQuotes);
  return rows.filter((r) => isQuoteOpenable(r as PricingQuote)).length;
}
