"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ROAST_STAGES, ROAST_IMPORTANT_NOTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Flame, Sparkles, Thermometer, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";

interface BeanColorConfig {
  bg: string;
  border: string;
  glow: string;
  label: string;
  cracks?: boolean;
  oilSheen?: boolean;
}

const BEAN_COLORS: Record<string, BeanColorConfig> = {
  drying: {
    bg: "from-[#8ea87d] via-[#7d9b6c] to-[#6a8459]",
    border: "#9eb98c",
    glow: "rgba(142, 168, 125, 0.4)",
    label: "Hijau Rumput Segar",
  },
  yellowing: {
    bg: "from-[#d4c979] via-[#c2b461] to-[#aba04d]",
    border: "#ded487",
    glow: "rgba(212, 201, 121, 0.4)",
    label: "Kekuningan (Yellowing)",
  },
  maillard: {
    bg: "from-[#b87d46] via-[#a36833] to-[#8a5323]",
    border: "#c98f59",
    glow: "rgba(184, 125, 70, 0.4)",
    label: "Cokelat Kayu Manis (Cinnamon)",
  },
  first_crack: {
    bg: "from-[#8c5128] via-[#783e18] to-[#5e2d0d]",
    border: "#ad6939",
    glow: "rgba(201, 114, 53, 0.5)",
    label: "Cokelat Terang (Light Roast)",
    cracks: true,
  },
  development: {
    bg: "from-[#5e3416] via-[#4d280e] to-[#3a1c07]",
    border: "#7a4621",
    glow: "rgba(150, 80, 30, 0.4)",
    label: "Cokelat Kaya (Medium Roast)",
    cracks: true,
  },
  second_crack: {
    bg: "from-[#2e180b] via-[#210f05] to-[#120702]",
    border: "#542f17",
    glow: "rgba(212, 175, 55, 0.35)",
    label: "Hitam Kilau Minyak (Dark Roast)",
    cracks: true,
    oilSheen: true,
  },
  cooling: {
    bg: "from-[#382013] via-[#2a160b] to-[#1a0c05]",
    border: "#82512f",
    glow: "rgba(56, 189, 248, 0.4)",
    label: "Matang Stabil & Terkunci",
    cracks: true,
  },
};

const CHEMICAL_INSIGHTS: Record<string, { chemistry: string; aroma: string; sensory: string }> = {
  drying: {
    chemistry: "Evaporasi air bebas intraseluler (Kadar air 11-12% turun ke ~7%). Belum ada pencokelatan non-enzimatik.",
    aroma: "Aroma rumput hijau basah, jerami kering, dan biji-bijian mentah.",
    sensory: "Biji menyerap panas (endotermik) dan melunak untuk mempersiapkan pembentukan selulosa berpori.",
  },
  yellowing: {
    chemistry: "Inisiasi reaksi Maillard antara gugus amino asam amino dan karbonil gula pereduksi. Degradasi klorofil.",
    aroma: "Aroma roti yang baru dipanggang, biskuit gandum, dan jerami hangat.",
    sensory: "Warna biji menguning, dinding sel mulai mengembang seiring pembentukan asam organik awal.",
  },
  maillard: {
    chemistry: "Polimerisasi melanoidin menghasilkan warna cokelat. Pirolisis asam klorogenat dan degradasi trigonelin.",
    aroma: "Aroma karamel manis, kacang panggang, madu, dan cokelat susu hangat.",
    sensory: "Terbentuk ratusan senyawa volatil penentu body, keasaman manis, dan kompleksitas rasa dasar.",
  },
  first_crack: {
    chemistry: "Pelepasan gas CO2 dan tekanan uap air internal menembus dinding sel (reaksi eksotermik cepat).",
    aroma: "Aroma buah ceri matang, rempah manis, asam sitrat segar, dan bunga melati.",
    sensory: "Titik tolak Light Roast. Struktur biji mekar sempurna dengan keasaman cerah dan rasa buah asli origin.",
  },
  development: {
    chemistry: "Reaksi degradasi Strecker membentuk pirazin, furan, dan piridin. Rasio asam malat & sitrat seimbang.",
    aroma: "Cokelat hitam pekat, toffee, kacang almond panggang, dan sirup gula merah.",
    sensory: "Fase krusial pembentukan body dan sweetness maksimal. Biosphere mengontrol fase ini hingga ketelitian detik.",
  },
  second_crack: {
    chemistry: "Pirolisis karbon tingkat lanjut. Membran sel pecah total sehingga lipid dan minyak aromatik keluar ke permukaan biji.",
    aroma: "Aroma roasted nut intens, dark cocoa 85%, asap manis kayu manis, dan sentuhan karamel gosong.",
    sensory: "Karakter Dark Roast khas. Keasaman buah mereda, tergantikan oleh sensasi rasa tebal dan aftertaste cokelat panjang.",
  },
  cooling: {
    chemistry: "Penurunan suhu mendadak dengan aliran udara dingin berkecepatan tinggi dalam waktu kurang dari 4 menit.",
    aroma: "Seluruh senyawa aromatik volatil terkunci rapat di dalam pori mikroskopis biji kopi.",
    sensory: "Mencegah carryover roasting (kematangan berlebih akibat panas sisa). Biji siap memasuki fase resting optimal.",
  },
};

