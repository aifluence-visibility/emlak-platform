-- =====================================================================
-- 006 · Uygulama fonksiyonları (RPC)
-- =====================================================================
-- Ziyaretçi  : submit_buyer_request, request_viewing, citizenship_collection, match_weights
-- Sunucu     : record_listing_view (yalnızca service_role), refresh_interest_snapshot
-- Alıcı      : my_requests
-- Partner    : partner_create_property, partner_submit_property, partner_listing_stats, partner_get_private_details
-- Yönetici   : admin_* (alıcı kişisel verisi yalnızca buradan; her okuma denetim kaydına yazılır)
-- Partner fonksiyonlarının HİÇBİRİ private.buyers / buyer_requests / property_matches / viewing_* okumaz.

-- ---------------------------------------------------------------
-- Ortak: alıcı talebi oluşturma (iç fonksiyon)
-- ---------------------------------------------------------------
create or replace function private.create_buyer_request(p jsonb, p_source text) returns private.buyer_requests
language plpgsql security definer set search_path = '' as $$
declare
  v_name    text := nullif(trim(p->>'full_name'), '');
  v_phone   text := nullif(regexp_replace(coalesce(p->>'phone', ''), '[^0-9+]', '', 'g'), '');
  v_email   text := nullif(lower(trim(p->>'email')), '');
  v_hash    text;
  v_buyer   uuid;
  v_req     private.buyer_requests;
  v_props   uuid[];
  v_actor   text;
begin
  if coalesce((p->>'consent')::boolean, false) is not true then
    raise exception 'Aydınlatma metni onayı gerekli' using errcode = '22023';
  end if;
  if v_name is null or char_length(v_name) < 2 then
    raise exception 'Ad gerekli' using errcode = '22023';
  end if;
  if v_phone is null and v_email is null then
    raise exception 'Telefon veya e-posta gerekli' using errcode = '22023';
  end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'E-posta geçersiz' using errcode = '22023';
  end if;

  -- Hız sınırı: aynı iletişim bilgisiyle saatte en fazla 5 talep; tüm sistemde dakikada en fazla 60
  v_hash := private.hash_key(coalesce(v_email, '') || '|' || coalesce(v_phone, ''));
  if (select count(*) from private.buyers where contact_hash = v_hash and created_at > now() - interval '1 hour') >= 5
     or (select count(*) from private.buyers where created_at > now() - interval '1 minute') >= 60 then
    raise exception 'Çok fazla talep; lütfen daha sonra tekrar deneyin' using errcode = '54000';
  end if;

  -- Yalnızca canlı ilanlar kabul edilir (yayında olmayan ilan kimliği sızdırılamaz/denenemez)
  select coalesce(array_agg(x), '{}') into v_props
  from (select distinct (jsonb_array_elements_text(coalesce(p->'property_ids', '[]'::jsonb)))::uuid as x) t
  where public.property_is_live(t.x);

  -- Aynı kişinin kayıtları birleştirilmez (doğrulanmamış iletişim bilgisiyle başkasının kaydına bağlanmayı önler)
  insert into private.buyers (user_id, full_name, phone, email, contact_hash, nationality, language, consent_at, consent_version, marketing_opt_in)
  values (
    (select auth.uid()), v_name, v_phone, v_email, v_hash, nullif(trim(p->>'nationality'), ''),
    coalesce(nullif(p->>'language', ''), 'tr'), now(), coalesce(nullif(p->>'consent_version', ''), 'v1'),
    coalesce((p->>'marketing_opt_in')::boolean, false)
  )
  on conflict (user_id) do update set full_name = excluded.full_name, phone = excluded.phone, email = excluded.email,
    contact_hash = excluded.contact_hash, consent_at = excluded.consent_at, consent_version = excluded.consent_version
  returning id into v_buyer;

  insert into private.buyer_requests (buyer_id, source, districts, neighborhoods, budget_max, types, rooms_min, net_sqm_min,
                                      features, strict_keys, citizenship, timing, financing, note, property_ids)
  values (
    v_buyer, p_source,
    coalesce(array(select jsonb_array_elements_text(p->'districts')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p->'neighborhoods')), '{}'),
    nullif(p->>'budget_max', '')::bigint,
    coalesce(array(select jsonb_array_elements_text(p->'types')), '{}'),
    nullif(p->>'rooms_min', '')::int,
    nullif(p->>'net_sqm_min', '')::int,
    coalesce(array(select jsonb_array_elements_text(p->'features')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p->'strict')), '{}'),
    coalesce((p->>'citizenship')::boolean, false),
    left(p->>'timing', 120), left(p->>'financing', 120), left(p->>'note', 2000), v_props
  )
  returning * into v_req;

  -- Anonim ilgi olayı (partner yalnızca tekil toplam sayıyı görür)
  v_actor := case when (p->>'actor_key') ~ '^[0-9a-f]{64}$' then p->>'actor_key' else v_hash end;
  insert into private.interest_events (property_id, actor_key, type)
  select unnest(v_props), v_actor, case when p_source = 'viewing_request' then 'viewing_request' else 'inquiry' end;

  return v_req;
