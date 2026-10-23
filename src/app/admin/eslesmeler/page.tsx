import type { Metadata } from "next";
import Link from "next/link";
import Scene from "@/components/Scene";
import { requirePreviewAdmin } from "@/lib/previewIdentity";
import { listBuyerRequests, matchOverview } from "@/lib/data/admin";
import { DEFAULT_WEIGHTS } from "@/lib/matching";
import { tlShort } from "@/lib/format";

export const metadata: Metadata = { title: "Eşleştirme" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function MatchingPage({ searchParams }: { searchParams: SP }) {
  await requirePreviewAdmin();
  const view = (await searchParams).gorunum === "talep" ? "talep" : "ilan";
  const props = matchOverview();
  const reqs = listBuyerRequests("acik");

  return (
    <>
      <header className="pnl-head">
        <div>
          <h1>Eşleştirme</h1>
          <p>
            Kural tabanlı eşleştirme · alt sınır %{DEFAULT_WEIGHTS.minScore} · yalnızca yayındaki ve yetkisi aktif ilanlar. Bu ekran yalnızca yöneticiye açıktır.
          </p>
        </div>
        <Link href="/admin/ayarlar" className="btn btn-light">
          Ağırlıkları düzenle
        </Link>
      </header>
      <nav className="lang-switch" style={{ justifySelf: "start" }}>
        <Link href="/admin/eslesmeler" aria-current={view === "ilan"}>
          İlana göre
        </Link>
        <Link href="/admin/eslesmeler?gorunum=talep" aria-current={view === "talep"}>
          Talebe göre
        </Link>
      </nav>

      {view === "ilan" ? (
        <section className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="ptable">
              <thead>
                <tr>
                  <th>İlan</th>
                  <th className="num">Tam uyum</th>
                  <th className="num">Yakın uyum</th>
                  <th className="num">En iyi puan</th>
                  <th>Talepler</th>
                </tr>
              </thead>
              <tbody>
                {props.map((x) => (
                  <tr key={x.property.id}>
                    <td>
                      <Link href={`/admin/portfoyler/${x.property.id}`} className="cell-title">
                        <span className="thumb">
                          <Scene spec={x.property.scene} label="" />
                        </span>
                        <span>
                          <strong>{x.property.title}</strong>
                          <small>
                            {x.property.code} · {tlShort(x.property.price)}
                          </small>
                        </span>
                      </Link>
                    </td>
                    <td className="num" style={{ color: x.exact ? "var(--ok)" : undefined, fontWeight: x.exact ? 700 : 400 }}>
                      {x.exact || "—"}
                    </td>
                    <td className="num">{x.near || "—"}</td>
                    <td className="num">{x.best ? `%${x.best}` : "—"}</td>
                    <td className="small">{x.requests.join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="ptable">
              <thead>
                <tr>
                  <th>Talep</th>
                  <th className="num">Uygun ilan</th>
                  <th className="num">Tam uyum</th>
                  <th className="num">En iyi puan</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {reqs.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.code}</strong> · {r.buyer.name}
                    </td>
                    <td className="num">{r.matchCount || "—"}</td>
                    <td className="num">{r.exactCount || "—"}</td>
                    <td className="num">{r.bestScore ? `%${r.bestScore}` : "—"}</td>
                    <td>
                      <Link href={`/admin/alici-talepleri/${r.id}`} className="btn btn-sm btn-light">
                        Sonuçlar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <p className="small muted">
        Yüzdeler iç uyum puanıdır, satın alma olasılığı değildir. İş ortakları bu ekranı ve eşleşme ayrıntılarını görmez; yalnızca kendi ilanlarının
        gecikmeli ilgi istatistiklerini görür.
      </p>
    </>
  );
}
