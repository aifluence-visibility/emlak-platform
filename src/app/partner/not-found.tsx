import Link from "next/link";

export default function PartnerNotFound() {
  return (
    <div className="empty stack" style={{ justifyItems: "center" }}>
      <h2>Kayıt bulunamadı</h2>
      <p className="muted">Bu kayıt yok ya da ofisinize ait değil.</p>
      <Link href="/partner/portfoyler" className="btn btn-primary">
        Portföyüme dön
      </Link>
    </div>
  );
}
