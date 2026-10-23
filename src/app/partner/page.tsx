import Link from "next/link";
import Scene from "@/components/Scene";
import { StatusBadge } from "@/components/panel/Status";
import { requirePreviewPartner } from "@/lib/previewIdentity";
import { getPartnerOrg, partnerSummary } from "@/lib/data/partner";
import { date, tlShort } from "@/lib/format";

export default async function PartnerHome() {
  const partnerId = await requirePreviewPartner();
  const org = getPartnerOrg(partnerId)!;
  const s = partnerSummary(partnerId);

  return (
    <>
      <header className="pnl-head">
        <div>
          <h1>Hoş geldiniz</h1>
          <p>{org.name} · portföy özeti</p>
        </div>
        <Link href="/partner/portfoyler/yeni" className="btn btn-primary">
          + Yeni ilan
        </Link>
      </header>

      <div className="tiles">
        <div className="tile">
          <span>Portföy</span>
          <strong>{s.total}</strong>
          <small>{s.published} yayında · {s.pending} hazırlıkta</small>
        </div>
        <div className="tile">
          <span>Görüntülenme</span>
          <strong>{s.views.toLocaleString("tr-TR")}</strong>
          <small>Yayındaki ilanlar, toplam</small>
        </div>
        <div className="tile">
          <span>Favoriye eklenme</span>
          <strong>{s.favorites.toLocaleString("tr-TR")}</strong>
          <small>Şu an favorisinde tutan kişi</small>
        </div>
        <div className="tile">
          <span>Yetkisi yakında bitecek</span>
          <strong>{s.expiringSoon.length}</strong>
          <small>60 gün içinde</small>
        </div>
      </div>

      <div className="notice notice-sea">
        <span>
          İstatistikler <strong>{date(s.cutoff)}</strong> sonuna kadar olan verilerle günde bir kez güncellenir. Anonim ve toplulaştırılmıştır;
          aynı kişinin tekrar eden ziyaretleri tek sayılır. Alıcıların kimliği, talepleri ve randevu ayrıntıları paylaşılmaz.
        </span>
      </div>

      <section className="card" style={{ padding: 0 }}>
        <div className="row" style={{ justifyContent: "space-between", padding: "18px 20px 6px" }}>
          <h2 style={{ fontSize: "1.25rem" }}>Son güncellenen ilanlar</h2>
          <Link href="/partner/portfoyler" className="btn btn-sm btn-light">
            Tüm portföy
          </Link>
        </div>
        <div className="table-wrap">
          <table className="ptable">
            <tbody>
              {s.recent.map((l) => (
                <tr key={l.propertyId}>
                  <td>
                    <Link href={`/partner/portfoyler/${l.propertyId}`} className="cell-title">
                      <span className="thumb">
                        <Scene spec={l.scene} label="" />
                      </span>
                      <span>
                        <strong>{l.title}</strong>
                        <small>
                          {l.code} · {l.neighborhood}
                        </small>
                      </span>
                    </Link>
                  </td>
                  <td>
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="num">{tlShort(l.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
