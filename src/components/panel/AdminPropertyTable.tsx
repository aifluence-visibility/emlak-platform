import Link from "next/link";
import Scene from "@/components/Scene";
import { AuthBadge, StatusBadge } from "./Status";
import type { listAllProperties } from "@/lib/data/admin";
import { EIDS_STATUS } from "@/lib/labels";
import { date, tlShort } from "@/lib/format";

type Row = ReturnType<typeof listAllProperties>[number];

export default function AdminPropertyTable({ rows, showStats = true }: { rows: Row[]; showStats?: boolean }) {
  return (
    <div className="table-wrap">
      <table className="ptable">
        <thead>
          <tr>
            <th>İlan</th>
            <th>Durum</th>
            <th>İş ortakları ve yetki</th>
            <th className="num">Fiyat</th>
            {showStats && <th className="num" title="Ham değerler; yalnızca yönetici">İlgilenen (ham)</th>}
            <th>Güncelleme</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>
                <Link href={`/admin/portfoyler/${p.id}`} className="cell-title">
                  <span className="thumb">
                    <Scene spec={p.scene} label="" />
                  </span>
                  <span>
                    <strong>{p.title}</strong>
                    <small>
                      {p.code} · {p.neighborhood}
                    </small>
                  </span>
                </Link>
              </td>
              <td>
                <StatusBadge status={p.status} />
              </td>
              <td className="small">
                {p.links.map((l) => (
                  <div key={l.id} className="row" style={{ gap: 6, marginBottom: 4 }}>
                    <span>{l.partnerName}</span>
                    <AuthBadge status={l.authorizationStatus} />
                    <span className="muted">EİDS: {EIDS_STATUS[l.eidsStatus]}</span>
                  </div>
                ))}
                {p.links.length > 1 && <span className="chip chip-sea">Çoklu yetki</span>}
              </td>
              <td className="num">{tlShort(p.price)}</td>
              {showStats && <td className="num">{p.stats ? p.stats.interestedBuyers : "—"}</td>}
              <td className="small nowrap">{date(p.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
