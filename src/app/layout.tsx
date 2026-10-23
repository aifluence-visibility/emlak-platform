import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "./globals.css";
import "./site.css";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: { default: `${BRAND.name} — Bodrum ve Milas'ta seçilmiş satılık evler`, template: `%s · ${BRAND.name}` },
  description: "Bodrum ve Milas'ta yetki belgesi incelenmiş satılık evler, yeni projeler ve vatandaşlık ön incelemesinden geçmiş gayrimenkuller.",
  robots: { index: false, follow: false }, // önizleme
};

export const viewport: Viewport = { themeColor: "#f8f5ef", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
