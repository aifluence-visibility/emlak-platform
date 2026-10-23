-- =====================================================================
-- 002 · Envanter: kanonik mülkler, partner bağlantıları, projeler, vatandaşlık
-- =====================================================================
-- Kanonik mülk (properties) yalnızca herkese gösterilebilecek alanları içerir.
-- Kesin adres, parsel ve sahip notları `private.property_private_details` içindedir.
-- Partner kimliği, iç referans ve partner fiyatı `partner_property_links` içindedir ve ziyaretçiye hiç açılmaz.

create sequence public.property_code_seq start 1001;

create table public.properties (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  slug            text not null unique,
  title           text not null check (char_length(title) between 5 and 120),
  summary         text check (char_length(summary) <= 300),
  description     text check (char_length(description) <= 6000),
  district        text not null check (district in ('bodrum', 'milas')),
  neighborhood    text not null check (char_length(neighborhood) between 2 and 60),
  type            text not null check (type in ('villa', 'apartment', 'detached', 'residence', 'land')),
  status          text not null default 'draft' check (status in (
                    'draft', 'pending_partner_documents', 'pending_eids_verification', 'pending_admin_review',
                    'published', 'paused', 'expired', 'sold', 'archived')),
  price           bigint not null check (price > 0),           -- TL
  rooms           text check (rooms ~ '^[0-9]{1,2}\+[0-9]$'),
  gross_sqm       int check (gross_sqm > 0),
  net_sqm         int check (net_sqm > 0),
  land_sqm        int check (land_sqm > 0),
  building_age    int check (building_age between 0 and 200),
  floor           text check (char_length(floor) <= 30),
  bathrooms       int check (bathrooms between 0 and 20),
  has_pool        boolean not null default false,
  has_garden      boolean not null default false,
  has_sea_view    boolean not null default false,
  has_parking     boolean not null default false,
  is_furnished    boolean not null default false,
  in_site         boolean not null default false,
  credit_eligible boolean not null default false,
  title_deed      text check (title_deed in ('Kat mülkiyeti', 'Kat irtifakı', 'Müstakil tapu', 'Hisseli tapu')),
  sea_distance_m  int check (sea_distance_m >= 0),
  approx_lat      numeric(7, 3),  -- yaklaşık konum (~100 m); kesin konum private'ta
  approx_lng      numeric(7, 3),
  fact_sources    jsonb not null default '{}'::jsonb,  -- {"net_sqm":"verified", ...} yalnızca yönetici değiştirir
  development_id  uuid,
  published_at    timestamptz,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index properties_status_idx on public.properties (status);
create index properties_search_idx on public.properties (district, neighborhood, type, price);
create trigger properties_touch before update on public.properties for each row execute function public.touch_updated_at();

-- Kesin konum ve hassas bilgiler: yalnızca yönetici (RPC) ve ilanı giren partner (RPC) okur
create table private.property_private_details (
  property_id   uuid primary key references public.properties(id) on delete cascade,
  exact_address text,
  exact_lat     numeric(9, 6),
  exact_lng     numeric(9, 6),
  parcel_ref    text,
  owner_notes   text,
  updated_at    timestamptz not null default now()
);

create table public.property_translations (
  property_id uuid not null references public.properties(id) on delete cascade,
  lang        text not null check (lang in ('en', 'ru')),
  title       text not null check (char_length(title) <= 120),
  summary     text check (char_length(summary) <= 300),
  description text check (char_length(description) <= 6000),
  primary key (property_id, lang)
);

-- Görsel ve videolar. storage_path: 'property-media' bucket'ında '<property_id>/<dosya>'
create table public.property_media (
  id                uuid primary key default gen_random_uuid(),
  property_id       uuid not null references public.properties(id) on delete cascade,
  storage_path      text not null unique,
  kind              text not null default 'photo' check (kind in ('photo', 'video', 'floor_plan')),
  is_render         boolean not null default false,  -- görselleştirme mi, gerçek fotoğraf mı
  provenance        text not null default 'partner_owned' check (provenance in ('partner_owned', 'licensed', 'platform')),
  sort              int not null default 0,
  created_by        uuid references auth.users(id),
  created_at        timestamptz not null default now()
);
create index property_media_property_idx on public.property_media (property_id, sort);

-- ---------------------------------------------------------------
-- Partner ↔ mülk yetki bağlantısı (brief §8). Bir mülkün birden çok partneri olabilir.
-- ---------------------------------------------------------------
create table public.partner_property_links (
  id                   uuid primary key default gen_random_uuid(),
  partner_id           uuid not null references public.partner_organizations(id) on delete cascade,
  property_id          uuid not null references public.properties(id) on delete cascade,
  internal_ref         text check (char_length(internal_ref) <= 40),
  authorization_status text not null default 'pending' check (authorization_status in ('pending', 'active', 'expired', 'revoked')),
  eids_status          text not null default 'not_started' check (eids_status in ('not_started', 'pending', 'verified', 'failed')),
  eids_reference       text check (char_length(eids_reference) <= 60),
  authorized_from      date,
  authorized_until     date,
  partner_asking_price bigint check (partner_asking_price > 0),
  created_by           uuid references auth.users(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (partner_id, property_id),
  check (authorized_until is null or authorized_from is null or authorized_from <= authorized_until)
);
create index ppl_property_idx on public.partner_property_links (property_id);
create index ppl_partner_idx on public.partner_property_links (partner_id);
create trigger ppl_touch before update on public.partner_property_links for each row execute function public.touch_updated_at();

-- Yetki/belge kontrolleri. Kanıt dosyası 'partner-documents' bucket'ında; burada yalnızca yolu ve sonucu tutulur.
create table public.property_authorization_checks (
  id            uuid primary key default gen_random_uuid(),
  link_id       uuid not null references public.partner_property_links(id) on delete cascade,
  kind          text not null check (kind in ('authorization_document', 'title_deed', 'eids', 'identity', 'other')),
  status        text not null default 'submitted' check (status in ('submitted', 'verified', 'rejected')),
  method        text check (char_length(method) <= 120),
  evidence_path text,
  note          text check (char_length(note) <= 1000),
  verified_by   uuid references auth.users(id),
  verified_at   timestamptz,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now()
);
create index pac_link_idx on public.property_authorization_checks (link_id);

create table public.property_price_history (
  id          bigint generated always as identity primary key,
  property_id uuid not null references public.properties(id) on delete cascade,
  old_price   bigint,
  new_price   bigint not null,
  changed_by  uuid,
  changed_at  timestamptz not null default now()
);

-- Yayındaki ilanda partner değişikliği doğrudan yapamaz; talep oluşturur, yönetici onaylar
create table public.property_change_requests (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  partner_id  uuid not null references public.partner_organizations(id) on delete cascade,
  changes     jsonb not null check (jsonb_typeof(changes) = 'object'),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz
);

-- Aynı gerçek mülkün farklı kayıtları: yalnızca yönetici, elle inceleme (otomatik birleştirme yok)
create table public.property_merge_reviews (
  id           uuid primary key default gen_random_uuid(),
  property_a   uuid not null references public.properties(id) on delete cascade,
  property_b   uuid not null references public.properties(id) on delete cascade,
  reason       text,
  status       text not null default 'open' check (status in ('open', 'merged', 'not_duplicate')),
  decided_by   uuid references auth.users(id),
  decided_at   timestamptz,
  created_at   timestamptz not null default now(),
  check (property_a <> property_b)
);

-- ---------------------------------------------------------------
-- Projeler (ayrı modül, brief §5)
-- ---------------------------------------------------------------
create table public.developments (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  name              text not null check (char_length(name) between 2 and 120),
  district          text not null check (district in ('bodrum', 'milas')),
  neighborhood      text not null,
  concept           text,
  description       text,
  developer_label   text,
  status            text not null default 'pre_launch' check (status in ('pre_launch', 'under_construction', 'completed')),
  delivery_estimate text,
  amenities         text[] not null default '{}',
  payment_plan      text,
  is_published      boolean not null default false,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger developments_touch before update on public.developments for each row execute function public.touch_updated_at();

alter table public.properties
  add constraint properties_development_fk foreign key (development_id) references public.developments(id) on delete set null;

create table public.development_units (
  id             uuid primary key default gen_random_uuid(),
  development_id uuid not null references public.developments(id) on delete cascade,
  label          text not null,
  rooms          text,
  net_sqm        int,
  gross_sqm      int,
  price          bigint check (price > 0),
  availability   text not null default 'available' check (availability in ('available', 'reserved', 'sold')),
  property_id    uuid unique references public.properties(id) on delete set null  -- satışa açık birim → kanonik mülk
);
create index dev_units_dev_idx on public.development_units (development_id);

create table public.development_media (
  id             uuid primary key default gen_random_uuid(),
  development_id uuid not null references public.developments(id) on delete cascade,
  storage_path   text not null unique,
  is_render      boolean not null default true,
  sort           int not null default 0
);

create table public.development_partner_links (
  development_id       uuid not null references public.developments(id) on delete cascade,
  partner_id           uuid not null references public.partner_organizations(id) on delete cascade,
  authorization_status text not null default 'pending' check (authorization_status in ('pending', 'active', 'expired', 'revoked')),
  primary key (development_id, partner_id)
);

-- ---------------------------------------------------------------
-- Vatandaşlık ön incelemesi (yalnızca yönetici). Aynı kanonik mülk; kopya ilan yok (brief §6)
-- ---------------------------------------------------------------
create table public.citizenship_reviews (
  property_id    uuid primary key references public.properties(id) on delete cascade,
  status         text not null default 'not_reviewed' check (status in (
                   'not_reviewed', 'under_review', 'preliminarily_eligible', 'needs_documents', 'not_eligible', 'expired_review')),
  admin_approved boolean not null default false,
  checklist      jsonb not null default '{
    "threshold_current_law": false, "official_valuation": false, "title_eligible": false, "ownership_history": false,
    "foreign_ownership_restrictions": false, "sale_restriction_annotation": false, "agency_rules": false}'::jsonb,
  reviewer       uuid references auth.users(id),
  reviewed_at    timestamptz,
  expires_at     timestamptz,
  note           text,
  updated_at     timestamptz not null default now()
);
create trigger citizenship_touch before update on public.citizenship_reviews for each row execute function public.touch_updated_at();

-- Sahip kararı: onay yalnızca "ön uygun" durumda ve kontrol listesinin TAMAMI işaretliyse verilebilir.
create or replace function public.guard_citizenship_review() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.admin_approved then
    if new.status <> 'preliminarily_eligible' then
      raise exception 'Vatandaşlık onayı yalnızca "ön uygun" durumda verilebilir';
    end if;
    if exists (select 1 from jsonb_each(new.checklist) e where e.value <> 'true'::jsonb) then
      raise exception 'Vatandaşlık onayı için kontrol listesinin tamamı tamamlanmalı';
    end if;
    if new.expires_at is null then
      raise exception 'Vatandaşlık onayı için inceleme geçerlilik tarihi gerekli';
    end if;
  end if;
  return new;
end $$;
create trigger citizenship_guard before insert or update on public.citizenship_reviews
  for each row execute function public.guard_citizenship_review();

-- Partner gösterim müsaitliği (randevu/alıcı bilgisi içermez)
create table public.partner_availability (
  id         uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partner_organizations(id) on delete cascade,
  day_label  text not null check (char_length(day_label) <= 40),
  from_time  time not null,
  to_time    time not null,
  note       text check (char_length(note) <= 500),
  check (from_time < to_time)
);

-- ---------------------------------------------------------------
-- Durum ve yayın kuralları
-- ---------------------------------------------------------------

-- Mülk "canlı" mı: yayında + en az bir aktif, süresi geçmemiş, aktif partnerli bağlantı (brief §8)
create or replace function public.property_is_live(p_property_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.properties p
    join public.partner_property_links l on l.property_id = p.id
    join public.partner_organizations o on o.id = l.partner_id
    where p.id = p_property_id
      and p.status = 'published'
      and l.authorization_status = 'active'
      and (l.authorized_until is null or l.authorized_until >= current_date)
      and o.status = 'active'
  )
$$;

-- Çağıranın partneri bu mülke bağlı mı (durumdan bağımsız)
create or replace function public.partner_links_property(p_property_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.partner_property_links l
    where l.property_id = p_property_id and l.partner_id in (select public.my_partner_ids())
  )
$$;

-- Partner kanonik kaydı doğrudan düzenleyebilir mi:
-- yalnızca mülkün TEK bağlantısı kendisininse ve ilan henüz incelemeye gönderilmemişse.
-- (Çoklu partnerli mülkte bir partnerin değişikliği diğerini etkilemesin.)
create or replace function public.partner_can_edit_property(p_property_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.properties p
    where p.id = p_property_id and p.status in ('draft', 'pending_partner_documents')
  )
  and (select count(*) from public.partner_property_links l where l.property_id = p_property_id) = 1
  and public.partner_links_property(p_property_id)
$$;

-- Yönetici olmayan doğrudan yazmalarda korunan alanlar (RPC'ler security definer ile çalışır, bu kontrole takılmaz)
create or replace function public.guard_property_write() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_platform_admin() then
    if tg_op = 'INSERT' then
      raise exception 'Mülk yalnızca partner_create_property() ile oluşturulabilir';
    end if;
    if new.status is distinct from old.status or new.code is distinct from old.code or new.slug is distinct from old.slug
       or new.fact_sources is distinct from old.fact_sources or new.published_at is distinct from old.published_at
       or new.development_id is distinct from old.development_id or new.created_by is distinct from old.created_by then
      raise exception 'Bu alanlar yalnızca platform tarafından değiştirilebilir';
    end if;
  end if;
  return new;
end $$;
create trigger properties_guard before insert or update on public.properties
  for each row execute function public.guard_property_write();

-- Partner kendi bağlantısında yalnızca iç referans ve fiyatını değiştirebilir; yetki/EİDS durumu platformundur
create or replace function public.guard_link_write() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_platform_admin() then
    if tg_op = 'INSERT' then
      raise exception 'Bağlantı yalnızca platform tarafından oluşturulabilir';
    end if;
    if new.partner_id <> old.partner_id or new.property_id <> old.property_id
       or new.authorization_status <> old.authorization_status or new.eids_status <> old.eids_status
       or new.authorized_from is distinct from old.authorized_from or new.authorized_until is distinct from old.authorized_until then
      raise exception 'Yetki bilgileri yalnızca platform tarafından değiştirilebilir';
    end if;
  end if;
  return new;
end $$;
create trigger ppl_guard before insert or update on public.partner_property_links
  for each row execute function public.guard_link_write();

-- Partner belge gönderebilir ama doğrulayamaz
create or replace function public.guard_auth_check_write() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_platform_admin() then
    if new.status <> 'submitted' or new.verified_by is not null or new.verified_at is not null then
      raise exception 'Belge doğrulaması yalnızca platform tarafından yapılır';
    end if;
    if tg_op = 'UPDATE' then
      raise exception 'Gönderilen belge değiştirilemez; yeni belge gönderin';
    end if;
  end if;
  return new;
end $$;
create trigger pac_guard before insert or update on public.property_authorization_checks
  for each row execute function public.guard_auth_check_write();

-- Fiyat geçmişi
create or replace function public.log_price_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.price is distinct from old.price then
    insert into public.property_price_history (property_id, old_price, new_price, changed_by)
    values (new.id, case when tg_op = 'UPDATE' then old.price end, new.price, (select auth.uid()));
  end if;
  return new;
end $$;
create trigger properties_price_log after insert or update of price on public.properties
  for each row execute function public.log_price_change();

-- Yetkisi biten bağlantılar ve canlı bağlantısı kalmayan ilanlar (günlük iş; bkz. 006)
create or replace function private.expire_authorizations() returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  update public.partner_property_links set authorization_status = 'expired'
  where authorization_status = 'active' and authorized_until < current_date;
  get diagnostics n = row_count;
  update public.properties p set status = 'expired'
  where p.status = 'published' and not public.property_is_live(p.id);
  return n;
end $$;

revoke execute on function public.guard_citizenship_review() from public, anon, authenticated;
revoke execute on function public.guard_property_write() from public, anon, authenticated;
revoke execute on function public.guard_link_write() from public, anon, authenticated;
revoke execute on function public.guard_auth_check_write() from public, anon, authenticated;
revoke execute on function public.log_price_change() from public, anon, authenticated;
revoke execute on function private.expire_authorizations() from public, anon, authenticated;
grant execute on function public.property_is_live(uuid) to anon, authenticated;
grant execute on function public.partner_links_property(uuid) to authenticated;
grant execute on function public.partner_can_edit_property(uuid) to authenticated;
