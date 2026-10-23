-- =====================================================================
-- RLS ve izolasyon testleri (ARCHITECTURE.md §7 matrisi)
-- =====================================================================
-- Tamamı tek bir işlem içinde çalışır ve sonunda ROLLBACK edilir: veritabanında iz bırakmaz.
-- Herhangi bir kontrol başarısız olursa "BAŞARISIZ: ..." hatasıyla durur.
-- ÖNEMLİ: Yalnızca boş/test projesinde veya yerel veritabanında çalıştırın; gerçek verili üretim veritabanında ÇALIŞTIRMAYIN.
--
-- Kimlikler: yönetici, PII yetkisiz operatör, A ofisi (sahip + çalışan), B ofisi, askıya alınmış C ofisi,
--            alıcı 1, alıcı 2, ziyaretçi (anon), sunucu (service_role).

begin;

-- ---------------------------------------------------------------
-- Test yardımcıları
-- ---------------------------------------------------------------
create schema tests;
grant usage on schema tests to anon, authenticated, service_role;

create function tests.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;
create function tests.logout() returns void language sql as $$
  select set_config('request.jwt.claims', '', true);
$$;
create function tests.ok(p_cond boolean, p_msg text) returns void language plpgsql as $$
begin
  if p_cond is not true then raise exception 'BAŞARISIZ: %', p_msg; end if;
  perform set_config('tests.passed', (coalesce(nullif(current_setting('tests.passed', true), ''), '0')::int + 1)::text, true);
  raise notice 'ok - %', p_msg;
end $$;
create function tests.throws(p_sql text, p_msg text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    perform tests.ok(true, p_msg || ' (' || sqlerrm || ')');
    return;
  end;
  raise exception 'BAŞARISIZ (hata bekleniyordu): %', p_msg;
end $$;
create function tests.rows(p_sql text) returns int language plpgsql as $$
declare n int;
begin
  execute 'select count(*) from (' || p_sql || ') t' into n;
  return n;
end $$;
create function tests.affected(p_sql text) returns int language plpgsql as $$
declare n int;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on all functions in schema tests to anon, authenticated, service_role;

-- ---------------------------------------------------------------
-- Sabit test verisi (yönetici yetkisiyle, sentetik)
-- ---------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-0000-0000-0000-000000000001', 'admin@example.invalid'),
  ('11111111-0000-0000-0000-000000000002', 'operator@example.invalid'),
  ('11111111-0000-0000-0000-000000000003', 'a-owner@example.invalid'),
  ('11111111-0000-0000-0000-000000000004', 'a-staff@example.invalid'),
  ('11111111-0000-0000-0000-000000000005', 'b-owner@example.invalid'),
  ('11111111-0000-0000-0000-000000000006', 'c-owner@example.invalid'),
  ('11111111-0000-0000-0000-000000000007', 'buyer1@example.invalid'),
  ('11111111-0000-0000-0000-000000000008', 'buyer2@example.invalid');

insert into public.platform_roles (user_id, role, can_view_pii) values
  ('11111111-0000-0000-0000-000000000001', 'superadmin', true),
  ('11111111-0000-0000-0000-000000000002', 'operator', false);

insert into public.partner_organizations (id, name, district, status) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'Test Ofis A', 'bodrum', 'active'),
  ('aaaaaaaa-0000-0000-0000-00000000000b', 'Test Ofis B', 'bodrum', 'active'),
  ('aaaaaaaa-0000-0000-0000-00000000000c', 'Test Ofis C', 'milas', 'suspended');

insert into public.partner_memberships (partner_id, user_id, role) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', '11111111-0000-0000-0000-000000000003', 'owner'),
  ('aaaaaaaa-0000-0000-0000-00000000000a', '11111111-0000-0000-0000-000000000004', 'staff'),
  ('aaaaaaaa-0000-0000-0000-00000000000b', '11111111-0000-0000-0000-000000000005', 'owner'),
  ('aaaaaaaa-0000-0000-0000-00000000000c', '11111111-0000-0000-0000-000000000006', 'owner');

insert into public.properties (id, code, slug, title, district, neighborhood, type, status, price, rooms, net_sqm, has_pool, has_sea_view, published_at) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'BD-T001', 'p1', 'P1 Yalıkavak villa', 'bodrum', 'Yalıkavak', 'villa', 'published', 50000000, '4+1', 220, true, true, now()),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'BD-T002', 'p2', 'P2 Bitez daire', 'bodrum', 'Bitez', 'apartment', 'published', 12000000, '2+1', 90, true, false, now()),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'BD-T003', 'p3', 'P3 Gündoğan villa (ortak)', 'bodrum', 'Gündoğan', 'villa', 'published', 28000000, '3+1', 160, true, true, now()),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'BD-T004', 'p4', 'P4 Taslak villa (A)', 'bodrum', 'Bitez', 'villa', 'draft', 25000000, '3+1', 150, true, false, null),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'BD-T005', 'p5', 'P5 İnceleme bekleyen villa (B)', 'bodrum', 'Torba', 'villa', 'pending_admin_review', 29000000, '3+1', 170, true, true, null),
  ('bbbbbbbb-0000-0000-0000-000000000006', 'BD-T006', 'p6', 'P6 Bütçe üstü villa (A)', 'bodrum', 'Yalıkavak', 'villa', 'published', 38000000, '4+1', 200, true, true, now()),
  ('bbbbbbbb-0000-0000-0000-000000000007', 'ML-T007', 'p7', 'P7 Askıdaki ofisin villası (C)', 'milas', 'Güllük', 'villa', 'published', 20000000, '3+1', 150, true, true, now());

