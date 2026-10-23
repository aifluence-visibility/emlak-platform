-- =====================================================================
-- 004 · RLS politikaları ve tablo/sütun yetkileri (varsayılan: reddet)
-- =====================================================================
-- Her public tabloda RLS açık. Önce tüm istemci yetkileri kaldırılır, sonra yalnızca gerekenler verilir.
-- Partner yetkisi her zaman "kendi partner organizasyonu" ile sınırlıdır (my_partner_ids()).

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

alter table public.profiles                      enable row level security;
alter table public.platform_roles                enable row level security;
alter table public.partner_organizations         enable row level security;
alter table public.partner_memberships           enable row level security;
alter table public.partner_invitations           enable row level security;
alter table public.properties                    enable row level security;
alter table public.property_translations         enable row level security;
alter table public.property_media                enable row level security;
alter table public.partner_property_links        enable row level security;
alter table public.property_authorization_checks enable row level security;
alter table public.property_price_history        enable row level security;
alter table public.property_change_requests      enable row level security;
alter table public.property_merge_reviews        enable row level security;
alter table public.developments                  enable row level security;
alter table public.development_units             enable row level security;
alter table public.development_media             enable row level security;
alter table public.development_partner_links     enable row level security;
alter table public.citizenship_reviews           enable row level security;
alter table public.partner_availability          enable row level security;
alter table public.buyer_favorites               enable row level security;
alter table public.saved_searches                enable row level security;
alter table public.notification_preferences      enable row level security;

-- private tablolarında da RLS açık (ikinci savunma hattı; istemci rollerinin zaten yetkisi yok)
alter table private.property_private_details        enable row level security;
alter table private.buyers                          enable row level security;
alter table private.buyer_requests                  enable row level security;
alter table private.property_matches                enable row level security;
alter table private.viewing_requests                enable row level security;
alter table private.viewing_request_items           enable row level security;
alter table private.appointments                    enable row level security;
alter table private.appointment_partner_assignments enable row level security;
alter table private.viewing_status_history          enable row level security;
alter table private.interest_events                 enable row level security;
alter table private.listing_interest_snapshot       enable row level security;
alter table private.partner_agreements              enable row level security;
alter table private.referral_attributions           enable row level security;
alter table private.deal_progress                   enable row level security;
alter table private.admin_tasks                     enable row level security;
alter table private.audit_events                    enable row level security;

-- ---------------------------------------------------------------
-- Kimlik
-- ---------------------------------------------------------------
grant select, insert, update on public.profiles to authenticated;
create policy profiles_own on public.profiles for all to authenticated
  using (user_id = (select auth.uid()) or app.is_platform_admin())
  with check (user_id = (select auth.uid()) or app.is_platform_admin());

-- platform_roles: yalnızca superadmin yönetir; kullanıcı kendi satırını görebilir
grant select, insert, update, delete on public.platform_roles to authenticated;
create policy platform_roles_read on public.platform_roles for select to authenticated
  using (user_id = (select auth.uid()) or app.is_superadmin());
create policy platform_roles_write on public.platform_roles for all to authenticated
  using (app.is_superadmin()) with check (app.is_superadmin());

-- ---------------------------------------------------------------
-- Partner organizasyonları: partner yalnızca KENDİ organizasyonunu görür
-- ---------------------------------------------------------------
grant select, insert, update, delete on public.partner_organizations to authenticated;
create policy partner_org_member_read on public.partner_organizations for select to authenticated
  using (app.is_partner_member(id) or app.is_platform_admin());
create policy partner_org_admin_write on public.partner_organizations for all to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

grant select, insert, update, delete on public.partner_memberships to authenticated;
create policy partner_members_read on public.partner_memberships for select to authenticated
  using (app.is_partner_member(partner_id) or app.is_platform_admin());
create policy partner_members_admin_write on public.partner_memberships for all to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

grant select, insert, update, delete on public.partner_invitations to authenticated;
create policy partner_invitations_admin on public.partner_invitations for all to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

