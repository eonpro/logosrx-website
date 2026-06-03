-- Contract phase: reconcile any stragglers, then drop the deprecated signature
-- columns from `clinics`.
--
-- ⚠️ DESTRUCTIVE & IRREVERSIBLE (the drop). Only run when ALL are true:
--   1. The contract code (no longer reads/writes clinics.*_signature; reads and
--      writes go through `clinic_signatures`) is DEPLOYED to production and has
--      fully rolled out — no old instance is still writing the old columns.
--   2. You accept this is the final cutover for the relocation.
--
-- The reconcile below runs first, in the same script: it copies any signature
-- still present only in the old `clinics` columns into `clinic_signatures`,
-- but ONLY where the isolated table is missing/NULL for that field. It never
-- overwrites a value already in `clinic_signatures`, so freshly written
-- post-deploy signatures are safe.

-- Step 1 — gap-fill from the old columns (insert missing rows + fill NULL fields).
INSERT INTO clinic_signatures (
  clerk_user_id,
  shipping_signature,
  provider_agreement_signature,
  payment_signature,
  created_at,
  updated_at
)
SELECT
  clerk_user_id,
  shipping_signature,
  provider_agreement_signature,
  payment_signature,
  now(),
  now()
FROM clinics
WHERE shipping_signature IS NOT NULL
   OR provider_agreement_signature IS NOT NULL
   OR payment_signature IS NOT NULL
ON CONFLICT (clerk_user_id) DO UPDATE SET
  shipping_signature =
    COALESCE(clinic_signatures.shipping_signature, EXCLUDED.shipping_signature),
  provider_agreement_signature =
    COALESCE(clinic_signatures.provider_agreement_signature, EXCLUDED.provider_agreement_signature),
  payment_signature =
    COALESCE(clinic_signatures.payment_signature, EXCLUDED.payment_signature),
  updated_at = now();

-- Step 2 — drop the deprecated columns. Data now lives only in clinic_signatures.
ALTER TABLE clinics
  DROP COLUMN IF EXISTS shipping_signature,
  DROP COLUMN IF EXISTS provider_agreement_signature,
  DROP COLUMN IF EXISTS payment_signature;