insert into private.property_private_details (property_id, exact_address, owner_notes) values
  ('bbbbbbbb-0000-0000-0000-000000000004', 'Gizli adres A', 'Sahip notu'),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'Gizli adres B', 'Sahip notu');

insert into public.partner_property_links (id, partner_id, property_id, internal_ref, authorization_status, eids_status, authorized_from, authorized_until, partner_asking_price) values
  ('cccccccc-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-00000000000a', 'bbbbbbbb-0000-0000-0000-000000000001', 'A-REF-1', 'active', 'verified', current_date - 30, current_date + 180, 50000000),
  ('cccccccc-0000-0000-0000-0000000000b2', 'aaaaaaaa-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-000000000002', 'B-REF-2', 'active', 'verified', current_date - 30, current_date + 180, 12000000),
  ('cccccccc-0000-0000-0000-0000000000a3', 'aaaaaaaa-0000-0000-0000-00000000000a', 'bbbbbbbb-0000-0000-0000-000000000003', 'A-REF-3', 'active', 'verified', current_date - 30, current_date + 180, 28000000),
  ('cccccccc-0000-0000-0000-0000000000b3', 'aaaaaaaa-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-000000000003', 'B-GIZLI-3', 'active', 'verified', current_date - 30, current_date + 180, 27500000),
  ('cccccccc-0000-0000-0000-0000000000a4', 'aaaaaaaa-0000-0000-0000-00000000000a', 'bbbbbbbb-0000-0000-0000-000000000004', 'A-REF-4', 'pending', 'not_started', null, null, 25000000),
  ('cccccccc-0000-0000-0000-0000000000b5', 'aaaaaaaa-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-000000000005', 'B-REF-5', 'active', 'pending', current_date, current_date + 180, 29000000),
  ('cccccccc-0000-0000-0000-0000000000a6', 'aaaaaaaa-0000-0000-0000-00000000000a', 'bbbbbbbb-0000-0000-0000-000000000006', 'A-REF-6', 'active', 'verified', current_date - 30, current_date + 180, 38000000),
  ('cccccccc-0000-0000-0000-0000000000c7', 'aaaaaaaa-0000-0000-0000-00000000000c', 'bbbbbbbb-0000-0000-0000-000000000007', 'C-REF-7', 'active', 'verified', current_date - 30, current_date + 180, 20000000);

insert into public.property_authorization_checks (id, link_id, kind, status) values
  ('dddddddd-0000-0000-0000-0000000000b5', 'cccccccc-0000-0000-0000-0000000000b5', 'authorization_document', 'submitted');

insert into public.citizenship_reviews (property_id, status, admin_approved, checklist, expires_at) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'preliminarily_eligible', true,
   '{"threshold_current_law":true,"official_valuation":true,"title_eligible":true,"ownership_history":true,"foreign_ownership_restrictions":true,"sale_restriction_annotation":true,"agency_rules":true}',
   now() + interval '90 days'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'preliminarily_eligible', false,
   '{"threshold_current_law":true,"official_valuation":true,"title_eligible":true,"ownership_history":true,"foreign_ownership_restrictions":true,"sale_restriction_annotation":true,"agency_rules":true}',
   null);

insert into storage.objects (bucket_id, name) values
  ('property-media', 'bbbbbbbb-0000-0000-0000-000000000001/kapak.jpg'),
  ('property-media', 'bbbbbbbb-0000-0000-0000-000000000005/taslak.jpg'),
  ('partner-documents', 'aaaaaaaa-0000-0000-0000-00000000000b/cccccccc-0000-0000-0000-0000000000b5/yetki.pdf');

-- =================================================================
-- 1) ZİYARETÇİ (anon)
-- =================================================================
select tests.logout();
set local role anon;

