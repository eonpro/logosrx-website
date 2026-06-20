-- Immutable audit trail for privileged state changes.
--
-- Records who-did-what-when for clinic approvals, partner suspensions,
-- pricing/commission edits, payouts, quote lifecycle, and card reveals.
-- Append-only by convention; for the strongest posture grant the app role
-- only INSERT/SELECT on this table (see the GRANT note at the bottom).
-- Idempotent and safe to re-run.

CREATE TABLE IF NOT EXISTS audit_events (
  id serial PRIMARY KEY,
  actor_type varchar(20) NOT NULL,
  actor_id varchar(64),
  actor_email varchar(255),
  action varchar(80) NOT NULL,
  target_type varchar(40),
  target_id varchar(64),
  metadata jsonb,
  ip varchar(64),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_events_actor_idx ON audit_events (actor_id);
CREATE INDEX IF NOT EXISTS audit_events_target_idx ON audit_events (target_type, target_id);
CREATE INDEX IF NOT EXISTS audit_events_action_idx ON audit_events (action);
CREATE INDEX IF NOT EXISTS audit_events_created_idx ON audit_events (created_at);

-- Optional hardening (run manually with the right role name): make the trail
-- tamper-evident at the DB layer by denying UPDATE/DELETE to the app role.
--
--   REVOKE UPDATE, DELETE ON audit_events FROM <app_db_role>;
--   GRANT  INSERT, SELECT ON audit_events TO <app_db_role>;
