"use client";

import { useState } from "react";

/** Önizlemede işlem butonu: hiçbir şey kaydetmez, bunu açıkça söyler. */
export default function PreviewAction({ label, done, variant = "btn-light" }: { label: string; done?: string; variant?: string }) {
  const [clicked, setClicked] = useState(false);
  return (
    <span className="row" style={{ gap: 8 }}>
      <button type="button" className={`btn btn-sm ${variant}`} onClick={() => setClicked(true)}>
        {label}
      </button>
      {clicked && (
        <span className="small" role="status" style={{ color: "var(--sea)" }}>
          Önizleme: {done ?? "kaydedilmedi"}.
        </span>
      )}
    </span>
  );
}
