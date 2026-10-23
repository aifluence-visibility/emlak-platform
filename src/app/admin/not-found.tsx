import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="empty stack" style={{ justifyItems: "center" }}>
      <h2>Kayıt bulunamadı</h2>
      <Link href="/admin" className="btn btn-primary">
        Özete dön
      </Link>
    </div>
  );
}
