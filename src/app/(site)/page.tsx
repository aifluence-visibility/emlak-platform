import Link from "next/link";
import Scene from "@/components/Scene";
import PropertyCard from "@/components/PropertyCard";
import { listCitizenshipCollection, listPublicDevelopments, listPublicProperties } from "@/lib/data/public";

export default function Home() {
  const all = listPublicProperties();
  const latest = [...all].sort((a, b) => Date.parse(b.publishedAt!) - Date.parse(a.publishedAt!)).slice(0, 6);
  const devs = listPublicDevelopments();
  const cit = listCitizenshipCollection();
  const count = (fn: (p: (typeof all)[number]) => boolean) => all.filter(fn).length;

  const regions = [
    { name: "Bodrum", q: "?ilce=bodrum", n: count((p) => p.district === "bodrum" && p.neighborhood !== "Mumcular"), seed: 41, kind: "villa" as const, text: "Yalıkavak'tan Gümüşlük'e, koylara bakan villalar ve site daireleri." },
    { name: "Mumcular", q: "?ilce=bodrum&mahalle=Mumcular", n: count((p) => p.neighborhood === "Mumcular"), seed: 97, kind: "detached" as const, text: "Zeytinlikler arasında taş evler, geniş araziler ve sakin köy yaşamı." },
    { name: "Milas", q: "?ilce=milas", n: count((p) => p.district === "milas"), seed: 173, kind: "apartment" as const, text: "Güllük körfezi, Ören ve Boğaziçi'nde erişilebilir sahil yaşamı." },
  ];

  return (
    <>
      <section className="hero">
        <div className="hero-media" aria-hidden="true">
          <Scene spec={{ seed: 7, time: "golden", kind: "villa" }} align="right" />
        </div>
        <div className="container hero-inner">
          <p className="eyebrow" style={{ color: "#f3dfb8" }}>
            Bodrum · Mumcular · Milas
          </p>
          <h1>Ege&apos;de size gerçekten uyan evi birlikte bulalım.</h1>
          <p className="lead">
            Yetki belgesi incelenmiş, seçilmiş satılık gayrimenkuller. Kriterlerinizi bir kez paylaşın; uygun evleri gerekçeleriyle
            gösterelim, randevularınızı tek elden planlayalım.
          </p>
          <div className="hero-ctas">
            <Link href="/satilik" className="journey">
              <strong>
                Evleri Keşfet <span aria-hidden="true">→</span>
              </strong>
              <span>{all.length} yayında ilan · bölge, fiyat ve özelliğe göre filtrele</span>
            </Link>
            <Link href="/eslestirme" className="journey journey-dark">
              <strong>
                Bana Uygun Evi Bul <span aria-hidden="true">→</span>
              </strong>
              <span>2 dakikalık sorularla uyum puanlı öneriler</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="stack">
              <span className="eyebrow">Koleksiyonlar</span>
              <h2>Üç farklı yol, tek bir özenli seçki</h2>
            </div>
          </div>
          <div className="pillars">
            <Link href="/satilik" className="pillar">
              <Scene spec={{ seed: 211, time: "day", kind: "villa" }} view={1} />
              <div className="pillar-body">
                <span className="eyebrow" style={{ color: "#f3dfb8" }}>
                  {all.length} ilan
                </span>
                <h3>Satılık Evler</h3>
                <p>Villa, müstakil ev, site dairesi ve arsa. Tümü yayın öncesi incelemeden geçer.</p>
              </div>
            </Link>
            <Link href="/projeler" className="pillar">
              <Scene spec={{ seed: 811, time: "day", kind: "project" }} />
              <div className="pillar-body">
                <span className="eyebrow" style={{ color: "#f3dfb8" }}>
                  {devs.length} proje
                </span>
                <h3>Yeni Projeler</h3>
                <p>Teslim tarihi, daire tipleri ve satıştaki birimleriyle ayrı ayrı incelenmiş projeler.</p>
              </div>
            </Link>
            <Link href="/vatandaslik" className="pillar">
              <Scene spec={{ seed: 333, time: "dusk", kind: "residence" }} />
              <div className="pillar-body">
                <span className="eyebrow" style={{ color: "#f3dfb8" }}>
                  {cit.length} ön incelemeli mülk · TR / EN / RU
                </span>
                <h3>Vatandaşlığa Uygun Gayrimenkuller</h3>
                <p>Yönetici ön incelemesinden geçmiş seçki. Ön inceleme resmî uygunluk ya da garanti değildir.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div className="stack">
              <span className="eyebrow">Yeni eklenenler</span>
              <h2>Bu hafta yayına alınanlar</h2>
            </div>
            <Link href="/satilik?sirala=yeni" className="btn btn-light">
              Tümünü gör
            </Link>
          </div>
          <div className="grid-cards">
            {latest.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "#fff", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <div className="section-head">
            <div className="stack">
              <span className="eyebrow">Bölgeler</span>
              <h2>Bodrum&apos;dan Milas&apos;a</h2>
              <p className="lead">Başlangıçta Bodrum yarımadası, Mumcular ve Milas. Yeni bölgeler eklenecek.</p>
            </div>
          </div>
          <div className="pillars">
            {regions.map((r) => (
              <Link key={r.name} href={`/satilik${r.q}`} className="pillar" style={{ minHeight: 280 }}>
                <Scene spec={{ seed: r.seed, time: "golden", kind: r.kind }} view={3} />
                <div className="pillar-body">
                  <span className="eyebrow" style={{ color: "#f3dfb8" }}>
                    {r.n} ilan
                  </span>
                  <h3>{r.name}</h3>
                  <p>{r.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container stack" style={{ gap: 40 }}>
          <div className="trust">
            <div>
              <span className="eyebrow">Doğrulanmış envanter</span>
              <h3>Yetkisi incelenmeyen ilan yayına çıkmaz</h3>
              <p className="muted">
                Her mülk, iş ortağının yetki belgesi ve platform incelemesi tamamlandıktan sonra yayınlanır. Belgeyle doğrulanan bilgiler
                ilanda ayrıca işaretlenir.
              </p>
            </div>
            <div>
              <span className="eyebrow">Gizlilik</span>
              <h3>İletişim bilgileriniz yalnızca bizde</h3>
              <p className="muted">
                Talep ve randevu bilgileriniz yalnızca yetkili platform ekibiyle paylaşılır. İş ortaklarımız kişisel bilgilerinizi görmez.
              </p>
            </div>
            <div>
              <span className="eyebrow">Tek elden randevu</span>
              <h3>Birden çok evi aynı gün görün</h3>
              <p className="muted">
                Beğendiğiniz evleri seçin, uygun zamanlarınızı bildirin. Tarihleri iş ortaklarıyla biz planlar, size onaylı programı iletiriz.
              </p>
            </div>
          </div>

          <div className="band">
            <div className="stack">
              <span className="eyebrow" style={{ color: "#e6cc98" }}>
                Akıllı eşleştirme
              </span>
              <h2>Aradığınızı anlatın, uygun her evi gerekçesiyle görün.</h2>
              <p className="lead">
                Bütçe, bölge, oda sayısı ve vazgeçemeyeceğiniz özellikler. Eşleştirme kurallarla çalışır: neden uyduğunu ve hangi
                kriterlerde farklı olduğunu açıkça yazarız.
              </p>
            </div>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <Link href="/eslestirme" className="btn btn-gold">
                Bana Uygun Evi Bul
              </Link>
              <Link href="/vatandaslik/bana-uygun" className="btn btn-light">
                Vatandaşlık için ev bul
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
