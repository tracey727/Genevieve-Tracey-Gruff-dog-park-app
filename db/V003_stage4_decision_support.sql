BEGIN;
CREATE SCHEMA IF NOT EXISTS stage4;

CREATE TABLE IF NOT EXISTS stage4.build_state (
  singleton_id smallint PRIMARY KEY DEFAULT 1 CHECK (singleton_id=1),
  structure_version text NOT NULL,
  stage_label text NOT NULL,
  status text NOT NULL,
  linked_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO stage4.build_state(singleton_id,structure_version,stage_label,status)
VALUES(1,'stage4-decision-support-2026-08-18','Stage 4','LINKED_GATED')
ON CONFLICT(singleton_id) DO UPDATE SET structure_version=EXCLUDED.structure_version,stage_label=EXCLUDED.stage_label,status=EXCLUDED.status,linked_at=now();

CREATE TABLE IF NOT EXISTS stage4.policy_state (
  singleton_id smallint PRIMARY KEY DEFAULT 1 CHECK (singleton_id=1),
  policy_version text NOT NULL,
  numeric_scoring_enabled boolean NOT NULL DEFAULT false,
  surface_heat_estimate_enabled boolean NOT NULL DEFAULT false,
  live_weather_enabled boolean NOT NULL DEFAULT false,
  expert_review_status text NOT NULL DEFAULT 'PENDING' CHECK (expert_review_status IN ('PENDING','APPROVED','REJECTED','SUPERSEDED')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO stage4.policy_state(singleton_id,policy_version,numeric_scoring_enabled,surface_heat_estimate_enabled,live_weather_enabled,expert_review_status)
VALUES(1,'stage4-candidate-2026-08-18',false,false,false,'PENDING')
ON CONFLICT(singleton_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS stage4.suitability_assessments (
  assessment_id text PRIMARY KEY,
  session_id text NOT NULL REFERENCES stage3.device_sessions(session_id) ON DELETE CASCADE,
  dog_id text NOT NULL REFERENCES stage3.dog_profiles(dog_id),
  park_id text NOT NULL REFERENCES stage3.parks(park_id),
  assessment_status text NOT NULL CHECK (assessment_status IN ('POLICY_GATED','READY','SUPERSEDED')),
  score smallint CHECK (score BETWEEN 1 AND 10),
  risk_band text CHECK (risk_band IN ('GREEN','YELLOW','AMBER','RED')),
  policy_version text NOT NULL,
  observations jsonb NOT NULL DEFAULT '{}'::jsonb,
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  unknowns jsonb NOT NULL DEFAULT '[]'::jsonb,
  controls jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  heat_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stage4_suitability_session_idx ON stage4.suitability_assessments(session_id,created_at DESC);

CREATE TABLE IF NOT EXISTS stage4.compatibility_assessments (
  assessment_id text PRIMARY KEY,
  session_id text NOT NULL REFERENCES stage3.device_sessions(session_id) ON DELETE CASCADE,
  assessment_mode text NOT NULL CHECK (assessment_mode IN ('PAIR','GROUP')),
  dog_ids jsonb NOT NULL,
  park_id text REFERENCES stage3.parks(park_id),
  assessment_status text NOT NULL CHECK (assessment_status IN ('POLICY_GATED','READY','SUPERSEDED')),
  score smallint CHECK (score BETWEEN 1 AND 10),
  risk_band text CHECK (risk_band IN ('GREEN','YELLOW','AMBER','RED')),
  policy_version text NOT NULL,
  factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  unknowns jsonb NOT NULL DEFAULT '[]'::jsonb,
  controls jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stage4_compatibility_session_idx ON stage4.compatibility_assessments(session_id,created_at DESC);
COMMIT;
