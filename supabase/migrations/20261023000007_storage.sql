-- =====================================================================
-- 007 · Dosya depolama (Supabase Storage) yetkileri
-- =====================================================================
-- property-media      : ilan fotoğraf/video. Yol: '<property_id>/<dosya>'. Bucket ÖZEL; ziyaretçi yalnızca
--                       canlı ilanın dosyalarını okuyabilir (taslak fotoğrafları adres tahminiyle bile açılmaz).
-- partner-documents   : yetki belgesi, tapu vb. Yol: '<partner_id>/<link_id>/<dosya>'. Yalnızca o partner ve yönetici.
--                       Partner yükleyebilir ama silemez/değiştiremez (kanıt bütünlüğü).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('property-media', 'property-media', false, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),
  ('partner-documents', 'partner-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create or replace function app.try_uuid(p text) returns uuid
language plpgsql immutable set search_path = '' as $$
begin
  return p::uuid;
exception when others then
  return null;
end $$;
revoke execute on function app.try_uuid(text) from public;
grant execute on function app.try_uuid(text) to anon, authenticated;

-- property-media
create policy "media: canlı ilan dosyaları herkese açık" on storage.objects for select to anon, authenticated
  using (bucket_id = 'property-media' and app.property_is_live(app.try_uuid((storage.foldername(name))[1])));
create policy "media: partner kendi ilanının dosyalarını görür" on storage.objects for select to authenticated
  using (bucket_id = 'property-media' and app.partner_links_property(app.try_uuid((storage.foldername(name))[1])));
create policy "media: partner taslağa dosya yükler" on storage.objects for insert to authenticated
  with check (bucket_id = 'property-media' and app.partner_can_edit_property(app.try_uuid((storage.foldername(name))[1])));
create policy "media: partner taslaktan dosya siler" on storage.objects for delete to authenticated
  using (bucket_id = 'property-media' and app.partner_can_edit_property(app.try_uuid((storage.foldername(name))[1])));
create policy "media: yönetici" on storage.objects for all to authenticated
  using (bucket_id = 'property-media' and app.is_platform_admin())
  with check (bucket_id = 'property-media' and app.is_platform_admin());

-- partner-documents
create policy "docs: partner kendi belgelerini görür" on storage.objects for select to authenticated
  using (bucket_id = 'partner-documents' and app.is_partner_member(app.try_uuid((storage.foldername(name))[1])));
create policy "docs: partner kendi klasörüne yükler" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'partner-documents'
    and app.is_partner_member(app.try_uuid((storage.foldername(name))[1]))
    and exists (
      select 1 from public.partner_property_links l
      where l.id = app.try_uuid((storage.foldername(name))[2])
        and l.partner_id = app.try_uuid((storage.foldername(name))[1])
    )
  );
create policy "docs: yönetici" on storage.objects for all to authenticated
  using (bucket_id = 'partner-documents' and app.is_platform_admin())
  with check (bucket_id = 'partner-documents' and app.is_platform_admin());
