"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState, useTransition } from "react";
import type { CartItemInput, CartItemRecord } from "@/lib/types";
import { toast } from "sonner";

interface AppliedVoucher {
  code: string;
  discountAmount: number;
  description?: string;
}

interface CartContextValue {
  items: CartItemRecord[];
  loading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  totalCount: number;
  subtotal: number;
  totalWeightGrams: number;
  appliedVoucher: AppliedVoucher | null;
  addItem: (input: CartItemInput) => Promise<boolean>;
  updateQty: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCartItems: () => Promise<void>;
  applyVoucherCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removeVoucher: () => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [totalWeightGrams, setTotalWeightGrams] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);
  const [, startTransition] = useTransition();

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  async function refreshCart() {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotalCount(data.totalCount || 0);
        setSubtotal(data.subtotal || 0);
        setTotalWeightGrams(data.totalWeightGrams || 0);
      }
    } catch {
      // Abaikan bila offline/error jaringan sementara
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/cart")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setItems(data.items || []);
        setTotalCount(data.totalCount || 0);
        setSubtotal(data.subtotal || 0);
        setTotalWeightGrams(data.totalWeightGrams || 0);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function addItem(input: CartItemInput): Promise<boolean> {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Gagal menambahkan ke keranjang");
        return false;
      }
      const data = await res.json();
      startTransition(() => {
        setItems(data.items || []);
        setTotalCount(data.totalCount || 0);
        setSubtotal(data.subtotal || 0);
        setTotalWeightGrams(data.totalWeightGrams || 0);
      });
      toast.success(`${input.coffeeName} ditambahkan ke keranjang ☕`);
      return true;
    } catch {
      toast.error("Terjadi kesalahan saat menambahkan ke keranjang");
      return false;
    }
  }

  async function updateQty(id: string, quantity: number) {
    // Optimistic UI update
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, quantity } : i));
    });

    try {
      const res = await fetch(`/api/cart/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotalCount(data.totalCount || 0);
        setSubtotal(data.subtotal || 0);
        setTotalWeightGrams(data.totalWeightGrams || 0);
      } else {
        await refreshCart();
      }
    } catch {
      await refreshCart();
    }
  }

  async function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/cart/${id}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotalCount(data.totalCount || 0);
        setSubtotal(data.subtotal || 0);
        setTotalWeightGrams(data.totalWeightGrams || 0);
        toast.info("Item dihapus dari keranjang");
      } else {
        await refreshCart();
      }
    } catch {
      await refreshCart();
    }
  }

  async function clearCartItems() {
    setItems([]);
    setTotalCount(0);
    setSubtotal(0);
    setTotalWeightGrams(0);
    setAppliedVoucher(null);
    try {
      await fetch("/api/cart", { method: "DELETE" });
    } catch {
      // noop
    }
  }

  async function applyVoucherCode(code: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        return { success: false, message: data.error || "Kode voucher tidak valid" };
      }
      setAppliedVoucher({
        code: data.voucher.code,
        discountAmount: data.discountAmount,
        description: data.voucher.description,
      });
      return { success: true, message: data.message || "Voucher berhasil diterapkan!" };
    } catch {
      return { success: false, message: "Gagal memverifikasi voucher" };
    }
  }

  function removeVoucher() {
    setAppliedVoucher(null);
    toast.info("Voucher dibatalkan");
  }

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        isOpen,
        openCart,
        closeCart,
        totalCount,
        subtotal,
        totalWeightGrams,
        appliedVoucher,
        addItem,
        updateQty,
        removeItem,
        clearCartItems,
        applyVoucherCode,
        removeVoucher,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
