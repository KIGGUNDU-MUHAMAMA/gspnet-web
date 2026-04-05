-- Corroboration workflow schema for survey parcel quality flags.
-- Supports RSU review, evidence uploads, structured case discussion,
-- and admin resolution actions.

alter table public.user_profiles
  add column if not exists email text,
  add column if not exists role text,
  add column if not exists full_name text;

create table if not exists public.corroboration_cases (
  id uuid primary key default gen_random_uuid(),
  flag_id uuid not null references public.parcel_flags (id) on delete cascade,
  polygon_feature_id uuid references public.polygon_features (id) on delete set null,
  parcel_unique_id text not null,
  layer_name text,
  surveyor_a_user_id uuid,
  surveyor_b_user_id uuid,
  rsu_a_user_id uuid,
  rsu_b_user_id uuid,
  admin_user_email text not null default 'kiggundumuhamad@gmail.com',
  status text not null default 'case_opened',
  title text,
  resolution_summary text,
  recommended_flag_type text,
  recommended_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create unique index if not exists corroboration_cases_flag_id_uidx
  on public.corroboration_cases (flag_id);

create index if not exists corroboration_cases_parcel_uidx
  on public.corroboration_cases (parcel_unique_id);

create table if not exists public.corroboration_case_members (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.corroboration_cases (id) on delete cascade,
  user_id uuid,
  email text,
  display_name text,
  role_in_case text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists corroboration_case_members_unique_user_idx
  on public.corroboration_case_members (case_id, user_id, role_in_case);

create table if not exists public.corroboration_messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.corroboration_cases (id) on delete cascade,
  sender_id uuid,
  sender_email text,
  sender_name text,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists corroboration_messages_case_created_idx
  on public.corroboration_messages (case_id, created_at);

create table if not exists public.corroboration_files (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.corroboration_cases (id) on delete cascade,
  flag_id uuid references public.parcel_flags (id) on delete set null,
  parcel_unique_id text not null,
  evidence_type text not null,
  file_name text not null,
  original_file_name text,
  file_url text not null,
  description text,
  uploaded_by uuid,
  uploader_email text,
  uploader_name text,
  created_at timestamptz not null default now()
);

create index if not exists corroboration_files_case_idx
  on public.corroboration_files (case_id, created_at desc);

create table if not exists public.corroboration_recommendations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.corroboration_cases (id) on delete cascade,
  submitted_by uuid,
  submitter_email text,
  submitter_name text,
  recommended_flag_type text,
  recommended_action text,
  severity text,
  issue_confirmed text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists corroboration_recommendations_case_idx
  on public.corroboration_recommendations (case_id, created_at desc);

create table if not exists public.corroboration_admin_actions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.corroboration_cases (id) on delete cascade,
  admin_email text not null,
  action_type text not null,
  old_flag_type text,
  new_flag_type text,
  parcel_action text,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists corroboration_admin_actions_case_idx
  on public.corroboration_admin_actions (case_id, created_at desc);
