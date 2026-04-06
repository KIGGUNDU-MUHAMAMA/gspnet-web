-- Enable RLS on Supabase linter-flagged public tables.
-- Compatibility-first: keeps existing app behavior while satisfying linter.
-- No frontend file changes required.

-- 1) Reference/public lookup tables: read-only for anon/authenticated.
-- spatial_ref_sys may be owned by PostGIS extension role in some projects;
-- handle insufficient privilege safely without aborting migration.
do $$
begin
  if to_regclass('public.spatial_ref_sys') is not null then
    begin
      execute 'alter table public.spatial_ref_sys enable row level security';
      execute 'drop policy if exists spatial_ref_sys_public_read on public.spatial_ref_sys';
      execute 'create policy spatial_ref_sys_public_read on public.spatial_ref_sys for select to anon, authenticated using (true)';
    exception
      when insufficient_privilege then
        raise notice 'Skipping RLS changes for public.spatial_ref_sys (not table owner).';
    end;
  end if;
end $$;

alter table if exists public.uganda_villages enable row level security;
drop policy if exists "uganda_villages_public_read" on public.uganda_villages;
create policy "uganda_villages_public_read"
  on public.uganda_villages
  for select
  to anon, authenticated
  using (true);

-- 2) Corroboration workflow tables used by authenticated app users.
-- Keep authenticated CRUD to avoid breaking current web flows.
do $$
declare
  t text;
  tables text[] := array[
    'corroboration_cases',
    'corroboration_case_members',
    'corroboration_messages',
    'corroboration_files',
    'corroboration_admin_actions',
    'corroboration_recommendations'
  ];
begin
  foreach t in array tables loop
    execute format('alter table if exists public.%I enable row level security', t);

    execute format('drop policy if exists %L on public.%I', t || '_authenticated_select', t);
    execute format('create policy %I on public.%I for select to authenticated using (true)',
      t || '_authenticated_select', t);

    execute format('drop policy if exists %L on public.%I', t || '_authenticated_insert', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (true)',
      t || '_authenticated_insert', t);

    execute format('drop policy if exists %L on public.%I', t || '_authenticated_update', t);
    execute format('create policy %I on public.%I for update to authenticated using (true) with check (true)',
      t || '_authenticated_update', t);

    execute format('drop policy if exists %L on public.%I', t || '_authenticated_delete', t);
    execute format('create policy %I on public.%I for delete to authenticated using (true)',
      t || '_authenticated_delete', t);
  end loop;
end $$;

-- 3) Generic user-owned tables.
-- If a table has user_id column, enforce ownership.
-- Otherwise fallback to authenticated-only CRUD to preserve runtime compatibility.
do $$
declare
  t text;
  has_user_id boolean;
  tables text[] := array[
    'pinned_messages',
    'user_chat_preferences',
    'profile_creation_log'
  ];
begin
  foreach t in array tables loop
    execute format('alter table if exists public.%I enable row level security', t);

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = t
        and column_name = 'user_id'
    ) into has_user_id;

    if has_user_id then
      execute format('drop policy if exists %L on public.%I', t || '_owner_select', t);
      execute format(
        'create policy %I on public.%I for select to authenticated using (auth.uid()::text = user_id::text)',
        t || '_owner_select', t
      );

      execute format('drop policy if exists %L on public.%I', t || '_owner_insert', t);
      execute format(
        'create policy %I on public.%I for insert to authenticated with check (auth.uid()::text = user_id::text)',
        t || '_owner_insert', t
      );

      execute format('drop policy if exists %L on public.%I', t || '_owner_update', t);
      execute format(
        'create policy %I on public.%I for update to authenticated using (auth.uid()::text = user_id::text) with check (auth.uid()::text = user_id::text)',
        t || '_owner_update', t
      );

      execute format('drop policy if exists %L on public.%I', t || '_owner_delete', t);
      execute format(
        'create policy %I on public.%I for delete to authenticated using (auth.uid()::text = user_id::text)',
        t || '_owner_delete', t
      );
    else
      execute format('drop policy if exists %L on public.%I', t || '_authenticated_select', t);
      execute format('create policy %I on public.%I for select to authenticated using (true)',
        t || '_authenticated_select', t);

      execute format('drop policy if exists %L on public.%I', t || '_authenticated_insert', t);
      execute format('create policy %I on public.%I for insert to authenticated with check (true)',
        t || '_authenticated_insert', t);

      execute format('drop policy if exists %L on public.%I', t || '_authenticated_update', t);
      execute format('create policy %I on public.%I for update to authenticated using (true) with check (true)',
        t || '_authenticated_update', t);

      execute format('drop policy if exists %L on public.%I', t || '_authenticated_delete', t);
      execute format('create policy %I on public.%I for delete to authenticated using (true)',
        t || '_authenticated_delete', t);
    end if;
  end loop;
end $$;
