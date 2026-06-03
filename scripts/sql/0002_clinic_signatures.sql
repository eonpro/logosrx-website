-- Expand phase: relocate clinic signature blobs into an isolated table.
--
-- This is the NON-destructive half of an expand/contract migration:
--   1. Create clinic_signatures (this file).
--   2. App dual-writes (clinics.*_signature AND clinic_signatures) and reads
--      clinic_signatures with a fallback to the old columns.
--   3. Backfill existing rows (this file).
--   4. LATER, after verification: drop clinics.*_signature (separate file).
--
-- Idempotent and safe to re-run: CREATE TABLE IF NOT EXISTS + INSERT … ON
-- CONFLICT. No CONCURRENTLY here, so it MAY run inside a transaction if desired.

CREATE TABLE IF NOT EXISTS clinic_signatures (
  id serial PRIMARY KEY,
  clerk_user_id varchar(64) NOT NULL UNIQUE,
  shipping_signature text,
  provider_agreement_signature text,
  payment_signature text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Backfill from the (deprecated) clinics columns for any clinic that has at
-- least one signature on file. Re-running refreshes values via ON CONFLICT.
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
  shipping_signature = EXCLUDED.shipping_signature,
  provider_agreement_signature = EXCLUDED.provider_agreement_signature,
  payment_signature = EXCLUDED.payment_signature,
  updated_at = now();
