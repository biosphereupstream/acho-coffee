"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Coffee, 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight, 
  KeyRound, 
  Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLoginProps {
  onLoginSuccess: (token: string, username: string) => void;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/backend/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Username atau password salah");
      }

      // Store in storage
      if (rememberMe) {
        localStorage.setItem("acho_admin_token", json.token);
        localStorage.setItem("acho_admin_user", json.username);
      } else {
        sessionStorage.setItem("acho_admin_token", json.token);
        sessionStorage.setItem("acho_admin_user", json.username);
      }

      onLoginSuccess(json.token, json.username);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal terhubung ke backend otentikasi";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleAutoFill() {
    setUsername("admin");
    setPassword("acho_admin_2026");
    setError(null);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-20">
      <div className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-gold/15 blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-primary/15 blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-green-deep text-primary-foreground shadow-lg mb-2">
            <Coffee className="h-7 w-7 text-gold-light" />
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold-deep">
            <ShieldCheck className="h-4 w-4" />
            <span>Roastery Command Center</span>
          </div>
          <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl font-black text-foreground">
            Login Admin Backend
          </h1>
          <p className="text-xs text-muted-foreground">
            Masukkan username dan password admin untuk mengelola menu, analitik, dan inventaris.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Username Admin
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username (contoh: admin)"
                className="w-full bg-background border border-input rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-foreground flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Password Admin
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin"
                className="w-full bg-background border border-input rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary"
              />
              <span className="text-muted-foreground select-none font-medium">Ingat sesi di perangkat ini</span>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 h-auto text-xs font-bold gap-2 rounded-xl shadow-md transition-transform active:scale-[0.99]"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                <span>Memverifikasi Kredensial...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Panel Admin</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Quick Credential Helper for Development */}
        <div className="mt-6 rounded-2xl border border-border/60 bg-secondary/40 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground flex items-center gap-1 text-[11px]">
              <KeyRound className="h-3.5 w-3.5 text-gold-deep" />
              Kredensial Default:
            </span>
            <button
              type="button"
              onClick={handleAutoFill}
              className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
            >
              <Sparkles className="h-3 w-3" /> Isi Otomatis
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-muted-foreground">
            <div className="p-1.5 rounded-lg bg-background/80 border border-border/50 truncate">
              User: <b className="text-foreground">admin</b>
            </div>
            <div className="p-1.5 rounded-lg bg-background/80 border border-border/50 truncate">
              Pass: <b className="text-foreground">acho_admin_2026</b>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground font-medium transition"
          >
            ← Kembali ke Beranda Toko ACHO Coffee
          </Link>
        </div>
      </div>
    </div>
  );
}
