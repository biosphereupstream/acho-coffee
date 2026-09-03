import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="metal-green-strong mt-auto text-primary-foreground/90">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
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
            <li><Link href="/kopi" className="hover:text-gold-light">Katalog Kopi</Link></li>
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
              Sumur Bandung, Kota Bandung, Jawa Barat
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-gold-light" /> +62 812-3456-7890
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-gold-light" /> hello@biosphereroastworks.com
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Biosphere Roast Works — Where Science Meets Soul ☕
      </div>
    </footer>
  );
}
