import Link from "next/link";
import type { PublicProperty } from "@/lib/types";
import type { Reason } from "@/lib/matching";
import { DISTRICT, TYPE } from "@/lib/labels";
import { tlShort, sqm } from "@/lib/format";
import Scene from "./Scene";
import { CompareButton, FavoriteButton } from "./SaveButtons";

type Props = {
  p: PublicProperty;
  href?: string;
  match?: { score: number; kind: "tam" | "yakin"; reasons: Reason[] };
};

export default function PropertyCard({ p, href, match }: Props) {
  const facts = [
    p.rooms,
    p.netSqm ? `${sqm(p.netSqm)} net` : null,
    p.landSqm && p.type !== "apartment" && p.type !== "residence" ? `${sqm(p.landSqm)} arsa` : null,
  ].filter(Boolean);

  return (
    <article className="pcard">
      <Link href={href ?? `/satilik/${p.slug}`} className="pcard-link">
        <div className="pcard-media">
          <Scene spec={p.scene} className="pcard-img" label={`${p.title} — temsilî görsel`} />
          <div className="pcard-tags">
            <span className="chip chip-dark">{TYPE[p.type]}</span>
            {p.inCitizenshipCollection && <span className="chip chip-gold">Vatandaşlık ön incelemesi</span>}
            {p.developmentName && <span className="chip chip-sea">Proje</span>}
          </div>
          <span className="pcard-note">Temsilî görsel</span>
        </div>
        <div className="pcard-body">
          {match && (
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className={`chip ${match.kind === "tam" ? "chip-ok" : "chip-sea"}`}>
                {match.kind === "tam" ? "Tam uyum" : "Yakın uyum"} · %{match.score}
              </span>
            </div>
          )}
          <p className="pcard-loc">
            {p.neighborhood}, {DISTRICT[p.district]}
          </p>
          <h3 className="pcard-title">{p.title}</h3>
          {facts.length > 0 && <p className="pcard-facts">{facts.join(" · ")}</p>}
          {match && (
            <ul className="reasons reasons-compact">
              {match.reasons.slice(0, 3).map((r, i) => (
                <li key={i} data-t={r.t}>
                  {r.m}
                </li>
              ))}
            </ul>
          )}
          <p className="pcard-price">{tlShort(p.price)}</p>
        </div>
      </Link>
      <div className="pcard-actions">
        <FavoriteButton code={p.code} />
        <CompareButton code={p.code} />
      </div>
    </article>
  );
}
