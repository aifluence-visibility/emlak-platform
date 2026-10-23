// Testler için: uzantısız göreli importları ve "@/" takma adını .ts/.tsx dosyalarına çözer.
import { register } from "node:module";

register(
  "data:text/javascript," +
    encodeURIComponent(`
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
const SRC = ${JSON.stringify(new URL("../src/", import.meta.url).href)};
export async function resolve(spec, ctx, next) {
  let target = spec.startsWith("@/") ? new URL(spec.slice(2), SRC).href : spec;
  if ((target.startsWith(".") || target.startsWith("file:")) && !/\\.[cm]?[jt]sx?$/.test(target)) {
    const base = new URL(target, ctx.parentURL);
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      const u = new URL(base.href + ext);
      if (existsSync(fileURLToPath(u))) return next(u.href, ctx);
    }
  }
  return next(target, ctx);
}`),
);
