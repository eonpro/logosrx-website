-- Partner relationship CRM: per-company stage/tags and an activity timeline.
-- Idempotent and safe to re-run.

-- --- Enums ------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE partner_clinic_stage AS ENUM ('lead', 'active', 'at_risk', 'dormant');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE partner_clinic_activity_type AS ENUM ('note', 'stage_change', 'tag_change');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- Relationship record (stage + tags) per (org, clinic) -------------------

CREATE TABLE IF NOT EXISTS partner_clinic_meta (
  id serial PRIMARY KEY,
  org_id integer NOT NULL REFERENCES partner_orgs (id) ON DELETE CASCADE,
  clinic_id integer NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
  stage partner_clinic_stage NOT NULL DEFAULT 'active',
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_clinic_meta_org_clinic_uniq
  ON partner_clinic_meta (org_id, clinic_id);
CREATE INDEX IF NOT EXISTS partner_clinic_meta_clinic_idx
  ON partner_clinic_meta (clinic_id);

-- --- Activity timeline (notes + logged stage/tag changes) -------------------

CREATE TABLE IF NOT EXISTS partner_clinic_activity (
  id serial PRIMARY KEY,
  org_id integer NOT NULL REFERENCES partner_orgs (id) ON DELETE CASCADE,
  clinic_id integer NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
  rep_id integer REFERENCES partner_reps (id) ON DELETE SET NULL,
  actor_kind commission_payee NOT NULL,
  actor_name varchar(200),
  type partner_clinic_activity_type NOT NULL,
  body text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_clinic_activity_clinic_idx
  ON partner_clinic_activity (clinic_id, created_at);