select tests.ok(tests.rows('select 1 from public.properties') = 4, 'anon: yalnızca canlı ilanlar (P1, P2, P3, P6) görünür');
select tests.ok(tests.rows($$select 1 from public.properties where status <> 'published'$$) = 0, 'anon: taslak/incelemedeki ilan görünmez');
select tests.ok(tests.rows($$select 1 from public.properties where code = 'ML-T007'$$) = 0, 'anon: askıya alınmış ofisin ilanı canlı sayılmaz');
select tests.throws('select * from public.partner_property_links', 'anon: partner bağlantıları okunamaz');
select tests.throws('select * from public.partner_organizations', 'anon: ofis listesi okunamaz');
select tests.throws('select * from public.citizenship_reviews', 'anon: vatandaşlık incelemeleri okunamaz');
select tests.throws('select * from private.buyers', 'anon: alıcı tablosu okunamaz');
select tests.throws('select * from private.property_private_details', 'anon: kesin adresler okunamaz');
select tests.throws('select public.admin_list_buyer_requests(null)', 'anon: yönetici fonksiyonu çağrılamaz');
select tests.throws($$select public.record_listing_view('bbbbbbbb-0000-0000-0000-000000000001', repeat('a', 64))$$, 'anon: görüntüleme sayacı doğrudan yazılamaz');
select tests.ok(
  (select array_agg(x order by x) from public.citizenship_collection() x) = array['bbbbbbbb-0000-0000-0000-000000000001'::uuid],
  'anon: vatandaşlık koleksiyonu yalnızca onaylı mülk (P1); onay bekleyen P3 yok');
select tests.ok(tests.rows($$select 1 from storage.objects where bucket_id = 'property-media'$$) = 1, 'anon: yalnızca canlı ilanın dosyası okunur');
select tests.ok(tests.rows($$select 1 from storage.objects where bucket_id = 'partner-documents'$$) = 0, 'anon: partner belgeleri görünmez');

-- Talep bırakma: yayında olmayan ilan kimliği sessizce elenir
select tests.ok(public.submit_buyer_request(jsonb_build_object(
  'full_name', 'Test Alıcı Bir', 'email', 'alici1@example.invalid', 'consent', true, 'source', 'match_wizard',
  'districts', jsonb_build_array('bodrum'), 'types', jsonb_build_array('villa'), 'budget_max', 30000000,
  'features', jsonb_build_array('pool'),
  'property_ids', jsonb_build_array('bbbbbbbb-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000004')
)) like 'T-%', 'anon: talep bırakabilir, yalnızca talep kodu döner');
select tests.throws($$select public.submit_buyer_request('{"full_name":"X Y","email":"x@example.invalid","consent":false}')$$, 'anon: aydınlatma onayı olmadan talep reddedilir');
select tests.throws($$select public.submit_buyer_request('{"full_name":"X Y","email":"x@example.invalid","consent":true,"source":"phone"}')$$, 'anon: yalnızca yöneticinin kullanabileceği kaynak reddedilir');
select tests.throws($$select public.request_viewing(jsonb_build_object('full_name','X Y','phone','5550000000','consent',true,
  'property_ids', jsonb_build_array('bbbbbbbb-0000-0000-0000-000000000004')))$$, 'anon: yalnızca taslak ilan için randevu istenemez');
select tests.ok(public.request_viewing(jsonb_build_object('full_name', 'Test Alıcı İki', 'phone', '+90 555 000 00 99', 'consent', true,
  'availability', 'Hafta sonu', 'property_ids', jsonb_build_array('bbbbbbbb-0000-0000-0000-000000000001'))) like 'R-%',
  'anon: canlı ilan için randevu talebi oluşturur');
select tests.ok(public.submit_buyer_request(jsonb_build_object('full_name', 'Test Alıcı Üç', 'email', 'alici3@example.invalid', 'consent', true,
  'source', 'listing_inquiry', 'property_ids', jsonb_build_array('bbbbbbbb-0000-0000-0000-000000000001'))) like 'T-%', 'anon: ilan için bilgi talebi');
select tests.ok(public.submit_buyer_request(jsonb_build_object('full_name', 'Test Alıcı Dört', 'email', 'alici4@example.invalid', 'consent', true,
  'source', 'listing_inquiry', 'property_ids', jsonb_build_array('bbbbbbbb-0000-0000-0000-000000000001'))) like 'T-%', 'anon: ilan için ikinci kişiden bilgi talebi');
-- Aynı kişi tekrar talep gönderir (ilgilenen sayısını artırmamalı)
select public.submit_buyer_request(jsonb_build_object('full_name', 'Test Alıcı Dört', 'email', 'alici4@example.invalid', 'consent', true,
  'source', 'listing_inquiry', 'property_ids', jsonb_build_array('bbbbbbbb-0000-0000-0000-000000000001')));
reset role;

-- Hız sınırı (aynı iletişim bilgisi saatte en fazla 5)
set local role anon;
select public.submit_buyer_request(jsonb_build_object('full_name', 'Spam Test', 'email', 'spam@example.invalid', 'consent', true)) from generate_series(1, 5);
select tests.throws($$select public.submit_buyer_request(jsonb_build_object('full_name','Spam Test','email','spam@example.invalid','consent',true))$$, 'anon: aynı iletişimden 6. talep hız sınırına takılır');
reset role;

-- =================================================================
-- 2) SUNUCU (service_role): görüntüleme olayları ve gecikmeli özet
-- =================================================================
set local role service_role;
select public.record_listing_view('bbbbbbbb-0000-0000-0000-000000000001', repeat('1', 64)) from generate_series(1, 3); -- aynı kişi, aynı gün, 3 kez
select public.record_listing_view('bbbbbbbb-0000-0000-0000-000000000001', repeat('2', 64));
select public.record_listing_view('bbbbbbbb-0000-0000-0000-000000000004', repeat('3', 64)); -- taslak: kaydedilmez
reset role;
-- Gecikme kontrolü: kesimden sonraki olay sayılmamalı
insert into private.interest_events (property_id, actor_key, type, at) values ('bbbbbbbb-0000-0000-0000-000000000001', repeat('9', 64), 'inquiry', now() + interval '2 hours');

