"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StatusLookup() {
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <div className="glossy-card mx-auto max-w-md rounded-2xl border border-border p-8 text-center">
      <PackageSearch className="mx-auto h-10 w-10 text-gold-deep" />
      <h2 className="mt-4 font-[var(--font-display)] text-xl font-bold text-green-deep">Lacak Pesanan</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Masukkan nomor pesanan dari email konfirmasimu (format: ACHO-XXXXXXXX-XXXX).
      </p>
      <form
        className="mt-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const v = value.trim().toUpperCase();
          if (v) router.push("/status/" + v);
        }}
      >
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="ACHO-20250901-AB12" />
        <Button type="submit" variant="gold">Cari</Button>
      </form>
    </div>
  );
}
