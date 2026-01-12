-- Mijnbeautyafspraken - Supabase schema
-- Run this in Supabase SQL Editor (new query) and execute.

-- 1) Extensions
create extension if not exists pgcrypto;

-- 2) Users (app profile)
create table if not exists public.users (
  id uuid primary key,                -- matches auth.users.id
  email text,
  name text,
  role text not null default 'customer' check (role in ('customer','salon_owner','admin')),
  created_at timestamptz not null default now()
);

-- 3) Salons
create table if not exists public.salons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  phone text,
  city text,
  address text,
  latitude double precision,
  longitude double precision,
  status text not null default 'pending' check (status in ('pending','active','disabled')),
  created_at timestamptz not null default now()
);

create index if not exists salons_owner_id_idx on public.salons(owner_id);
create index if not exists salons_status_idx on public.salons(status);

-- 4) Staff members
create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists staff_salon_id_idx on public.staff_members(salon_id);

-- 5) Services
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null,
  duration_minutes int not null check (duration_minutes >= 5),
  buffer_minutes int not null default 0 check (buffer_minutes >= 0),
  price_cents int not null default 0 check (price_cents >= 0),
  cancel_until_hours int not null default 24 check (cancel_until_hours >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists services_salon_id_idx on public.services(salon_id);

-- 6) Which staff can perform which service
create table if not exists public.service_staff (
  service_id uuid not null references public.services(id) on delete cascade,
  staff_id uuid not null references public.staff_members(id) on delete cascade,
  primary key (service_id, staff_id)
);

-- 7) Opening hours (per staff per weekday)
-- weekday: 0=Sun ... 6=Sat
create table if not exists public.opening_hours (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_members(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  unique (staff_id, weekday)
);

-- 8) Blocks / time off
create table if not exists public.blocked_times (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_members(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists blocks_staff_idx on public.blocked_times(staff_id);
create index if not exists blocks_range_idx on public.blocked_times(start_at, end_at);

-- 9) Bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  salon_id uuid not null references public.salons(id) on delete cascade,
  staff_id uuid not null references public.staff_members(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  price_cents int not null default 0,
  status text not null default 'booked' check (status in ('booked','cancelled','completed')),
  created_at timestamptz not null default now()
);

create index if not exists bookings_salon_idx on public.bookings(salon_id);
create index if not exists bookings_staff_idx on public.bookings(staff_id);
create index if not exists bookings_user_idx on public.bookings(user_id);
create index if not exists bookings_range_idx on public.bookings(start_at, end_at);

-- Optional: prevent double-booking per staff (basic overlap prevention isn't trivial with plain constraints).
-- The app checks overlap in availability, but for strict DB-level protection you'd use an exclusion constraint with tstzrange.

-- 10) Deals (last-minute discounted slots)
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  staff_id uuid not null references public.staff_members(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  discounted_price_cents int not null default 0,
  expires_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists deals_salon_idx on public.deals(salon_id);
create index if not exists deals_active_idx on public.deals(is_active, expires_at);

-- 11) Minimal RLS (optional for now)
-- NOTE: This project currently uses SUPABASE_SERVICE_ROLE_KEY in server routes (bypasses RLS).
-- For production, move toward RLS + per-user policies and remove service role from the app.

alter table public.users enable row level security;
alter table public.salons enable row level security;
alter table public.staff_members enable row level security;
alter table public.services enable row level security;
alter table public.service_staff enable row level security;
alter table public.opening_hours enable row level security;
alter table public.blocked_times enable row level security;
alter table public.bookings enable row level security;
alter table public.deals enable row level security;

-- Customers can read active salons/services/deals
drop policy if exists "read active salons" on public.salons;
create policy "read active salons" on public.salons
for select using (status = 'active');

drop policy if exists "read active services" on public.services;
create policy "read active services" on public.services
for select using (is_active = true);

drop policy if exists "read active staff" on public.staff_members;
create policy "read active staff" on public.staff_members
for select using (is_active = true);

drop policy if exists "read active deals" on public.deals;
create policy "read active deals" on public.deals
for select using (is_active = true and expires_at > now());

-- Users can read their own bookings
drop policy if exists "read own bookings" on public.bookings;
create policy "read own bookings" on public.bookings
for select using (auth.uid() = user_id);

-- (Writes are done via server routes with service role in this starter.)
