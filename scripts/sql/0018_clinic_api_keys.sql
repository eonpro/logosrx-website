-- 0018_clinic_api_keys.sql
-- API keys for the clinic ordering API (/api/clinic/v1/*). Admin-issued,
-- scoped to one clinic, SHA-256 hashed at rest (plaintext lxck_... shown once
-- at mint time). Mirrors partner_api_keys. Idempotent.
--
--   npx tsx scripts/apply-sql.ts scripts/sql/0018_clinic_api_keys.sql

CREATE TABLE IF NOT EXISTS clinic_api_keys (
  id serial PRIMARY KEY,
  clinic_id integer NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
  name varchar(120) NOT NULL,
  key_prefix varchar(24) NOT NULL,
  key_hash varchar(64) NOT NULL UNIQUE,
  last_used_at timestamp,
  revoked_at timestamp,
  created_by varchar(64),
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clinic_api_keys_clinic_idx
  ON clinic_api_keys (clinic_id);
