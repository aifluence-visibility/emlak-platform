"use client";

import { useEffect, useState } from "react";
import type { PublicProperty } from "./types";

/** Kod listesine göre public ilanları getirir; listedeki sırayı korur. Yayından kalkanlar düşer. */
export function useProperties(codes: string[]) {
  const key = codes.join(",");
  const [state, setState] = useState<{ key: string; data: PublicProperty[] } | null>(null);

  useEffect(() => {
    if (!key) return;
    let alive = true;
    fetch(`/api/ilanlar?k=${encodeURIComponent(key)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: PublicProperty[]) => {
        if (!alive) return;
        const order = new Map(key.split(",").map((c, i) => [c, i]));
        setState({ key, data: data.sort((a, b) => (order.get(a.code) ?? 0) - (order.get(b.code) ?? 0)) });
      })
      .catch(() => alive && setState({ key, data: [] }));
    return () => {
      alive = false;
    };
  }, [key]);

  if (!key) return { loading: false, data: [] as PublicProperty[] };
  return { loading: state?.key !== key, data: state?.key === key ? state.data : [] };
}
