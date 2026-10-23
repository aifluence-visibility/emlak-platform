-- =====================================================================
-- 008 · Zamanlanmış işler (pg_cron varsa)
-- =====================================================================
-- Supabase'de pg_cron eklentisi Database > Extensions ekranından açılır. Açık değilse bu dosya
-- hiçbir şey yapmaz; işler daha sonra yeniden çalıştırılarak kurulabilir.
--   * 00:10 (İstanbul = 21:10 UTC): partner istatistik özeti (önceki gün sonuna kadar)
--   * 00:20 (İstanbul = 21:20 UTC): süresi biten yetkiler ve canlılığını yitiren ilanlar

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('emlak-interest-snapshot', '10 21 * * *', 'select private.refresh_interest_snapshot()');
    perform cron.schedule('emlak-expire-authorizations', '20 21 * * *', 'select private.expire_authorizations()');
  else
    raise notice 'pg_cron yok: zamanlanmış işler kurulmadı (Database > Extensions > pg_cron açılıp bu dosya yeniden çalıştırılabilir)';
  end if;
end $$;
