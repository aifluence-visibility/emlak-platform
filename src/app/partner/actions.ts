"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isPartnerId } from "@/lib/data/partner";
import { PREVIEW_PARTNER_COOKIE } from "@/lib/previewIdentity";

/** Önizleme: örnek partner kimliğini seçer. Gerçek oturum açma DEĞİLDİR. */
export async function choosePreviewPartner(formData: FormData) {
  const id = String(formData.get("partner") ?? "");
  if (!isPartnerId(id)) redirect("/partner/onizleme-kimligi");
  (await cookies()).set(PREVIEW_PARTNER_COOKIE, id, { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
  redirect("/partner");
}

export async function clearPreviewPartner() {
  (await cookies()).delete(PREVIEW_PARTNER_COOKIE);
  redirect("/partner/onizleme-kimligi");
}
