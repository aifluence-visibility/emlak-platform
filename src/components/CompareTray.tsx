"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clear, useList, COMPARE_LIMIT } from "@/lib/store";

export default function CompareTray() {
  const list = useList("compare");
  const path = usePathname();
  if (list.length === 0 || path.startsWith("/karsilastir")) return null;
  return (
    <div className="tray" role="region" aria-label="Karşılaştırma listesi">
      <span>
        <strong>{list.length}</strong> / {COMPARE_LIMIT} ilan karşılaştırmada
      </span>
      <div className="row">
        <button className="btn btn-sm btn-ghost tray-ghost" onClick={() => clear("compare")}>
          Temizle
        </button>
        <Link className="btn btn-sm btn-gold" href="/karsilastir">
          Karşılaştır
        </Link>
      </div>
    </div>
  );
}
