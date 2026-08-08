create table if not exists public.program_settings (
  id bigint primary key,
  target_amount numeric not null default 200,
  reached_amount numeric not null default 146,
  progress_percent numeric not null default 73,
  start_date date not null default '2026-05-12',
  completion_date date not null default '2026-10-21',
  withdrawal_enabled boolean not null default false
);

insert into public.program_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.program_settings enable row level security;

create policy "Authenticated users can read program settings"
on public.program_settings for select
to authenticated using (true);

create policy "Admins can update program settings"
on public.program_settings for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
