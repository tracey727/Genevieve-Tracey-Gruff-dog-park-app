BEGIN;
CREATE SCHEMA IF NOT EXISTS stage5;

CREATE TABLE IF NOT EXISTS stage5.build_state (
  singleton_id smallint PRIMARY KEY DEFAULT 1 CHECK (singleton_id=1),
  structure_version text NOT NULL,
  stage_label text NOT NULL,
  status text NOT NULL,
  linked_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO stage5.build_state(singleton_id,structure_version,stage_label,status)
VALUES(1,'stage5-presence-privacy-2026-08-18','Stage 5','LINKED_GATED')
ON CONFLICT(singleton_id) DO UPDATE SET structure_version=EXCLUDED.structure_version,stage_label=EXCLUDED.stage_label,status=EXCLUDED.status,linked_at=now();

CREATE TABLE IF NOT EXISTS stage5.policy_state (
  singleton_id smallint PRIMARY KEY DEFAULT 1 CHECK (singleton_id=1),
  policy_version text NOT NULL,
  public_attendance_enabled boolean NOT NULL DEFAULT false,
  occupancy_policy_status text NOT NULL DEFAULT 'PENDING' CHECK (occupancy_policy_status IN ('PENDING','APPROVED','DISABLED','SUPERSEDED')),
  stale_visit_expiry_policy_status text NOT NULL DEFAULT 'PENDING' CHECK (stale_visit_expiry_policy_status IN ('PENDING','APPROVED','DISABLED','SUPERSEDED')),
  boundary_policy_status text NOT NULL DEFAULT 'SOURCE_REQUIRED' CHECK (boundary_policy_status IN ('SOURCE_REQUIRED','READY','DISABLED','SUPERSEDED')),
  night_privacy_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO stage5.policy_state(singleton_id,policy_version,public_attendance_enabled,occupancy_policy_status,stale_visit_expiry_policy_status,boundary_policy_status,night_privacy_enabled)
VALUES(1,'stage5-presence-privacy-2026-08-18',false,'PENDING','PENDING','SOURCE_REQUIRED',true)
ON CONFLICT(singleton_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS stage5.visits (
  visit_id text PRIMARY KEY,
  session_id text NOT NULL REFERENCES stage3.device_sessions(session_id) ON DELETE CASCADE,
  dog_id text NOT NULL REFERENCES stage3.dog_profiles(dog_id),
  park_id text NOT NULL REFERENCES stage3.parks(park_id),
  dog_status text NOT NULL DEFAULT 'UNKNOWN' CHECK (dog_status IN ('UNKNOWN','PLAYFUL','OFF_GAME','NEEDS_SPACE','REACTIVE','ON_LEAD','IN_TRAINING','UNWELL','ANXIOUS')),
  privacy_mode text NOT NULL DEFAULT 'PRIVATE' CHECK (privacy_mode IN ('PRIVATE','INCOGNITO')),
  owner_location_state text NOT NULL DEFAULT 'UNKNOWN' CHECK (owner_location_state IN ('UNKNOWN','INSIDE','AT_GATE','OUTSIDE','LEFT')),
  duty_interval_minutes smallint NOT NULL CHECK (duty_interval_minutes IN (5,10,15,20)),
  duty_confirmed_at timestamptz NOT NULL DEFAULT now(),
  duty_due_at timestamptz NOT NULL,
  checkin_idempotency_key text NOT NULL,
  checkout_idempotency_key text,
  arrival_at timestamptz NOT NULL DEFAULT now(),
  departure_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id,checkin_idempotency_key),
  UNIQUE(session_id,checkout_idempotency_key)
);
CREATE UNIQUE INDEX IF NOT EXISTS stage5_one_active_visit_per_dog_idx ON stage5.visits(dog_id) WHERE departure_at IS NULL;
CREATE INDEX IF NOT EXISTS stage5_visits_private_session_idx ON stage5.visits(session_id,departure_at,arrival_at DESC);
CREATE INDEX IF NOT EXISTS stage5_visits_park_private_idx ON stage5.visits(park_id,departure_at,arrival_at DESC);

CREATE OR REPLACE FUNCTION stage5.protect_closed_visit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.departure_at IS NOT NULL THEN
    RAISE EXCEPTION 'closed Stage 5 visit history is immutable';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS stage5_closed_visit_immutable ON stage5.visits;
CREATE TRIGGER stage5_closed_visit_immutable BEFORE UPDATE ON stage5.visits FOR EACH ROW WHEN (OLD.departure_at IS NOT NULL) EXECUTE FUNCTION stage5.protect_closed_visit();

CREATE TABLE IF NOT EXISTS stage5.visit_events (
  event_id bigserial PRIMARY KEY,
  visit_id text NOT NULL REFERENCES stage5.visits(visit_id) ON DELETE CASCADE,
  session_id text NOT NULL REFERENCES stage3.device_sessions(session_id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('CHECK_IN','CHECK_OUT','SUPERVISION_RENEWED','OWNER_LOCATION_CHANGED','BOUNDARY_DECISION')),
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stage5_visit_events_private_idx ON stage5.visit_events(session_id,visit_id,occurred_at DESC);

CREATE TABLE IF NOT EXISTS stage5.boundary_decisions (
  decision_id text PRIMARY KEY,
  visit_id text REFERENCES stage5.visits(visit_id) ON DELETE SET NULL,
  session_id text NOT NULL REFERENCES stage3.device_sessions(session_id) ON DELETE CASCADE,
  dog_id text NOT NULL REFERENCES stage3.dog_profiles(dog_id),
  park_id text NOT NULL REFERENCES stage3.parks(park_id),
  decision text NOT NULL CHECK (decision IN ('IN_BOUNDARY','OUTSIDE','UNKNOWN')),
  reason text NOT NULL,
  accuracy_state text,
  precise_location_stored boolean NOT NULL DEFAULT false CHECK (precise_location_stored=false),
  decided_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stage5_boundary_private_idx ON stage5.boundary_decisions(session_id,decided_at DESC);

COMMIT;
