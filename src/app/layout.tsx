import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: SITE_NAME + " — " + SITE_TAGLINE,
    template: "%s | " + SITE_NAME,
  },
  description:
    "ACHO Coffee: kopi single origin & blend nusantara yang diroasting fresh sesuai pesananmu. Pilih profil roasting, grind size, jadwal ambil atau kirim dengan tracing kurir.",
  keywords: ["kopi", "fresh roasting", "single origin", "blend", "kopi nusantara", "roastery"],
  openGraph: {
    title: SITE_NAME + " — Fresh Roasting Sesuai Pesanan",
    description: "Dipesan hari ini, dipanggang khusus untukmu. Ambil di roastery atau kirim ke rumahmu.",
    type: "website",
    locale: "id_ID",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d5c3a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="flex min-h-screen flex-col bg-background">
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