-- Kayıtlı alıcılar favori ekler/çıkarır
select tests.login('11111111-0000-0000-0000-000000000007');
set local role authenticated;
insert into public.buyer_favorites (user_id, property_id) values ('11111111-0000-0000-0000-000000000007', 'bbbbbbbb-0000-0000-0000-000000000001');
delete from public.buyer_favorites where property_id = 'bbbbbbbb-0000-0000-0000-000000000001';
insert into public.buyer_favorites (user_id, property_id) values ('11111111-0000-0000-0000-000000000007', 'bbbbbbbb-0000-0000-0000-000000000001');
select tests.throws($$insert into public.buyer_favorites (user_id, property_id) values ('11111111-0000-0000-0000-000000000007', 'bbbbbbbb-0000-0000-0000-000000000004')$$, 'alıcı: taslak ilan favoriye eklenemez');
select tests.throws($$insert into public.buyer_favorites (user_id, property_id) values ('11111111-0000-0000-0000-000000000008', 'bbbbbbbb-0000-0000-0000-000000000002')$$, 'alıcı: başkası adına favori eklenemez');
select tests.throws('select * from private.buyers', 'alıcı: alıcı tablosu okunamaz');
select tests.ok(tests.rows('select 1 from public.partner_property_links') = 0, 'alıcı: hiçbir partner bağlantısı görünmez');
reset role;
select tests.login('11111111-0000-0000-0000-000000000008');
set local role authenticated;
insert into public.buyer_favorites (user_id, property_id) values ('11111111-0000-0000-0000-000000000008', 'bbbbbbbb-0000-0000-0000-000000000001');
select tests.ok(tests.rows('select 1 from public.buyer_favorites') = 1, 'alıcı 2: yalnızca kendi favorisini görür');
select tests.ok(jsonb_array_length(public.my_requests()) = 0, 'alıcı 2: başkasının taleplerini görmez');
reset role;

set local role service_role;
select private.refresh_interest_snapshot(now() + interval '1 minute');
reset role;

-- =================================================================
-- 3) PARTNER A (sahip)
-- =================================================================
select tests.login('11111111-0000-0000-0000-000000000003');
set local role authenticated;

select tests.ok(tests.rows('select 1 from public.partner_organizations') = 1, 'A: yalnızca kendi ofisini görür');
select tests.ok(tests.rows($$select 1 from public.partner_organizations where name <> 'Test Ofis A'$$) = 0, 'A: başka ofisin adı görünmez');
select tests.ok(tests.rows('select 1 from public.partner_memberships') = 2, 'A: yalnızca kendi ofisinin üyelerini görür');
select tests.ok(tests.rows('select 1 from public.partner_property_links') = 4, 'A: yalnızca kendi 4 bağlantısını görür');
select tests.ok(tests.rows($$select 1 from public.partner_property_links where partner_id <> 'aaaaaaaa-0000-0000-0000-00000000000a'$$) = 0, 'A: ortak ilan P3''te B''nin bağlantısı görünmez');
select tests.ok(tests.rows($$select 1 from public.partner_property_links where internal_ref = 'B-GIZLI-3'$$) = 0, 'A: B''nin iç referansı ve fiyatı görünmez');
select tests.ok(tests.rows($$select 1 from public.properties where id = 'bbbbbbbb-0000-0000-0000-000000000004'$$) = 1, 'A: kendi taslağını görür');
select tests.ok(tests.rows($$select 1 from public.properties where id = 'bbbbbbbb-0000-0000-0000-000000000005'$$) = 0, 'A: B''nin incelemedeki ilanını görmez');
select tests.ok(tests.rows('select 1 from public.citizenship_reviews') = 0, 'A: vatandaşlık inceleme kayıtlarını görmez');
select tests.ok(tests.rows($$select 1 from storage.objects where name like 'bbbbbbbb-0000-0000-0000-000000000005/%'$$) = 0, 'A: B''nin taslak fotoğrafını göremez');
select tests.ok(tests.rows($$select 1 from storage.objects where bucket_id = 'partner-documents'$$) = 0, 'A: B''nin belgelerini göremez');