-- ---------------------------------------------------------------
-- Mülkler
--   anon/alıcı: yalnızca canlı ilanlar
--   partner  : yalnızca bağlantılı olduğu mülkler; düzenleme yalnızca tek sahipli taslakta ve izinli sütunlarda
--   yönetici : tümü
-- ---------------------------------------------------------------
grant select on public.properties to anon, authenticated;
grant update (
  title, summary, description, district, neighborhood, type, price, rooms, gross_sqm, net_sqm, land_sqm,
  building_age, floor, bathrooms, has_pool, has_garden, has_sea_view, has_parking, is_furnished, in_site,
  credit_eligible, title_deed, sea_distance_m, approx_lat, approx_lng
) on public.properties to authenticated;
grant insert, delete on public.properties to authenticated;  -- yalnızca yönetici (politika + tetikleyici)
grant update (status, code, slug, fact_sources, published_at, development_id) on public.properties to authenticated; -- yalnızca yönetici (tetikleyici)

create policy properties_public_read on public.properties for select to anon, authenticated
  using (app.property_is_live(id));
create policy properties_partner_read on public.properties for select to authenticated
  using (app.partner_links_property(id));
create policy properties_partner_update on public.properties for update to authenticated
  using (app.partner_can_edit_property(id)) with check (app.partner_can_edit_property(id));
create policy properties_admin_all on public.properties for all to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

grant select, insert, update, delete on public.property_translations to authenticated;
grant select on public.property_translations to anon;
create policy translations_public_read on public.property_translations for select to anon, authenticated
  using (app.property_is_live(property_id));
create policy translations_admin on public.property_translations for all to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

grant select on public.property_media to anon;
grant select, insert, update, delete on public.property_media to authenticated;
create policy media_public_read on public.property_media for select to anon, authenticated
  using (app.property_is_live(property_id));
create policy media_partner_read on public.property_media for select to authenticated
  using (app.partner_links_property(property_id));
create policy media_partner_write on public.property_media for insert to authenticated
  with check (app.partner_can_edit_property(property_id) and created_by = (select auth.uid()));
create policy media_partner_delete on public.property_media for delete to authenticated
  using (app.partner_can_edit_property(property_id));
create policy media_admin on public.property_media for all to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

-- ---------------------------------------------------------------
-- Partner bağlantıları: partner yalnızca KENDİ bağlantılarını görür (diğer ofislerin aynı mülkteki bağlantısı görünmez)
-- ---------------------------------------------------------------
grant select, insert, delete on public.partner_property_links to authenticated;
grant update (internal_ref, partner_asking_price, eids_reference) on public.partner_property_links to authenticated;
grant update (authorization_status, eids_status, authorized_from, authorized_until) on public.partner_property_links to authenticated; -- yalnızca yönetici (tetikleyici)
create policy links_partner_read on public.partner_property_links for select to authenticated
  using (app.is_partner_member(partner_id));
create policy links_partner_update on public.partner_property_links for update to authenticated
  using (app.is_partner_member(partner_id)) with check (app.is_partner_member(partner_id));
create policy links_admin on public.partner_property_links for all to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

grant select, insert on public.property_authorization_checks to authenticated;
grant update, delete on public.property_authorization_checks to authenticated; -- yalnızca yönetici (politika)
create policy auth_checks_partner_read on public.property_authorization_checks for select to authenticated
  using (exists (select 1 from public.partner_property_links l where l.id = link_id and app.is_partner_member(l.partner_id)));
create policy auth_checks_partner_insert on public.property_authorization_checks for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (select 1 from public.partner_property_links l where l.id = link_id and app.is_partner_member(l.partner_id))
  );
create policy auth_checks_admin on public.property_authorization_checks for all to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

grant select on public.property_price_history to authenticated;
create policy price_history_read on public.property_price_history for select to authenticated
  using (app.is_platform_admin() or app.partner_links_property(property_id));

grant select, insert on public.property_change_requests to authenticated;
grant update on public.property_change_requests to authenticated;
create policy change_req_partner_read on public.property_change_requests for select to authenticated
  using (app.is_partner_member(partner_id));
create policy change_req_partner_insert on public.property_change_requests for insert to authenticated
  with check (
    app.is_partner_member(partner_id) and status = 'pending' and created_by = (select auth.uid())
    and exists (select 1 from public.partner_property_links l where l.property_id = property_change_requests.property_id and l.partner_id = property_change_requests.partner_id)
  );
create policy change_req_admin on public.property_change_requests for all to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

