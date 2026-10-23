"use client";

import Link from "next/link";
import { useState } from "react";
import PropertyCard from "@/components/PropertyCard";
import { useList } from "@/lib/store";
import { useProperties } from "@/lib/useProperties";

export default function FavoritesClient() {
  const codes = useList("favorites");
  const { loading, data } = useProperties(codes);
  const [picked, setPicked] = useState<string[]>([]);
  const sel = picked.filter((c) => codes.includes(c));

  if (!codes.length) {
    return (
      <div className="empty stack" style={{ justifyItems: "center" }}>
        <h3>Henüz favoriniz yok</h3>
        <p className="muted">İlan kartlarındaki kalp simgesiyle beğendiğiniz evleri buraya ekleyin.</p>
        <Link href="/satilik" className="btn btn-primary">
          Evleri keşfet
        </Link>
      </div>
    );
  }
  if (loading) return <p className="muted">Yükleniyor…</p>;

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="card row" style={{ justifyContent: "space-between", padding: "14px 18px" }}>
        <span>
          Görmek istediğiniz evleri seçin: <strong>{sel.length}</strong> seçili
        </span>
        <Link
          href={sel.length ? `/randevu-talebi?k=${sel.join(",")}` : "#"}
          aria-disabled={!sel.length}
          className="btn btn-primary btn-sm"
          style={sel.length ? undefined : { opacity: 0.45, pointerEvents: "none" }}
        >
          Seçilenler için randevu talep et
        </Link>
      </div>
      {codes.length > data.length && (
        <p className="small muted">{codes.length - data.length} favori ilan artık yayında değil ve listeden gizlendi.</p>
      )}
      <div className="grid-cards">
        {data.map((p) => (
          <div key={p.id} className="stack" style={{ gap: 8 }}>
            <PropertyCard p={p} />
            <label className="check" style={{ justifySelf: "start" }}>
              <input
                type="checkbox"
                checked={sel.includes(p.code)}
                onChange={(e) => setPicked((s) => (e.target.checked ? [...s, p.code] : s.filter((c) => c !== p.code)))}
              />
              Randevuya ekle
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
