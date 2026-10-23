import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isPartnerId } from "@/lib/data/partner";

/**
 * ÖNİZLEME KİMLİĞİ — GÜVENLİK ÖZELLİĞİ DEĞİLDİR.
 * Panelleri farklı partner gözünden görmek için seçilen örnek kimlik bir çerezde tutulur.
 * Herkes istediği kimliği seçebilir. Canlıda bunun yerini Supabase Auth oturumu + sunucuda
 * doğrulanan partner üyeliği alır; bu dosya silinir.
 */
export const PREVIEW_PARTNER_COOKIE = "ep_preview_partner";

export async function currentPreviewPartner(): Promise<string | null> {
  const v = (await cookies()).get(PREVIEW_PARTNER_COOKIE)?.value;
  return isPartnerId(v) ? v : null;
}

export async function requirePreviewPartner(): Promise<string> {
  const id = await currentPreviewPartner();
  if (!id) redirect("/partner/onizleme-kimligi");
  return id;
}
