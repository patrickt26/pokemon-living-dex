-- Defense in depth for the public API. RLS remains the primary authorization layer.
revoke all on table public.collection_entries from public;
revoke all on table public.collection_entries from anon;
revoke all on table public.collection_migrations from public;
revoke all on table public.collection_migrations from anon;

alter table public.collection_entries
  add constraint collection_entries_species_id_length check (char_length(species_id) between 1 and 64),
  add constraint collection_entries_form_id_length check (char_length(form_id) between 1 and 96),
  add constraint collection_entries_game_id_length check (char_length(game_id) between 1 and 64),
  add constraint collection_entries_origin_game_id_length check (char_length(origin_game_id) between 1 and 64),
  add constraint collection_entries_quantity_limit check (quantity <= 999999),
  add constraint collection_entries_version_positive check (version > 0);

alter table public.collection_migrations
  add constraint collection_migrations_entry_count_limit check (local_entry_count <= 10000);

create or replace function public.import_local_collection(p_entries jsonb)
returns void
language plpgsql
security invoker
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

  insert into public.collection_migrations (user_id, local_entry_count)
  values (current_user_id, entry_count)
  on conflict (user_id) do update
  set imported_at = now(), local_entry_count = excluded.local_entry_count;
end;
$$;

revoke all on function public.import_local_collection(jsonb) from public;
grant execute on function public.import_local_collection(jsonb) to authenticated;
