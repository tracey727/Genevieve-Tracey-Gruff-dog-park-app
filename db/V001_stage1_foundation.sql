BEGIN;
CREATE SCHEMA IF NOT EXISTS stage1;
CREATE TABLE IF NOT EXISTS stage1.app_foundation (
  id smallint PRIMARY KEY CHECK (id = 1),
  structure_version text NOT NULL,
  stage_label text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO stage1.app_foundation (id, structure_version, stage_label, status)
VALUES (1, 'first-structure-2026-08-18', 'Stage 1', 'ready')
ON CONFLICT (id) DO UPDATE SET structure_version = EXCLUDED.structure_version, stage_label = EXCLUDED.stage_label, status = EXCLUDED.status, updated_at = now();
CREATE TABLE IF NOT EXISTS stage1.audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type text NOT NULL,
  source text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_events_created_at_idx ON stage1.audit_events (created_at DESC);
COMMIT;
