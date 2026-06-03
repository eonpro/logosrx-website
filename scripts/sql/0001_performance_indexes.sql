-- Performance indexes for the admin/portal read paths.
--
-- These mirror the index() declarations added to src/lib/db/schema.ts. Running
-- `npm run db:push` will also create them, but drizzle-kit issues a plain
-- CREATE INDEX, which takes an ACCESS EXCLUSIVE-ish lock and blocks writes for
-- the duration. On a live/large table prefer applying THIS file instead, which
-- uses CREATE INDEX CONCURRENTLY (no write lock).
--
-- Notes:
--   * CONCURRENTLY cannot run inside a transaction block. Run this file with a
--     client that does not wrap it in a transaction (e.g. `psql -f` without
--     `--single-transaction`).
--   * IF NOT EXISTS makes the script idempotent and safe to re-run.
--   * If a CONCURRENTLY build is interrupted it can leave an INVALID index;
--     drop it (`DROP INDEX <name>;`) and re-run.

CREATE INDEX CONCURRENTLY IF NOT EXISTS employment_applications_status_idx
  ON employment_applications (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS employment_applications_created_at_idx
  ON employment_applications (created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS clinic_signups_status_idx
  ON clinic_signups (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS clinic_signups_created_at_idx
  ON clinic_signups (created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS clinics_onboarding_verification_idx
  ON clinics (onboarding_completed, verification_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS clinics_created_at_idx
  ON clinics (created_at);

-- Admin clinics list: WHERE onboarding_completed = true ORDER BY created_at DESC.
-- Composite serves the filter + sort in a single (backward) index scan.
CREATE INDEX CONCURRENTLY IF NOT EXISTS clinics_completed_created_at_idx
  ON clinics (onboarding_completed, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS clinic_notes_clinic_id_created_at_idx
  ON clinic_notes (clinic_id, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS promotions_active_sort_idx
  ON promotions (active, sort_order);

CREATE INDEX CONCURRENTLY IF NOT EXISTS featured_products_active_sort_idx
  ON featured_products (active, sort_order);
