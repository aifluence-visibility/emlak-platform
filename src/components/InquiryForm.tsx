"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  /** İlgili ilan kodları (bir ya da birden çok) */
  codes: string[];
  mode?: "info" | "viewing";
  compact?: boolean;
  /** Vatandaşlık akışında uyruk sorulur (edinim kısıtları uyruğa göre değişebilir) */
  askNationality?: boolean;
  copy?: Partial<typeof TR>;
};

const TR = {
  info: "Bilgi Al",
  viewing: "Randevu Talep Et",
  name: "Adınız",
  contact: "Telefon veya e-posta",
  nationality: "Uyruğunuz",
  dates: "Uygun olduğunuz günler / saatler",
  datesPh: "Örn. 12–14 Kasım, öğleden sonra",
  message: "Mesajınız (isteğe bağlı)",
  consent: "Aydınlatma metnini okudum; bilgilerimin yalnızca bu talep için platform yöneticisi tarafından işlenmesini kabul ediyorum.",
  privacyLink: "Aydınlatma metni",
  privacyNote: "Bilgileriniz iş ortaklarıyla paylaşılmaz. Randevuyu platform ekibi planlar.",
  submit: "Gönder",
  done: "Önizleme modu: talebiniz kaydedilmedi.",
  doneDetail: "Canlı sürümde bu form yalnızca platform yöneticisine iletilecek; iş ortakları iletişim bilgilerinizi görmeyecek.",
  again: "Yeni talep",
};

export default function InquiryForm({ codes, mode = "info", compact, askNationality, copy }: Props) {
  const t = { ...TR, ...copy };
  const [tab, setTab] = useState<"info" | "viewing">(mode);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="notice notice-sea" role="status">
        <div className="stack" style={{ gap: 6 }}>
          <strong>{t.done}</strong>
          <span>{t.doneDetail}</span>
          <button className="btn btn-sm btn-light" style={{ justifySelf: "start" }} onClick={() => setSent(false)}>
            {t.again}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="stack"
      style={{ gap: 14 }}
      onSubmit={(e) => {
        e.preventDefault();
        // ÖNİZLEME: hiçbir veri gönderilmez ve saklanmaz.
        setSent(true);
      }}
    >
      {!compact && (
        <div className="lang-switch" role="tablist" style={{ justifySelf: "start" }}>
          {(["info", "viewing"] as const).map((k) => (
            <a
              key={k}
              href="#"
              role="tab"
              aria-current={tab === k}
              aria-selected={tab === k}
              onClick={(e) => {
                e.preventDefault();
                setTab(k);
              }}
            >
              {k === "info" ? t.info : t.viewing}
            </a>
          ))}
        </div>
      )}
      <input type="hidden" name="codes" value={codes.join(",")} />
      <label className="field">
        <span>{t.name}</span>
        <input className="input" name="name" required autoComplete="name" maxLength={80} />
      </label>
      <label className="field">
        <span>{t.contact}</span>
        <input className="input" name="contact" required autoComplete="tel" maxLength={120} />
      </label>
      {askNationality && (
        <label className="field">
          <span>{t.nationality}</span>
          <input className="input" name="nationality" maxLength={60} />
        </label>
      )}
      {tab === "viewing" && (
        <label className="field">
          <span>{t.dates}</span>
          <input className="input" name="dates" placeholder={t.datesPh} maxLength={200} />
        </label>
      )}
      <label className="field">
        <span>{t.message}</span>
        <textarea className="textarea" name="message" maxLength={1000} />
      </label>
      <label className="row small" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
        <input type="checkbox" required style={{ marginTop: 4 }} />
        <span>
          {t.consent}{" "}
          <Link href="/gizlilik" style={{ textDecoration: "underline" }}>
            {t.privacyLink}
          </Link>
        </span>
      </label>
      <button className="btn btn-primary btn-block">{tab === "viewing" ? t.viewing : t.submit}</button>
      <p className="small muted">{t.privacyNote}</p>
    </form>
  );
}
