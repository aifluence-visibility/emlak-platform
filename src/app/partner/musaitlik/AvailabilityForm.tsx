"use client";

import { useState } from "react";

type Slot = { day: string; from: string; to: string };

export default function AvailabilityForm({ initial }: { initial: Slot[] }) {
  const [slots, setSlots] = useState<Slot[]>(initial.length ? initial : [{ day: "Pazartesi–Cuma", from: "10:00", to: "18:00" }]);
  const [saved, setSaved] = useState(false);
  const set = (i: number, k: keyof Slot, v: string) => setSlots((s) => s.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  return (
    <form
      className="card stack"
      style={{ gap: 14 }}
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(true);
      }}
    >
      {slots.map((s, i) => (
        <div key={i} className="form-grid" style={{ alignItems: "end" }}>
          <label className="field">
            <span>Günler</span>
            <input className="input" value={s.day} onChange={(e) => set(i, "day", e.target.value)} />
          </label>
          <label className="field">
            <span>Başlangıç</span>
            <input className="input" type="time" value={s.from} onChange={(e) => set(i, "from", e.target.value)} />
          </label>
          <label className="field">
            <span>Bitiş</span>
            <input className="input" type="time" value={s.to} onChange={(e) => set(i, "to", e.target.value)} />
          </label>
          <button type="button" className="btn btn-ghost" onClick={() => setSlots((x) => x.filter((_, j) => j !== i))}>
            Kaldır
          </button>
        </div>
      ))}
      <label className="field">
        <span>Not (ör. tatil günleri, anahtar teslim bilgisi)</span>
        <textarea className="textarea" maxLength={500} style={{ minHeight: 80 }} />
      </label>
      <div className="row">
        <button type="button" className="btn btn-light" onClick={() => setSlots((x) => [...x, { day: "", from: "10:00", to: "17:00" }])}>
          + Zaman aralığı ekle
        </button>
        <button className="btn btn-primary">Kaydet</button>
      </div>
      {saved && (
        <p className="small" role="status" style={{ color: "var(--sea)" }}>
          Önizleme: müsaitlik kaydedilmedi.
        </p>
      )}
    </form>
  );
}
