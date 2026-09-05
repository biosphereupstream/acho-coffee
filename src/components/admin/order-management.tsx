"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Truck,
  FileText,
  Tag,
  Package,
  CheckCircle2,
  Loader2,
  ChevronRight,
  CheckSquare,
  Square,
  Edit,
  Trash2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatIDR, GRIND_LABELS } from "@/lib/constants";
import { STATUS_LABELS, type OrderRecord, type OrderStatus } from "@/lib/types";
import { toast } from "sonner";

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  draft: [],
  pending_payment: ["paid"],
  paid: ["queued"],
  queued: ["roasting"],
  roasting: ["resting"],
  resting: ["ready_pickup", "shipped"],
  ready_pickup: ["completed"],
  shipped: ["delivered"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
};

type FilterCategory =
  | "all"
  | "perlu_roast"
  | "roasting"
  | "resting"
  | "siap_kirim"
  | "shipped"
  | "completed"
  | "cancelled";

export function OrderManagement({
  orders,
  onOrderUpdated,
}: {
  orders: OrderRecord[];
  onOrderUpdated?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [busyOrder, setBusyOrder] = useState<string | null>(null);

  // Multi-select state
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Bulk Status Modal
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [targetBulkStatus, setTargetBulkStatus] = useState<OrderStatus>("roasting");

  // Single Edit Order State
  const [editingOrder, setEditingOrder] = useState<OrderRecord | null>(null);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerPhone, setEditCustomerPhone] = useState("");
  const [editCustomerEmail, setEditCustomerEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editPostalCode, setEditPostalCode] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editStatus, setEditStatus] = useState<OrderStatus>("paid");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Dispatch Dialog State
  const [dispatchOrder, setDispatchOrder] = useState<OrderRecord | null>(null);
  const [trackingNoInput, setTrackingNoInput] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);

  // Filter and search logic
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Search
      const q = search.trim().toLowerCase();
      if (q) {
        const matchesNumber = o.orderNumber.toLowerCase().includes(q);
        const matchesCustomer = o.customerName.toLowerCase().includes(q);
        const matchesPhone = o.customerPhone.includes(q);
        const matchesEmail = o.customerEmail.toLowerCase().includes(q);
        if (!matchesNumber && !matchesCustomer && !matchesPhone && !matchesEmail) return false;
      }

      // Filter category
      if (filter === "perlu_roast") return ["paid", "queued"].includes(o.status);
      if (filter === "roasting") return o.status === "roasting";
      if (filter === "resting") return o.status === "resting";
      if (filter === "siap_kirim") return o.status === "ready_pickup";
      if (filter === "shipped") return o.status === "shipped";
      if (filter === "completed") return ["delivered", "completed"].includes(o.status);
      if (filter === "cancelled") return o.status === "cancelled";

      return true;
    });
  }, [orders, search, filter]);

  async function updateStatus(orderNumber: string, status: OrderStatus) {
    setBusyOrder(orderNumber);
    try {
      const res = await fetch("/api/admin/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, status }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui status pesanan");
      toast.success(`Pesanan ${orderNumber} diperbarui ke ${STATUS_LABELS[status]}`);
      if (onOrderUpdated) onOrderUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setBusyOrder(null);
    }
  }

  async function handleDispatchBiteship() {
    if (!dispatchOrder) return;
    setIsDispatching(true);
    try {
      const res = await fetch("/api/admin/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: dispatchOrder.orderNumber,
          mode: "biteship",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memproses pickup kurir");
      toast.success(json.message || "Pickup kurir berhasil dijadwalkan!");
      setDispatchOrder(null);
      if (onOrderUpdated) onOrderUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan dispatch");
    } finally {
      setIsDispatching(false);
    }
  }

  async function handleManualTracking() {
    if (!dispatchOrder || !trackingNoInput.trim()) {
      toast.error("Silakan masukkan nomor resi");
      return;
    }
    setIsDispatching(true);
    try {
      const res = await fetch("/api/admin/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: dispatchOrder.orderNumber,
          mode: "manual",
          trackingNo: trackingNoInput.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan nomor resi");
      toast.success(json.message || "Resi berhasil disimpan dan status diubah ke 'Dalam Pengiriman'");
      setDispatchOrder(null);
      setTrackingNoInput("");
      if (onOrderUpdated) onOrderUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setIsDispatching(false);
    }
  }

  const isAllSelected = filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length;

  function handleSelectAllToggle() {
    if (isAllSelected) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((o) => o.orderNumber));
    }
  }

  function handleToggleOrderSelect(orderNumber: string) {
    if (selectedOrders.includes(orderNumber)) {
      setSelectedOrders((prev) => prev.filter((id) => id !== orderNumber));
    } else {
      setSelectedOrders((prev) => [...prev, orderNumber]);
    }
  }

  function openEditModal(o: OrderRecord) {
    setEditingOrder(o);
    setEditCustomerName(o.customerName || "");
    setEditCustomerPhone(o.customerPhone || "");
    setEditCustomerEmail(o.customerEmail || "");
    setEditAddress(o.shippingAddress?.address || "");
    setEditCity(o.shippingAddress?.city || "");
    setEditPostalCode(o.shippingAddress?.postalCode || "");
    setEditNote(o.note || "");
    setEditStatus(o.status);
  }

  async function handleSaveOrderEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingOrder) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: editingOrder.orderNumber,
          customerName: editCustomerName,
          customerPhone: editCustomerPhone,
          customerEmail: editCustomerEmail,
          shippingAddress: editingOrder.shippingAddress
            ? {
                ...editingOrder.shippingAddress,
                address: editAddress,
                city: editCity,
                postalCode: editPostalCode,
              }
            : editAddress
            ? {
                name: editCustomerName,
                phone: editCustomerPhone,
                address: editAddress,
                city: editCity,
                postalCode: editPostalCode,
                courierService: "custom",
              }
            : null,
          note: editNote,
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui pesanan");
      toast.success(`Pesanan ${editingOrder.orderNumber} berhasil diperbarui!`);
      setEditingOrder(null);
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDeleteSingleOrder(orderNumber: string) {
    if (!confirm(`Apakah Anda yakin ingin menghapus pesanan ${orderNumber}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const res = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus pesanan");
      toast.success(data.message || `Pesanan ${orderNumber} berhasil dihapus`);
      setSelectedOrders((prev) => prev.filter((id) => id !== orderNumber));
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus pesanan");
    }
  }

  async function handleBulkStatusSubmit() {
    if (selectedOrders.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const res = await fetch("/api/admin/batch-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumbers: selectedOrders,
          status: targetBulkStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status massal");
      toast.success(`Berhasil mengubah ${data.updatedCount || selectedOrders.length} pesanan ke ${STATUS_LABELS[targetBulkStatus]}`);
      setShowBulkStatusModal(false);
      setSelectedOrders([]);
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal update status massal");
    } finally {
      setIsBulkProcessing(false);
    }
  }

  async function handleBulkDeleteSubmit() {
    if (selectedOrders.length === 0) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedOrders.length} pesanan terpilih? Tindakan ini tidak dapat dibatalkan.`)) return;
    setIsBulkProcessing(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumbers: selectedOrders,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus pesanan massal");
      toast.success(data.message || `Berhasil menghapus ${data.deletedCount} pesanan`);
      setSelectedOrders([]);
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus pesanan massal");
    } finally {
      setIsBulkProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari no. pesanan, nama, atau HP..."
            className="pl-9 text-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            { id: "all", label: "Semua" },
            { id: "perlu_roast", label: "Perlu Di-Roast" },
            { id: "roasting", label: "🔥 Roasting" },
            { id: "resting", label: "❄️ Resting" },
            { id: "siap_kirim", label: "Siap Kirim" },
            { id: "shipped", label: "🚚 Terkirim" },
            { id: "completed", label: "Selesai" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as FilterCategory)}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                filter === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Select All and Bulk Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card/60 backdrop-blur border border-border/80 rounded-xl p-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAllToggle}
            className="flex items-center gap-2 font-medium hover:text-primary transition"
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : (
              <Square className="h-4 w-4 text-muted-foreground" />
            )}
            <span>Pilih Semua Pesanan ({filteredOrders.length})</span>
          </button>
        </div>

        {selectedOrders.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">
              {selectedOrders.length} pesanan dipilih
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowBulkStatusModal(true)}
              className="gap-1 text-xs h-8 font-semibold"
            >
              <Edit className="h-3.5 w-3.5 text-primary" /> Ubah Status Massal
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDeleteSubmit}
              disabled={isBulkProcessing}
              className="gap-1 text-xs h-8 font-semibold bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-3.5 w-3.5" /> Hapus Terpilih ({selectedOrders.length})
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedOrders([])}
              className="text-xs h-8"
            >
              Batal
            </Button>
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 && (
          <div className="glossy-card rounded-2xl border border-border p-12 text-center text-sm text-muted-foreground">
            Tidak ada pesanan yang sesuai dengan filter atau pencarian ini.
          </div>
        )}

        {filteredOrders.map((o) => {
          const isBusy = busyOrder === o.orderNumber;
          const isSelected = selectedOrders.includes(o.orderNumber);
          const formattedDate = new Intl.DateTimeFormat("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(o.createdAt));

          return (
            <div
              key={o.orderNumber}
              className={`glossy-card rounded-2xl border transition-all p-5 sm:p-6 ${
                isSelected ? "border-primary/60 ring-1 ring-primary/40 bg-primary/[0.02]" : "border-border"
              }`}
            >
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleOrderSelect(o.orderNumber)}
                    className="text-foreground hover:text-primary transition"
                    title={isSelected ? "Batal pilih" : "Pilih pesanan"}
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <span className="font-mono text-base font-extrabold text-green-deep">
                    {o.orderNumber}
                  </span>
                  <Badge
                    variant={
                      o.paymentStatus === "paid"
                        ? "default"
                        : o.status === "cancelled"
                        ? "destructive"
                        : "gold"
                    }
                    className="text-[11px]"
                  >
                    {STATUS_LABELS[o.status]}
                  </Badge>
                  {Boolean(o.voucherCode) && (
                    <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                      Voucher: {o.voucherCode}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditModal(o)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                    title="Edit Detail Pesanan"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteSingleOrder(o.orderNumber)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    title="Hapus Pesanan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground">{formattedDate}</span>
                </div>
              </div>

              {/* Customer & Fulfillment Summary */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <p className="font-bold text-foreground text-sm">{o.customerName}</p>
                  <p className="text-muted-foreground mt-0.5">
                    {o.customerPhone} • {o.customerEmail}
                  </p>
                  {o.shippingAddress && (
                    <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
                      📍 {o.shippingAddress.address}, {o.shippingAddress.city} {o.shippingAddress.postalCode}
                    </p>
                  )}
                  {o.note && (
                    <p className="mt-1 italic text-[11px] text-muted-foreground bg-secondary/50 p-1.5 rounded">
                      &ldquo;{o.note}&rdquo;
                    </p>
                  )}
                </div>

                <div className="text-left sm:text-right">
                  <p className="font-[var(--font-display)] text-lg font-black text-green-deep">
                    {formatIDR(o.total)}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    {o.fulfillment === "pickup" ? (
                      <span className="font-semibold text-primary">
                        Ambil di Roastery: {o.pickupDate ?? "Sesuai jadwal"} ({o.pickupSlot ?? "14:00 - 17:00"})
                      </span>
                    ) : (
                      <span>
                        Kurir: <b>{o.courierCompany?.toUpperCase() ?? "Reguler"}</b>
                        {o.trackingNo ? (
                          <span className="font-mono text-primary font-bold ml-1">
                            • Resi: {o.trackingNo}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium ml-1">• Belum ada resi</span>
                        )}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <Separator className="my-3" />

              {/* Items List */}
              <div className="space-y-1.5">
                {o.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="text-foreground font-medium">
                      • {it.quantity}x <b>{it.coffeeName}</b> ({it.roastProfileName}) —{" "}
                      <span className="text-muted-foreground">{GRIND_LABELS[it.grindSize] || it.grindSize}</span>
                    </span>
                    <span>{formatIDR(it.subtotalIdr ?? it.unitPriceIdr * it.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Footer Actions: Print Links & Status Buttons */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
                {/* Print Quick Links */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs h-8">
                    <Link href={`/admin/print/bag-labels?order=${o.orderNumber}`}>
                      <Tag className="h-3.5 w-3.5 text-gold-deep" /> Stiker Bag
                    </Link>
                  </Button>

                  {o.fulfillment === "delivery" && (
                    <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs h-8">
                      <Link href={`/admin/print/packing-slip?order=${o.orderNumber}`}>
                        <Package className="h-3.5 w-3.5 text-muted-foreground" /> Packing Slip
                      </Link>
                    </Button>
                  )}

                  <Button variant="ghost" size="sm" asChild className="gap-1 text-xs h-8 text-muted-foreground">
                    <Link href={`/faktur/${o.orderNumber}`}>
                      <FileText className="h-3.5 w-3.5" /> Faktur
                    </Link>
                  </Button>
                </div>

                {/* Status Advancement & Courier Dispatch */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Courier Dispatch Trigger */}
                  {o.fulfillment === "delivery" && o.status !== "cancelled" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDispatchOrder(o);
                        setTrackingNoInput(o.trackingNo || "");
                      }}
                      className="gap-1.5 text-xs h-8 font-semibold border-primary/40 text-primary hover:bg-primary/10"
                    >
                      <Truck className="h-3.5 w-3.5" />
                      {o.trackingNo ? "Ubah Resi Kurir" : "Kirim / Input Resi"}
                    </Button>
                  )}

                  {/* Individual Status Advancement */}
                  {NEXT[o.status].map((nextStat) => (
                    <Button
                      key={nextStat}
                      size="sm"
                      variant={nextStat === "completed" ? "default" : "outline"}
                      disabled={isBusy}
                      onClick={() => updateStatus(o.orderNumber, nextStat)}
                      className="gap-1 text-xs h-8 font-semibold"
                    >
                      {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      {STATUS_LABELS[nextStat]}
                    </Button>
                  ))}

                  {o.status !== "cancelled" && o.status !== "completed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive text-xs h-8"
                      disabled={isBusy}
                      onClick={() => updateStatus(o.orderNumber, "cancelled")}
                    >
                      Batalkan
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Courier Dispatch / Resi Dialog */}
      <Dialog open={Boolean(dispatchOrder)} onOpenChange={(open) => !open && setDispatchOrder(null)}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-deep">
              <Truck className="h-5 w-5 text-primary" /> Kirim Pesanan {dispatchOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              Pilih mode pengiriman untuk pesanan ke {dispatchOrder?.shippingAddress?.name || dispatchOrder?.customerName} (
              {dispatchOrder?.courierCompany?.toUpperCase() ?? "Kurir Reguler"}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Option 1: Automated Biteship Dispatch */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-green-deep">Opsi 1: Request Pickup Biteship</span>
                <Badge variant="outline" className="text-[10px]">Otomatis</Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Jadwalkan kurir {dispatchOrder?.courierCompany?.toUpperCase() ?? "ekspedisi"} untuk menjemput paket langsung di Biosphere Roast Works Roastery. Nomor resi dan tracking URL akan dibuat otomatis.
              </p>
              <Button
                onClick={handleDispatchBiteship}
                disabled={isDispatching}
                variant="gold"
                size="sm"
                className="w-full font-bold gap-1.5 mt-2"
              >
                {isDispatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                Jadwalkan Pickup Sekarang
              </Button>
            </div>

            <div className="relative flex items-center justify-center">
              <Separator />
              <span className="absolute bg-background px-2 text-[10px] uppercase font-bold text-muted-foreground">
                atau
              </span>
            </div>

            {/* Option 2: Manual Waybill Input */}
            <div className="rounded-xl border border-border p-4 space-y-3">
              <span className="font-bold text-sm text-foreground">Opsi 2: Input Resi Manual</span>
              <p className="text-muted-foreground text-[11px]">
                Gunakan jika paket di-drop langsung ke gerai ekspedisi dan Anda sudah memegang nomor resi fisik.
              </p>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">Nomor Resi / Waybill:</label>
                <Input
                  value={trackingNoInput}
                  onChange={(e) => setTrackingNoInput(e.target.value)}
                  placeholder="Contoh: JNE0192837461 / SC8192837"
                  className="font-mono text-xs"
                />
              </div>
              <Button
                onClick={handleManualTracking}
                disabled={isDispatching || !trackingNoInput.trim()}
                variant="outline"
                size="sm"
                className="w-full font-semibold gap-1.5"
              >
                {isDispatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Simpan Resi & Ubah Status ke Dikirim
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDispatchOrder(null)} disabled={isDispatching}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Dialog */}
      <Dialog open={showBulkStatusModal} onOpenChange={setShowBulkStatusModal}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-deep">
              <Edit className="h-5 w-5 text-primary" /> Ubah Status {selectedOrders.length} Pesanan
            </DialogTitle>
            <DialogDescription>
              Pilih status baru yang akan diterapkan secara bersamaan ke semua pesanan yang dipilih.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div>
              <label className="font-semibold text-foreground">Pilih Status Baru:</label>
              <select
                value={targetBulkStatus}
                onChange={(e) => setTargetBulkStatus(e.target.value as OrderStatus)}
                className="w-full mt-1.5 bg-background border border-input rounded-xl p-2.5 text-xs font-semibold"
              >
                <option value="paid">Sudah Bayar (Paid)</option>
                <option value="queued">Antrian Roasting (Queued)</option>
                <option value="roasting">Sedang Roasting 🔥</option>
                <option value="resting">Resting Degassing ❄️</option>
                <option value="ready_pickup">Siap Diambil / Dikirim</option>
                <option value="shipped">Dalam Pengiriman 🚚</option>
                <option value="delivered">Diterima Pemesan</option>
                <option value="completed">Pesanan Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Tindakan ini akan memperbarui status timeline dan riwayat pelacakan pesanan secara otomatis.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowBulkStatusModal(false)}
              disabled={isBulkProcessing}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleBulkStatusSubmit}
              disabled={isBulkProcessing}
              className="gap-1.5 font-bold"
            >
              {isBulkProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Terapkan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Single Order Dialog */}
      <Dialog open={Boolean(editingOrder)} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto p-6">
          <form onSubmit={handleSaveOrderEdit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-deep">
                <Edit className="h-5 w-5 text-primary" /> Edit Pesanan {editingOrder?.orderNumber}
              </DialogTitle>
              <DialogDescription>
                Ubah informasi pelanggan, alamat pengiriman, status, dan catatan pesanan.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Nama Pelanggan:</label>
                  <Input
                    required
                    value={editCustomerName}
                    onChange={(e) => setEditCustomerName(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">No. Telepon / WhatsApp:</label>
                  <Input
                    required
                    value={editCustomerPhone}
                    onChange={(e) => setEditCustomerPhone(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Email:</label>
                <Input
                  type="email"
                  required
                  value={editCustomerEmail}
                  onChange={(e) => setEditCustomerEmail(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div className="space-y-2 rounded-xl border border-border/70 p-3 bg-secondary/20">
                <span className="font-bold text-foreground text-[11px]">Alamat Pengiriman</span>
                <div>
                  <label className="text-muted-foreground text-[11px]">Jalan / Detail Alamat:</label>
                  <Input
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Jl. Mawar No. 12..."
                    className="mt-1 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-muted-foreground text-[11px]">Kota / Kabupaten:</label>
                    <Input
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="Jakarta Selatan"
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-[11px]">Kode Pos:</label>
                    <Input
                      value={editPostalCode}
                      onChange={(e) => setEditPostalCode(e.target.value)}
                      placeholder="12345"
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Status Pesanan:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs font-semibold"
                >
                  <option value="pending_payment">Menunggu Pembayaran</option>
                  <option value="paid">Sudah Bayar (Paid)</option>
                  <option value="queued">Antrian Roasting</option>
                  <option value="roasting">Sedang Roasting 🔥</option>
                  <option value="resting">Resting Degassing ❄️</option>
                  <option value="ready_pickup">Siap Diambil / Dikirim</option>
                  <option value="shipped">Dalam Pengiriman 🚚</option>
                  <option value="delivered">Diterima Pemesan</option>
                  <option value="completed">Pesanan Selesai</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Catatan Pesanan:</label>
                <textarea
                  rows={2}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Catatan dari pembeli atau instruksi roaster..."
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingOrder(null)}
                disabled={isSavingEdit}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isSavingEdit} className="gap-1.5 font-bold">
                {isSavingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
