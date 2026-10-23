"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useList } from "@/lib/store";
import { BRAND } from "@/lib/brand";

const NAV = [
  { href: "/satilik", label: "Satılık Evler" },
  { href: "/projeler", label: "Yeni Projeler" },
  { href: "/vatandaslik", label: "Vatandaşlığa Uygun" },
  { href: "/eslestirme", label: "Bana Uygun Evi Bul" },
];

export default function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const favs = useList("favorites");
  const compare = useList("compare");

  useEffect(() => setOpen(false), [path]);

  return (
    <header className="hdr">
      <div className="container hdr-inner">
        <Link href="/" className="brand" aria-label={`${BRAND.name} ana sayfa`}>
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="30" height="30">
              <rect x="3" y="12" width="14" height="14" fill="currentColor" />
              <rect x="13" y="6" width="16" height="20" fill="currentColor" opacity="0.55" />
              <rect x="0" y="27" width="32" height="2.5" fill="currentColor" opacity="0.35" />
            </svg>
          </span>
          <span>
            <strong>{BRAND.name}</strong>
            <small>{BRAND.tagline}</small>
          </span>
        </Link>

        <nav className={`nav ${open ? "nav-open" : ""}`} aria-label="Ana menü">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} data-active={path.startsWith(n.href)}>
              {n.label}
            </Link>
          ))}
          <Link href="/favoriler" data-active={path.startsWith("/favoriler")} className="nav-fav">
            Favorilerim{favs.length > 0 && <span className="count">{favs.length}</span>}
          </Link>
          {compare.length > 0 && (
            <Link href={`/karsilastir`} data-active={path.startsWith("/karsilastir")}>
              Karşılaştır<span className="count">{compare.length}</span>
            </Link>
          )}
        </nav>

        <button className="icon-btn menu-btn" aria-expanded={open} aria-label="Menüyü aç" onClick={() => setOpen((o) => !o)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
    </header>
  );
}
