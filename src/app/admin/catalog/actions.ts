"use server";

import { revalidatePath, updateTag } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  catalogProducts,
  clinicPricing,
  featuredProducts,
} from "@/lib/db/schema";
import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
import { recordAdminAudit } from "@/lib/audit/log";
import { CATALOG_PRODUCTS_TAG } from "@/lib/catalog/store";
import { cleanPricing, isValidSkuId } from "@/lib/catalog/mapping";
import {
  BRANDS,
  DOSAGE_FORMS,
  PRODUCT_FAMILIES,
  THERAPEUTIC_AREAS,
  type CatalogPricing,
} from "@/data/catalog";

/**
 * Super-admin server actions for the catalog editor (`/admin/catalog`). All
 * mutators require a full admin (viewers are read-only), validate against the
 * taxonomy const arrays in `@/data/catalog`, write an audit event, and
 * revalidate every surface that renders catalog prices.
 *
 * A SKU's `id` (slug) is IMMUTABLE after creation — `clinic_pricing.productId`
 * and `featured_products.productId` reference it by value. Renaming edits the
 * display `name` only; deletion is refused when references exist (deactivate
 * instead).
 */

/** How a single price tier is expressed in the editor. */
export type TierState = "price" | "na" | "hidden";

export interface TierInput {
  state: TierState;
  /** Dollars (e.g. 45.5). Ignored unless `state === "price"`. */
  dollars: number;
}

export interface CatalogProductInput {
  name: string;
  strength: string;
  form: string;
  unit: string;
  retail: TierInput;
  provider: TierInput;
  volume: TierInput;
  productFamily: string[];
  brand: string;
  therapeuticAreas: string[];
  details: string;
  badge: string;
  active: boolean;
  sortOrder: number;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const FORM_SET = new Set<string>(DOSAGE_FORMS);
const FAMILY_SET = new Set<string>(PRODUCT_FAMILIES);
const AREA_SET = new Set<string>(THERAPEUTIC_AREAS);
const BRAND_SET = new Set<string>(BRANDS);

/** Invalidate every surface that renders catalog data. */
function revalidateCatalog() {
  // `updateTag` (not `revalidateTag(tag, "max")`) gives read-your-own-writes:
  // it expires the tag immediately so the next read of getCatalogProducts()
  // — the public /catalog, clinic storefront, and the quote builder — fetches
  // fresh prices. `revalidateTag(tag, "max")` is stale-while-revalidate, which
  // served the OLD price after a save. Valid here because every caller is a
  // Server Action.
  updateTag(CATALOG_PRODUCTS_TAG);
  revalidatePath("/admin/catalog");
  revalidatePath("/catalog");
  revalidatePath("/dashboard");
}

/** Map a tier input to its `CatalogPricing` value (number | null | undefined). */
function tierToValue(t: TierInput | undefined): number | null | undefined {
  if (!t || t.state === "hidden") return undefined;
  if (t.state === "na") return null;
  const n = Number(t.dollars);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

function sanitize(input: CatalogProductInput) {
  const name = input.name.trim();
  if (!name) throw new Error("Product name is required.");
  if (name.length > 200) throw new Error("Product name is too long.");

  const form = input.form.trim();
  if (!FORM_SET.has(form)) throw new Error("Choose a valid dosage form.");

  const brand = input.brand.trim();
  if (brand && !BRAND_SET.has(brand)) throw new Error("Choose a valid brand.");

  const productFamily = [
    ...new Set(input.productFamily.map((s) => s.trim()).filter(Boolean)),
  ];
  for (const f of productFamily) {
    if (!FAMILY_SET.has(f)) throw new Error(`Unknown product family: ${f}`);
  }

  const therapeuticAreas = [
    ...new Set(input.therapeuticAreas.map((s) => s.trim()).filter(Boolean)),
  ];
  for (const a of therapeuticAreas) {
    if (!AREA_SET.has(a)) throw new Error(`Unknown therapeutic area: ${a}`);
  }

  const pricing: CatalogPricing = cleanPricing({
    retail: tierToValue(input.retail),
    provider: tierToValue(input.provider),
    volume: tierToValue(input.volume),
  });

  return {
    name,
    strength: input.strength.trim().slice(0, 120) || null,
    form,
    unit: input.unit.trim().slice(0, 60) || null,
    pricing,
    productFamily,
    brand: brand || null,
    therapeuticAreas,
    details: input.details.trim() || null,
    badge: input.badge.trim().slice(0, 60) || null,
    active: Boolean(input.active),
    sortOrder: Number.isFinite(input.sortOrder)
      ? Math.trunc(input.sortOrder)
      : 0,
  };
}

/** Creates a new SKU. `id` must be a unique kebab-case slug. */
export async function createCatalogProduct(
  id: string,
  input: CatalogProductInput,
): Promise<ActionResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  const sku = id.trim().toLowerCase();
  if (!isValidSkuId(sku)) {
    return {
      ok: false,
      error:
        "Invalid SKU id. Use lowercase letters, numbers, '-' and '.' only (e.g. semaglutide-glycine-2.5mg-1ml).",
    };
  }

  let values: ReturnType<typeof sanitize>;
  try {
    values = sanitize(input);
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  const existing = await db
    .select({ id: catalogProducts.id })
    .from(catalogProducts)
    .where(eq(catalogProducts.id, sku))
    .limit(1);
  if (existing.length) {
    return { ok: false, error: "A product with this id already exists." };
  }

  await db.insert(catalogProducts).values({ id: sku, ...values });
  await recordAdminAudit(
    ctx,
    "catalog.product_create",
    { type: "catalog_product", id: sku },
    { name: values.name },
  );
  revalidateCatalog();
  return { ok: true };
}

/** Updates an existing SKU. The slug `id` itself is immutable. */
export async function updateCatalogProduct(
  id: string,
  input: CatalogProductInput,
): Promise<ActionResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  const sku = id.trim();
  if (!sku) return { ok: false, error: "Missing product id." };

  let values: ReturnType<typeof sanitize>;
  try {
    values = sanitize(input);
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  const res = await db
    .update(catalogProducts)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(catalogProducts.id, sku))
    .returning({ id: catalogProducts.id });
  if (!res.length) return { ok: false, error: "Product not found." };

  await recordAdminAudit(
    ctx,
    "catalog.product_update",
    { type: "catalog_product", id: sku },
    { name: values.name },
  );
  revalidateCatalog();
  return { ok: true };
}

/** Toggles a SKU's active flag (soft hide/show in catalog + storefront). */
export async function setCatalogProductActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  const sku = id.trim();
  if (!sku) return { ok: false, error: "Missing product id." };

