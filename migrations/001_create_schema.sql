-- Migration: create profiles and records tables with RLS and policies
-- Run this in Supabase SQL editor

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  locale text,
  created_at timestamptz default now()
);

create table if not exists public.records (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date,
  title text,
  category text,
  description text,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at on public.records;
create trigger trg_set_updated_at
  before update on public.records
  for each row execute function public.set_updated_at();

create index if not exists idx_records_user_id on public.records (user_id);
create index if not exists idx_records_date on public.records (date);

alter table public.profiles enable row level security;
alter table public.records enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
  for delete using (auth.uid() = user_id);

drop policy if exists records_select_own on public.records;
create policy records_select_own on public.records
  for select using (user_id = auth.uid());

drop policy if exists records_insert_own on public.records;
create policy records_insert_own on public.records
  for insert with check (user_id = auth.uid());

drop policy if exists records_update_own on public.records;
create policy records_update_own on public.records
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists records_delete_own on public.records;
create policy records_delete_own on public.records
  for delete using (user_id = auth.uid());
