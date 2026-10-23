import Link from "next/link";
import { LANGS, type Lang } from "@/lib/i18n";

export default function LangSwitch({ lang, path }: { lang: Lang; path: string }) {
  return (
    <nav className="lang-switch" aria-label="Dil / Language / Язык">
      {LANGS.map((l) => (
        <Link key={l.key} href={l.key === "tr" ? path : `${path}?dil=${l.key}`} aria-current={l.key === lang} hrefLang={l.key}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
