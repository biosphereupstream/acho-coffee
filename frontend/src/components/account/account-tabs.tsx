"use client";

import Link from "next/link";
import { ArrowRight, FileText, PackageOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AddressBook } from "@/components/account/address-book";
import { formatIDR } from "@/lib/constants";
import { STATUS_LABELS, type OrderRecord, type UserAddressRecord } from "@/lib/types";

export function AccountTabs({
  orders,
  addresses,
  profile,
  initialTab,
}: {
  orders: OrderRecord[];
  addresses: UserAddressRecord[];
  profile: { name: string; email: string };
  initialTab: "pesanan" | "alamat" | "profil";
}) {
  return (
    <Tabs defaultValue={initialTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="pesanan">Pesanan Saya</TabsTrigger>
        <TabsTrigger value="alamat">Buku Alamat</TabsTrigger>
        <TabsTrigger value="profil">Profil</TabsTrigger>
      </TabsList>

      <TabsContent value="pesanan">
        {orders.length === 0 ? (
          <div className="glossy-card rounded-2xl border border-border p-10 text-center">
            <PackageOpen className="mx-auto h-10 w-10 text-gold-deep" />
            <p className="mt-4 font-semibold text-green-deep">Belum ada pesanan</p>
            <p className="mt-1 text-sm text-muted-foreground">Yuk mulai petualangan kopimu yang pertama!</p>
            <Button className="mt-5" variant="gold" asChild>
              <Link href="/kopi">Lihat Katalog <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.orderNumber} className="glossy-card rounded-2xl border border-border p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-green-deep">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(o.createdAt))}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={o.paymentStatus === "paid" ? "default" : o.status === "cancelled" ? "destructive" : "gold"}>
                      {STATUS_LABELS[o.status]}
                    </Badge>
                    <Button size="sm" variant="outline" asChild className="text-xs h-8">
                      <Link href={"/status/" + o.orderNumber}>Detail</Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild className="text-xs h-8">
                      <Link href={"/faktur/" + o.orderNumber}>
                        <FileText className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                        Faktur
                      </Link>
                    </Button>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
                  <p className="text-muted-foreground">
                    {o.items.map((it) => it.coffeeName).join(", ")} • {o.items.reduce((s, it) => s + it.quantity, 0)} pcs •{" "}
                    {o.fulfillment === "pickup" ? "Ambil di Roastery" : "Dikirim"}
                  </p>
                  <p className="font-bold text-primary">{formatIDR(o.total)}</p>
                </div>
                {o.paymentStatus !== "paid" && o.status === "pending_payment" && (
                  <div className="mt-3">
                    <Button size="sm" variant="gold" asChild className="w-full sm:w-auto">
                      <Link href={"/pembayaran/" + o.orderNumber}>Bayar Sekarang</Link>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="alamat">
        <AddressBook initialAddresses={addresses} />
      </TabsContent>

      <TabsContent value="profil">
        <div className="glossy-card max-w-md rounded-2xl border border-border p-6">
          <h3 className="text-sm font-bold text-green-deep">Informasi Akun</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Nama</p>
              <p className="font-semibold">{profile.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-semibold">{profile.email}</p>
            </div>
          </div>
          <p className="mt-4 rounded-lg bg-secondary/60 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
            Akun dikelola melalui Supabase Auth (termasuk login Google). Keluar dari menu akun di pojok kanan atas.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
