-- Partner sales goals / quotas with progress tracking. Idempotent.

DO $$ BEGIN
  CREATE TYPE partner_goal_metric AS ENUM ('revenue', 'commission');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE partner_goal_period AS ENUM ('month', 'quarter', 'year');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS partner_goals (
  id serial PRIMARY KEY,
  org_id integer NOT NULL REFERENCES partner_orgs (id) ON DELETE CASCADE,
  rep_id integer REFERENCES partner_reps (id) ON DELETE CASCADE,
  metric partner_goal_metric NOT NULL,
  period partner_goal_period NOT NULL,
  target_cents integer NOT NULL,
  created_by varchar(64),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Rep-level uniqueness (NULLs are distinct, so org-level dedupe is enforced in
-- the app's set action). Plus a lookup index by org.
CREATE UNIQUE INDEX IF NOT EXISTS partner_goals_org_rep_metric_period_uniq
  ON partner_goals (org_id, rep_id, metric, period);
CREATE INDEX IF NOT EXISTS partner_goals_org_idx ON partner_goals (org_id);
