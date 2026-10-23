import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

/**
 * Statik izolasyon testi: herkese açık site ve partner paneli, alıcı verisine (mock/buyers)
 * veya yönetici katmanına (data/admin) HİÇBİR import zinciriyle ulaşamamalı.
 * Supabase aşamasında buna RLS testleri eklenecek; bu test kod katmanındaki sınırı korur.
 */

const ROOT = resolve(import.meta.dirname, "..");
const SRC = join(ROOT, "src");
const FORBIDDEN = ["src/lib/mock/buyers.ts", "src/lib/data/admin.ts"];

function resolveImport(from: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(from), spec);
  else return null;
  for (const c of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

function reachable(entries: string[]) {
  const seen = new Set<string>();
  const stack = [...entries];
  while (stack.length) {
    const f = stack.pop()!;
    if (seen.has(f)) continue;
    seen.add(f);
    const src = readFileSync(f, "utf8");
    // from'lu import/export, yan etkili import ("import 'x'") ve dinamik import
    for (const m of src.matchAll(/(?:import|export)\s[^"';]*?from\s*["']([^"']+)["']|import\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g)) {
      const r = resolveImport(f, m[1] ?? m[2] ?? m[3]);
      if (r) stack.push(r);
    }
  }
  return [...seen].map((f) => f.slice(ROOT.length + 1));
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? filesUnder(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
}

for (const [name, dir] of [
  ["Herkese açık site", "src/app/(site)"],
  ["Partner paneli", "src/app/partner"],
  ["Public API", "src/app/api"],
] as const) {
  test(`${name} alıcı verisine ve yönetici katmanına ulaşamaz`, () => {
    const graph = reachable(filesUnder(join(ROOT, dir)));
    for (const f of FORBIDDEN) assert.ok(!graph.includes(f), `${dir} → ${f} import zinciri bulundu`);
  });
}

test("Yönetici paneli alıcı verisine ulaşır (testin kendisi çalışıyor mu)", () => {
  const graph = reachable(filesUnder(join(ROOT, "src/app/admin")));
  assert.ok(graph.includes("src/lib/data/admin.ts"));
  assert.ok(graph.includes("src/lib/mock/buyers.ts"));
});

test("Partner veri katmanı başka partnerlerin bağlantılarını filtresiz döndürmez", () => {
  const src = readFileSync(join(SRC, "lib/data/partner.ts"), "utf8");
  assert.match(src, /partnerPropertyLinks\.filter\(\(l\) => l\.partnerId === partnerId\)/);
});