end $$;

create or replace function public.submit_buyer_request(p jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare r private.buyer_requests; v_source text := coalesce(p->>'source', 'site_form');
begin
  if v_source not in ('site_form', 'match_wizard', 'citizenship_wizard', 'listing_inquiry') then
    raise exception 'Geçersiz kaynak' using errcode = '22023';
  end if;
  r := private.create_buyer_request(p, v_source);
  return r.code;  -- yalnızca talep kodu döner; başka hiçbir kayıt bilgisi dönmez
end $$;

create or replace function public.request_viewing(p jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare r private.buyer_requests; v_code text; v_id uuid;
begin
  r := private.create_buyer_request(p, 'viewing_request');
  if cardinality(r.property_ids) = 0 then
    raise exception 'Randevu için yayında en az bir ilan seçilmeli' using errcode = '22023';
  end if;
  insert into private.viewing_requests (request_id, availability)
  values (r.id, left(p->>'availability', 500))
  returning id, code into v_id, v_code;
  insert into private.viewing_request_items (viewing_request_id, property_id) select v_id, unnest(r.property_ids);
  insert into private.viewing_status_history (viewing_request_id, status, changed_by) values (v_id, 'requested', (select auth.uid()));
  return v_code;
end $$;

-- Sayfa görüntüleme: yalnızca sunucu çağırır (actor_key = sunucuda tuzlanmış IP+UA hash'i)
create or replace function public.record_listing_view(p_property_id uuid, p_actor_key text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_actor_key !~ '^[0-9a-f]{64}$' then raise exception 'Geçersiz anahtar' using errcode = '22023'; end if;
  if public.property_is_live(p_property_id) then
    insert into private.interest_events (property_id, actor_key, type) values (p_property_id, p_actor_key, 'view');
  end if;
end $$;

-- Kayıtlı alıcının kendi talepleri (kişisel olmayan özet)
create or replace function public.my_requests() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'code', r.code, 'status', r.status, 'created_at', r.created_at,
    'viewings', (select coalesce(jsonb_agg(jsonb_build_object('code', v.code, 'status', v.status)), '[]'::jsonb)
                 from private.viewing_requests v where v.request_id = r.id)
  ) order by r.created_at desc), '[]'::jsonb)
  from private.buyer_requests r
  join private.buyers b on b.id = r.buyer_id
  where b.user_id = (select auth.uid()) and (select auth.uid()) is not null
$$;

-- ---------------------------------------------------------------
-- İlgi istatistikleri: gecikmeli, tekilleştirilmiş özet (sahip kararı)
-- ---------------------------------------------------------------
create or replace function private.refresh_interest_snapshot(p_cutoff timestamptz default date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul')
returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  with ev as (select * from private.interest_events where at < p_cutoff),
  v as (
    select property_id, count(distinct (actor_key, (at at time zone 'Europe/Istanbul')::date))::int as views
    from ev where type = 'view' group by property_id
  ),
  f as (
    select property_id, count(*) filter (where type = 'favorite_add')::int as favorites
    from (
      select distinct on (property_id, actor_key) property_id, actor_key, type
      from ev where type in ('favorite_add', 'favorite_remove')
      order by property_id, actor_key, at desc, id desc
    ) last_state group by property_id
  ),
  i as (
    select property_id, count(distinct actor_key)::int as interested
    from ev where type in ('inquiry', 'viewing_request') group by property_id
  ),
  allp as (select property_id from v union select property_id from f union select property_id from i)
  insert into private.listing_interest_snapshot (property_id, as_of, views, favorites, interested)
  select a.property_id, p_cutoff, coalesce(v.views, 0), coalesce(f.favorites, 0), coalesce(i.interested, 0)
  from allp a left join v using (property_id) left join f using (property_id) left join i using (property_id)
  on conflict (property_id) do update
    set as_of = excluded.as_of, views = excluded.views, favorites = excluded.favorites, interested = excluded.interested;
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.bucket_interested(n int) returns text
language sql immutable set search_path = '' as $$
  select case when n is null or n = 0 then '0' when n <= 2 then '1–2' else n::text end
$$;

-- ---------------------------------------------------------------
-- Partner fonksiyonları
-- ---------------------------------------------------------------
create or replace function public.partner_create_property(p_partner_id uuid, p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_code text; v_district text := p->>'district';
begin
  if public.partner_role(p_partner_id) is null then
    raise exception 'Bu iş ortağı adına işlem yetkiniz yok' using errcode = '42501';
  end if;
  v_code := case v_district when 'milas' then 'ML-' else 'BD-' end || nextval('public.property_code_seq')::text;

  insert into public.properties (code, slug, title, summary, description, district, neighborhood, type, status, price,
    rooms, gross_sqm, net_sqm, land_sqm, building_age, floor, bathrooms, has_pool, has_garden, has_sea_view, has_parking,
    is_furnished, in_site, credit_eligible, title_deed, sea_distance_m, created_by)
  values (v_code, public.slugify(p->>'title') || '-' || lower(v_code), p->>'title', p->>'summary', p->>'description',
    v_district, p->>'neighborhood', p->>'type', 'draft', (p->>'price')::bigint,
    nullif(p->>'rooms', ''), nullif(p->>'gross_sqm', '')::int, nullif(p->>'net_sqm', '')::int, nullif(p->>'land_sqm', '')::int,
    nullif(p->>'building_age', '')::int, nullif(p->>'floor', ''), nullif(p->>'bathrooms', '')::int,
    coalesce((p->>'has_pool')::boolean, false), coalesce((p->>'has_garden')::boolean, false),
    coalesce((p->>'has_sea_view')::boolean, false), coalesce((p->>'has_parking')::boolean, false),
    coalesce((p->>'is_furnished')::boolean, false), coalesce((p->>'in_site')::boolean, false),
    coalesce((p->>'credit_eligible')::boolean, false), nullif(p->>'title_deed', ''), nullif(p->>'sea_distance_m', '')::int,
    (select auth.uid()))
  returning id into v_id;

  insert into public.partner_property_links (partner_id, property_id, internal_ref, partner_asking_price, eids_reference, created_by)
  values (p_partner_id, v_id, nullif(p->>'internal_ref', ''), (p->>'price')::bigint, nullif(p->>'eids_reference', ''), (select auth.uid()));

  if nullif(p->>'exact_address', '') is not null then
    insert into private.property_private_details (property_id, exact_address) values (v_id, p->>'exact_address');
  end if;
  return v_id;
end $$;

-- Taslağı incelemeye gönderir: belge yoksa "belge bekleniyor", varsa "EİDS doğrulaması bekleniyor"
create or replace function public.partner_submit_property(p_property_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare v_status text; v_next text;
begin
  if not public.partner_can_edit_property(p_property_id) then
    raise exception 'Bu ilan gönderilemez' using errcode = '42501';
  end if;
  select status into v_status from public.properties where id = p_property_id;
  v_next := case when exists (
      select 1 from public.property_authorization_checks c
      join public.partner_property_links l on l.id = c.link_id
      where l.property_id = p_property_id and l.partner_id in (select public.my_partner_ids())
        and c.kind = 'authorization_document' and c.status <> 'rejected')
    then 'pending_eids_verification' else 'pending_partner_documents' end;
  update public.properties set status = v_next where id = p_property_id;
  return v_next;
end $$;

-- Partnerin KENDİ ilanları için gecikmeli istatistik. Ham ilgilenen sayısı dönmez; kova döner.
create or replace function public.partner_listing_stats(p_partner_id uuid)
returns table (property_id uuid, code text, views int, favorites int, interested text, as_of timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_partner_member(p_partner_id) then
    raise exception 'Bu iş ortağı adına işlem yetkiniz yok' using errcode = '42501';
  end if;
  return query
    select p.id, p.code, coalesce(s.views, 0), coalesce(s.favorites, 0), public.bucket_interested(s.interested), s.as_of
    from public.partner_property_links l
    join public.properties p on p.id = l.property_id
    left join private.listing_interest_snapshot s on s.property_id = p.id
    where l.partner_id = p_partner_id and p.status = 'published';
end $$;

create or replace function public.partner_get_private_details(p_property_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select to_jsonb(d) - 'owner_notes'
  from private.property_private_details d
  where d.property_id = p_property_id and public.partner_links_property(p_property_id)
$$;

-- ---------------------------------------------------------------
-- Yönetici fonksiyonları
-- ---------------------------------------------------------------
create or replace function private.require_admin(p_pii boolean default false) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Yalnızca platform yöneticisi' using errcode = '42501';
  end if;
  if p_pii and not private.can_view_pii() then
    raise exception 'Alıcı kişisel verisi için yetkiniz yok' using errcode = '42501';
  end if;
end $$;

create or replace function public.admin_list_buyer_requests(p_status text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare res jsonb; pii boolean;
begin
  perform private.require_admin();
  pii := private.can_view_pii();
  select coalesce(jsonb_agg(x order by (x->>'created_at') desc), '[]'::jsonb) into res from (
    select jsonb_build_object(
      'id', r.id, 'code', r.code, 'status', r.status, 'source', r.source, 'created_at', r.created_at,
      'citizenship', r.citizenship, 'districts', r.districts, 'neighborhoods', r.neighborhoods,
      'budget_max', r.budget_max, 'types', r.types, 'rooms_min', r.rooms_min,
      'buyer_name', case when pii then b.full_name else left(b.full_name, 1) || '***' end,
      'match_count', (select count(*) from private.property_matches m where m.request_id = r.id and m.is_current),
      'exact_count', (select count(*) from private.property_matches m where m.request_id = r.id and m.is_current and m.kind = 'exact'),
      'viewing_count', (select count(*) from private.viewing_requests v where v.request_id = r.id)
    ) as x
    from private.buyer_requests r join private.buyers b on b.id = r.buyer_id
    where p_status is null
       or (p_status = 'open' and r.status not in ('closed_won', 'closed_lost'))
       or (p_status = 'closed' and r.status in ('closed_won', 'closed_lost'))
       or r.status = p_status
  ) t;
  perform private.audit('buyer_requests.list', 'buyer_requests', null, jsonb_build_object('status', p_status, 'pii', pii));
  return res;
end $$;

create or replace function public.admin_get_buyer_request(p_request_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare res jsonb;
begin
  perform private.require_admin(true);
  select jsonb_build_object(
    'request', to_jsonb(r),
    'buyer', to_jsonb(b) - 'contact_hash',
    'matches', (select coalesce(jsonb_agg(jsonb_build_object('property_id', m.property_id, 'code', p.code, 'title', p.title,
                  'price', p.price, 'score', m.score, 'kind', m.kind, 'reasons', m.reasons) order by m.score desc), '[]'::jsonb)
                from private.property_matches m join public.properties p on p.id = m.property_id
                where m.request_id = r.id and m.is_current),
    'viewings', (select coalesce(jsonb_agg(jsonb_build_object('id', v.id, 'code', v.code, 'status', v.status)), '[]'::jsonb)
                 from private.viewing_requests v where v.request_id = r.id)
  ) into res
  from private.buyer_requests r join private.buyers b on b.id = r.buyer_id
  where r.id = p_request_id;
  if res is null then raise exception 'Talep bulunamadı' using errcode = 'P0002'; end if;
  perform private.audit('buyer.view', 'buyer_requests', p_request_id::text);
  return res;
end $$;

create or replace function public.admin_set_request_status(p_request_id uuid, p_status text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  update private.buyer_requests set status = p_status where id = p_request_id;
  if not found then raise exception 'Talep bulunamadı' using errcode = 'P0002'; end if;
  perform private.audit('buyer_request.status', 'buyer_requests', p_request_id::text, jsonb_build_object('status', p_status));
end $$;

create or replace function public.admin_list_viewings(p_status text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare res jsonb;
begin
  perform private.require_admin(true);
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', v.id, 'code', v.code, 'status', v.status, 'availability', v.availability, 'created_at', v.created_at,
    'request_code', r.code, 'buyer_name', b.full_name,
    'items', (select coalesce(jsonb_agg(jsonb_build_object('property_id', i.property_id, 'code', p.code, 'title', p.title)), '[]'::jsonb)
              from private.viewing_request_items i join public.properties p on p.id = i.property_id
              where i.viewing_request_id = v.id)
  ) order by v.created_at desc), '[]'::jsonb) into res
  from private.viewing_requests v
  join private.buyer_requests r on r.id = v.request_id
  join private.buyers b on b.id = r.buyer_id
  where p_status is null or v.status = p_status;
  perform private.audit('viewings.list', 'viewing_requests', null, jsonb_build_object('status', p_status));
  return res;
end $$;

create or replace function public.admin_set_viewing_status(p_viewing_id uuid, p_status text, p_note text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  update private.viewing_requests set status = p_status where id = p_viewing_id;
  if not found then raise exception 'Randevu bulunamadı' using errcode = 'P0002'; end if;
  insert into private.viewing_status_history (viewing_request_id, status, note, changed_by)
  values (p_viewing_id, p_status, left(p_note, 1000), (select auth.uid()));
  perform private.audit('viewing.status', 'viewing_requests', p_viewing_id::text, jsonb_build_object('status', p_status));
end $$;

-- Yayın kararı: yayına almak için aktif yetki + doğrulanmış EİDS + doğrulanmış yetki belgesi şart
create or replace function public.admin_set_property_status(p_property_id uuid, p_status text, p_note text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if p_status = 'published' and not exists (
      select 1 from public.partner_property_links l
      where l.property_id = p_property_id and l.authorization_status = 'active'
        and (l.authorized_until is null or l.authorized_until >= current_date)
        and l.eids_status = 'verified'
        and exists (select 1 from public.property_authorization_checks c
                    where c.link_id = l.id and c.kind = 'authorization_document' and c.status = 'verified')) then
    raise exception 'Yayın için aktif yetki, doğrulanmış EİDS ve doğrulanmış yetki belgesi gerekli' using errcode = '23514';
  end if;
  update public.properties
     set status = p_status,
         published_at = case when p_status = 'published' then coalesce(published_at, now()) else published_at end
   where id = p_property_id;
  if not found then raise exception 'İlan bulunamadı' using errcode = 'P0002'; end if;
  perform private.audit('property.status', 'properties', p_property_id::text, jsonb_build_object('status', p_status, 'note', p_note));
end $$;

create or replace function public.admin_verify_check(p_check_id uuid, p_status text, p_note text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if p_status not in ('verified', 'rejected') then raise exception 'Geçersiz durum' using errcode = '22023'; end if;
  update public.property_authorization_checks
     set status = p_status, note = coalesce(p_note, note), verified_by = (select auth.uid()), verified_at = now()
   where id = p_check_id;
  if not found then raise exception 'Belge bulunamadı' using errcode = 'P0002'; end if;
  perform private.audit('authorization_check.' || p_status, 'property_authorization_checks', p_check_id::text);
end $$;

create or replace function public.admin_match_overview() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare res jsonb;
begin
  perform private.require_admin();
  select coalesce(jsonb_agg(jsonb_build_object('property_id', p.id, 'code', p.code, 'title', p.title,
           'exact', coalesce(x.exact, 0), 'near', coalesce(x.near, 0), 'best', x.best) order by coalesce(x.exact, 0) + coalesce(x.near, 0) desc), '[]'::jsonb)
    into res
  from public.properties p
  left join (
    select property_id, count(*) filter (where kind = 'exact') as exact, count(*) filter (where kind = 'near') as near, max(score) as best
    from private.property_matches where is_current group by property_id
  ) x on x.property_id = p.id
  where p.status = 'published';
  return res;
end $$;

create or replace function public.admin_set_match_setting(p_key text, p_value numeric) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if not public.is_superadmin() then raise exception 'Yalnızca süper yönetici' using errcode = '42501'; end if;
  update private.match_settings set value = p_value where key = p_key;
  if not found then raise exception 'Ayar bulunamadı' using errcode = 'P0002'; end if;
  perform private.audit('match_setting', 'match_settings', p_key, jsonb_build_object('value', p_value));
end $$;

create or replace function public.admin_audit_log(p_limit int default 100) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare res jsonb;
begin
  perform private.require_admin();
  if not public.is_superadmin() then raise exception 'Yalnızca süper yönetici' using errcode = '42501'; end if;
  select coalesce(jsonb_agg(to_jsonb(a) order by a.at desc), '[]'::jsonb) into res
  from (select * from private.audit_events order by at desc limit least(greatest(p_limit, 1), 1000)) a;
  return res;
end $$;

create or replace function public.admin_refresh_interest_snapshot() returns int
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  return private.refresh_interest_snapshot();
end $$;

-- KVKK silme talebi: kişisel alanlar anonimleştirilir, talep istatistiği korunur
create or replace function public.admin_erase_buyer(p_buyer_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin(true);
  if not public.is_superadmin() then raise exception 'Yalnızca süper yönetici' using errcode = '42501'; end if;
  update private.buyers
     set full_name = 'Silinmiş alıcı', phone = null, email = 'erased+' || id::text || '@invalid', nationality = null,
         user_id = null, marketing_opt_in = false, erased_at = now()
   where id = p_buyer_id;
  if not found then raise exception 'Alıcı bulunamadı' using errcode = 'P0002'; end if;
  update private.buyer_requests set note = null where buyer_id = p_buyer_id;
  perform private.audit('buyer.erase', 'buyers', p_buyer_id::text);
end $$;

-- ---------------------------------------------------------------
-- Yetkiler: her fonksiyon yalnızca hedef rolüne açılır
-- ---------------------------------------------------------------
revoke execute on all functions in schema private from public, anon, authenticated;

revoke execute on function public.submit_buyer_request(jsonb) from public;
revoke execute on function public.request_viewing(jsonb) from public;
revoke execute on function public.record_listing_view(uuid, text) from public, anon, authenticated;
revoke execute on function public.my_requests() from public, anon;
revoke execute on function public.bucket_interested(int) from public;
revoke execute on function public.partner_create_property(uuid, jsonb) from public, anon;
revoke execute on function public.partner_submit_property(uuid) from public, anon;
revoke execute on function public.partner_listing_stats(uuid) from public, anon;
revoke execute on function public.partner_get_private_details(uuid) from public, anon;
revoke execute on function public.admin_list_buyer_requests(text) from public, anon;
revoke execute on function public.admin_get_buyer_request(uuid) from public, anon;
revoke execute on function public.admin_set_request_status(uuid, text) from public, anon;
revoke execute on function public.admin_list_viewings(text) from public, anon;
revoke execute on function public.admin_set_viewing_status(uuid, text, text) from public, anon;
revoke execute on function public.admin_set_property_status(uuid, text, text) from public, anon;
revoke execute on function public.admin_verify_check(uuid, text, text) from public, anon;
revoke execute on function public.admin_match_overview() from public, anon;
revoke execute on function public.admin_set_match_setting(text, numeric) from public, anon;
revoke execute on function public.admin_audit_log(int) from public, anon;
revoke execute on function public.admin_refresh_interest_snapshot() from public, anon;
revoke execute on function public.admin_erase_buyer(uuid) from public, anon;

grant execute on function public.submit_buyer_request(jsonb) to anon, authenticated;
grant execute on function public.request_viewing(jsonb) to anon, authenticated;
grant execute on function public.record_listing_view(uuid, text) to service_role;
grant execute on function private.refresh_interest_snapshot(timestamptz) to service_role;
grant execute on function private.expire_authorizations() to service_role;
grant execute on function public.my_requests() to authenticated;
grant execute on function public.bucket_interested(int) to authenticated;
grant execute on function public.partner_create_property(uuid, jsonb) to authenticated;
grant execute on function public.partner_submit_property(uuid) to authenticated;
grant execute on function public.partner_listing_stats(uuid) to authenticated;
grant execute on function public.partner_get_private_details(uuid) to authenticated;
grant execute on function public.admin_list_buyer_requests(text) to authenticated;
grant execute on function public.admin_get_buyer_request(uuid) to authenticated;
grant execute on function public.admin_set_request_status(uuid, text) to authenticated;
grant execute on function public.admin_list_viewings(text) to authenticated;
grant execute on function public.admin_set_viewing_status(uuid, text, text) to authenticated;
grant execute on function public.admin_set_property_status(uuid, text, text) to authenticated;
grant execute on function public.admin_verify_check(uuid, text, text) to authenticated;
grant execute on function public.admin_match_overview() to authenticated;
grant execute on function public.admin_set_match_setting(text, numeric) to authenticated;
grant execute on function public.admin_audit_log(int) to authenticated;
grant execute on function public.admin_refresh_interest_snapshot() to authenticated;
grant execute on function public.admin_erase_buyer(uuid) to authenticated;