export function RoastScienceStepper() {
  const [activeStageIndex, setActiveStageIndex] = useState(3); // Default to First Crack (Titik Kritis)
  const currentStage = ROAST_STAGES[activeStageIndex];
  const beanVisual = BEAN_COLORS[currentStage.key] || BEAN_COLORS.drying;
  const insights = CHEMICAL_INSIGHTS[currentStage.key] || CHEMICAL_INSIGHTS.drying;

  return (
    <section id="proses" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24">
      {/* Header Section */}
      <div className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-bold text-primary mb-3">
          <Flame className="h-3.5 w-3.5 text-gold-deep" />
          <span>Where Science Meets Soul • Kontrol Suhu Presisi</span>
        </div>
        <h2 className="font-[var(--font-display)] text-3xl font-extrabold text-green-deep sm:text-4xl lg:text-5xl leading-tight">
          7 Fase Reaksi Kimia <span className="text-gold-gradient">Roasting Kopi</span>
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base max-w-2xl mx-auto">
          Roasting di Biosphere bukan tebak-tebakan. Ini adalah ilmu termodinamika dan mikrobiologi presisi yang mengubah biji hijau menjadi simfoni rasa terroir Jawa Barat.
        </p>
      </div>

      {/* Interactive Roasting Curve & Timeline Nav */}
      <div className="mt-12">
        {/* Timeline Stepper Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-1 sm:justify-center scrollbar-none">
          {ROAST_STAGES.map((stage, idx) => {
            const isActive = idx === activeStageIndex;
            return (
              <button
                key={stage.key}
                onClick={() => setActiveStageIndex(idx)}
                className={cn(
                  "group relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 border",
                  isActive
                    ? "bg-green-deep text-white border-gold shadow-md ring-2 ring-gold/40 scale-105"
                    : "bg-card hover:bg-secondary/80 text-muted-foreground hover:text-foreground border-border/80"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-mono font-black",
                    isActive ? "bg-gold text-green-deep" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                  )}
                >
                  {idx + 1}
                </span>
                <span className="whitespace-nowrap">{stage.title}</span>
                {stage.isCritical && (
                  <span className={cn(
                    "text-[9px] px-1 rounded-sm uppercase tracking-wider font-extrabold",
                    isActive ? "bg-rose-500 text-white" : "bg-rose-500/15 text-rose-600"
                  )}>
                    Kritis
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Interactive Stage Interactive Showcase Box */}
        <div className="mt-6 rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card/95 to-secondary/30 p-6 sm:p-10 shadow-lg backdrop-blur-sm">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            
            {/* Visual Simulated Bean & Temperature Gauge (Left Column - 5 cols) */}
            <div className="flex flex-col items-center justify-center text-center lg:col-span-5 rounded-2xl bg-secondary/40 border border-border/60 p-6 sm:p-8 relative overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none opacity-40 blur-2xl"
                style={{ background: beanVisual.glow }}
              />

              {/* Temperature Badge */}
              <div className="relative flex items-center gap-1.5 rounded-full bg-background/90 border border-border px-4 py-1.5 shadow-sm text-xs font-mono font-extrabold text-foreground">
                <Thermometer className="h-4 w-4 text-gold-deep" />
                <span>{currentStage.suhu}</span>
              </div>

              {/* Simulated Coffee Bean Visual */}
              <div className="relative my-8 flex items-center justify-center">
                <div
                  className={cn(
                    "relative h-40 w-28 rounded-[50%/40%] shadow-2xl transition-all duration-500 bg-gradient-to-br flex items-center justify-center border-2",
                    beanVisual.bg
                  )}
                  style={{
                    borderColor: beanVisual.border,
                    boxShadow: `0 15px 35px -5px ${beanVisual.glow}`,
                  }}
                >
                  {/* Bean Center Crease / Split */}
                  <div className="h-32 w-1.5 rounded-full bg-black/40 blur-[0.5px] transform -rotate-2 relative">
                    {/* Chaff line simulation */}
                    <div className="absolute inset-y-1 left-0 w-0.5 bg-amber-100/40" />
                  </div>

                  {/* Surface Crack marks if applicable */}
                  {beanVisual.cracks && (
                    <div className="absolute inset-0 pointer-events-none opacity-40">
                      <div className="absolute top-8 left-4 h-5 w-0.5 bg-black/60 rotate-45" />
                      <div className="absolute bottom-10 right-5 h-6 w-0.5 bg-black/60 -rotate-30" />
                    </div>
                  )}

                  {/* Oil Sheen overlay if second crack */}
                  {beanVisual.oilSheen && (
                    <div className="absolute inset-2 rounded-[50%/40%] bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
                  )}
                </div>
              </div>

              <div className="relative space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-mono">
                  Transformasi Fisik Biji
                </p>
                <p className="text-base font-extrabold text-foreground">
                  {beanVisual.label}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Fase {activeStageIndex + 1} dari 7 • Biosphere Roast Curve
                </p>
              </div>
            </div>

            {/* Stage Description & Scientific Breakdown (Right Column - 7 cols) */}
            <div className="space-y-6 lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-gold-deep uppercase tracking-wider">
                      Tahap 0{activeStageIndex + 1}
                    </span>
                    {currentStage.isCritical && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                        <ShieldAlert className="h-3 w-3" /> Titik Kritis Roasting
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 font-[var(--font-display)] text-2xl sm:text-3xl font-bold text-green-deep">
                    {currentStage.title}
                  </h3>
                </div>
                <div className="text-right font-mono text-xs text-muted-foreground">
                  <span>Target Suhu:</span>
                  <p className="font-extrabold text-green-deep text-sm">{currentStage.suhu}</p>
                </div>
              </div>

              <p className="text-sm sm:text-base leading-relaxed text-foreground/90 font-medium">
                {currentStage.desc}
              </p>

              {/* 3 Scientific Pillar Cards */}
              <div className="grid gap-3.5 sm:grid-cols-3">
                <div className="rounded-xl border border-border/80 bg-background/80 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <Sparkles className="h-3.5 w-3.5 text-gold-deep shrink-0" />
                    <span>Reaksi Kimia</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {insights.chemistry}
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-background/80 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gold-deep">
                    <Flame className="h-3.5 w-3.5 shrink-0" />
                    <span>Profil Aroma</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {insights.aroma}
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-background/80 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Dampak Cangkir</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {insights.sensory}
                  </p>
                </div>
              </div>

              {/* Progress Slider Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={activeStageIndex === 0}
                  onClick={() => setActiveStageIndex((prev) => Math.max(0, prev - 1))}
                  className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-40 transition"
                >
                  ← Tahap Sebelumnya
                </button>
                <div className="flex items-center gap-1">
                  {ROAST_STAGES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveStageIndex(i)}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        i === activeStageIndex ? "w-6 bg-gold" : "w-2 bg-border hover:bg-muted-foreground"
                      )}
                    />
                  ))}
                </div>
                <button
                  disabled={activeStageIndex === ROAST_STAGES.length - 1}
                  onClick={() => setActiveStageIndex((prev) => Math.min(ROAST_STAGES.length - 1, prev + 1))}
                  className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white disabled:opacity-40 transition flex items-center gap-1"
                >
                  <span>Tahap Lanjut</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* 3 Catatan Penting Sains Roasting */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {ROAST_IMPORTANT_NOTES.map((note, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-sm p-4 sm:p-5 flex items-start gap-3 shadow-xs hover:border-gold/40 transition"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-deep font-mono font-black text-xs">
                0{idx + 1}
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground leading-snug">
                  {note.title}
                </h4>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  {note.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
