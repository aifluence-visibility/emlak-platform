import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/panel/Status";
import { requirePreviewAdmin } from "@/lib/previewIdentity";
import { listBuyerRequests } from "@/lib/data/admin";
import { DISTRICT, REQUEST_SOURCE, REQUEST_STATUS, TYPE } from "@/lib/labels";
import { date, tlShort } from "@/lib/format";

export const metadata: Metadata = { title: "Müşteri havuzu" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function BuyerPool({ searchParams }: { searchParams: SP }) {
  await requirePreviewAdmin();
  const durum = (await searchParams).durum;
  const tab = durum === "kapali" ? "kapali" : durum === "tumu" ? "tumu" : "acik";
  const list = listBuyerRequests(tab === "tumu" ? undefined : tab);

  return (
    <>
      <header className="pnl-head">
        <div>
          <h1>Müşteri havuzu</h1>
          <p>Alıcı talepleri ve iletişim bilgileri. Bu bilgiler iş ortaklarıyla paylaşılmaz.</p>
        </div>
        <button className="btn btn-light" disabled title="Önizlemede devre dışı">
          + Telefonla gelen talep
        </button>
      </header>
      <nav className="lang-switch" style={{ justifySelf: "start" }} aria-label="Durum">
        {[
          ["acik", "Açık"],
          ["kapali", "Kapanmış"],
          ["tumu", "Tümü"],
        ].map(([k, l]) => (
          <Link key={k} href={`/admin/alici-talepleri?durum=${k}`} aria-current={tab === k}>
            {l}
          </Link>
        ))}
      </nav>
      <section className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table className="ptable">
            <thead>
              <tr>
                <th>Talep / alıcı</th>
                <th>Kriterler</th>
                <th>Durum</th>
                <th className="num">Uygun ilan</th>
                <th className="num">Randevu</th>
                <th>Kaynak</th>
                <th>Tarih</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/admin/alici-talepleri/${r.id}`}>
                      <strong>{r.code}</strong> · {r.buyer.name}
                    </Link>
                    <div className="small muted">
                      {r.buyer.nationality ?? "—"} · {r.buyer.language.toUpperCase()}
                      {r.citizenship && " · vatandaşlık"}
                    </div>
                  </td>
                  <td className="small">
                    {[
                      r.neighborhoods.length ? r.neighborhoods.join(", ") : r.districts.map((d) => DISTRICT[d]).join(", ") || "Bölge fark etmez",
                      r.types.map((t) => TYPE[t]).join("/"),
                      r.roomsMin ? `${r.roomsMin}+ oda` : null,
                      r.budgetMax ? `≤ ${tlShort(r.budgetMax)}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </td>
                  <td>
                    <Badge status={r.status} labels={REQUEST_STATUS} />
                  </td>
                  <td className="num">
                    {r.matchCount ? (
                      <>
                        <strong>{r.matchCount}</strong>
                        {r.exactCount > 0 && <span className="small" style={{ color: "var(--ok)" }}> ({r.exactCount} tam)</span>}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="num">{r.appointmentCount || "—"}</td>
                  <td className="small">{REQUEST_SOURCE[r.source]}</td>
                  <td className="small nowrap">{date(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
