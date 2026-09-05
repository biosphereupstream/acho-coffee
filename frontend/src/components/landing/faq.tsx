"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const GROUPS = [
  {
    id: "jadwal",
    title: "Jadwal Pickup & Antrian",
    items: [
      {
        q: "Kapan kopi saya bisa diambil setelah memesan?",
        a: "Kopi diroasting fresh setelah pembayaran diterima, lalu didiamkan (degassing) selama 2 hari agar rasa optimal. Tanggal pickup paling cepat adalah 2 hari setelah tanggal pesan, sesuai kapasitas antrian roasting harian kami.",
      },
      {
        q: "Bagaimana sistem antrian pesanan bekerja?",
        a: "Setiap hari kami punya kapasitas roasting maksimal (120 bungkus/hari). Saat memilih tanggal ambil, sistem otomatis menghitung sisa slot hari itu dan hanya menampilkan tanggal yang masih tersedia.",
      },
      {
        q: "Apakah saya bisa ambil di luar jam yang saya pilih?",
        a: "Kamu bisa datang kapan saja di jam operasional roastery (08.00–17.00), tapi memilih slot membantu kami menyiapkan pesananmu lebih cepat saat kamu tiba.",
      },
    ],
  },
  {
    id: "pengiriman",
    title: "Pengiriman & Tracing",
    items: [
      {
        q: "Kurir apa saja yang tersedia?",
        a: "Kami terintegrasi dengan Biteship: JNE, J&T, SiCepat, dan AnterAja. Ongkir dihitung otomatis sesuai alamat tujuan dan berat paket.",
      },
      {
        q: "Bagaimana cara melacak paket saya?",
        a: "Setelah paket diserahkan ke kurir, kamu mendapat nomor resi dan tautan tracing. Status juga otomatis diperbarui di halaman status pesananmu lewat webhook kurir.",
      },
      {
        q: "Apakah kopi tetap fresh saat dikirim?",
        a: "Ya — kami kirim dalam kemasan one-way valve maksimal 1 hari setelah roasting selesai, sehingga kopi tiba di puncak kesegarannya.",
      },
    ],
  },
  {
    id: "pembayaran",
    title: "Pembayaran",
    items: [
      {
        q: "Metode pembayaran apa saja yang diterima?",
        a: "Virtual Account (BCA, Mandiri, BRI, BNI), e-wallet (OVO, DANA, LinkAja, ShopeePay), dan QRIS — diproses oleh Doku dengan standar keamanan PCI-DSS.",
      },
      {
        q: "Kapan kopi mulai dipanggang?",
        a: "Segera setelah pembayaran kamu terverifikasi otomatis. Kamu akan menerima email konfirmasi dan update di setiap tahap proses.",
      },
      {
        q: "Apakah bisa refund?",
        a: "Bisa, jika pesanan belum masuk tahap roasting. Setelah biji dipanggang, pesanan bersifat final karena kopi dibuat khusus untukmu.",
      },
    ],
  },
];

export function LandingFAQ() {
  return (
    <div className="space-y-10">
      {GROUPS.map((group) => (
        <div key={group.id} id={group.id} className="scroll-mt-24">
          <h3 className="mb-3 flex items-center gap-2 font-[var(--font-display)] text-xl font-bold text-green-deep">
            <span className="inline-block h-5 w-1.5 rounded-full metal-gold" />
            {group.title}
          </h3>
          <Accordion type="single" collapsible className="glossy-card rounded-xl border border-border px-5">
            {group.items.map((item, i) => (
              <AccordionItem key={i} value={group.id + "-" + i}>
                <AccordionTrigger className="text-base font-semibold">{item.q}</AccordionTrigger>
                <AccordionContent className="text-[15px] leading-relaxed">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  );
}
