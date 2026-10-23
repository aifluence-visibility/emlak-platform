-- =====================================================================
-- 005 · Eşleştirme motoru (kural tabanlı, deterministik — brief §9)
-- =====================================================================
-- src/lib/matching.ts ile aynı kurallar (otogaleri-havuz score_pair() deseninden uyarlandı):
--   * Kesin kriterlere uymayan ilan önerilmez.
--   * İlgisiz tür ve bütçeyi %budget_hard_limit'ten fazla aşan ilan önerilmez.
--   * "exact" yalnızca belirtilen tüm kriterler birebir uyduğunda verilir.
--   * Sonuçlar yalnızca private.property_matches'e yazılır; yalnızca yönetici okur.

create table private.match_settings (
  key   text primary key,
  value numeric not null,
  label text not null
);
alter table private.match_settings enable row level security;

insert into private.match_settings (key, value, label) values
  ('w_region', 25, 'Bölge'),
  ('w_budget', 25, 'Bütçe'),
  ('w_type', 15, 'Mülk türü'),
  ('w_rooms', 12, 'Oda sayısı'),
  ('w_sqm', 8, 'Net alan'),
  ('w_features', 10, 'Özellikler'),
  ('w_recency', 5, 'İlan güncelliği'),
  ('budget_tolerance', 0.10, 'Bütçe toleransı (kısmi puan)'),
  ('budget_hard_limit', 0.25, 'Bütçe üst sınırı (aşan önerilmez)'),
  ('min_score', 60, 'En düşük uyum yüzdesi');

create or replace function private.setting(p_key text) returns numeric
language sql stable set search_path = '' as $$
  select value from private.match_settings where key = p_key
$$;

-- Vatandaşlık koleksiyonu: ön uygun + yönetici onaylı + süresi geçmemiş + canlı
create or replace function public.citizenship_collection() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select c.property_id
  from public.citizenship_reviews c
  where c.status = 'preliminarily_eligible'
    and c.admin_approved
    and (c.expires_at is null or c.expires_at > now())
    and app.property_is_live(c.property_id)
$$;

create or replace function private.fmt_tl(p bigint) returns text
language sql immutable set search_path = '' as $$
  select replace(to_char(p, 'FM999,999,999,999'), ',', '.') || ' TL'
$$;

create or replace function private.score_pair(r private.buyer_requests, p public.properties)
returns table (score int, kind text, reasons jsonb)
language plpgsql stable set search_path = '' as $$
declare
  v_s numeric := 0;
  v_rs jsonb := '[]'::jsonb;
  v_exact boolean := true;
  v_strict text[] := coalesce(r.strict_keys, '{}');
  v_bedrooms int := case when p.rooms is null then null else split_part(p.rooms, '+', 1)::int end;
  v_over bigint;
  v_per numeric;
  v_f text;
  v_has boolean;
  v_label text;
  v_similar boolean;
