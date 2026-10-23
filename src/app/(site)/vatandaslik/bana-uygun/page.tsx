import type { Metadata } from "next";
import Link from "next/link";
import MatchWizard from "@/components/MatchWizard";
import LangSwitch from "@/components/LangSwitch";
import { listCitizenshipCollection, neighborhoods } from "@/lib/data/public";
import { criteriaFromParams, matchAll } from "@/lib/matching";
import { UI, asLang } from "@/lib/i18n";
import { CIT } from "@/lib/citizenshipCopy";

export const metadata: Metadata = { title: "Vatandaşlık için uygun mülkü bul" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function CitizenshipFinder({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const lang = asLang(sp.dil);
  const t = UI[lang];
  // Arama yalnızca koleksiyon içinde yapılır
  const c = { ...criteriaFromParams(sp), citizenshipOnly: true };
  const submitted = sp.ara === "1";
  const results = submitted ? matchAll(c, listCitizenshipCollection(), lang) : [];

  return (
    <div className="container" lang={lang}>
      <header className="page-head">
        <nav className="crumbs" aria-label="Konum">
          <Link href={lang === "tr" ? "/vatandaslik" : `/vatandaslik?dil=${lang}`}>{CIT[lang].eyebrow}</Link>
          <span>/</span>
          <span>{t.citWizardTitle}</span>
        </nav>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "start" }}>
          <h1 style={{ maxWidth: "22ch" }}>{t.citWizardTitle}</h1>
          <LangSwitch lang={lang} path="/vatandaslik/bana-uygun" />
        </div>
        <p className="lead">{t.citWizardLead}</p>
        <div className="notice" style={{ marginTop: 18 }}>
          <span>{CIT[lang].disclaimer}</span>
        </div>
      </header>
      <MatchWizard
        lang={lang}
        action="/vatandaslik/bana-uygun"
        criteria={c}
        submitted={submitted}
        results={results}
        hoods={neighborhoods()}
        citizenship
      />
    </div>
  );
}