  await db
    .update(catalogProducts)
    .set({ active: Boolean(active), updatedAt: new Date() })
    .where(eq(catalogProducts.id, sku));
  await recordAdminAudit(
    ctx,
    "catalog.product_set_active",
    { type: "catalog_product", id: sku },
    { active: Boolean(active) },
  );
  revalidateCatalog();
  return { ok: true };
}

/**
 * Hard-deletes a SKU, but only when nothing references it. If clinic overrides
 * or featured rows point at it, returns an error so the admin deactivates
 * instead (preserving referential integrity + history).
 */
export async function deleteCatalogProduct(id: string): Promise<ActionResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  const sku = id.trim();
  if (!sku) return { ok: false, error: "Missing product id." };

  const [pricingRef] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(clinicPricing)
    .where(eq(clinicPricing.productId, sku));
  const [featuredRef] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(featuredProducts)
    .where(eq(featuredProducts.productId, sku));

  const refs = (pricingRef?.n ?? 0) + (featuredRef?.n ?? 0);
  if (refs > 0) {
    return {
      ok: false,
      error:
        "This product is referenced by clinic pricing or featured products. Deactivate it instead of deleting.",
    };
  }

  await db.delete(catalogProducts).where(eq(catalogProducts.id, sku));
  await recordAdminAudit(ctx, "catalog.product_delete", {
    type: "catalog_product",
    id: sku,
  });
  revalidateCatalog();
  return { ok: true };
}
