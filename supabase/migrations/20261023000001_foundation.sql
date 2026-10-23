-- =====================================================================
-- 001 · Temel: şemalar, varsayılan-reddet yetkileri, kimlik ve partner tabloları
-- =====================================================================
-- İlke (brief §3, §11):
--   * Alıcı kişisel verisi ve tüm talep/eşleşme/randevu kayıtları `private` şemasındadır.
--     anon ve authenticated rollerinin bu şemaya HİÇBİR erişimi yoktur (USAGE dahil).
--   * public şemada varsayılan reddet: her tabloya yalnızca gereken yetki tek tek verilir, RLS her tabloda açıktır.
--   * Rol bilgisi kullanıcının düzenleyebildiği metadata'dan değil, bu tablolardan okunur.
-- Bu dosya Supabase'in sağladığı auth şemasına ve anon/authenticated/service_role rollerine dayanır.

-- ---------------------------------------------------------------
-- Şemalar
-- ---------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

-- app: RLS politikalarının ve tetikleyicilerin kullandığı yardımcı fonksiyonlar.
-- Data API'de AÇILMAZ (yalnızca public açıktır); istemci bu fonksiyonları RPC olarak çağıramaz.
-- Politikalar istemci rolüyle değerlendirildiği için USAGE gerekir; tablo içermez.
create schema if not exists app;
revoke all on schema app from public;
grant usage on schema app to anon, authenticated, service_role;
alter default privileges in schema app revoke execute on functions from anon, authenticated;

-- public şemada yeni oluşturulacak tablo/fonksiyonlara otomatik yetki verilmesin
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
-- Not: fonksiyonların PUBLIC'e verilen varsayılan EXECUTE yetkisi şema bazında kaldırılamaz (PostgreSQL kuralı).
-- Bu yüzden 006 ve 007'nin sonunda tüm fonksiyonlardan yetki açıkça kaldırılır ve yalnızca onaylı liste geri verilir.
alter default privileges in schema public revoke execute on functions from anon, authenticated;
alter default privileges in schema private revoke all on tables from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from anon, authenticated;

-- ---------------------------------------------------------------
-- Yardımcılar
-- ---------------------------------------------------------------
create or replace function app.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- URL için Türkçe karakterleri sadeleştirir: "Yalıkavak'ta Villa" → "yalikavak-ta-villa"
create or replace function app.slugify(p text) returns text
language sql immutable set search_path = '' as $$
  select trim(both '-' from regexp_replace(
    translate(lower(p), 'çğıöşüâîû', 'cgiosuaiu'),
    '[^a-z0-9]+', '-', 'g'))
$$;

-- Ham olaylar için anonim anahtar (geri döndürülemez)
create or replace function private.hash_key(p text) returns text
language sql immutable set search_path = '' as $$
  select encode(sha256(convert_to(coalesce(p, ''), 'UTF8')), 'hex')
$$;

-- ---------------------------------------------------------------
-- Kimlik ve platform rolleri
-- ---------------------------------------------------------------
create table public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  full_name  text check (char_length(full_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Platform ekibi. can_view_pii: alıcı kişisel verisini görebilir mi (operatörler için ayrı yetki)
create table public.platform_roles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('superadmin', 'operator')),
  can_view_pii boolean not null default false,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id)
);

-- ---------------------------------------------------------------
-- İş ortakları (davetli emlak ofisleri ve proje geliştiriciler)
-- ---------------------------------------------------------------
create table public.partner_organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 2 and 160),
  kind       text not null default 'agency' check (kind in ('agency', 'developer')),
  district   text not null check (district in ('bodrum', 'milas')),
  status     text not null default 'invited' check (status in ('invited', 'active', 'suspended')),
  joined_at  date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partner_memberships (
  partner_id uuid not null references public.partner_organizations(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (partner_id, user_id)
);
create index partner_memberships_user_idx on public.partner_memberships (user_id);

-- Davetler yalnızca yönetici tarafından oluşturulur; token yalnızca hash olarak tutulur
create table public.partner_invitations (
  id          uuid primary key default gen_random_uuid(),
  partner_id  uuid not null references public.partner_organizations(id) on delete cascade,
  email       text not null,
  role        text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  accepted_at timestamptz,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

create trigger profiles_touch before update on public.profiles for each row execute function app.touch_updated_at();
create trigger partner_org_touch before update on public.partner_organizations for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------
-- Yetki fonksiyonları (RLS politikalarında kullanılır)
-- security definer: politikalar içinde tablo RLS'ine takılmadan güvenli kontrol yapar.
-- Yalnızca çağıranın kendi durumunu döndürür; başkası hakkında bilgi vermez.
-- ---------------------------------------------------------------
create or replace function app.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.platform_roles
    where user_id = (select auth.uid()) and active
  )
$$;

create or replace function app.is_superadmin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.platform_roles
    where user_id = (select auth.uid()) and active and role = 'superadmin'
  )
$$;

-- Alıcı kişisel verisini görebilir mi (yalnızca yönetici RPC'lerinde kullanılır)
create or replace function private.can_view_pii() returns boolean
language sql stable set search_path = '' as $$
  select exists (
    select 1 from public.platform_roles
    where user_id = (select auth.uid()) and active and (role = 'superadmin' or can_view_pii)
  )
$$;

-- Çağıranın üyesi olduğu AKTİF partner organizasyonları
create or replace function app.my_partner_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select m.partner_id
  from public.partner_memberships m
  join public.partner_organizations o on o.id = m.partner_id
  where m.user_id = (select auth.uid()) and m.active and o.status = 'active'
$$;

create or replace function app.is_partner_member(p_partner_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_partner_id in (select app.my_partner_ids())
$$;

create or replace function app.partner_role(p_partner_id uuid) returns text
language sql stable security definer set search_path = '' as $$
  select m.role
  from public.partner_memberships m
  join public.partner_organizations o on o.id = m.partner_id
  where m.partner_id = p_partner_id and m.user_id = (select auth.uid()) and m.active and o.status = 'active'
$$;

revoke execute on function app.touch_updated_at() from public, anon, authenticated;
revoke execute on function private.hash_key(text) from public, anon, authenticated;
revoke execute on function private.can_view_pii() from public, anon, authenticated;
grant execute on function app.slugify(text) to anon, authenticated;
grant execute on function app.is_platform_admin() to authenticated;
grant execute on function app.is_superadmin() to authenticated;
grant execute on function app.my_partner_ids() to authenticated;
grant execute on function app.is_partner_member(uuid) to authenticated;
grant execute on function app.partner_role(uuid) to authenticated;
