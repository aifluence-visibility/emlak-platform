-- =====================================================================
-- YALNIZCA YEREL TEST İÇİN — Supabase'e UYGULANMAZ.
-- Boş bir PostgreSQL'de Supabase'in hazır sunduğu rolleri, auth ve storage şemalarını taklit eder.
-- Davranış Supabase ile aynı tutuldu: auth.uid() 'request.jwt.claims' içindeki 'sub' değerini okur,
-- ve Supabase'in varsayılan yetkileri (public tablolarına anon/authenticated için geniş yetki) burada da verilir;
-- böylece migration'ların bu yetkileri gerçekten kaldırdığı test edilir.
-- =====================================================================

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
end $$;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;

create table if not exists auth.users (
  id    uuid primary key,
  email text unique
);

create or replace function auth.uid() returns uuid
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create or replace function auth.role() returns text
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant execute on function auth.role() to anon, authenticated, service_role;

-- Storage (yalnızca bu testler için gereken kısmı)
create schema if not exists storage;
grant usage on schema storage to anon, authenticated, service_role;

create table if not exists storage.buckets (
  id                 text primary key,
  name               text not null,
  public             boolean default false,
  file_size_limit    bigint,
  allowed_mime_types text[]
);

create table if not exists storage.objects (
  id        uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name      text not null,
  owner     uuid default auth.uid(),
  unique (bucket_id, name)
);
alter table storage.objects enable row level security;
grant select, insert, update, delete on storage.objects to anon, authenticated, service_role;

create or replace function storage.foldername(name text) returns text[]
language sql immutable as $$
  select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
$$;
grant execute on function storage.foldername(text) to anon, authenticated, service_role;
