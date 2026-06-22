-- Partner Marketing Services Agreement (MSA) e-signature + document of record.
--
-- Adds:
--   * partner_orgs.msa_signed_at / partner_reps.msa_signed_at  (cheap gate)
--   * partner_agreements                                       (signed record)
--
-- Idempotent and safe to re-run.

-- --- Signer kind enum -------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE partner_signer_kind AS ENUM ('org', 'rep');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- Denormalized "signed" flags for the portal gate -----------------------

ALTER TABLE partner_orgs
  ADD COLUMN IF NOT EXISTS msa_signed_at timestamp;

ALTER TABLE partner_reps
  ADD COLUMN IF NOT EXISTS msa_signed_at timestamp;

-- --- Executed agreement records (system of record) -------------------------

CREATE TABLE IF NOT EXISTS partner_agreements (
  id                serial PRIMARY KEY,
  org_id            integer NOT NULL REFERENCES partner_orgs (id) ON DELETE CASCADE,
  rep_id            integer REFERENCES partner_reps (id) ON DELETE CASCADE,
  signer_kind       partner_signer_kind NOT NULL,
  clerk_user_id     varchar(64) NOT NULL,
  document_version  varchar(40) NOT NULL,
  document_title    varchar(200) NOT NULL,
  document_hash     varchar(64) NOT NULL,
  document_text     text NOT NULL,
  legal_entity_name varchar(200),
  signer_name       varchar(200) NOT NULL,
  signer_title      varchar(120),
  signer_email      varchar(255),
  signature_image   text NOT NULL,
  signed_ip         varchar(64),
  signed_user_agent varchar(400),
  signed_at         timestamp NOT NULL DEFAULT now(),
  created_at        timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_agreements_org_id_idx
  ON partner_agreements (org_id);
CREATE INDEX IF NOT EXISTS partner_agreements_rep_id_idx
  ON partner_agreements (rep_id);

-- One executed row per signer per document version. NULL rep_id (org-owner
-- signatures) are treated as distinct by Postgres, which is what we want.
CREATE UNIQUE INDEX IF NOT EXISTS partner_agreements_signer_version_uniq
  ON partner_agreements (org_id, rep_id, document_version);
