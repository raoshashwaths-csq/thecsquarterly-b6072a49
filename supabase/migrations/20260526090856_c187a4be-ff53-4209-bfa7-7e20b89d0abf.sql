create table public.q_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id text not null,
  context jsonb not null default '{}'::jsonb,
  zones jsonb not null,
  witty boolean not null default false,
  created_at timestamptz not null default now()
);

create index q_runs_user_created_idx on public.q_runs (user_id, created_at desc);

alter table public.q_runs enable row level security;

create policy "q_runs select own"
  on public.q_runs for select
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::app_role));

create policy "q_runs insert own"
  on public.q_runs for insert
  with check (auth.uid() = user_id);