begin
  if not app.property_is_live(p.id) then return; end if;
  if r.citizenship and p.id not in (select public.citizenship_collection()) then return; end if;

  -- Bölge
  if cardinality(r.districts) = 0 and cardinality(r.neighborhoods) = 0 then
    v_s := v_s + private.setting('w_region');
  elsif p.neighborhood = any(r.neighborhoods) or (cardinality(r.neighborhoods) = 0 and p.district = any(r.districts)) then
    v_s := v_s + private.setting('w_region');
    v_rs := v_rs || jsonb_build_object('t', 'ok', 'm', 'İstenen bölgede: ' || p.neighborhood);
  else
    v_exact := false;
    if 'bolge' = any(v_strict) then return; end if;
    if p.district = any(r.districts) or exists (
         select 1 from public.properties x where x.neighborhood = any(r.neighborhoods) and x.district = p.district) then
      v_s := v_s + private.setting('w_region') * 0.5;
      v_rs := v_rs || jsonb_build_object('t', 'alt', 'm', 'Aynı ilçede yakın alternatif: ' || p.neighborhood);
    else
      v_rs := v_rs || jsonb_build_object('t', 'warn', 'm', 'Farklı bölge: ' || p.neighborhood);
    end if;
  end if;

  -- Bütçe
  if r.budget_max is null or p.price <= r.budget_max then
    v_s := v_s + private.setting('w_budget');
    if r.budget_max is not null then
      v_rs := v_rs || jsonb_build_object('t', 'ok', 'm', 'Bütçe içinde: ' || private.fmt_tl(p.price));
    end if;
  else
    v_exact := false;
    if 'butce' = any(v_strict) then return; end if;
    if p.price > r.budget_max * (1 + private.setting('budget_hard_limit')) then return; end if;
    v_over := p.price - r.budget_max;
    if p.price <= r.budget_max * (1 + private.setting('budget_tolerance')) then
      v_s := v_s + private.setting('w_budget') * 0.5;
    end if;
    v_rs := v_rs || jsonb_build_object('t', 'warn', 'm', 'Bütçeyi ' || private.fmt_tl(v_over) || ' aşıyor');
  end if;

  -- Tür
  if cardinality(r.types) = 0 or p.type = any(r.types) then
    v_s := v_s + private.setting('w_type');
    if cardinality(r.types) > 0 then v_rs := v_rs || jsonb_build_object('t', 'ok', 'm', 'Aranan tür'); end if;
  else
    v_exact := false;
    if 'tip' = any(v_strict) then return; end if;
    v_similar := (p.type = 'detached' and 'villa' = any(r.types)) or (p.type = 'villa' and 'detached' = any(r.types))
            or (p.type = 'residence' and 'apartment' = any(r.types)) or (p.type = 'apartment' and 'residence' = any(r.types));
    if not v_similar then return; end if;  -- ilgisiz tür: öneri değil
    v_s := v_s + private.setting('w_type') * 0.5;
    v_rs := v_rs || jsonb_build_object('t', 'alt', 'm', 'Benzer tür');
  end if;

  -- Oda
  if r.rooms_min is null or (v_bedrooms is not null and v_bedrooms >= r.rooms_min) then
    v_s := v_s + private.setting('w_rooms');
    if r.rooms_min is not null then v_rs := v_rs || jsonb_build_object('t', 'ok', 'm', p.rooms || ' — en az ' || r.rooms_min || ' oda'); end if;
  else
    v_exact := false;
    if 'oda' = any(v_strict) then return; end if;
    if v_bedrooms is not null and v_bedrooms = r.rooms_min - 1 then v_s := v_s + private.setting('w_rooms') * 0.5; end if;
    v_rs := v_rs || jsonb_build_object('t', 'warn', 'm', coalesce(p.rooms || ' — istenenden az oda', 'Oda bilgisi yok'));
  end if;

  -- Alan
  if r.net_sqm_min is null or (p.net_sqm is not null and p.net_sqm >= r.net_sqm_min) then
    v_s := v_s + private.setting('w_sqm');
    if r.net_sqm_min is not null then v_rs := v_rs || jsonb_build_object('t', 'ok', 'm', 'Net ' || p.net_sqm || ' m²'); end if;
  else
    v_exact := false;
    if 'alan' = any(v_strict) then return; end if;
    if p.net_sqm is not null and p.net_sqm >= r.net_sqm_min * 0.85 then v_s := v_s + private.setting('w_sqm') * 0.5; end if;
    v_rs := v_rs || jsonb_build_object('t', 'warn', 'm', coalesce('Net ' || p.net_sqm || ' m² (istenen ' || r.net_sqm_min || ')', 'Net alan belirtilmemiş'));
  end if;

  -- Özellikler
  if cardinality(r.features) = 0 then
    v_s := v_s + private.setting('w_features');
  else
    v_per := private.setting('w_features') / cardinality(r.features);
    foreach v_f in array r.features loop
      v_has := case v_f
        when 'pool' then p.has_pool when 'garden' then p.has_garden when 'seaView' then p.has_sea_view
        when 'parking' then p.has_parking when 'furnished' then p.is_furnished when 'inSite' then p.in_site
        when 'creditEligible' then p.credit_eligible else false end;
      v_label := case v_f
        when 'pool' then 'Havuz' when 'garden' then 'Bahçe' when 'seaView' then 'Deniz manzarası'
        when 'parking' then 'Otopark' when 'furnished' then 'Eşyalı' when 'inSite' then 'Site içinde'
        when 'creditEligible' then 'Krediye uygun' else v_f end;
      if v_has then
        v_s := v_s + v_per;
        v_rs := v_rs || jsonb_build_object('t', 'ok', 'm', v_label);
      else
        v_exact := false;
        if v_f = any(v_strict) then return; end if;
        v_rs := v_rs || jsonb_build_object('t', 'warn', 'm', v_label || ' yok');
      end if;
    end loop;
  end if;

  -- Güncellik
  v_s := v_s + case when p.published_at > now() - interval '14 days' then private.setting('w_recency') else private.setting('w_recency') * 0.5 end;

  if round(v_s) < private.setting('min_score') then return; end if;
  return query select round(v_s)::int, case when v_exact then 'exact' else 'near' end, v_rs;