-- Alıcı verisine hiçbir yoldan erişemez
select tests.throws('select * from private.buyers', 'A: alıcılar okunamaz');
select tests.throws('select * from private.buyer_requests', 'A: talepler okunamaz');
select tests.throws('select * from private.property_matches', 'A: eşleşmeler okunamaz');
select tests.throws('select * from private.viewing_requests', 'A: randevu talepleri okunamaz');
select tests.throws('select * from private.appointments', 'A: randevular okunamaz');
select tests.throws('select * from private.interest_events', 'A: ham ilgi olayları okunamaz');
select tests.throws('select * from private.listing_interest_snapshot', 'A: ham istatistik özeti okunamaz');
select tests.throws('select * from private.audit_events', 'A: denetim kayıtları okunamaz');
select tests.throws('select * from private.partner_agreements', 'A: sözleşmeler okunamaz');
select tests.throws('select public.admin_list_buyer_requests(null)', 'A: yönetici talep listesi çağrılamaz');
select tests.throws($$select public.admin_get_buyer_request(gen_random_uuid())$$, 'A: yönetici alıcı detayı çağrılamaz');
select tests.throws('select public.admin_list_viewings(null)', 'A: yönetici randevu listesi çağrılamaz');
select tests.throws('select public.admin_match_overview()', 'A: eşleşme özeti çağrılamaz');
select tests.throws('select private.refresh_interest_snapshot()', 'A: özet yenileme çağrılamaz');

-- İstatistikler: yalnızca kendi yayındaki ilanları, kova uygulanmış
select tests.ok(tests.rows($$select 1 from public.partner_listing_stats('aaaaaaaa-0000-0000-0000-00000000000a')$$) = 3, 'A: istatistik yalnızca kendi 3 yayındaki ilanı için');
select tests.ok((select views from public.partner_listing_stats('aaaaaaaa-0000-0000-0000-00000000000a') where code = 'BD-T001') = 2, 'A: görüntülenme tekil kişi-gün (aynı kişinin 3 ziyareti = 1)');
select tests.ok((select favorites from public.partner_listing_stats('aaaaaaaa-0000-0000-0000-00000000000a') where code = 'BD-T001') = 2, 'A: favori son durum (ekle-çıkar-ekle = 1) + ikinci alıcı = 2');
select tests.ok((select interested from public.partner_listing_stats('aaaaaaaa-0000-0000-0000-00000000000a') where code = 'BD-T001') = '3', 'A: ilgilenen tekil (tekrar talep sayılmaz, gecikmeli olay sayılmaz) = 3');
select tests.ok((select interested from public.partner_listing_stats('aaaaaaaa-0000-0000-0000-00000000000a') where code = 'BD-T003') = '1–2', 'A: 1 ilgilenen "1–2" olarak döner');
select tests.throws($$select * from public.partner_listing_stats('aaaaaaaa-0000-0000-0000-00000000000b')$$, 'A: B''nin istatistiklerini isteyemez');

-- Yazma kuralları
select tests.ok(tests.affected($$update public.partner_property_links set internal_ref = 'X' where id = 'cccccccc-0000-0000-0000-0000000000b3'$$) = 0, 'A: B''nin bağlantısını güncelleyemez');
select tests.ok(tests.affected($$update public.partner_property_links set internal_ref = 'A-YENI' where id = 'cccccccc-0000-0000-0000-0000000000a1'$$) = 1, 'A: kendi iç referansını güncelleyebilir');
select tests.throws($$update public.partner_property_links set authorization_status = 'active' where id = 'cccccccc-0000-0000-0000-0000000000a4'$$, 'A: kendi yetki durumunu aktif yapamaz');
select tests.throws($$update public.partner_property_links set eids_status = 'verified' where id = 'cccccccc-0000-0000-0000-0000000000a4'$$, 'A: EİDS doğrulamasını kendisi yapamaz');
select tests.ok(tests.affected($$update public.properties set price = 1 where id = 'bbbbbbbb-0000-0000-0000-000000000001'$$) = 0, 'A: yayındaki ilanı doğrudan değiştiremez');
select tests.ok(tests.affected($$update public.properties set price = 1 where id = 'bbbbbbbb-0000-0000-0000-000000000003'$$) = 0, 'A: ortak ilanı (P3) değiştiremez');
select tests.ok(tests.affected($$update public.properties set price = 26000000 where id = 'bbbbbbbb-0000-0000-0000-000000000004'$$) = 1, 'A: kendi taslağının fiyatını değiştirebilir');
select tests.throws($$update public.properties set status = 'published' where id = 'bbbbbbbb-0000-0000-0000-000000000004'$$, 'A: taslağını kendisi yayınlayamaz');
select tests.throws($$update public.properties set fact_sources = '{"net_sqm":"verified"}' where id = 'bbbbbbbb-0000-0000-0000-000000000004'$$, 'A: "doğrulandı" işaretini kendisi koyamaz');
select tests.throws($$insert into public.properties (code, slug, title, district, neighborhood, type, price) values ('BD-X', 'x', 'Doğrudan ekleme', 'bodrum', 'Bitez', 'villa', 1)$$, 'A: mülk tablosuna doğrudan ekleme yapamaz');
select tests.throws($$insert into public.partner_property_links (partner_id, property_id) values ('aaaaaaaa-0000-0000-0000-00000000000a', 'bbbbbbbb-0000-0000-0000-000000000002')$$, 'A: başka ilana kendini bağlayamaz');
select tests.throws($$insert into public.property_authorization_checks (link_id, kind, status, created_by) values ('cccccccc-0000-0000-0000-0000000000a4', 'authorization_document', 'verified', '11111111-0000-0000-0000-000000000003')$$, 'A: belgesini "doğrulandı" olarak gönderemez');
select tests.throws($$insert into public.property_authorization_checks (link_id, kind, created_by) values ('cccccccc-0000-0000-0000-0000000000b5', 'authorization_document', '11111111-0000-0000-0000-000000000003')$$, 'A: B''nin bağlantısına belge ekleyemez');
insert into public.property_authorization_checks (link_id, kind, created_by) values ('cccccccc-0000-0000-0000-0000000000a4', 'authorization_document', '11111111-0000-0000-0000-000000000003');
select tests.ok(public.partner_submit_property('bbbbbbbb-0000-0000-0000-000000000004') = 'pending_eids_verification', 'A: belgesi olan taslak EİDS doğrulamasına gönderilir');
select tests.ok(public.partner_get_private_details('bbbbbbbb-0000-0000-0000-000000000004') ->> 'exact_address' = 'Gizli adres A', 'A: kendi ilanının adresini okur');
select tests.ok(public.partner_get_private_details('bbbbbbbb-0000-0000-0000-000000000004') ->> 'owner_notes' is null, 'A: sahip notları partnere dönmez');
select tests.ok(public.partner_get_private_details('bbbbbbbb-0000-0000-0000-000000000005') is null, 'A: B''nin ilanının adresini okuyamaz');
select tests.throws($$select public.partner_create_property('aaaaaaaa-0000-0000-0000-00000000000b', '{"title":"Sahte ilan B adına","district":"bodrum","neighborhood":"Bitez","type":"villa","price":1}')$$, 'A: B adına ilan oluşturamaz');
select tests.ok(public.partner_create_property('aaaaaaaa-0000-0000-0000-00000000000a',
  '{"title":"Yeni taslak villa","district":"bodrum","neighborhood":"Bitez","type":"villa","price":20000000,"exact_address":"Gizli yeni adres"}') is not null,
  'A: kendi adına taslak oluşturur');
