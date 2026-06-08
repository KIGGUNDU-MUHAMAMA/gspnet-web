-- Add is_contributor to profiles if it doesn't exist
alter table public.profiles add column if not exists is_contributor boolean default false;

-- Create user_contributions table
create table if not exists public.user_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  contribution_type text not null, -- e.g., 'survey_polygon', 'symbol_mapping', 'dxf_dwg_upload', '3d_terrain_upload', 'corroboration_case'
  details jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for quick lookups by user
create index if not exists user_contributions_user_idx on public.user_contributions(user_id);
create index if not exists user_contributions_type_idx on public.user_contributions(contribution_type);

-- Enable RLS
alter table public.user_contributions enable row level security;

-- Policies
drop policy if exists "Users can view their own contributions" on public.user_contributions;
create policy "Users can view their own contributions" 
  on public.user_contributions for select 
  using ( auth.uid() = user_id );

-- Allow users to insert their own contributions
drop policy if exists "Users can insert their own contributions" on public.user_contributions;
create policy "Users can insert their own contributions"
  on public.user_contributions for insert
  with check ( auth.uid() = user_id );

-- 6. Trigger to automatically award the "Verified Contributor" badge when a contribution is added
create or replace function update_is_contributor()
returns trigger as $$
declare
  total_count int;
begin
  select count(id) into total_count from public.user_contributions where user_id = new.user_id;
  
  if total_count >= 5 then
    update public.profiles set is_contributor = true where id = new.user_id;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists update_is_contributor_trigger on public.user_contributions;
create trigger update_is_contributor_trigger
after insert on public.user_contributions
for each row execute function update_is_contributor();

-- 7. Backfill existing contributions from historical tables
insert into public.user_contributions (user_id, contribution_type, created_at)
select 
  created_by as user_id, 
  'survey_polygon' as contribution_type,
  created_at
from public.polygon_features 
where created_by is not null
on conflict do nothing;

insert into public.user_contributions (user_id, contribution_type, created_at)
select user_id, 'symbol_mapping', created_at
from public.map_features
where user_id is not null
on conflict do nothing;

insert into public.user_contributions (user_id, contribution_type, created_at)
select p.id, 'corroboration_case', a.created_at
from public.corroboration_admin_actions a
join public.profiles p on a.admin_email = p.email
on conflict do nothing;

insert into public.user_contributions (user_id, contribution_type, created_at)
select created_by as user_id, 'condominium', created_at
from public.condo_buildings
where created_by is not null
on conflict do nothing;

insert into public.user_contributions (user_id, contribution_type, created_at)
select user_id, 'quality_flag', coalesce(last_viewed_at, now())
from public.user_flag_views
where user_id is not null
on conflict do nothing;

insert into public.user_contributions (user_id, contribution_type, created_at)
select user_id, 'valuation', created_at
from public.property_valuations
where user_id is not null
on conflict do nothing;

insert into public.user_contributions (user_id, contribution_type, created_at)
select created_by as user_id, '3d_terrain_upload', created_at
from public.terrain_projects
where created_by is not null
on conflict do nothing;

insert into public.user_contributions (user_id, contribution_type, created_at)
select uploaded_by as user_id, 'assistant_upload', created_at
from public.project_drawings
where uploaded_by is not null
union
select uploaded_by as user_id, 'assistant_upload', created_at
from public.project_files
where uploaded_by is not null
on conflict do nothing;

-- 8. Apply the new threshold to existing users
update public.profiles
set is_contributor = true
where id in (
  select user_id 
  from public.user_contributions
  group by user_id
  having count(id) >= 5
);

update public.profiles
set is_contributor = false
where id in (
  select user_id 
  from public.user_contributions
  group by user_id
  having count(id) < 5
);

-- Create the profile_contribution_stats view used by the Profile Report
create or replace view public.profile_contribution_stats as
select 
    p.id as user_id,
    p.username,
    p.role,
    p.is_contributor,
    count(c.id) as total_contributions,
    count(c.id) filter (where c.contribution_type = 'survey_polygon') as survey_polygons_count,
    count(c.id) filter (where c.contribution_type = 'symbol_mapping') as symbols_mapped_count,
    count(c.id) filter (where c.contribution_type = 'assistant_upload') as assistant_uploads_count,
    count(c.id) filter (where c.contribution_type = '3d_terrain_upload') as terrain_uploads_count,
    count(c.id) filter (where c.contribution_type = 'corroboration_case') as corroboration_cases_count,
    count(c.id) filter (where c.contribution_type = 'condominium') as condominiums_count,
    count(c.id) filter (where c.contribution_type = 'quality_flag') as quality_flags_count,
    count(c.id) filter (where c.contribution_type = 'valuation') as valuations_count
from 
    public.profiles p
left join 
    public.user_contributions c on p.id = c.user_id
group by 
    p.id, p.username, p.role, p.is_contributor;