end $$;

-- Bir talebin eşleşmelerini yeniden hesaplar
create or replace function private.refresh_matches_for_request(p_request_id uuid) returns int
language plpgsql set search_path = '' as $$
declare r private.buyer_requests; n int;
begin
  select * into r from private.buyer_requests where id = p_request_id;
  if not found then return 0; end if;
  if r.status in ('closed_won', 'closed_lost') then
    update private.property_matches set is_current = false where request_id = p_request_id;
    return 0;
  end if;

  with fresh as (
    select p.id as property_id, m.score, m.kind, m.reasons
    from public.properties p
    cross join lateral private.score_pair(r, p) m
    where p.status = 'published'
  ), up as (
    insert into private.property_matches (request_id, property_id, score, kind, reasons, is_current, updated_at)
    select p_request_id, property_id, score, kind, reasons, true, now() from fresh
    on conflict (request_id, property_id) do update
      set score = excluded.score, kind = excluded.kind, reasons = excluded.reasons, is_current = true, updated_at = now()
    returning property_id
  )
  select count(*) into n from up;

  update private.property_matches pm set is_current = false, updated_at = now()
  where pm.request_id = p_request_id and pm.is_current
    and pm.property_id not in (
      select p.id from public.properties p cross join lateral private.score_pair(r, p) m where p.status = 'published');
  return n;
end $$;

-- Bir mülk değişince açık taleplerle eşleşmesini yeniden hesaplar
create or replace function private.refresh_matches_for_property(p_property_id uuid) returns void
language plpgsql set search_path = '' as $$
declare r private.buyer_requests; p public.properties; m record;
begin
  select * into p from public.properties where id = p_property_id;
  if not found then return; end if;
  update private.property_matches set is_current = false, updated_at = now() where property_id = p_property_id;
  for r in select * from private.buyer_requests where status not in ('closed_won', 'closed_lost') loop
    for m in select * from private.score_pair(r, p) loop
      insert into private.property_matches (request_id, property_id, score, kind, reasons, is_current, updated_at)
      values (r.id, p.id, m.score, m.kind, m.reasons, true, now())
      on conflict (request_id, property_id) do update
        set score = excluded.score, kind = excluded.kind, reasons = excluded.reasons, is_current = true, updated_at = now();
    end loop;
  end loop;
end $$;

create or replace function private.on_request_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.refresh_matches_for_request(new.id);
  return null;
end $$;
create trigger buyer_requests_match after insert or update on private.buyer_requests
  for each row execute function private.on_request_change();

create or replace function private.on_property_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.refresh_matches_for_property(new.id);
  return null;
end $$;
create trigger properties_match after insert or update of status, price, district, neighborhood, type, rooms, net_sqm,
  has_pool, has_garden, has_sea_view, has_parking, is_furnished, in_site, credit_eligible
  on public.properties for each row execute function private.on_property_change();

create or replace function private.on_link_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.refresh_matches_for_property(coalesce(new.property_id, old.property_id));
  return null;
end $$;
create trigger ppl_match after insert or update of authorization_status, authorized_until or delete
  on public.partner_property_links for each row execute function private.on_link_change();

-- Ziyaretçi tarafındaki "Bana Uygun Evi Bul" aynı ağırlıkları kullanır (kişisel veri değildir)
create or replace function public.match_weights() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_object_agg(key, value) from private.match_settings
$$;

revoke execute on function private.setting(text) from public, anon, authenticated;
revoke execute on function private.fmt_tl(bigint) from public, anon, authenticated;
revoke execute on function private.score_pair(private.buyer_requests, public.properties) from public, anon, authenticated;
revoke execute on function private.refresh_matches_for_request(uuid) from public, anon, authenticated;
revoke execute on function private.refresh_matches_for_property(uuid) from public, anon, authenticated;
revoke execute on function private.on_request_change() from public, anon, authenticated;
revoke execute on function private.on_property_change() from public, anon, authenticated;
revoke execute on function private.on_link_change() from public, anon, authenticated;
revoke all on private.match_settings from public, anon, authenticated;
grant execute on function public.citizenship_collection() to anon, authenticated;
grant execute on function public.match_weights() to anon, authenticated;
