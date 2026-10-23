import type { Metadata } from "next";
import Link from "next/link";
import Scene from "@/components/Scene";
import LangSwitch from "@/components/LangSwitch";
import { FavoriteButton, CompareButton } from "@/components/SaveButtons";
import { listCitizenshipCollection } from "@/lib/data/public";
import { CIT } from "@/lib/citizenshipCopy";
import { TYPES, asLang, moneyShort } from "@/lib/i18n";
import { DISTRICT } from "@/lib/labels";

export const metadata: Metadata = { title: "Vatandaşlığa Uygun Gayrimenkuller" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function CitizenshipPage({ searchParams }: { searchParams: SP }) {
  const lang = asLang((await searchParams).dil);
  const t = CIT[lang];
  const list = listCitizenshipCollection();
  const q = lang === "tr" ? "" : `?dil=${lang}`;

  return (
    <div lang={lang}>
      <section className="hero" style={{ minHeight: "min(64vh, 600px)" }}>
        <div className="hero-media" aria-hidden="true">
          <Scene spec={{ seed: 333, time: "dusk", kind: "residence" }} align="right" />
        </div>
        <div className="container hero-inner">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 18 }}>
            <p className="eyebrow" style={{ color: "#f3dfb8" }}>
              {t.eyebrow}
            </p>
            <LangSwitch lang={lang} path="/vatandaslik" />
          </div>
          <h1 style={{ maxWidth: "20ch" }}>{t.title}</h1>
          <p className="lead">{t.lead}</p>
          <div className="row" style={{ marginTop: 24 }}>
            <Link href={`/vatandaslik/bana-uygun${q}`} className="btn btn-gold">
              {t.finderCta}
            </Link>
            <a href="#koleksiyon" className="btn btn-light">
              {t.exploreCta}
            </a>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="notice" style={{ marginTop: 28 }} role="note">
          <div className="stack" style={{ gap: 4 }}>
            <strong>{t.disclaimerTitle}</strong>
            <span>{t.disclaimer}</span>
          </div>
        </div>

        <section className="section" style={{ paddingBottom: 0 }}>
          <h2 style={{ marginBottom: 24 }}>{t.stepsTitle}</h2>
          <div className="steps">
            {t.steps.map((s) => (
              <div key={s.h}>
                <h3>{s.h}</h3>
                <p className="muted small">{s.p}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="koleksiyon">
          <div className="section-head">
            <div className="stack">
              <h2>{t.collectionTitle}</h2>
              <p className="muted">{t.collectionLead}</p>
            </div>
          </div>
          {list.length === 0 ? (
            <div className="empty">{t.empty}</div>
          ) : (
            <div className="grid-cards">
              {list.map((p) => (
                <article key={p.id} className="pcard">
                  <Link href={`/satilik/${p.slug}`} className="pcard-link">
                    <div className="pcard-media">
                      <Scene spec={p.scene} className="pcard-img" label={p.title} />
                      <div className="pcard-tags">
                        <span className="chip chip-dark">{TYPES[lang][p.type]}</span>
                        <span className="chip chip-gold">{t.reviewed}</span>
                      </div>
                    </div>
                    <div className="pcard-body">
                      <p className="pcard-loc">
                        {p.neighborhood}, {DISTRICT[p.district]}
                      </p>
                      <h3 className="pcard-title">{p.title}</h3>
                      <p className="pcard-facts">
                        {[p.rooms, p.netSqm ? `${p.netSqm} m²` : null].filter(Boolean).join(" · ")}
                      </p>
                      <p className="pcard-price">{moneyShort(lang, p.price)}</p>
                    </div>
                  </Link>
                  <div className="pcard-actions">
                    <FavoriteButton code={p.code} />
                    <CompareButton code={p.code} />
                  </div>
                </article>
              ))}
            </div>
          )}
          {lang !== "tr" && (
            <p className="small muted" style={{ marginTop: 16 }}>
              {lang === "en"
                ? "Listing titles are shown in Turkish in this preview; translated listing content will be added with the admin translation workflow."
                : "В предпросмотре названия объектов показаны на турецком; переводы появятся вместе с административным модулем переводов."}
            </p>
          )}
        </section>

        <section className="band" style={{ marginBottom: 40 }}>
          <div className="stack">
            <h2>{t.finderTitle}</h2>
            <p className="lead">{t.finderLead}</p>
          </div>
          <div className="stack">
            <strong style={{ color: "#e6cc98" }}>{t.checksTitle}</strong>
            <ul className="reasons" style={{ color: "rgba(255,255,255,.85)" }}>
              {t.checks.map((c) => (
                <li key={c} data-t="ok">
                  {c}
                </li>
              ))}
            </ul>
            <Link href={`/vatandaslik/bana-uygun${q}`} className="btn btn-gold" style={{ justifySelf: "start", marginTop: 8 }}>
              {t.finderCta}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
