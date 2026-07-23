"use server";

import { revalidatePath, updateTag } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { catalogProducts } from "@/lib/db/schema";
import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
import { recordAdminAudit } from "@/lib/audit/log";
import { CATALOG_PRODUCTS_TAG } from "@/lib/catalog/store";

/**
 * Admin actions for the LifeFile product mapping (`/admin/orders/mapping`).
 * A SKU becomes orderable in-app once it has a LifeFile product id (and isn't
 * a controlled schedule 2-5 substance).
 */

export interface LifeFileMappingInput {
  lfProductId: number | null;
  scheduleCode: string | null;
  quantityUnits: string | null;
  defaultQuantity: string | null;
}

export interface MappingResult {
  ok: boolean;
  error?: string;
}

const VALID_SCHEDULES = new Set(["2", "3", "4", "5", "L", "O"]);

export async function setLifeFileMapping(
  productId: string,
  input: LifeFileMappingInput,
): Promise<MappingResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  const sku = productId.trim();
  if (!sku) return { ok: false, error: "Missing product id." };

  const lfProductId =
    input.lfProductId == null || Number.isNaN(input.lfProductId)
      ? null
      : Math.trunc(input.lfProductId);
  if (lfProductId !== null && lfProductId <= 0) {
    return { ok: false, error: "LifeFile product ID must be positive." };
  }

  const scheduleCode = input.scheduleCode?.trim().toUpperCase() || null;
  if (scheduleCode && !VALID_SCHEDULES.has(scheduleCode)) {
    return {
      ok: false,
      error: "Schedule must be one of 2, 3, 4, 5, L, or O.",
    };
  }

  const res = await db
    .update(catalogProducts)
    .set({
      lfProductId,
      scheduleCode,
      quantityUnits: input.quantityUnits?.trim().slice(0, 45) || null,
      defaultQuantity: input.defaultQuantity?.trim().slice(0, 45) || null,
      updatedAt: new Date(),
    })
    .where(eq(catalogProducts.id, sku))
    .returning({ id: catalogProducts.id });
  if (!res.length) return { ok: false, error: "Product not found." };

  await recordAdminAudit(
    ctx,
    "catalog.lifefile_mapping",
    { type: "catalog_product", id: sku },
    { lfProductId, scheduleCode },
  );

  updateTag(CATALOG_PRODUCTS_TAG);
  revalidatePath("/admin/orders/mapping");
  revalidatePath("/dashboard");
  return { ok: true };
}
