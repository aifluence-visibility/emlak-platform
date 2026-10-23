import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container" style={{ padding: "96px 0", textAlign: "center" }}>
      <h1>Aradığınız sayfa bulunamadı</h1>
      <p className="lead" style={{ margin: "14px auto 24px" }}>
        İlan yayından kaldırılmış ya da bağlantı hatalı olabilir.
      </p>
      <Link href="/satilik" className="btn btn-primary">
        Satılık evlere göz at
      </Link>
    </div>
  );
}
