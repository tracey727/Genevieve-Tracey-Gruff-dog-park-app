-- GENEVIEVE App™ Dog Park — Stage 3 source-of-truth foundation
-- Chronological successor to V001_stage1_foundation.sql.
-- Deliberately excludes check-in, GPS boundary, live occupancy, risk scoring,
-- hazard workflows, payments and production-release logic.
CREATE SCHEMA IF NOT EXISTS stage3;
CREATE TABLE IF NOT EXISTS stage3.build_state (
  singleton_id smallint PRIMARY KEY CHECK (singleton_id = 1),
  stage_label text NOT NULL,
  structure_version text NOT NULL,
  status text NOT NULL CHECK (status IN ('ready', 'maintenance')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO stage3.build_state (singleton_id, stage_label, structure_version, status)
VALUES (1, 'Stage 3', 'source-of-truth-2026-08-18', 'ready')
ON CONFLICT (singleton_id) DO UPDATE SET stage_label=EXCLUDED.stage_label, structure_version=EXCLUDED.structure_version, status=EXCLUDED.status, updated_at=now();
CREATE TABLE IF NOT EXISTS stage3.device_sessions (
  session_id text PRIMARY KEY, token_hash char(64) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(), last_seen_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz
);
CREATE TABLE IF NOT EXISTS stage3.owner_profiles (
  session_id text PRIMARY KEY REFERENCES stage3.device_sessions(session_id) ON DELETE CASCADE,
  public_name text, email text, phone text, emergency_contact_name text, emergency_contact_phone text,
  accessibility_notes text, private_medical_notes text,
  visibility_mode text NOT NULL DEFAULT 'GHOST' CHECK (visibility_mode IN ('GHOST','PACK_ONLY','PUBLIC_FUZZY')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS stage3.dog_profiles (
  dog_id text PRIMARY KEY, session_id text NOT NULL REFERENCES stage3.device_sessions(session_id) ON DELETE CASCADE,
  name text NOT NULL, breed_mix text, birth_date date, age_years numeric(4,1),
  size_group text CHECK (size_group IS NULL OR size_group IN ('SMALL','MEDIUM','LARGE','GIANT')),
  weight_kg numeric(6,2), sex text CHECK (sex IS NULL OR sex IN ('FEMALE','MALE','UNKNOWN')),
  desexed_status text CHECK (desexed_status IS NULL OR desexed_status IN ('YES','NO','UNKNOWN')),
  energy_level text, play_style text, social_comfort text, approach_preferences text,
  likes text, dislikes text, known_triggers text, sociability_notes text, reactivity_notes text,
  tolerance_notes text, play_intensity text, resource_sharing_notes text, guarding_notes text,
  extra_care_needs text, swimming_ability text, mobility_limitations text, favourite_toys text,
  exercise_level text, confidence_level text,
  visibility_mode text NOT NULL DEFAULT 'GHOST' CHECK (visibility_mode IN ('GHOST','PACK_ONLY','PUBLIC_FUZZY')),
  archived_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dog_profiles_session_idx ON stage3.dog_profiles(session_id, archived_at, name);
CREATE TABLE IF NOT EXISTS stage3.dog_private_details (
  dog_id text PRIMARY KEY REFERENCES stage3.dog_profiles(dog_id) ON DELETE CASCADE,
  microchip_number text, council_registration text, vaccination_notes text, vaccination_due_date date,
  other_document_notes text, other_document_due_date date, medical_conditions text, allergies text,
  medications text, veterinarian_name text, veterinarian_phone text, emergency_notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS stage3.park_sources (
  source_id text PRIMARY KEY, authority_name text NOT NULL, dataset_name text,
  source_type text NOT NULL DEFAULT 'OFFICIAL' CHECK (source_type IN ('OFFICIAL','DEMO','OTHER')),
  jurisdiction text, source_url text, attribution text, licence_note text,
  last_verified_at timestamptz, fetched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS stage3.parks (
  park_id text PRIMARY KEY, source_id text REFERENCES stage3.park_sources(source_id), source_record_id text,
  name text NOT NULL, locality text, state_code text, postcode text,
  latitude numeric(9,6), longitude numeric(9,6), iana_timezone text, park_type text, area_m2 numeric(12,2),
  fenced boolean, double_gate boolean, separate_small_dog_area boolean, separate_large_dog_area boolean,
  beach_water_access boolean, puppy_area boolean, shade boolean, dog_water_bowls boolean, tap_water boolean,
  toilets boolean, seating boolean, lighting boolean, agility_equipment boolean, training_friendly boolean,
  accessible_features boolean, easy_parking boolean, caravan_parking boolean, cafes_nearby boolean,
  bbq_picnic boolean, bins boolean, waste_bags boolean, official_rules text, official_rules_url text,
  opening_hours jsonb NOT NULL DEFAULT '{}'::jsonb, off_leash_schedule jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_attributes jsonb NOT NULL DEFAULT '{}'::jsonb, source_updated_at timestamptz, fetched_at timestamptz,
  verification_status text NOT NULL DEFAULT 'OFFICIAL_UNVERIFIED'
    CHECK (verification_status IN ('VERIFIED_OFFICIAL','OFFICIAL_UNVERIFIED','DEMO','STALE')),
  retired_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS parks_search_idx ON stage3.parks(state_code, locality, name);
CREATE INDEX IF NOT EXISTS parks_source_idx ON stage3.parks(source_id, verification_status, retired_at);
CREATE TABLE IF NOT EXISTS stage3.park_source_snapshots (
  snapshot_id text PRIMARY KEY, source_id text NOT NULL REFERENCES stage3.park_sources(source_id),
  source_record_id text, payload_sha256 char(64) NOT NULL, observed_at timestamptz NOT NULL,
  payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS park_source_snapshots_lookup_idx ON stage3.park_source_snapshots(source_id, source_record_id, observed_at DESC);
CREATE TABLE IF NOT EXISTS stage3.selected_parks (
  session_id text PRIMARY KEY REFERENCES stage3.device_sessions(session_id) ON DELETE CASCADE,
  park_id text NOT NULL REFERENCES stage3.parks(park_id), selected_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS stage3.audit_events (
  event_id bigserial PRIMARY KEY, session_id text, event_type text NOT NULL, entity_type text, entity_id text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb, occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stage3_audit_events_lookup_idx ON stage3.audit_events(session_id, occurred_at DESC);