select tests.ok(tests.rows($$select 1 from storage.objects where bucket_id = 'property-media'$$) = 1, 'A: yalnızca canlı/kendi ilan dosyaları (P1)');
select tests.throws($$insert into storage.objects (bucket_id, name) values ('partner-documents', 'aaaaaaaa-0000-0000-0000-00000000000b/cccccccc-0000-0000-0000-0000000000b5/sahte.pdf')$$, 'A: B''nin belge klasörüne yükleyemez');
insert into storage.objects (bucket_id, name) values ('partner-documents', 'aaaaaaaa-0000-0000-0000-00000000000a/cccccccc-0000-0000-0000-0000000000a4/yetki.pdf');
select tests.throws($$insert into storage.objects (bucket_id, name) values ('partner-documents', 'aaaaaaaa-0000-0000-0000-00000000000a/cccccccc-0000-0000-0000-0000000000b5/yanlis.pdf')$$, 'A: kendi klasöründe B''nin bağlantısına belge yükleyemez');
reset role;

-- =================================================================
-- 4) PARTNER A (çalışan) ve B ve askıdaki C
-- =================================================================
select tests.login('11111111-0000-0000-0000-000000000004');
set local role authenticated;
select tests.ok(tests.rows('select 1 from public.partner_property_links') = 5, 'A çalışanı: ofisinin bağlantılarını görür (yeni taslak dahil)');
select tests.throws('select * from private.buyers', 'A çalışanı: alıcılar okunamaz');
reset role;

select tests.login('11111111-0000-0000-0000-000000000005');
set local role authenticated;
select tests.ok(tests.rows('select 1 from public.partner_property_links') = 3, 'B: yalnızca kendi 3 bağlantısını görür');
select tests.ok(tests.rows($$select 1 from public.partner_property_links where internal_ref like 'A-%'$$) = 0, 'B: A''nın iç referanslarını görmez');
select tests.ok(tests.rows($$select 1 from public.properties where title = 'Yeni taslak villa'$$) = 0, 'B: A''nın yeni taslağını görmez');
select tests.ok(tests.rows($$select 1 from storage.objects where bucket_id = 'partner-documents'$$) = 1, 'B: yalnızca kendi belgesini görür');
select tests.ok(tests.rows($$select 1 from public.partner_listing_stats('aaaaaaaa-0000-0000-0000-00000000000b')$$) = 2, 'B: kendi 2 yayındaki ilanının istatistiği');
reset role;

select tests.login('11111111-0000-0000-0000-000000000006');
set local role authenticated;
select tests.ok(tests.rows('select 1 from public.partner_property_links') = 0, 'C (askıda): hiçbir bağlantı görünmez');
select tests.ok(tests.rows('select 1 from public.partner_organizations') = 0, 'C (askıda): ofis kaydı görünmez');
select tests.throws($$select * from public.partner_listing_stats('aaaaaaaa-0000-0000-0000-00000000000c')$$, 'C (askıda): istatistik alamaz');
reset role;

