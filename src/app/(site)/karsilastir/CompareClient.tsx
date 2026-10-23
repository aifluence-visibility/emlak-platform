"use client";

import Link from "next/link";
import Scene from "@/components/Scene";
import { remove, clear, useList, COMPARE_LIMIT } from "@/lib/store";
import { useProperties } from "@/lib/useProperties";
import { DISTRICT, FEATURE, TYPE } from "@/lib/labels";
import { age, meters, sqm, tl } from "@/lib/format";
import type { PublicProperty } from "@/lib/types";

type Row = { label: string; get: (p: PublicProperty) => string; num?: (p: PublicProperty) => number | null; best?: "min" | "max" };

const ROWS: Row[] = [
  { label: "Fiyat", get: (p) => tl(p.price), num: (p) => p.price, best: "min" },
  { label: "Bölge", get: (p) => `${p.neighborhood}, ${DISTRICT[p.district]}` },
  { label: "Tür", get: (p) => TYPE[p.type] },
  { label: "Oda", get: (p) => p.rooms ?? "—", num: (p) => (p.rooms ? parseInt(p.rooms, 10) : null), best: "max" },
  { label: "Net alan", get: (p) => sqm(p.netSqm), num: (p) => p.netSqm, best: "max" },
  { label: "Brüt alan", get: (p) => sqm(p.grossSqm), num: (p) => p.grossSqm, best: "max" },
  { label: "Arsa alanı", get: (p) => sqm(p.landSqm), num: (p) => p.landSqm, best: "max" },
  {
    label: "m² fiyatı (net)",
    get: (p) => (p.netSqm ? tl(Math.round(p.price / p.netSqm)) : "—"),
    num: (p) => (p.netSqm ? p.price / p.netSqm : null),
    best: "min",
  },
  { label: "Bina yaşı", get: (p) => age(p.buildingAge), num: (p) => p.buildingAge, best: "min" },
  { label: "Denize uzaklık", get: (p) => meters(p.seaDistanceM) ?? "—", num: (p) => p.seaDistanceM, best: "min" },
  { label: "Tapu", get: (p) => p.titleDeed ?? "—" },
  ...(Object.keys(FEATURE) as (keyof typeof FEATURE)[]).map((k) => ({ label: FEATURE[k], get: (p: PublicProperty) => (p.features[k] ? "✓" : "—") })),
  { label: "Vatandaşlık koleksiyonu", get: (p) => (p.inCitizenshipCollection ? "Ön incelemeli" : "—") },
];

export default function CompareClient() {
  const codes = useList("compare");
  const { loading, data } = useProperties(codes);

  if (!codes.length) {
    return (
      <div className="empty stack" style={{ justifyItems: "center" }}>
        <h3>Karşılaştırma listeniz boş</h3>
        <p className="muted">İlan kartlarındaki karşılaştır simgesiyle en fazla {COMPARE_LIMIT} ilan ekleyebilirsiniz.</p>
        <Link href="/satilik" className="btn btn-primary">
          İlanlara göz at
        </Link>
      </div>
    );
  }
  if (loading) return <p className="muted">Yükleniyor…</p>;

  const bestOf = (r: Row) => {
    if (!r.num || !r.best || data.length < 2) return null;
    const vals = data.map(r.num).filter((v): v is number => v != null);
    if (vals.length < 2) return null;
    return r.best === "min" ? Math.min(...vals) : Math.max(...vals);
  };

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <p className="small muted">Yeşil değerler, karşılaştırılan ilanlar arasında en avantajlı olanı gösterir.</p>
        <div className="row">
          <button className="btn btn-sm btn-ghost" onClick={() => clear("compare")}>
            Listeyi temizle
          </button>
          <Link className="btn btn-sm btn-primary" href={`/randevu-talebi?k=${data.map((p) => p.code).join(",")}`}>
            Hepsi için randevu talep et
          </Link>
        </div>
      </div>
      <div className="cmp">
        <table>
          <thead>
            <tr>
              <th scope="row" />
              {data.map((p) => (
                <th key={p.id} style={{ minWidth: 200 }}>
                  <div className="cmp-media">
                    <Scene spec={p.scene} label={p.title} />
                  </div>
                  <Link href={`/satilik/${p.slug}`} style={{ fontFamily: "var(--font-display)", fontSize: "1.02rem", fontWeight: 500 }}>
                    {p.title}
                  </Link>
                  <div>
                    <button className="btn btn-sm btn-ghost" style={{ marginTop: 8 }} onClick={() => remove("compare", p.code)}>
                      Çıkar
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => {
              const best = bestOf(r);
              return (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  {data.map((p) => (
                    <td key={p.id} className={best != null && r.num!(p) === best ? "best" : undefined}>
                      {r.get(p)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
