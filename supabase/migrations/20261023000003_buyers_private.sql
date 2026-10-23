-- =====================================================================
-- 003 · Alıcılar, talepler, eşleşmeler, randevular, ilgi olayları, ticari kayıtlar
-- =====================================================================
-- Bu dosyadaki private.* tablolarına anon ve authenticated rollerinin ERİŞİMİ YOKTUR (şema USAGE'ı bile yok).
-- Partner rolü hangi RLS politikası yazılırsa yazılsın bu tablolara ulaşamaz.
-- Yönetici bu verilere yalnızca 006'daki admin_* RPC'leriyle (yetki kontrolü + denetim kaydı) ulaşır.

create sequence private.request_code_seq start 1;
create sequence private.viewing_code_seq start 1;

-- Alıcı kişisel verisi (PII)
create table private.buyers (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid unique references auth.users(id) on delete set null,  -- kayıtlı alıcıysa
  full_name        text not null check (char_length(full_name) between 2 and 120),
  phone            text check (char_length(phone) <= 40),
  email            text check (char_length(email) <= 254),
  contact_hash     text not null,  -- hız sınırı için; düz metin aramayı gerektirmez
  nationality      text check (char_length(nationality) <= 60),
  language         text not null default 'tr' check (language in ('tr', 'en', 'ru')),
  consent_at       timestamptz not null,
  consent_version  text not null,
  marketing_opt_in boolean not null default false,
  erased_at        timestamptz,  -- KVKK silme talebi sonrası anonimleştirme zamanı
  created_at       timestamptz not null default now(),
  check (phone is not null or email is not null)
);
create index buyers_contact_hash_idx on private.buyers (contact_hash, created_at);

create table private.buyer_requests (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique default ('T-' || lpad(nextval('private.request_code_seq')::text, 4, '0')),
  buyer_id      uuid not null references private.buyers(id) on delete cascade,
  source        text not null check (source in ('site_form', 'match_wizard', 'citizenship_wizard', 'listing_inquiry', 'viewing_request', 'phone')),
  status        text not null default 'new' check (status in ('new', 'contacted', 'matching', 'viewing', 'negotiation', 'closed_won', 'closed_lost')),
  districts     text[] not null default '{}' check (districts <@ array['bodrum', 'milas']),
  neighborhoods text[] not null default '{}',
  budget_max    bigint check (budget_max > 0),
  types         text[] not null default '{}' check (types <@ array['villa', 'apartment', 'detached', 'residence', 'land']),
  rooms_min     int check (rooms_min between 1 and 10),
  net_sqm_min   int check (net_sqm_min > 0),
  features      text[] not null default '{}' check (features <@ array['pool', 'garden', 'seaView', 'parking', 'furnished', 'inSite', 'creditEligible']),
  strict_keys   text[] not null default '{}' check (strict_keys <@ array['bolge', 'butce', 'tip', 'oda', 'alan', 'pool', 'garden', 'seaView', 'parking', 'furnished', 'inSite', 'creditEligible']),
  citizenship   boolean not null default false,
  timing        text check (char_length(timing) <= 120),
  financing     text check (char_length(financing) <= 120),
  note          text check (char_length(note) <= 2000),
  property_ids  uuid[] not null default '{}',  -- bir ilandan geldiyse
  assigned_admin uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index buyer_requests_buyer_idx on private.buyer_requests (buyer_id);
create index buyer_requests_status_idx on private.buyer_requests (status);
create trigger buyer_requests_touch before update on private.buyer_requests for each row execute function public.touch_updated_at();

-- Eşleşmeler: yalnızca motor (005) yazar, yalnızca yönetici okur
create table private.property_matches (
  request_id  uuid not null references private.buyer_requests(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  score       int not null check (score between 0 and 100),
  kind        text not null check (kind in ('exact', 'near')),
  reasons     jsonb not null default '[]'::jsonb,
  is_current  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (request_id, property_id)
);
create index property_matches_property_idx on private.property_matches (property_id) where is_current;

-- Görüntüleme talepleri (bir veya birden çok mülk) ve randevular — partner bunları GÖRMEZ (sahip kararı)
create table private.viewing_requests (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique default ('R-' || lpad(nextval('private.viewing_code_seq')::text, 4, '0')),
  request_id   uuid not null references private.buyer_requests(id) on delete cascade,
  availability text check (char_length(availability) <= 500),
  status       text not null default 'requested' check (status in (
                 'requested', 'contacting', 'awaiting_partner_confirmation', 'proposed', 'confirmed', 'completed', 'cancelled', 'no_show')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger viewing_requests_touch before update on private.viewing_requests for each row execute function public.touch_updated_at();

create table private.viewing_request_items (
  viewing_request_id uuid not null references private.viewing_requests(id) on delete cascade,
  property_id        uuid not null references public.properties(id) on delete cascade,
  primary key (viewing_request_id, property_id)
);

create table private.appointments (
  id                 uuid primary key default gen_random_uuid(),
  viewing_request_id uuid not null references private.viewing_requests(id) on delete cascade,
  property_id        uuid not null references public.properties(id) on delete cascade,
  starts_at          timestamptz,
  status             text not null default 'proposed' check (status in ('proposed', 'confirmed', 'completed', 'cancelled', 'no_show')),
  created_at         timestamptz not null default now()
);

-- Randevunun hangi partner bağlantısıyla yapıldığı (ofis teyidi platform ekibince işlenir)
create table private.appointment_partner_assignments (
  appointment_id    uuid not null references private.appointments(id) on delete cascade,
  link_id           uuid not null references public.partner_property_links(id) on delete cascade,
  partner_confirmed boolean not null default false,
  confirmed_at      timestamptz,
  primary key (appointment_id, link_id)
);

create table private.viewing_status_history (
  id                 bigint generated always as identity primary key,
  viewing_request_id uuid not null references private.viewing_requests(id) on delete cascade,
  status             text not null,
  note               text,
  changed_by         uuid,
  changed_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- İlgi olayları (ham) ve partnere gösterilen gecikmeli özet
-- ---------------------------------------------------------------
create table private.interest_events (
  id          bigint generated always as identity primary key,
  property_id uuid not null references public.properties(id) on delete cascade,
  actor_key   text not null check (char_length(actor_key) = 64),  -- sha256 hex; kişi bilgisi değildir
  type        text not null check (type in ('view', 'favorite_add', 'favorite_remove', 'inquiry', 'viewing_request')),
  at          timestamptz not null default now()
);
create index interest_events_property_idx on private.interest_events (property_id, at);

create table private.listing_interest_snapshot (
  property_id uuid primary key references public.properties(id) on delete cascade,
  as_of       timestamptz not null,
  views       int not null default 0,  -- tekil kişi-gün
  favorites   int not null default 0,  -- son durumu "favoride" olan tekil kişi
  interested  int not null default 0   -- talep gönderen tekil kişi (HAM; partnere kova ile gider)
);

-- ---------------------------------------------------------------
-- Ticari kayıtlar ve denetim (yalnızca yönetici)
-- ---------------------------------------------------------------
create table private.partner_agreements (
  id            uuid primary key default gen_random_uuid(),
  partner_id    uuid not null references public.partner_organizations(id) on delete cascade,
  kind          text not null check (kind in ('cooperation', 'listing_authorization', 'referral', 'co_brokerage')),
  signed_at     date,
  valid_until   date,
  terms_summary text,
  document_path text,
  created_at    timestamptz not null default now()
);

create table private.referral_attributions (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references private.buyer_requests(id) on delete cascade,
  property_id  uuid not null references public.properties(id) on delete cascade,
  link_id      uuid references public.partner_property_links(id) on delete set null,
  agreement_id uuid references private.partner_agreements(id) on delete set null,
  created_at   timestamptz not null default now()
);

create table private.deal_progress (
  id          bigint generated always as identity primary key,
  request_id  uuid not null references private.buyer_requests(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  stage       text not null check (stage in ('interest', 'offer', 'deposit', 'contract', 'title_transfer', 'lost')),
  note        text,
  evidence_path text,
  created_by  uuid,
  created_at  timestamptz not null default now()
);

create table private.admin_tasks (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  related    text,
  due_at     timestamptz,
  done       boolean not null default false,
  created_at timestamptz not null default now()
);

create table private.audit_events (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  actor       uuid,
  action      text not null,
  target_type text,
  target_id   text,
  detail      jsonb
);
create index audit_events_at_idx on private.audit_events (at desc);

create or replace function private.audit(p_action text, p_target_type text, p_target_id text, p_detail jsonb default null) returns void
language sql security definer set search_path = '' as $$
  insert into private.audit_events (actor, action, target_type, target_id, detail)
  values ((select auth.uid()), p_action, p_target_type, p_target_id, p_detail)
$$;

-- ---------------------------------------------------------------
-- Kayıtlı alıcının kendi kayıtları (public; RLS: yalnızca kendisi)
-- ---------------------------------------------------------------
create table public.buyer_favorites (
  user_id     uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, property_id)
);

create table public.saved_searches (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text check (char_length(name) <= 80),
  criteria   jsonb not null check (jsonb_typeof(criteria) = 'object'),
  notify     boolean not null default false,
  created_at timestamptz not null default now()
);
create index saved_searches_user_idx on public.saved_searches (user_id);

create table public.notification_preferences (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  email_new_match boolean not null default false,
  email_price_change boolean not null default false,
  updated_at      timestamptz not null default now()
);

-- Favori değişiklikleri anonim ilgi olayı olarak kaydedilir (partner yalnızca toplam sayıyı görür)
create or replace function private.log_favorite_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into private.interest_events (property_id, actor_key, type)
    values (new.property_id, private.hash_key('user:' || new.user_id::text), 'favorite_add');
    return new;
  else
    insert into private.interest_events (property_id, actor_key, type)
    values (old.property_id, private.hash_key('user:' || old.user_id::text), 'favorite_remove');
    return old;
  end if;
end $$;
create trigger buyer_favorites_log after insert or delete on public.buyer_favorites
  for each row execute function private.log_favorite_event();

revoke execute on function private.audit(text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function private.log_favorite_event() from public, anon, authenticated;

-- Güvence: private şemadaki hiçbir tabloya istemci rollerinin yetkisi olmasın
revoke all on all tables in schema private from public, anon, authenticated;
revoke all on all sequences in schema private from public, anon, authenticated;
