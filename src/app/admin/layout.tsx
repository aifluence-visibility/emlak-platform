import type { Metadata } from "next";
import Link from "next/link";
import "../panel.css";
import PanelNav from "@/components/panel/PanelNav";
import { isPreviewAdmin } from "@/lib/previewIdentity";
import { adminDashboard } from "@/lib/data/admin";
import { leaveAdminPreview } from "./actions";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: { default: "Yönetici paneli", template: `%s · Yönetici` } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isPreviewAdmin();
  const d = admin ? adminDashboard() : null;
  return (
    <>
      <div className="pnl-preview" role="note" style={{ background: "#5a1e16" }}>
        <div className="container">
          <span>
            <strong>Yönetici önizlemesi — gerçek giriş yok.</strong> Tüm alıcılar, telefonlar ve e-postalar kurgusaldır. Değişiklikler kaydedilmez.
          </span>
          {admin && (
            <form action={leaveAdminPreview}>
              <button>Önizlemeden çık</button>
            </form>
          )}
        </div>
      </div>
      {admin && d ? (
        <div className="pnl">
          <aside className="pnl-side">
            <Link href="/admin" className="pnl-brand">
              <strong>{BRAND.name}</strong>
              <small>Yönetici paneli</small>
            </Link>
            <PanelNav
              items={[
                { href: "/admin", label: "Özet", d: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10", exact: true },
                { href: "/admin/alici-talepleri", label: "Müşteri havuzu", d: "M16 11a4 4 0 1 0-8 0M3 21a9 9 0 0 1 18 0", badge: d.newRequests.length },
                { href: "/admin/eslesmeler", label: "Eşleştirme", d: "M8 7h11l-3-3M16 17H5l3 3" },
                { href: "/admin/randevular", label: "Randevular", d: "M7 3v3M17 3v3M4 8h16M5 5h14v15H5z", badge: d.upcoming.filter((a) => a.status === "requested").length },
                { href: "/admin/yayin-onaylari", label: "Yayın onayları", d: "M5 12l4 4L19 6", badge: d.pendingApprovals },
                { href: "/admin/portfoyler", label: "Tüm ilanlar", d: "M4 7h16v13H4zM9 7V4h6v3" },
                { href: "/admin/vatandaslik-inceleme", label: "Vatandaşlık inceleme", d: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z", badge: d.citizenshipPending },
                { href: "/admin/ortaklar", label: "İş ortakları", d: "M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 20v-2a4 4 0 0 0-3-3.9" },
                { href: "/admin/ayarlar", label: "Ayarlar", d: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a7.9 7.9 0 0 0 0-6M4.6 9a7.9 7.9 0 0 0 0 6" },
              ]}
            />
            <div className="pnl-side-foot">
              Alıcı kişisel bilgileri yalnızca bu panelde bulunur.
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
