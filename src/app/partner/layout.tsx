import type { Metadata } from "next";
import Link from "next/link";
import "../panel.css";
import PanelNav from "@/components/panel/PanelNav";
import { currentPreviewPartner } from "@/lib/previewIdentity";
import { getPartnerOrg, listPartnerDevelopments } from "@/lib/data/partner";
import { clearPreviewPartner } from "./actions";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: { default: "Partner paneli", template: `%s · Partner paneli` } };

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const partnerId = await currentPreviewPartner();
  const org = partnerId ? getPartnerOrg(partnerId) : null;
  const hasProjects = partnerId ? listPartnerDevelopments(partnerId).length > 0 : false;

  return (
    <>
      <div className="pnl-preview" role="note">
        <div className="container">
          <span>
            <strong>Önizleme — gerçek giriş yok.</strong>{" "}
            {org ? `“${org.name}” örnek kimliğiyle görüntülüyorsunuz. Veriler kurgusaldır, değişiklikler kaydedilmez.` : "Bir örnek partner kimliği seçin."}
          </span>
          {org && (
            <form action={clearPreviewPartner}>
              <button>Örnek kimliği değiştir</button>
            </form>
          )}
        </div>
      </div>
      {org ? (
        <div className="pnl">
          <aside className="pnl-side">
            <Link href="/partner" className="pnl-brand">
              <strong>{BRAND.name}</strong>
              <small>Partner paneli</small>
            </Link>
            <div className="pnl-org">
              <span>Ofis</span>
              {org.name}
            </div>
            <PanelNav
              items={[
                { href: "/partner", label: "Özet", d: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10", exact: true },
                { href: "/partner/portfoyler", label: "Portföyüm", d: "M4 7h16v13H4zM9 7V4h6v3" },
                { href: "/partner/portfoyler/yeni", label: "Yeni ilan", d: "M12 5v14M5 12h14", exact: true },
                ...(hasProjects ? [{ href: "/partner/projeler", label: "Projelerim", d: "M4 20V9l6-4v15M10 20V5l10 5v10M4 20h16" }] : []),
                { href: "/partner/musaitlik", label: "Gösterim müsaitliği", d: "M7 3v3M17 3v3M4 8h16M5 5h14v15H5z" },
                { href: "/partner/hesap", label: "Hesap", d: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" },
              ]}
            />
            <div className="pnl-side-foot">
              Alıcı bilgileri ve randevu ayrıntıları yalnızca platform ekibindedir.
              <br />
              <Link href="/">Siteye dön</Link>
            </div>
          </aside>
          <main className="pnl-main">{children}</main>
        </div>
      ) : (
        <main>{children}</main>
      )}
    </>
  );
}
