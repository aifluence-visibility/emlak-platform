#!/usr/bin/env bash
# Migration'ları ve RLS testlerini YEREL, geçici bir PostgreSQL veritabanında çalıştırır.
# Supabase'e veya uzak bir sunucuya BAĞLANMAZ: PGHOST bir Unix soket dizini ya da localhost olmalıdır.
#
# Kullanım:  PGHOST=/var/run/postgresql PGPORT=5432 PGUSER=postgres scripts/db-test.sh
# Her çalıştırmada 'emlak_test' veritabanı silinip yeniden oluşturulur.
set -euo pipefail

: "${PGHOST:?PGHOST gerekli (yerel soket dizini veya localhost)}"
case "$PGHOST" in
  /*|localhost|127.0.0.1) ;;
  *) echo "Güvenlik: yalnızca yerel veritabanına izin verilir (PGHOST=$PGHOST)." >&2; exit 2 ;;
esac
DB=emlak_test
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PSQL=(psql -X -q -v ON_ERROR_STOP=1)

"${PSQL[@]}" -d postgres -c "drop database if exists $DB" -c "create database $DB" >/dev/null
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/tests/local/00_supabase_shim.sql" >/dev/null
OUT="$(mktemp)"
trap 'rm -f "$OUT"' EXIT
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ $(basename "$f")"
  if ! "${PSQL[@]}" -d "$DB" -f "$f" >"$OUT" 2>&1; then
    cat "$OUT" >&2
    echo "Migration başarısız: $(basename "$f")" >&2
    exit 1
  fi
done
"${PSQL[@]}" -d "$DB" -tAc "select count(*) from pg_tables where schemaname in ('public','private')" | xargs echo "Tablo sayısı:"
echo "→ RLS testleri"
status=0
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/tests/rls_isolation.test.sql" >"$OUT" 2>&1 || status=$?
grep -E "^psql:.*(NOTICE|ERROR):|TÜM TESTLER|BAŞARISIZ" "$OUT" | sed -E 's/^psql:[^ ]+ (NOTICE|ERROR): +/  \1: /'
if [ "$status" -ne 0 ]; then echo "RLS TESTLERİ BAŞARISIZ" >&2; exit 1; fi
