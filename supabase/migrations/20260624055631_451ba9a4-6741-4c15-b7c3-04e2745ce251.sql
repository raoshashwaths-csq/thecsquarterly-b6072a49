create table public.lumi_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event text not null,
  tree_id text,
  briefing_shown boolean not null default false,
  message_count integer not null default 0,
  meta jsonb,
  created_at timestamptz not null default now()
);
grant select, insert on public.lumi_events to authenticated;
grant all on public.lumi_events to service_role;
alter table public.lumi_events enable row level security;
create policy "users insert own lumi events" on public.lumi_events for insert to authenticated with check (user_id = auth.uid() or user_id is null);
create policy "users read own lumi events" on public.lumi_events for select to authenticated using (user_id = auth.uid());
create policy "admins read all lumi events" on public.lumi_events for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create index lumi_events_created_idx on public.lumi_events (created_at desc);
create index lumi_events_event_idx on public.lumi_events (event);
create index lumi_events_tree_idx on public.lumi_events (tree_id);