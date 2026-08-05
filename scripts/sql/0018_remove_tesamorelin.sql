-- 0018_remove_tesamorelin.sql
-- Soft-hide Tesamorelin from the live catalog (clinic storefront + /catalog).
-- The marketing PDP and static seed entry were removed in the same change;
-- this keeps already-seeded production rows from continuing to surface.
-- Soft-delete (active=false) preserves historical quote/order/clinic_pricing
-- references that key on the SKU id.
--
--   npx tsx scripts/apply-sql.ts scripts/sql/0018_remove_tesamorelin.sql

UPDATE catalog_products
SET active = false,
    updated_at = now()
WHERE id = 'tesamorelin-5mg-4ml'
  AND active = true;
