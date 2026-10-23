"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PREVIEW_ADMIN_COOKIE } from "@/lib/previewIdentity";

/** Önizleme: yönetici görünümünü açar. Gerçek oturum açma DEĞİLDİR. */
export async function enterAdminPreview() {
  (await cookies()).set(PREVIEW_ADMIN_COOKIE, "1", { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 24 });
  redirect("/admin");
}

export async function leaveAdminPreview() {
  (await cookies()).delete(PREVIEW_ADMIN_COOKIE);
  redirect("/");
}
