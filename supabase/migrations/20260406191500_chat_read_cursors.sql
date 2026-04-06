-- Server-side read cursors for inbox threads and room feeds.
-- Enables multi-device accurate unread counters.

create table if not exists public.chat_thread_reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  partner_id uuid not null,
  last_read_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists chat_thread_reads_user_partner_uidx
  on public.chat_thread_reads (user_id, partner_id);

create index if not exists chat_thread_reads_user_lastread_idx
  on public.chat_thread_reads (user_id, last_read_at desc);

create table if not exists public.room_read_cursors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  room_id uuid not null references public.chat_rooms (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists room_read_cursors_user_room_uidx
  on public.room_read_cursors (user_id, room_id);

create index if not exists room_read_cursors_user_lastread_idx
  on public.room_read_cursors (user_id, last_read_at desc);

alter table public.chat_thread_reads enable row level security;
alter table public.room_read_cursors enable row level security;

drop policy if exists "chat_thread_reads_select_own" on public.chat_thread_reads;
create policy "chat_thread_reads_select_own"
  on public.chat_thread_reads
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "chat_thread_reads_insert_own" on public.chat_thread_reads;
create policy "chat_thread_reads_insert_own"
  on public.chat_thread_reads
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "chat_thread_reads_update_own" on public.chat_thread_reads;
create policy "chat_thread_reads_update_own"
  on public.chat_thread_reads
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "room_read_cursors_select_own" on public.room_read_cursors;
create policy "room_read_cursors_select_own"
  on public.room_read_cursors
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "room_read_cursors_insert_own" on public.room_read_cursors;
create policy "room_read_cursors_insert_own"
  on public.room_read_cursors
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "room_read_cursors_update_own" on public.room_read_cursors;
create policy "room_read_cursors_update_own"
  on public.room_read_cursors
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
