import Link from "next/link";
import Scene from "./Scene";
import InquiryForm from "./InquiryForm";
import { FavoriteButton, CompareButton } from "./SaveButtons";
import type { Criteria, MatchResult } from "@/lib/matching";
import { FEATURES, FORM, TYPES, UI, moneyShort, type Lang } from "@/lib/i18n";
import { DISTRICT } from "@/lib/labels";

type Props = {
  lang: Lang;
  action: string;
  criteria: Criteria;
  submitted: boolean;
  results: MatchResult[];
  hoods: { bodrum: string[]; milas: string[] };
  citizenship?: boolean;
};

/** Sunucu bileşeni: form GET ile çalışır, sonuçlar paylaşılabilir URL'dir. Kişisel veri URL'ye yazılmaz. */
export default function MatchWizard({ lang, action, criteria: c, submitted, results, hoods, citizenship }: Props) {
  const t = UI[lang];
  const strict = new Set<string>(c.strict);
  const Strict = ({ k }: { k: string }) => (
    <label className="strict-toggle">
      <input type="checkbox" name="kesin" value={k} defaultChecked={strict.has(k) || (k === "ozellik" && c.features.some((f) => strict.has(f)))} />
      {t.strict}
    </label>
  );
  const detailQuery = (() => {
    const q = new URLSearchParams();
    if (c.neighborhoods.length) q.set("mahalle", c.neighborhoods.join(","));
    if (c.districts.length) q.set("ilce", c.districts.join(","));
    if (c.budgetMax) q.set("butce", String(c.budgetMax));
    if (c.types.length) q.set("tip", c.types.join(","));
    if (c.roomsMin) q.set("oda", String(c.roomsMin));
    if (c.netSqmMin) q.set("m2", String(c.netSqmMin));
    if (c.features.length) q.set("ozellik", c.features.join(","));
    return q.toString();
  })();

  return (
    <div className="split">
      <form method="get" action={action} className="card wizard">
        {lang !== "tr" && <input type="hidden" name="dil" value={lang} />}
        <input type="hidden" name="ara" value="1" />

        <fieldset>
          <legend>{t.region}</legend>
          <div className="chips-input">
            {(["bodrum", "milas"] as const).map((d) => (
              <label key={d} className="check">
                <input type="checkbox" name="ilce" value={d} defaultChecked={c.districts.includes(d)} />
                {DISTRICT[d]} ({lang === "tr" ? "tümü" : lang === "en" ? "all" : "все"})
              </label>
            ))}
          </div>
          <details>
            <summary className="small" style={{ cursor: "pointer", color: "var(--sea)", fontWeight: 600 }}>
              {lang === "tr" ? "Mahalle seç" : lang === "en" ? "Choose neighbourhoods" : "Выбрать районы"}
            </summary>
            <div className="chips-input" style={{ marginTop: 10 }}>
              {[...hoods.bodrum, ...hoods.milas].map((n) => (
                <label key={n} className="check">
                  <input type="checkbox" name="mahalle" value={n} defaultChecked={c.neighborhoods.includes(n)} />
                  {n}
                </label>
              ))}
            </div>
          </details>
          <Strict k="bolge" />
        </fieldset>

        <fieldset>
          <legend>{t.budget}</legend>
          <input className="input" name="butce" inputMode="numeric" placeholder={t.budgetPh} defaultValue={c.budgetMax ?? ""} />
          <Strict k="butce" />
        </fieldset>

        <fieldset>
          <legend>{t.type}</legend>
          <div className="chips-input">
            {(Object.keys(TYPES[lang]) as (keyof (typeof TYPES)["tr"])[]).map((k) => (
              <label key={k} className="check">
                <input type="checkbox" name="tip" value={k} defaultChecked={c.types.includes(k)} />
                {TYPES[lang][k]}
              </label>
            ))}
          </div>
          <Strict k="tip" />
        </fieldset>

        <div className="two">
          <fieldset>
            <legend style={{ fontSize: "1rem" }}>{t.rooms}</legend>
            <select name="oda" className="select" defaultValue={c.roomsMin ?? ""}>
              <option value="">{t.any}</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
            <Strict k="oda" />
          </fieldset>
          <fieldset>
            <legend style={{ fontSize: "1rem" }}>{t.sqm}</legend>
            <input className="input" name="m2" inputMode="numeric" defaultValue={c.netSqmMin ?? ""} />
            <Strict k="alan" />
          </fieldset>
        </div>

        <fieldset>
          <legend>{t.features}</legend>
          <div className="chips-input">
            {(Object.keys(FEATURES[lang]) as (keyof (typeof FEATURES)["tr"])[]).map((k) => (
              <label key={k} className="check">
                <input type="checkbox" name="ozellik" value={k} defaultChecked={c.features.includes(k)} />
                {FEATURES[lang][k]}
              </label>
            ))}
          </div>
          <Strict k="ozellik" />
        </fieldset>

        <p className="small muted">{t.strictHint}</p>
        <div className="row">
          <button className="btn btn-primary">{t.search}</button>
          <Link className="btn btn-ghost" href={lang === "tr" ? action : `${action}?dil=${lang}`}>
            {t.reset}
          </Link>
        </div>
      </form>

      <section className="stack" style={{ gap: 16 }} aria-live="polite">
        {!submitted ? (
          <div className="empty">
            <p className="muted">{t.startHint}</p>
          </div>
        ) : (
          <>
            <div className="stack" style={{ gap: 4 }}>
              <h2 style={{ fontSize: "1.6rem" }}>{t.results(results.length)}</h2>
              <p className="small muted">{t.resultsHint}</p>
            </div>
            {results.length === 0 && (
              <div className="empty stack">
                <h3>{t.noResults}</h3>
                <p className="muted">{t.noResultsHint}</p>
              </div>
            )}
            {results.map((m) => (
              <article key={m.property.id} className="match-row">
                <div className="media">
                  <Scene spec={m.property.scene} label={`${m.property.title}`} />
                </div>
                <div className="body">
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <span className={`chip ${m.kind === "tam" ? "chip-ok" : "chip-sea"}`}>
                      {m.kind === "tam" ? t.exact : t.near} · %{m.score}
                    </span>
                    <div className="row" style={{ gap: 6 }}>
                      <FavoriteButton code={m.property.code} />
                      <CompareButton code={m.property.code} />
                    </div>
                  </div>
                  <div className="score-bar" aria-hidden="true">
                    <span style={{ width: `${m.score}%` }} />
                  </div>
                  <p className="pcard-loc">
                    {m.property.neighborhood}, {DISTRICT[m.property.district]} · {TYPES[lang][m.property.type]}
                  </p>
                  <h3 className="pcard-title">{m.property.title}</h3>
                  <ul className="reasons reasons-compact">
                    {m.reasons.map((r, i) => (
                      <li key={i} data-t={r.t}>
                        {r.m}
                      </li>
                    ))}
                  </ul>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <span className="pcard-price">{moneyShort(lang, m.property.price)}</span>
                    <Link className="btn btn-sm btn-light" href={`/satilik/${m.property.slug}${detailQuery ? `?${detailQuery}` : ""}`}>
                      {t.view} →
                    </Link>
                  </div>
                </div>
              </article>
            ))}

            <div className="card stack" style={{ gap: 12 }}>
              <h3>{t.leaveRequest}</h3>
              <p className="small muted">{t.leaveRequestHint}</p>
              <InquiryForm
                codes={results.slice(0, 10).map((r) => r.property.code)}
                compact
                askNationality={citizenship}
                copy={FORM[lang]}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
