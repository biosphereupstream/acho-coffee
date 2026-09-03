import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://biosphereroastery.vercel.app"),
  title: {
    default: SITE_NAME + " — " + SITE_TAGLINE,
    template: "%s | " + SITE_NAME,
  },
  description:
    "Biosphere Roast Works: Where Science Meets Soul. Biji kopi sangrai Classic Origin Ciwidey & seduhan segar Botol Kale, Pet Can 250ml, Botol 1L, dan Simplicity Pouch. Freshly brewed · straight to your door.",
  keywords: ["Biosphere Roast Works", "kopi ciwidey", "fresh roasting", "botol kale", "pet can coffee", "simplicity pouch", "bandung roastery"],
  icons: {
    icon: "/biosphere-logo.png",
    shortcut: "/biosphere-logo.png",
    apple: "/biosphere-logo.png",
  },
  openGraph: {
    title: SITE_NAME + " — Where Science Meets Soul",
    description: "Freshly brewed · straight to your door. Roastery kopi specialty Bandung.",
    type: "website",
    locale: "id_ID",
    images: [{ url: "/biosphere-logo.png", width: 1024, height: 1017, alt: "Biosphere Roast Works Logo" }],
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
      <body className="flex min-h-screen flex-col bg-background overflow-x-hidden w-full max-w-full">
        <Providers>
          <SiteHeader />
          <main className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>
          <SiteFooter />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
