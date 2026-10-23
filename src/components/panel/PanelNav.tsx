"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; d: string; badge?: number; exact?: boolean };

export default function PanelNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="pnl-nav" aria-label="Panel menüsü">
      {items.map((i) => {
        const active = i.exact ? path === i.href : path === i.href || path.startsWith(i.href + "/");
        return (
          <Link key={i.href} href={i.href} data-active={active} aria-current={active ? "page" : undefined}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={i.d} />
            </svg>
            {i.label}
            {!!i.badge && <span className="badge">{i.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