grant select, insert, update, delete on public.property_merge_reviews to authenticated;
create policy merge_reviews_admin on public.property_merge_reviews for all to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

-- ---------------------------------------------------------------
-- Projeler
-- ---------------------------------------------------------------
grant select on public.developments, public.development_units, public.development_media to anon;
grant select, insert, update, delete on public.developments, public.development_media to authenticated;
grant select, insert, delete on public.development_units to authenticated;
grant update (price, availability) on public.development_units to authenticated;
grant update (label, rooms, net_sqm, gross_sqm, property_id, development_id) on public.development_units to authenticated; -- yalnızca yönetici (politika)

create or replace function app.partner_links_development(p_development_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.development_partner_links d
    where d.development_id = p_development_id and d.partner_id in (select app.my_partner_ids())
  )
$$;
grant execute on function app.partner_links_development(uuid) to authenticated;

create policy dev_public_read on public.developments for select to anon, authenticated using (is_published);
create policy dev_partner_read on public.developments for select to authenticated using (app.partner_links_development(id));
create policy dev_admin on public.developments for all to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

create policy units_public_read on public.development_units for select to anon, authenticated
  using (exists (select 1 from public.developments d where d.id = development_id and d.is_published));
create policy units_partner_read on public.development_units for select to authenticated
  using (app.partner_links_development(development_id));
-- Partner yalnızca fiyat ve satış durumunu günceller (sütun yetkisi); diğer sütunlar tetikleyiciyle korunur
create policy units_partner_update on public.development_units for update to authenticated
  using (app.partner_links_development(development_id)) with check (app.partner_links_development(development_id));
create policy units_admin on public.development_units for all to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

create or replace function app.guard_unit_write() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') and not app.is_platform_admin() then
    if new.label <> old.label or new.rooms is distinct from old.rooms or new.net_sqm is distinct from old.net_sqm
       or new.gross_sqm is distinct from old.gross_sqm or new.property_id is distinct from old.property_id
       or new.development_id <> old.development_id then
      raise exception 'Bu alanlar yalnızca platform tarafından değiştirilebilir';
    end if;
  end if;
  return new;
end $$;
revoke execute on function app.guard_unit_write() from public, anon, authenticated;
create trigger units_guard before update on public.development_units for each row execute function app.guard_unit_write();

create policy dev_media_public_read on public.development_media for select to anon, authenticated
  using (exists (select 1 from public.developments d where d.id = development_id and d.is_published));
create policy dev_media_admin on public.development_media for all to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

grant select, insert, update, delete on public.development_partner_links to authenticated;
create policy dev_links_partner_read on public.development_partner_links for select to authenticated
  using (app.is_partner_member(partner_id));
create policy dev_links_admin on public.development_partner_links for all to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

-- ---------------------------------------------------------------
-- Vatandaşlık incelemesi: yalnızca yönetici. Ziyaretçi yalnızca citizenship_collection() ile mülk kimliklerini alır.
-- ---------------------------------------------------------------
grant select, insert, update, delete on public.citizenship_reviews to authenticated;
create policy citizenship_admin on public.citizenship_reviews for all to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

-- ---------------------------------------------------------------
-- Partner müsaitliği: kendi kayıtları
-- ---------------------------------------------------------------
grant select, insert, update, delete on public.partner_availability to authenticated;
create policy availability_own on public.partner_availability for all to authenticated
  using (app.is_partner_member(partner_id) or app.is_platform_admin())
  with check (app.is_partner_member(partner_id) or app.is_platform_admin());

-- ---------------------------------------------------------------
-- Kayıtlı alıcının kendi kayıtları
-- ---------------------------------------------------------------
grant select, insert, delete on public.buyer_favorites to authenticated;
create policy favorites_own_read on public.buyer_favorites for select to authenticated
  using (user_id = (select auth.uid()));
create policy favorites_own_insert on public.buyer_favorites for insert to authenticated
  with check (user_id = (select auth.uid()) and app.property_is_live(property_id));
create policy favorites_own_delete on public.buyer_favorites for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.saved_searches to authenticated;
create policy saved_searches_own on public.saved_searches for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update on public.notification_preferences to authenticated;
create policy notif_own on public.notification_preferences for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- private tablolarında istemci rolleri için HİÇBİR politika yoktur (yetki de yoktur).
