"use client";

import { useSyncExternalStore } from "react";

/**
 * ÖNİZLEME: favoriler ve karşılaştırma listesi yalnızca bu tarayıcıda (localStorage) tutulur.
 * Canlı sürümde favoriler giriş gerektirir ve `buyer_favorites` tablosuna yazılır (brief §4).
 */

type Key = "favorites" | "compare";
const STORAGE: Record<Key, string> = { favorites: "ep.favorites.v1", compare: "ep.compare.v1" };
export const COMPARE_LIMIT = 4;

const listeners = new Set<() => void>();
const cache: Partial<Record<Key, string[]>> = {};
const EMPTY: string[] = [];

function read(key: Key): string[] {
  if (cache[key]) return cache[key]!;
  let v: string[] = [];
  try {
    const raw = window.localStorage.getItem(STORAGE[key]);
    const parsed = raw ? JSON.parse(raw) : [];
    v = Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string").slice(0, 200) : [];
  } catch {
    v = [];
  }
  cache[key] = v;
  return v;
}

function write(key: Key, v: string[]) {
  cache[key] = v;
  try {
    window.localStorage.setItem(STORAGE[key], JSON.stringify(v));
  } catch {
    // gizli sekme vb.: yalnızca bellekte kalır
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE.favorites || e.key === STORAGE.compare) {
      delete cache.favorites;
      delete cache.compare;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useList(key: Key) {
  return useSyncExternalStore(subscribe, () => read(key), () => EMPTY);
}

export function toggle(key: Key, code: string): boolean {
  const cur = read(key);
  if (cur.includes(code)) {
    write(key, cur.filter((c) => c !== code));
    return true;
  }
  if (key === "compare" && cur.length >= COMPARE_LIMIT) return false;
  write(key, [...cur, code]);
  return true;
}

export function clear(key: Key) {
  write(key, []);
}

export function remove(key: Key, code: string) {
  write(key, read(key).filter((c) => c !== code));
}
