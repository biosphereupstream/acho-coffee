"use client";

import { useState, useEffect } from "react";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminPanel } from "@/components/admin/admin-panel";
import type { OrderRecord } from "@/lib/types";
import { Coffee } from "lucide-react";

export function AdminGate({ orders, demo }: { orders: OrderRecord[]; demo: boolean }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<string>("admin");

  useEffect(() => {
    const token = localStorage.getItem("acho_admin_token") || sessionStorage.getItem("acho_admin_token");
    const user = localStorage.getItem("acho_admin_user") || sessionStorage.getItem("acho_admin_user");
    if (token) {
      setAuthenticated(true);
      if (user) setAdminUser(user);
    } else {
      setAuthenticated(false);
    }
  }, []);

  function handleLoginSuccess(token: string, username: string) {
    setAuthenticated(true);
    setAdminUser(username);
  }

  async function handleLogout() {
    try {
      const token = localStorage.getItem("acho_admin_token") || sessionStorage.getItem("acho_admin_token");
      if (token) {
        await fetch("/api/backend/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("acho_admin_token");
      localStorage.removeItem("acho_admin_user");
      sessionStorage.removeItem("acho_admin_token");
      sessionStorage.removeItem("acho_admin_user");
      setAuthenticated(false);
    }
  }

  if (authenticated === null) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-muted-foreground">
        <Coffee className="h-8 w-8 animate-bounce text-gold mb-3" />
        <p className="text-xs font-semibold">Memeriksa status sesi admin...</p>
      </div>
    );
  }

  if (!authenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminPanel orders={orders} demo={demo} adminUser={adminUser} onLogout={handleLogout} />;
}
