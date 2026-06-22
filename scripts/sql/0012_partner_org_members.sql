-- Finer org-admin roles: multiple users per partner org with roles. The org
-- owner remains partner_orgs.clerk_user_id; this adds invited teammates.
-- Idempotent.

DO $$ BEGIN
  CREATE TYPE partner_org_member_role AS ENUM ('admin', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS partner_org_members (
  id serial PRIMARY KEY,
  org_id integer NOT NULL REFERENCES partner_orgs (id) ON DELETE CASCADE,
  clerk_user_id varchar(64) UNIQUE,
  name varchar(200) NOT NULL,
  email varchar(255) NOT NULL,
  role partner_org_member_role NOT NULL DEFAULT 'viewer',
  status partner_status NOT NULL DEFAULT 'active',
  invited_by varchar(64),
  invited_at timestamp NOT NULL DEFAULT now(),
  activated_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_org_members_org_idx
  ON partner_org_members (org_id);
CREATE UNIQUE INDEX IF NOT EXISTS partner_org_members_org_email_uniq
  ON partner_org_members (org_id, email);
