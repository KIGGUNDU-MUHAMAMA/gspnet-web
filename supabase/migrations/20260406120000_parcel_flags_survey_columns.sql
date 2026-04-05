-- Links quality flags to polygon_features survey parcels (optional but recommended).
-- Run in Supabase SQL editor or via CLI migrate.

alter table public.parcel_flags
  add column if not exists survey_unique_id text;

alter table public.parcel_flags
  add column if not exists survey_layer_name text;

alter table public.parcel_flags
  add column if not exists polygon_feature_id uuid references public.polygon_features (id) on delete set null;

create index if not exists parcel_flags_survey_unique_id_idx
  on public.parcel_flags (survey_unique_id)
  where survey_unique_id is not null;

create index if not exists parcel_flags_polygon_feature_id_idx
  on public.parcel_flags (polygon_feature_id)
  where polygon_feature_id is not null;

comment on column public.parcel_flags.survey_unique_id is 'Survey parcel unique_id from polygon_features (e.g. TT36N-001)';
comment on column public.parcel_flags.survey_layer_name is 'Survey polygon layer name (TITLE TRACTS / UNTITLED / BLB-UNTITLED)';
comment on column public.parcel_flags.polygon_feature_id is 'FK to polygon_features for zoom and integrity';
