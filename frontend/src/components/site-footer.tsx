"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useFrontendConfig } from "@/components/frontend-config-provider";

function formatSocialUrl(value: string | undefined, platform: "instagram" | "tiktok"): string | null {
  if (!value || !value.trim()) return null;
  const clean = value.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }
  const username = clean.replace(/^@/, "");
  if (!username) return null;
  if (platform === "instagram") {
    return `https://instagram.com/${username}`;
  }
  if (platform === "tiktok") {
    return `https://tiktok.com/@${username}`;
  }
  return clean;
}

function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TikTokIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.34 6.34 0 0 0 1.86-4.49V8.52a8.27 8.27 0 0 0 4.84 1.56v-3.4a4.84 4.84 0 0 1-.93.01z" />
    </svg>
  );
}

export function SiteFooter() {
  const config = useFrontendConfig();

  const whatsapp = (config?.contact_whatsapp || "6281291731358").replace(/\D/g, "");
  const formattedPhone = whatsapp.startsWith("62")
    ? `+62 ${whatsapp.slice(2, 5)}-${whatsapp.slice(5, 9)}-${whatsapp.slice(9)}`
    : `+${whatsapp}`;
  const email = config?.contact_email || "biosphere.upstream@gmail.com";
  const hours = config?.operating_hours || "08:00 - 20:00 WIB";
  const address =
    config?.contact_address ||
    "Jl. Srikaya Perum Bumi Tajur Raya Blok A4 No 7, Desa Tajur, Kec. Citeureup, Kabupaten Bogor, Jawa Barat 16811";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const instagramUrl = formatSocialUrl(config?.social_instagram || "biosphere.roastworks", "instagram");
  const tiktokUrl = formatSocialUrl(config?.social_tiktok || "biosphere.roastworks", "tiktok");

  return (
    <footer className="metal-green-strong mt-auto text-primary-foreground/90">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/20 bg-white/10 p-1">
              <Image src="/biosphere-logo.png" alt="Biosphere Roast Works" width={40} height={40} className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-[var(--font-display)] text-base font-extrabold tracking-wider leading-none text-white">
                BIOSPHERE
              </span>
              <span className="text-[10px] font-bold tracking-widest text-gold-light uppercase leading-tight mt-0.5">
                Roast Works
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold text-gold-light tracking-wide uppercase">
            Where Science Meets Soul
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Freshly brewed · straight to your door. Pilihan Classic Origin Beans, Botol Kale 250ml, Pet Can sealed, Botol 1 Liter, dan Simplicity Pouch.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-gold-light">Jelajahi</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/kopi" className="hover:text-gold-light">Biji Kopi (Roasted Beans)</Link></li>
            <li><Link href="/minuman" className="hover:text-gold-light">Minuman Siap Seduh</Link></li>
            <li><Link href="/wholesale" className="hover:text-gold-light font-semibold text-gold-light">Kemitraan Kafe (Wholesale)</Link></li>
            <li><Link href="/#proses" className="hover:text-gold-light">Proses Roasting</Link></li>
            <li><Link href="/masuk" className="hover:text-gold-light">Masuk / Daftar</Link></li>
            <li><Link href="/status" className="hover:text-gold-light">Lacak Pesanan</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-gold-light">Bantuan</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/#faq" className="hover:text-gold-light">FAQ</Link></li>
            <li><Link href="/#jadwal" className="hover:text-gold-light">Jadwal Pickup</Link></li>
            <li><Link href="/#pengiriman" className="hover:text-gold-light">Pengiriman</Link></li>
            <li><Link href="/#pembayaran" className="hover:text-gold-light">Pembayaran</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-gold-light">Hubungi Kami</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" />
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Buka lokasi di Google Maps"
                className="hover:text-gold-light transition-colors underline-offset-2 hover:underline leading-relaxed"
              >
                {address}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-gold-light" />
              <span>Jam Operasional: {hours}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-gold-light" />
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold-light transition-colors underline-offset-2 hover:underline"
              >
                {formattedPhone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-gold-light" />
              <a
                href={`mailto:${email}`}
                className="hover:text-gold-light transition-colors underline-offset-2 hover:underline"
              >
                {email}
              </a>
            </li>

            {(instagramUrl || tiktokUrl) && (
              <li className="pt-2 border-t border-white/10">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-gold-light mb-2">
                  Media Sosial Resmi
                </span>
                <div className="flex items-center gap-2.5">
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram Biosphere Roast Works"
                      title="Instagram @biosphere.roastworks"
                      className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/90 transition-all duration-300 hover:border-gold-light hover:bg-gold-light/20 hover:text-gold-light hover:scale-110 shadow-sm"
                    >
                      <InstagramIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
                    </a>
                  )}
                  {tiktokUrl && (
                    <a
                      href={tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="TikTok Biosphere Roast Works"
                      title="TikTok @biosphere.roastworks"
                      className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/90 transition-all duration-300 hover:border-gold-light hover:bg-gold-light/20 hover:text-gold-light hover:scale-110 shadow-sm"
                    >
                      <TikTokIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
                    </a>
                  )}
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Biosphere Roast Works — Where Science Meets Soul ☕
      </div>
    </footer>
  );
}
