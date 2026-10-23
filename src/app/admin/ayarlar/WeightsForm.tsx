"use client";

import { useState } from "react";
import type { Weights } from "@/lib/matching";

const LABELS: Partial<Record<keyof Weights, string>> = {
  region: "Bölge",
  budget: "Bütçe",
  type: "Mülk türü",
  rooms: "Oda sayısı",
  sqm: "Net alan",
  features: "Özellikler",
  recency: "İlan güncelliği",
};

export default function WeightsForm({ initial }: { initial: Weights }) {
  const [w, setW] = useState(initial);
  const [saved, setSaved] = useState(false);
  const keys = Object.keys(LABELS) as (keyof Weights)[];
  const total = keys.reduce((s, k) => s + w[k], 0);

  return (
    <form
      className="card stack"
      style={{ gap: 14 }}
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(true);
      }}
    >
      <h2 style={{ fontSize: "1.15rem" }}>Eşleştirme ağırlıkları</h2>
      {keys.map((k) => (
        <label key={k} className="weight-row">
          <span className="small">{LABELS[k]}</span>
          <input type="range" min={0} max={40} value={w[k]} onChange={(e) => setW({ ...w, [k]: Number(e.target.value) })} />
          <strong className="small" style={{ textAlign: "right" }}>
            {w[k]}
          </strong>
        </label>
      ))}
      <p className="small" style={{ color: total === 100 ? "var(--ok)" : "var(--warn)" }}>
        Toplam: {total} {total === 100 ? "✓" : "(100 olmalı)"}
      </p>
      <div className="form-grid">
        <label className="field">
          <span>En düşük uyum yüzdesi</span>
          <input className="input" type="number" min={40} max={95} value={w.minScore} onChange={(e) => setW({ ...w, minScore: Number(e.target.value) })} />
        </label>
        <label className="field">
          <span>Bütçe toleransı (%)</span>
          <input
            className="input"
            type="number"
            min={0}
            max={30}
            value={Math.round(w.budgetTolerance * 100)}
            onChange={(e) => setW({ ...w, budgetTolerance: Number(e.target.value) / 100 })}
          />
        </label>
        <label className="field">
          <span>Bütçe üst sınırı (%) — aşan önerilmez</span>
          <input
            className="input"
            type="number"
            min={0}
            max={100}
            value={Math.round(w.budgetHardLimit * 100)}
            onChange={(e) => setW({ ...w, budgetHardLimit: Number(e.target.value) / 100 })}
          />
        </label>
      </div>
      <button className="btn btn-primary" disabled={total !== 100} style={{ justifySelf: "start" }}>
        Kaydet
      </button>
      {saved && (
        <p className="small" role="status" style={{ color: "var(--sea)" }}>
          Önizleme: ağırlıklar kaydedilmedi. Canlıda `match_settings` tablosuna yazılır ve denetim kaydı oluşur.
        </p>
      )}
    </form>
  );
}
