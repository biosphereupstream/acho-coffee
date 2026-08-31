import Link from "next/link";
import { Coffee, Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="metal-green-strong mt-auto text-primary-foreground/90">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <Coffee className="h-5 w-5 text-gold-light" />
            </span>
            <span className="text-lg font-extrabold text-white">
              ACHO <span className="text-gold-light">COFFEE</span>
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Roastery kopi nusantara. Setiap pesanan dipanggang fresh setelah kamu bayar — bukan stok lama di rak.
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
              Jl. Kopi No. 1, Bandung, Jawa Barat
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-gold-light" /> +62 812-3456-7890
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-gold-light" /> hello@acho.coffee
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} ACHO Coffee Roastery — Dipanggang dengan cinta di Bandung ☕
      </div>
    </footer>
  );
}
