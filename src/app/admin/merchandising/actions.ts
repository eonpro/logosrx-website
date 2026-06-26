"use server";

import { revalidatePath, updateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { promotions, featuredProducts } from "@/lib/db/schema";
import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
import { MERCHANDISING_TAG } from "@/lib/portal/merchandising";
import { getActiveCatalogIds } from "@/lib/catalog/store";

/**
 * Invalidate every storefront surface that renders merchandising. Clears the
 * tag-cached reads (`getActivePromotions` / `getFeaturedProductIds`) and the
 * pages that embed them.
 */
function revalidateMerchandising() {
  // `updateTag` expires the tag immediately (read-your-own-writes) so edits show
  // up on the next visit, instead of `revalidateTag(tag, "max")` which serves
  // stale-while-revalidate. Valid here because every caller is a Server Action.
  updateTag(MERCHANDISING_TAG);
  revalidatePath("/admin/merchandising");
  revalidatePath("/dashboard");
}

type PromotionKind = "promo" | "news";
type PromotionLayout = "card" | "hero" | "tile";
type AudienceTier = "" | "standard" | "preferred" | "vip";

export interface PromotionInput {
  kind: PromotionKind;
  layout: PromotionLayout;
  title: string;
  body: string;
  imageUrl: string;
  bgColor: string;
  badge: string;
  ctaLabel: string;
  ctaHref: string;
  productId: string;
  audienceTier: AudienceTier;
  pinned: boolean;
  active: boolean;
  sortOrder: number;
  /** ISO date string (`YYYY-MM-DD`) or empty. */
  startsAt: string;
  endsAt: string;
}

const VALID_KIND = new Set<PromotionKind>(["promo", "news"]);
const VALID_LAYOUT = new Set<PromotionLayout>(["card", "hero", "tile"]);
const VALID_TIER = new Set<AudienceTier>(["", "standard", "preferred", "vip"]);
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function assertId(id: number, label = "id") {
  if (!Number.isFinite(id) || id <= 0) throw new Error(`invalid ${label}`);
}

function parseDate(value: string): Date | null {
  const v = value.trim();
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function sanitize(input: PromotionInput, catalogIds: Set<string>) {
  const kind: PromotionKind = VALID_KIND.has(input.kind) ? input.kind : "promo";
  const layout: PromotionLayout = VALID_LAYOUT.has(input.layout)
    ? input.layout
    : "card";
  const title = input.title.trim();
  if (!title) throw new Error("title required");
  if (title.length > 200) throw new Error("title too long");

  const tier = VALID_TIER.has(input.audienceTier) ? input.audienceTier : "";
  const productId = input.productId.trim();
  // Only persist a product link when it maps to a real catalog SKU.
  const linkedProduct = productId && catalogIds.has(productId) ? productId : null;
  const bg = input.bgColor.trim();
  const bgColor = HEX_COLOR.test(bg) ? bg : null;

  return {
    kind,
    layout,
    title,
    body: input.body.trim() || null,
    imageUrl: input.imageUrl.trim() || null,
    bgColor,
    badge: input.badge.trim().slice(0, 40) || null,
    ctaLabel: input.ctaLabel.trim().slice(0, 60) || null,
    ctaHref: input.ctaHref.trim().slice(0, 500) || null,
    productId: linkedProduct,
    audienceTier: tier === "" ? null : tier,
    pinned: Boolean(input.pinned),
    active: Boolean(input.active),
    sortOrder: Number.isFinite(input.sortOrder)
      ? Math.trunc(input.sortOrder)
      : 0,
    startsAt: parseDate(input.startsAt),
    endsAt: parseDate(input.endsAt),
  };
}

export async function createPromotion(input: PromotionInput) {
  await requireAdmin({ minRole: ADMIN_ROLE });
  const catalogIds = await getActiveCatalogIds();
  const values = sanitize(input, catalogIds);
  await db.insert(promotions).values(values);
  revalidateMerchandising();
}

export async function updatePromotion(id: number, input: PromotionInput) {
  await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(id);
  const catalogIds = await getActiveCatalogIds();
  const values = sanitize(input, catalogIds);
  await db
    .update(promotions)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(promotions.id, id));
  revalidateMerchandising();
}

export async function deletePromotion(id: number) {
  await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(id);
  await db.delete(promotions).where(eq(promotions.id, id));
  revalidateMerchandising();
}

/** Toggle a promotion's active flag without opening the full editor. */
export async function setPromotionActive(id: number, active: boolean) {
  await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(id);
  await db
    .update(promotions)
    .set({ active: Boolean(active), updatedAt: new Date() })
    .where(eq(promotions.id, id));
  revalidateMerchandising();
}

/* ─────────────── Featured products ─────────────── */

export async function addFeatured(
  productId: string,
  label: string,
  sortOrder: number,
) {
  await requireAdmin({ minRole: ADMIN_ROLE });
  const pid = productId.trim();
  const catalogIds = await getActiveCatalogIds();
  if (!pid || !catalogIds.has(pid)) throw new Error("unknown product");
  const cleanLabel = label.trim().slice(0, 40) || null;
  const order = Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0;

  await db
    .insert(featuredProducts)
    .values({ productId: pid, label: cleanLabel, sortOrder: order, active: true })
    .onConflictDoUpdate({
      target: featuredProducts.productId,
      set: {
        label: cleanLabel,
        sortOrder: order,
        active: true,
        updatedAt: new Date(),
      },
    });

  revalidateMerchandising();
}

export async function removeFeatured(id: number) {
  await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(id);
  await db.delete(featuredProducts).where(eq(featuredProducts.id, id));
  revalidateMerchandising();
}
