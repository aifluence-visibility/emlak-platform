"use client";

import { useState } from "react";
import { toggle, useList, COMPARE_LIMIT } from "@/lib/store";

export function FavoriteButton({ code, withLabel = false }: { code: string; withLabel?: boolean }) {
  const favs = useList("favorites");
  const on = favs.includes(code);
  return (
    <button
      type="button"
      className={withLabel ? "btn btn-light" : "icon-btn"}
      aria-pressed={on}
      aria-label={on ? "Favorilerden çıkar" : "Favorilere ekle"}
      title={on ? "Favorilerden çıkar" : "Favorilere ekle"}
      onClick={(e) => {
        e.preventDefault();
        toggle("favorites", code);
      }}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
      </svg>
      {withLabel && (on ? "Favorilerde" : "Favorilere ekle")}
    </button>
  );
}

export function CompareButton({ code, withLabel = false }: { code: string; withLabel?: boolean }) {
  const list = useList("compare");
  const [full, setFull] = useState(false);
  const on = list.includes(code);
  return (
    <button
      type="button"
      className={withLabel ? "btn btn-light" : "icon-btn"}
      aria-pressed={on}
      aria-label={on ? "Karşılaştırmadan çıkar" : "Karşılaştırmaya ekle"}
      title={full ? `En fazla ${COMPARE_LIMIT} ilan karşılaştırılabilir` : on ? "Karşılaştırmadan çıkar" : "Karşılaştırmaya ekle"}
      onClick={(e) => {
        e.preventDefault();
        const ok = toggle("compare", code);
        setFull(!ok);
      }}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M8 4v16M16 4v16M4 8h8M12 16h8" />
      </svg>
      {withLabel && (full ? `En fazla ${COMPARE_LIMIT}` : on ? "Karşılaştırmada" : "Karşılaştır")}
    </button>
  );
}
