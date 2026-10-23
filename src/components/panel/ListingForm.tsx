"use client";

import { useState } from "react";
import { FEATURE, NEIGHBORHOODS, ROOMS, TYPE } from "@/lib/labels";
import type { Features, PropertyStatus, PropertyType } from "@/lib/types";

export type ListingFormValues = {
  title: string;
  district: "bodrum" | "milas";
  neighborhood: string;
  type: PropertyType;
  price: number | null;
  rooms: string | null;
  grossSqm: number | null;
  netSqm: number | null;
  landSqm: number | null;
  buildingAge: number | null;
  floor: string | null;
  bathrooms: number | null;
  titleDeed: string | null;
  summary: string;
  features: Features;
  internalRef: string;
};

const EMPTY: ListingFormValues = {
  title: "",
  district: "bodrum",
  neighborhood: "",
  type: "villa",
  price: null,
  rooms: null,
  grossSqm: null,
  netSqm: null,
  landSqm: null,
  buildingAge: null,
  floor: null,
  bathrooms: null,
  titleDeed: null,
  summary: "",
  features: { pool: false, garden: false, seaView: false, parking: false, furnished: false, inSite: false, creditEligible: false },
  internalRef: "",
};

export default function ListingForm({ initial, status }: { initial?: ListingFormValues; status?: PropertyStatus }) {
  const v = initial ?? EMPTY;
  const [district, setDistrict] = useState(v.district);
  const [type, setType] = useState<PropertyType>(v.type);
  const [result, setResult] = useState<null | "draft" | "review">(null);
  const isLand = type === "land";
  const live = status === "published";

  if (result) {
    return (
      <div className="notice notice-sea" role="status">
        <div className="stack" style={{ gap: 8 }}>
          <strong>Önizleme: hiçbir değişiklik kaydedilmedi.</strong>
          <span>
            {result === "draft"
              ? "Canlı sürümde ilan “Taslak” olarak kaydedilir; yalnızca ofisiniz görür."
              : live
                ? "Canlı sürümde yayındaki ilanda yapılan değişiklikler yönetici onayına gider; onaylanana kadar mevcut hâli yayında kalır."
                : "Canlı sürümde ilan “Belge bekleniyor” durumuna geçer. Yetki belgesi ve EİDS doğrulaması tamamlanıp yönetici onaylamadan yayına çıkmaz."}
          </span>
          <button className="btn btn-sm btn-light" style={{ justifySelf: "start" }} onClick={() => setResult(null)}>
            Forma dön
          </button>
        </div>
      </div>
    );
  }

  const num = (n: number | null) => (n == null ? "" : n);

  return (
    <form
      className="stack"
      style={{ gap: 20 }}
      onSubmit={(e) => {
        e.preventDefault();
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        setResult(submitter?.value === "draft" ? "draft" : "review");
      }}
    >
      <section className="card form-section">
        <h2>Temel bilgiler</h2>
        <label className="field">
          <span>İlan başlığı</span>
          <input className="input" name="title" required maxLength={90} defaultValue={v.title} placeholder="Örn. Yalıkavak'ta deniz manzaralı villa" />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>Tür</span>
            <select className="select" name="type" value={type} onChange={(e) => setType(e.target.value as PropertyType)}>
              {Object.entries(TYPE).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Satış fiyatı (TL)</span>
            <input className="input" name="price" inputMode="numeric" required defaultValue={num(v.price)} />
          </label>
          <label className="field">
            <span>Ofis içi referans</span>
            <input className="input" name="internalRef" maxLength={30} defaultValue={v.internalRef} placeholder="Yalnızca siz görürsünüz" />
          </label>
        </div>
        <label className="field">
          <span>Kısa özet</span>
          <textarea className="textarea" name="summary" maxLength={240} defaultValue={v.summary} style={{ minHeight: 80 }} />
        </label>
      </section>

      <section className="card form-section">
        <h2>Konum</h2>
        <div className="form-grid">
          <label className="field">
            <span>İlçe</span>
            <select className="select" name="district" value={district} onChange={(e) => setDistrict(e.target.value as "bodrum" | "milas")}>
              <option value="bodrum">Bodrum</option>
              <option value="milas">Milas</option>
            </select>
          </label>
          <label className="field">
            <span>Mahalle / bölge</span>
            <select className="select" name="neighborhood" required defaultValue={v.neighborhood} key={district}>
              <option value="">Seçin</option>
              {NEIGHBORHOODS[district].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Açık adres (yayınlanmaz)</span>
            <input className="input" name="address" maxLength={200} placeholder="Yalnızca platform ekibi görür" />
          </label>
        </div>
        <p className="small muted">Sitede yalnızca mahalle düzeyinde yaklaşık konum gösterilir.</p>
      </section>

      <section className="card form-section">
        <h2>Alan ve özellikler</h2>
        <div className="form-grid">
          {!isLand && (
            <label className="field">
              <span>Oda</span>
              <select className="select" name="rooms" defaultValue={v.rooms ?? ""}>
                <option value="">Seçin</option>
                {ROOMS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
                <option>6+1</option>
              </select>
            </label>
          )}
          {!isLand && (
            <label className="field">
              <span>Brüt m²</span>
              <input className="input" name="grossSqm" inputMode="numeric" defaultValue={num(v.grossSqm)} />
            </label>
          )}
          {!isLand && (
            <label className="field">
              <span>Net m²</span>
              <input className="input" name="netSqm" inputMode="numeric" defaultValue={num(v.netSqm)} />
            </label>
          )}
          <label className="field">
            <span>Arsa m²</span>
            <input className="input" name="landSqm" inputMode="numeric" defaultValue={num(v.landSqm)} />
          </label>
          {!isLand && (
            <label className="field">
              <span>Bina yaşı</span>
              <input className="input" name="buildingAge" inputMode="numeric" defaultValue={num(v.buildingAge)} />
            </label>
          )}
          {!isLand && (
            <label className="field">
              <span>Banyo</span>
              <input className="input" name="bathrooms" inputMode="numeric" defaultValue={num(v.bathrooms)} />
            </label>
          )}
          <label className="field">
            <span>Tapu türü</span>
            <select className="select" name="titleDeed" defaultValue={v.titleDeed ?? ""}>
              <option value="">Seçin</option>
              <option>Kat mülkiyeti</option>
              <option>Kat irtifakı</option>
              <option>Müstakil tapu</option>
              <option>Hisseli tapu</option>
            </select>
          </label>
        </div>
        {!isLand && (
          <div className="chips-input">
            {(Object.keys(FEATURE) as (keyof Features)[]).map((k) => (
              <label key={k} className="check">
                <input type="checkbox" name="features" value={k} defaultChecked={v.features[k]} />
                {FEATURE[k]}
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="card form-section">
        <h2>Fotoğraf ve video</h2>
        <div className="dropzone">
          <input type="file" accept="image/*,video/*" multiple aria-label="Fotoğraf seç" />
          <p style={{ marginTop: 8 }}>Önizlemede dosyalar yüklenmez. Canlıda fotoğraflar konum bilgisi (EXIF) temizlenerek saklanır.</p>
        </div>
        <label className="row small" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
          <input type="checkbox" required style={{ marginTop: 4 }} />
          <span>Bu görselleri kullanma hakkım var; başka sitelerden veya ilanlardan izinsiz kopyalanmadı.</span>
        </label>
      </section>

      <section className="card form-section">
        <h2>Yetki ve belgeler</h2>
        <p className="small muted">
          Belgeler yalnızca platform ekibi tarafından görülür ve ilanda yayınlanmaz. Bir ilanın yayına çıkması için yetki belgesi, EİDS doğrulaması ve
          yönetici onayı gerekir.
        </p>
        <div className="form-grid">
          <label className="field">
            <span>Yetki belgesi / sözleşme</span>
            <input type="file" className="input" accept="application/pdf,image/*" />
          </label>
          <label className="field">
            <span>Tapu belgesi</span>
            <input type="file" className="input" accept="application/pdf,image/*" />
          </label>
          <label className="field">
            <span>EİDS yetki belgesi numarası</span>
            <input className="input" name="eidsRef" maxLength={40} placeholder="Doğrulamayı platform ekibi yapar" />
          </label>
        </div>
        <div className="notice">
          <span>
            EİDS resmî entegrasyonu henüz doğrulanmadı. Önizlemedeki EİDS durumları <strong>simülasyondur</strong>.
          </span>
        </div>
      </section>

      <div className="row" style={{ position: "sticky", bottom: 12, background: "var(--bg)", padding: "10px 0" }}>
        <button className="btn btn-light" name="intent" value="draft" formNoValidate>
          Taslak olarak kaydet
        </button>
        <button className="btn btn-primary" name="intent" value="review">
          {live ? "Değişikliği onaya gönder" : "İncelemeye gönder"}
        </button>
      </div>
    </form>
  );
}
