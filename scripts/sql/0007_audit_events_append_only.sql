-- Enforce append-only on audit_events at the database layer.
--
-- The app connects as a single role (`postgres`) that also OWNS this table, so
-- GRANT/REVOKE alone cannot stop UPDATE/DELETE — table owners (and superusers)
-- bypass privilege checks. Instead we install BEFORE UPDATE/DELETE/TRUNCATE
-- triggers that hard-fail any mutation. INSERT (the only operation the app
-- performs) is unaffected, so there is ZERO overhead on the write path.
--
-- Triggers fire for the owner and for ordinary roles alike; only a deliberate
-- superuser `SET session_replication_role = replica` can bypass them, which is
-- itself an audit-worthy administrative action. For an even stronger posture,
-- run the app under a dedicated least-privilege role (INSERT/SELECT only) that
-- does not own this table.
--
-- Idempotent and safe to re-run.

CREATE OR REPLACE FUNCTION audit_events_block_mutation()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only; % is not permitted', TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;

DROP TRIGGER IF EXISTS audit_events_no_update ON audit_events;
CREATE TRIGGER audit_events_no_update
  BEFORE UPDATE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION audit_events_block_mutation();

DROP TRIGGER IF EXISTS audit_events_no_delete ON audit_events;
CREATE TRIGGER audit_events_no_delete
  BEFORE DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION audit_events_block_mutation();

DROP TRIGGER IF EXISTS audit_events_no_truncate ON audit_events;
CREATE TRIGGER audit_events_no_truncate
  BEFORE TRUNCATE ON audit_events
  FOR EACH STATEMENT EXECUTE FUNCTION audit_events_block_mutation();

-- Defense in depth: deny UPDATE/DELETE to PUBLIC (no-op for the owner, but
-- protects any future non-owner roles that might be granted table access).
REVOKE UPDATE, DELETE, TRUNCATE ON audit_events FROM PUBLIC;
