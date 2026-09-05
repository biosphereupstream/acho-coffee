import { Check, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { STATUS_LABELS, type OrderRecord, type OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const PICKUP_STEPS: [OrderStatus, string][] = [
  ["pending_payment", "Pesanan Dibuat"],
  ["paid", "Dibayar"],
  ["queued", "Dalam Antrian"],
  ["roasting", "Roasting"],
  ["resting", "Resting / Degassing"],
  ["ready_pickup", "Siap Diambil"],
  ["completed", "Selesai"],
];

const DELIVERY_STEPS: [OrderStatus, string][] = [
  ["pending_payment", "Pesanan Dibuat"],
  ["paid", "Dibayar"],
  ["queued", "Dalam Antrian"],
  ["roasting", "Roasting"],
  ["resting", "Resting / Degassing"],
  ["shipped", "Dikirim"],
  ["delivered", "Terkirim"],
  ["completed", "Selesai"],
];

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function StatusTimeline({ order }: { order: OrderRecord }) {
  const steps = order.fulfillment === "delivery" ? DELIVERY_STEPS : PICKUP_STEPS;

  if (order.status === "cancelled") {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-center">
        <p className="font-bold text-destructive">Pesanan Dibatalkan</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Pesanan {order.orderNumber} dibatalkan. Hubungi kami bila ini kesalahan.
        </p>
      </div>
    );
  }

  const currentIdx = steps.findIndex(([s]) => s === order.status);
  const progress = Math.round(((currentIdx + 1) / steps.length) * 100);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between text-sm">
        <span className="font-bold text-green-deep">Proses Pesanan</span>
        <span className="text-muted-foreground">{progress}%</span>
      </div>
      <Progress value={progress} className="mb-8 h-2.5" indicatorClassName="metal-gold" />

      <ol className="space-y-0">
        {steps.map(([status, label], i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const isLast = i === steps.length - 1;
          return (
            <li key={status} className="relative flex gap-4 pb-8 last:pb-0">
              {!isLast && (
                <span
                  className={cn(
                    "absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5",
                    done ? "metal-green" : "bg-border"
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                  done && "metal-green border-transparent text-primary-foreground",
                  active && "border-gold bg-accent text-gold-deep",
                  !done && !active && "border-border bg-white text-muted-foreground"
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : active ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-xs font-bold">{i + 1}</span>
                )}
              </span>
              <div className="pt-1">
                <p className={cn("text-sm font-bold", active ? "text-primary" : done ? "text-green-deep" : "text-muted-foreground")}>
                  {label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {active ? "Sedang berlangsung — " + STATUS_LABELS[status] : ""}
                  {status === "paid" && order.paidAt ? "Dibayar " + formatTime(order.paidAt) : ""}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
