-- Run this in Supabase: SQL Editor → New query → Run
-- Enables per-user cloud storage for saved simulations (used with Row Level Security).

create table if not exists public.saved_calculations (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  saved_at timestamptz not null,
  inputs jsonb not null,
  results jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists saved_calculations_user_saved_at_idx
  on public.saved_calculations (user_id, saved_at desc);

alter table public.saved_calculations enable row level security;

create policy "saved_select_own"
  on public.saved_calculations for select
  using (auth.uid() = user_id);

create policy "saved_insert_own"
  on public.saved_calculations for insert
  with check (auth.uid() = user_id);

create policy "saved_update_own"
  on public.saved_calculations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "saved_delete_own"
  on public.saved_calculations for delete
  using (auth.uid() = user_id);
