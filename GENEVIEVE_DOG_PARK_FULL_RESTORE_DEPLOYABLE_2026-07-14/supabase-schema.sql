-- GENEVIEVE App™ Dog Park — production backend starting schema
-- Review with a qualified backend/security professional before using real personal or animal-health information.
-- This script assumes Supabase Auth and PostgreSQL. Never place a service-role key in the public app.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'owner' check (role in ('owner','visitor','superintendent','responder','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dogs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dob date,
  breed text,
  life_stage text,
  public_note text,
  public_profile jsonb not null default '{}'::jsonb,
  behavioural_profile jsonb not null default '{}'::jsonb,
  restricted_emergency jsonb not null default '{}'::jsonb,
  visibility jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  jurisdiction text,
  location geography(point,4326),
  official_source_url text,
  verified_at timestamptz,
  capacity integer,
  facilities jsonb not null default '{}'::jsonb,
  rules jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  park_id uuid not null references public.parks(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text,
  needs_space boolean not null default false,
  on_lead boolean not null default false,
  in_training boolean not null default false,
  incognito boolean not null default false,
  lead_agreement boolean not null default false,
  gate_agreement boolean not null default false,
  supervision_agreement boolean not null default false,
  checked_in_at timestamptz not null default now(),
  last_supervision_at timestamptz not null default now(),
  checked_out_at timestamptz
);

create table if not exists public.affinities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  from_dog_id uuid not null references public.dogs(id) on delete cascade,
  to_dog_id uuid not null references public.dogs(id) on delete cascade,
  mode text not null check (mode in ('mutual','one_way')),
  status text not null default 'pending' check (status in ('pending','active','removed')),
  preferred_park_ids uuid[] not null default '{}',
  notifications_enabled boolean not null default true,
  consented_at timestamptz,
  removed_at timestamptz,
  private_removal_feedback jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_type text not null check (assessment_type in ('interaction','heat','puppy','departure','etiquette')),
  dog_ids uuid[] not null default '{}',
  park_id uuid references public.parks(id) on delete set null,
  risk_score numeric(5,2) not null check (risk_score between 0 and 100),
  risk_level text not null check (risk_level in ('green','yellow','amber','red')),
  input_snapshot jsonb not null default '{}'::jsonb,
  output_snapshot jsonb not null default '{}'::jsonb,
  model_version text,
  created_at timestamptz not null default now()
);

create table if not exists public.outcomes (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  observed_outcome text not null,
  private_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.hazards (
  id uuid primary key default gen_random_uuid(),
  park_id uuid not null references public.parks(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  hazard_type text not null,
  details text,
  risk_score numeric(5,2) not null check (risk_score between 0 and 100),
  status text not null default 'open' check (status in ('open','verified','resolved','expired','rejected')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  park_id uuid references public.parks(id) on delete set null,
  reporter_id uuid references auth.users(id) on delete set null,
  incident_type text not null,
  severity_score numeric(5,2) not null check (severity_score between 0 and 100),
  details text,
  witness_notes text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.maintenance (
  id uuid primary key default gen_random_uuid(),
  park_id uuid not null references public.parks(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  facility text not null,
  task text not null,
  priority text not null check (priority in ('yellow','amber','red')),
  status text not null default 'open',
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  park_id uuid not null references public.parks(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  details text not null,
  verified boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id text,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.dogs enable row level security;
alter table public.checkins enable row level security;
alter table public.affinities enable row level security;
alter table public.assessments enable row level security;
alter table public.outcomes enable row level security;
alter table public.hazards enable row level security;
alter table public.incidents enable row level security;
alter table public.maintenance enable row level security;
alter table public.notices enable row level security;
alter table public.audit_events enable row level security;

-- Minimum owner policies. Add carefully reviewed public/operator/responder policies before production.
create policy if not exists profiles_self on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists dogs_owner on public.dogs for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy if not exists checkins_owner on public.checkins for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy if not exists affinities_owner on public.affinities for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy if not exists assessments_owner on public.assessments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists outcomes_owner on public.outcomes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Public read access to parks should be added only after official data ingestion and moderation are designed.
-- Operator/responder roles require server-side custom claims and audited policies; do not trust a role selected in the browser.
