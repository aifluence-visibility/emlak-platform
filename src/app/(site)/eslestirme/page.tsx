import type { Metadata } from "next";
import Link from "next/link";
import MatchWizard from "@/components/MatchWizard";
import { listPublicProperties, neighborhoods } from "@/lib/data/public";
import { criteriaFromParams, matchAll } from "@/lib/matching";
import { UI } from "@/lib/i18n";

export const metadata: Metadata = { title: "Bana Uygun Evi Bul" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function MatchPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const c = { ...criteriaFromParams(sp), citizenshipOnly: false };
  const submitted = sp.ara === "1";
  const results = submitted ? matchAll(c, listPublicProperties(), "tr") : [];

  return (
    <div className="container">
      <header className="page-head">
        <nav className="crumbs" aria-label="Konum">
          <Link href="/">Ana sayfa</Link>
          <span>/</span>
          <span>Bana Uygun Evi Bul</span>
        </nav>
        <h1>{UI.tr.wizardTitle}</h1>
        <p className="lead">{UI.tr.wizardLead}</p>
      </header>
      <MatchWizard lang="tr" action="/eslestirme" criteria={c} submitted={submitted} results={results} hoods={neighborhoods()} />
    </div>
  );
}
