create table public.collection_sync_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

alter table public.collection_sync_state enable row level security;

create policy "users read their sync state" on public.collection_sync_state
  for select to authenticated using ((select auth.uid()) = user_id);

insert into public.collection_sync_state (user_id, revision, updated_at)
select user_id, 1, max(updated_at)
from public.collection_entries
group by user_id
on conflict (user_id) do nothing;

revoke all on table public.collection_sync_state from public;
revoke all on table public.collection_sync_state from anon;
revoke all on table public.collection_sync_state from authenticated;

create or replace function public.get_collection_sync_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_revision bigint;
  current_entries jsonb;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select revision
  into current_revision
  from public.collection_sync_state
  where user_id = current_user_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'species_id', species_id,
    'form_id', form_id,
    'game_id', game_id,
    'origin_game_id', origin_game_id,
    'shiny', shiny,
    'alpha', alpha,
    'own_ot', own_ot,
    'quantity', quantity
  ) order by species_id, form_id, game_id, origin_game_id, shiny, alpha, own_ot), '[]'::jsonb)
  into current_entries
  from public.collection_entries
  where user_id = current_user_id;

  return jsonb_build_object(
    'revision', coalesce(current_revision, 0),
    'entries', current_entries
  );
end;
$$;

revoke all on function public.get_collection_sync_snapshot() from public;
grant execute on function public.get_collection_sync_snapshot() to authenticated;

create or replace function public.replace_cloud_collection(p_entries jsonb, p_expected_revision bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_revision bigint;
  next_revision bigint;
  entry_count integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'Expected revision must be a non-negative integer';
  end if;

  if p_entries is null or jsonb_typeof(p_entries) <> 'array' then
    raise exception 'Collection payload must be an array';
  end if;

  entry_count := jsonb_array_length(p_entries);
  if entry_count > 10000 then
    raise exception 'Collection payload exceeds 10000 entries';
  end if;

  insert into public.collection_sync_state (user_id)
  values (current_user_id)
  on conflict (user_id) do nothing;

  select revision
  into current_revision
  from public.collection_sync_state
  where user_id = current_user_id
  for update;

  if current_revision <> p_expected_revision then
    raise exception 'Cloud collection changed since revision %', p_expected_revision
      using errcode = '40001';
  end if;

  delete from public.collection_entries
  where user_id = current_user_id;

  insert into public.collection_entries (
    user_id,
    species_id,
    form_id,
    game_id,
    origin_game_id,
    shiny,
    alpha,
    own_ot,
    quantity
  )
  select
    current_user_id,
    item.species_id,
    item.form_id,
    item.game_id,
    item.origin_game_id,
    item.shiny,
    item.alpha,
    item.own_ot,
    item.quantity
  from jsonb_to_recordset(p_entries) as item(
    species_id text,
    form_id text,
    game_id text,
    origin_game_id text,
    shiny boolean,
    alpha boolean,
    own_ot boolean,
    quantity integer
  );

  update public.collection_sync_state
  set revision = revision + 1, updated_at = now()
  where user_id = current_user_id
  returning revision into next_revision;

  return next_revision;
end;
$$;

revoke all on function public.replace_cloud_collection(jsonb, bigint) from public;
grant execute on function public.replace_cloud_collection(jsonb, bigint) to authenticated;

-- Keep the one-time import compatible with revision-aware clients during rolling releases.
create or replace function public.import_local_collection(p_entries jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  entry_count integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_entries is null or jsonb_typeof(p_entries) <> 'array' then
    raise exception 'Collection payload must be an array';
  end if;

  entry_count := jsonb_array_length(p_entries);
  if entry_count > 10000 then
    raise exception 'Collection payload exceeds 10000 entries';
  end if;

  if exists (select 1 from public.collection_entries where user_id = current_user_id) then
    raise exception 'Cloud collection is not empty';
  end if;

  insert into public.collection_entries (
    user_id, species_id, form_id, game_id, origin_game_id, shiny, alpha, own_ot, quantity
  )
  select
    current_user_id, item.species_id, item.form_id, item.game_id, item.origin_game_id,
    item.shiny, item.alpha, item.own_ot, item.quantity
  from jsonb_to_recordset(p_entries) as item(
    species_id text,
    form_id text,
    game_id text,
    origin_game_id text,
    shiny boolean,
    alpha boolean,
    own_ot boolean,
    quantity integer
  );

  insert into public.collection_migrations (user_id, local_entry_count)
  values (current_user_id, entry_count)
  on conflict (user_id) do update
  set imported_at = now(), local_entry_count = excluded.local_entry_count;

  insert into public.collection_sync_state (user_id, revision, updated_at)
  values (current_user_id, 1, now())
  on conflict (user_id) do update
  set revision = public.collection_sync_state.revision + 1, updated_at = now();
end;
$$;

revoke all on function public.import_local_collection(jsonb) from public;
grant execute on function public.import_local_collection(jsonb) to authenticated;
