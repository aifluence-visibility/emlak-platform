"use client";

import { useState } from "react";

/** Mobilde açılır-kapanır filtre kabı; masaüstünde her zaman açık */
export default function FilterPanel({ activeCount, children }: { activeCount: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <aside className="filters" data-open={open}>
      <button type="button" className="filters-toggle btn btn-light btn-block" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Filtreler{activeCount > 0 && <span className="count">{activeCount}</span>}
      </button>
      <div className="filters-body">{children}</div>
    </aside>
  );
}
