-- ReferredBy Portfolio Holder Portal authentication and scoping.
--
-- Supabase Auth does not support arbitrary physical columns on auth.users.
-- user_type is therefore stored in raw_app_meta_data and mirrored in the
-- public mapping table below.

create table if not exists public.portfolio_holder_users (
  id uuid primary key default gen_random_uuid(),
  portfolio_holder_id uuid not null references public.portfolio_holders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'portfolio_holder',
  user_type text not null default 'portfolio_holder',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolio_holder_users_user_type_check
    check (user_type = 'portfolio_holder')
);

alter table public.portfolio_holder_users
  add column if not exists user_type text not null default 'portfolio_holder';

alter table public.portfolio_holder_users
  add column if not exists created_at timestamptz not null default now();

alter table public.portfolio_holder_users
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_portfolio_holder_users_holder
  on public.portfolio_holder_users(portfolio_holder_id);

create index if not exists idx_portfolio_holder_users_user_holder
  on public.portfolio_holder_users(user_id, portfolio_holder_id);

create or replace function public.current_portfolio_holder_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select phu.portfolio_holder_id
  from public.portfolio_holder_users phu
  where phu.user_id = auth.uid()
    and phu.user_type = 'portfolio_holder';
$$;

revoke all on function public.current_portfolio_holder_ids() from public;
grant execute on function public.current_portfolio_holder_ids() to authenticated;

create or replace function public.current_portfolio_holder_society_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select ls.id
  from public.lending_societies ls
  where ls.portfolio_holder_id in (
    select public.current_portfolio_holder_ids()
  );
$$;

revoke all on function public.current_portfolio_holder_society_ids() from public;
grant execute on function public.current_portfolio_holder_society_ids() to authenticated;

create or replace function public.set_portfolio_holder_auth_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched_holder_id uuid;
begin
  select ph.id
    into matched_holder_id
  from public.portfolio_holders ph
  where lower(ph.contact_email) = lower(new.email)
     or lower(ph.company_contact_email) = lower(new.email)
  order by ph.created_at
  limit 1;

  if matched_holder_id is not null then
    new.raw_app_meta_data :=
      coalesce(new.raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object(
        'user_type', 'portfolio_holder',
        'portfolio_holder_id', matched_holder_id
      );
  end if;

  return new;
end;
$$;

drop trigger if exists set_portfolio_holder_auth_metadata on auth.users;
create trigger set_portfolio_holder_auth_metadata
before insert or update of email on auth.users
for each row execute function public.set_portfolio_holder_auth_metadata();

create or replace function public.sync_portfolio_holder_auth_mapping()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched_holder_id uuid;
begin
  if new.raw_app_meta_data ->> 'user_type' = 'portfolio_holder' then
    matched_holder_id :=
      nullif(new.raw_app_meta_data ->> 'portfolio_holder_id', '')::uuid;
  end if;

  if matched_holder_id is null then
    select ph.id
      into matched_holder_id
    from public.portfolio_holders ph
    where lower(ph.contact_email) = lower(new.email)
       or lower(ph.company_contact_email) = lower(new.email)
    order by ph.created_at
    limit 1;
  end if;

  if matched_holder_id is not null then
    update public.portfolio_holder_users
      set user_type = 'portfolio_holder',
          role = coalesce(role, 'portfolio_holder'),
          updated_at = now()
    where user_id = new.id
      and portfolio_holder_id = matched_holder_id;

    if not found then
      insert into public.portfolio_holder_users (
        id,
        user_id,
        portfolio_holder_id,
        role,
        user_type,
        updated_at
      )
      values (
        gen_random_uuid(),
        new.id,
        matched_holder_id,
        'portfolio_holder',
        'portfolio_holder',
        now()
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_portfolio_holder_auth_mapping on auth.users;
create trigger sync_portfolio_holder_auth_mapping
after insert or update of email, raw_app_meta_data on auth.users
for each row execute function public.sync_portfolio_holder_auth_mapping();

-- Backfill existing Auth users whose email matches a portfolio holder.
update auth.users u
set raw_app_meta_data =
  coalesce(u.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object(
    'user_type', 'portfolio_holder',
    'portfolio_holder_id', ph.id
  )
from public.portfolio_holders ph
where lower(u.email) = lower(ph.contact_email)
   or lower(u.email) = lower(ph.company_contact_email);

insert into public.portfolio_holder_users (
  id,
  user_id,
  portfolio_holder_id,
  role,
  user_type
)
select
  gen_random_uuid(),
  u.id,
  (u.raw_app_meta_data ->> 'portfolio_holder_id')::uuid,
  'portfolio_holder',
  'portfolio_holder'
from auth.users u
where u.raw_app_meta_data ->> 'user_type' = 'portfolio_holder'
  and nullif(u.raw_app_meta_data ->> 'portfolio_holder_id', '') is not null
  and not exists (
    select 1
    from public.portfolio_holder_users existing
    where existing.user_id = u.id
      and existing.portfolio_holder_id =
        (u.raw_app_meta_data ->> 'portfolio_holder_id')::uuid
  );

alter table public.portfolio_holder_users enable row level security;

drop policy if exists "Portfolio holders can view own access mappings"
  on public.portfolio_holder_users;
create policy "Portfolio holders can view own access mappings"
  on public.portfolio_holder_users
  for select
  to authenticated
  using (
    user_id = auth.uid()
    and user_type = 'portfolio_holder'
  );

drop policy if exists "Portfolio holders can view own holder record"
  on public.portfolio_holders;
create policy "Portfolio holders can view own holder record"
  on public.portfolio_holders
  for select
  to authenticated
  using (id in (select public.current_portfolio_holder_ids()));

drop policy if exists "Portfolio holders can view linked lending societies"
  on public.lending_societies;
create policy "Portfolio holders can view linked lending societies"
  on public.lending_societies
  for select
  to authenticated
  using (portfolio_holder_id in (select public.current_portfolio_holder_ids()));

drop policy if exists "Portfolio holders can view linked partner ratings"
  on public.partner_ratings;
create policy "Portfolio holders can view linked partner ratings"
  on public.partner_ratings
  for select
  to authenticated
  using (portfolio_holder_id in (select public.current_portfolio_holder_ids()));
