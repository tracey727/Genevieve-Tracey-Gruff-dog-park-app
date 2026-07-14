-- GENEVIEVE App™ Dog Park — Supabase starter schema
-- Review and test before production. Use a separate staging project first.
create extension if not exists pgcrypto;

create table if not exists public.dog_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  profile jsonb not null default '{}'::jsonb,
  is_discoverable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  dog_id uuid not null references public.dog_profiles(id) on delete cascade,
  park_id text not null,
  incognito boolean not null default false,
  needs_space boolean not null default false,
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz
);
create table if not exists public.affinities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  from_dog_id uuid not null references public.dog_profiles(id) on delete cascade,
  to_dog_id uuid not null references public.dog_profiles(id) on delete cascade,
  mode text not null check (mode in ('mutual','one_way')),
  status text not null default 'pending',
  preferred_park_ids text[] not null default '{}',
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.compatibility_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  dog_a_id uuid references public.dog_profiles(id) on delete set null,
  dog_b_id uuid references public.dog_profiles(id) on delete set null,
  park_id text,
  input_snapshot jsonb not null,
  output_snapshot jsonb not null,
  model_version text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.interaction_outcomes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  compatibility_event_id uuid references public.compatibility_events(id) on delete set null,
  outcome text not null,
  private_note text,
  created_at timestamptz not null default now()
);
create table if not exists public.subscription_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  channel text not null check (channel in ('apple','google','stripe')),
  product_id text not null,
  status text not null,
  current_period_end timestamptz,
  provider_reference text,
  updated_at timestamptz not null default now()
);
create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now(),
  status text not null default 'received'
);

alter table public.dog_profiles enable row level security;
alter table public.checkins enable row level security;
alter table public.affinities enable row level security;
alter table public.compatibility_events enable row level security;
alter table public.interaction_outcomes enable row level security;
alter table public.subscription_entitlements enable row level security;
alter table public.deletion_requests enable row level security;

create policy "owners manage dog profiles" on public.dog_profiles for all using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
create policy "owners manage checkins" on public.checkins for all using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
create policy "owners manage affinities" on public.affinities for all using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
create policy "owners manage compatibility" on public.compatibility_events for all using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
create policy "owners manage outcomes" on public.interaction_outcomes for all using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
create policy "owners read entitlements" on public.subscription_entitlements for select using (auth.uid()=user_id);
create policy "owners request deletion" on public.deletion_requests for insert with check (auth.uid()=user_id);
-- Entitlements must be written by a secure server/service role after provider verification, never by browser clients.
