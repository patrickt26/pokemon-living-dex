create table public.collection_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  species_id text not null,
  form_id text not null,
  game_id text not null,
  origin_game_id text not null,
  shiny boolean not null default false,
  alpha boolean not null default false,
  own_ot boolean not null default true,
  quantity integer not null check (quantity > 0),
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, species_id, form_id, game_id, origin_game_id, shiny, alpha, own_ot)
);

alter table public.collection_entries enable row level security;

create policy "users read their collection" on public.collection_entries for select to authenticated using ((select auth.uid()) = user_id);
create policy "users insert their collection" on public.collection_entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users update their collection" on public.collection_entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users delete their collection" on public.collection_entries for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.get_collection_summary()
returns table(entries bigint,species bigint,total_quantity bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*),count(distinct species_id),coalesce(sum(quantity),0)
  from public.collection_entries
  where user_id = auth.uid();
$$;

revoke all on function public.get_collection_summary() from public;
grant execute on function public.get_collection_summary() to authenticated;

create or replace function public.get_collection_snapshot()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'species_id',species_id,'form_id',form_id,'game_id',game_id,'origin_game_id',origin_game_id,
    'shiny',shiny,'alpha',alpha,'own_ot',own_ot,'quantity',quantity
  ) order by created_at),'[]'::jsonb)
  from public.collection_entries
  where user_id = auth.uid();
$$;

revoke all on function public.get_collection_snapshot() from public;
grant execute on function public.get_collection_snapshot() to authenticated;

create table public.collection_migrations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  imported_at timestamptz not null default now(),
  local_entry_count integer not null check (local_entry_count >= 0)
);

alter table public.collection_migrations enable row level security;
create policy "users read their migration" on public.collection_migrations for select to authenticated using ((select auth.uid()) = user_id);
create policy "users insert their migration" on public.collection_migrations for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users update their migration" on public.collection_migrations for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.import_local_collection(p_entries jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if exists (select 1 from public.collection_entries where user_id = current_user_id) then raise exception 'Cloud collection is not empty'; end if;

  insert into public.collection_entries (user_id,species_id,form_id,game_id,origin_game_id,shiny,alpha,own_ot,quantity)
  select current_user_id,item.species_id,item.form_id,item.game_id,item.origin_game_id,item.shiny,item.alpha,item.own_ot,item.quantity
  from jsonb_to_recordset(p_entries) as item(species_id text,form_id text,game_id text,origin_game_id text,shiny boolean,alpha boolean,own_ot boolean,quantity integer);

  insert into public.collection_migrations (user_id,local_entry_count) values (current_user_id,jsonb_array_length(p_entries))
  on conflict (user_id) do update set imported_at=now(),local_entry_count=excluded.local_entry_count;
end;
$$;

revoke all on function public.import_local_collection(jsonb) from public;
grant execute on function public.import_local_collection(jsonb) to authenticated;
