import { NextResponse } from "next/server";
import { getPublicPropertiesByCodes } from "@/lib/data/public";

/** Favoriler/karşılaştırma için: yalnızca public projeksiyon döner. */
export function GET(req: Request) {
  const codes = (new URL(req.url).searchParams.get("k") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter((c) => /^[A-Z]{2}-\d{4}$/i.test(c))
    .slice(0, 50);
  return NextResponse.json(getPublicPropertiesByCodes(codes), { headers: { "Cache-Control": "no-store" } });
}