-- =================================================================
-- 5) PII YETKİSİZ OPERATÖR
-- =================================================================
select tests.login('11111111-0000-0000-0000-000000000002');
set local role authenticated;
select tests.ok(jsonb_array_length(public.admin_list_buyer_requests(null)) > 0, 'operatör: talep listesini görür');
select tests.ok(not exists (select 1 from jsonb_array_elements(public.admin_list_buyer_requests(null)) e where e->>'buyer_name' not like '%***'), 'operatör: alıcı adları maskeli');
select tests.throws($$select public.admin_get_buyer_request((select (e->>'id')::uuid from jsonb_array_elements(public.admin_list_buyer_requests(null)) e limit 1))$$, 'operatör: alıcı iletişim detayını açamaz');
select tests.throws('select public.admin_list_viewings(null)', 'operatör: alıcı adlı randevu listesini açamaz');
select tests.throws('select * from private.buyers', 'operatör: tabloya doğrudan erişemez');
reset role;

-- =================================================================
-- 6) YÖNETİCİ
-- =================================================================
select tests.login('11111111-0000-0000-0000-000000000001');
set local role authenticated;
select tests.ok(tests.rows('select 1 from public.partner_property_links') = 9, 'yönetici: tüm bağlantıları görür');
select tests.ok(exists (select 1 from jsonb_array_elements(public.admin_list_buyer_requests(null)) e where e->>'buyer_name' = 'Test Alıcı Bir'), 'yönetici: alıcı adlarını görür');
select tests.ok((
  select public.admin_get_buyer_request((e->>'id')::uuid) -> 'buyer' ->> 'email'
  from jsonb_array_elements(public.admin_list_buyer_requests(null)) e where e->>'buyer_name' = 'Test Alıcı Bir'
) = 'alici1@example.invalid', 'yönetici: alıcı iletişim bilgisini görür');
select tests.ok((
  select jsonb_agg(m->>'code' order by m->>'code') from jsonb_array_elements(
    (select public.admin_get_buyer_request((e->>'id')::uuid) -> 'matches'
     from jsonb_array_elements(public.admin_list_buyer_requests(null)) e where e->>'buyer_name' = 'Test Alıcı Bir')) m
) = '["BD-T003"]'::jsonb, 'eşleştirme: 30M villa talebine yalnızca P3; %25 üstü (P6 38M), taslak/inceleme ve askıdaki ofisin ilanı yok');
select tests.ok(public.admin_list_viewings(null) -> 0 ->> 'buyer_name' = 'Test Alıcı İki', 'yönetici: randevu talebini alıcı adıyla görür');
select tests.throws($$select public.admin_set_property_status('bbbbbbbb-0000-0000-0000-000000000005', 'published')$$, 'yönetici: EİDS/belge doğrulanmadan yayınlayamaz');
select public.admin_verify_check('dddddddd-0000-0000-0000-0000000000b5', 'verified');
update public.partner_property_links set eids_status = 'verified' where id = 'cccccccc-0000-0000-0000-0000000000b5';
select public.admin_set_property_status('bbbbbbbb-0000-0000-0000-000000000005', 'published');
select tests.ok(app.property_is_live('bbbbbbbb-0000-0000-0000-000000000005'), 'yönetici: doğrulamalar tamamlanınca yayınlar');
select tests.throws($$update public.citizenship_reviews set admin_approved = true, expires_at = now() + interval '90 days', checklist = checklist || '{"agency_rules": false}' where property_id = 'bbbbbbbb-0000-0000-0000-000000000003'$$, 'vatandaşlık: kontrol listesi eksikken onaylanamaz');
select tests.throws($$update public.citizenship_reviews set status = 'under_review', admin_approved = true where property_id = 'bbbbbbbb-0000-0000-0000-000000000003'$$, 'vatandaşlık: "ön uygun" olmadan onaylanamaz');
select tests.ok((select count(*) from jsonb_array_elements(public.admin_audit_log(100)) a where a->>'action' = 'buyer.view') >= 1, 'denetim: alıcı detayı görüntülemesi kaydedildi');
reset role;

-- =================================================================
-- 7) Yetki süresi dolunca ilan yayından ve eşleştirmeden çıkar
-- =================================================================
update public.partner_property_links set authorized_until = current_date - 1 where id = 'cccccccc-0000-0000-0000-0000000000b2';
select private.expire_authorizations();
set local role anon;
select tests.ok(tests.rows($$select 1 from public.properties where code = 'BD-T002'$$) = 0, 'süre: yetkisi biten ilan ziyaretçiye görünmez');
reset role;
select tests.ok((select status from public.properties where code = 'BD-T002') = 'expired', 'süre: ilan "süresi doldu" durumuna geçer');

-- =================================================================
-- 8) Şema güvencesi: istemci rollerinin private şemada hiçbir yetkisi yok
-- =================================================================
select tests.ok(not has_schema_privilege('anon', 'private', 'usage'), 'anon: private şema erişimi yok');
select tests.ok(not has_schema_privilege('authenticated', 'private', 'usage'), 'authenticated: private şema erişimi yok');
select tests.ok(not exists (
  select 1 from information_schema.role_table_grants
  where table_schema = 'private' and grantee in ('anon', 'authenticated', 'PUBLIC')
), 'private tablolarında istemci rollerine verilmiş tek bir yetki yok');
select tests.ok(not exists (
  select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'private') and c.relkind = 'r' and not c.relrowsecurity
), 'public ve private şemalardaki tüm tablolarda RLS açık');

-- =================================================================
-- 9) SECURITY DEFINER denetimi (docs/SECURITY_DEFINER.md ile birebir)
--    Yeni bir definer fonksiyon eklenir/çıkarılır ya da yetkisi genişlerse bu bölüm başarısız olur.
-- =================================================================
create temp table _fn as
select p.oid, n.nspname as schema, p.proname as name, p.prosecdef as definer, p.proconfig as config, p.prosrc as src,
       pg_get_function_identity_arguments(p.oid) as args
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'app', 'private')
  and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e');

select tests.ok(not exists (
  select 1 from _fn where definer and not ('search_path=""' = any(coalesce(config, '{}')))
), 'definer: tüm security definer fonksiyonlarda search_path boş dizgeye sabit');

select tests.ok((select array_agg(name order by name) from _fn where schema = 'public') = array[
  'admin_audit_log', 'admin_erase_buyer', 'admin_get_buyer_request', 'admin_list_buyer_requests', 'admin_list_viewings',
  'admin_match_overview', 'admin_refresh_interest_snapshot', 'admin_set_match_setting', 'admin_set_property_status',
  'admin_set_request_status', 'admin_set_viewing_status', 'admin_verify_check', 'citizenship_collection', 'match_weights',
  'my_requests', 'partner_create_property', 'partner_get_private_details', 'partner_listing_stats', 'partner_submit_property',
  'record_listing_view', 'request_viewing', 'submit_buyer_request'
]::name[], 'definer: public şemada (Data API) yalnızca onaylı 22 RPC var; yardımcı fonksiyonlar app şemasında');

select tests.ok((select array_agg(name order by name) from _fn where schema = 'private' and definer) = array[
  'expire_authorizations', 'log_favorite_event', 'log_price_change', 'on_link_change', 'on_property_change',
  'on_request_change', 'refresh_interest_snapshot'
]::name[], 'definer: private şemada yalnızca 7 giriş noktası definer (tetikleyiciler ve gece işleri); iç fonksiyonlar invoker');

select tests.ok((select array_agg(name order by name) from _fn where schema = 'app' and definer) = array[
  'is_partner_member', 'is_platform_admin', 'is_superadmin', 'my_partner_ids', 'partner_can_edit_property',
  'partner_links_development', 'partner_links_property', 'partner_role', 'property_is_live'
]::name[], 'definer: app şemasında yalnızca 9 RLS yardımcısı definer');

select tests.ok(not exists (select 1 from _fn where schema = 'public' and not definer),
  'definer: public şemadaki her RPC belgelenmiş definer fonksiyon (gizli yardımcı yok)');

select tests.ok((
  select array_agg(name order by name) from _fn where schema = 'public' and has_function_privilege('anon', oid, 'execute')
) = array['citizenship_collection', 'match_weights', 'request_viewing', 'submit_buyer_request']::name[],
  'definer: ziyaretçinin çağırabildiği RPC''ler yalnızca 4 onaylı fonksiyon');

select tests.ok(not exists (
  select 1 from _fn where schema = 'private' and (has_function_privilege('anon', oid, 'execute') or has_function_privilege('authenticated', oid, 'execute'))
), 'definer: private fonksiyonları istemci rolleriyle çalıştırılamaz');

select tests.ok((
  select array_agg(name order by name) from _fn where schema = 'app' and has_function_privilege('anon', oid, 'execute')
) = array['property_is_live', 'slugify', 'try_uuid']::name[], 'definer: app şemasında ziyaretçiye açık yalnızca 3 yardımcı');

select tests.ok(not exists (
  select 1 from _fn where schema = 'public' and name like 'admin\_%' and src not like '%private.require_admin(%'
), 'definer: her admin_* fonksiyonu yönetici kontrolüyle başlar');

select tests.ok(not exists (
  select 1 from _fn where schema = 'public' and name like 'partner\_%'
    and src !~ 'app\.(partner_role|is_partner_member|partner_can_edit_property|partner_links_property)\('
), 'definer: her partner_* fonksiyonu üyelik/bağlantı kontrolü yapar');

select tests.ok(not exists (
  select 1 from _fn where schema = 'public' and name like 'partner\_%'
    and src ~ 'private\.(buyers|buyer_requests|property_matches|viewing_requests|viewing_request_items|appointments|interest_events|audit_events)'
), 'definer: hiçbir partner_* fonksiyonu alıcı/talep/eşleşme/randevu tablolarını okumaz');

select tests.ok(not exists (
  select 1 from pg_views where schemaname in ('public', 'app')
), 'definer: public/app şemasında view yok (security definer view riski yok)');

select format('TÜM TESTLER GEÇTİ: %s kontrol', current_setting('tests.passed')) as sonuc;

rollback;
