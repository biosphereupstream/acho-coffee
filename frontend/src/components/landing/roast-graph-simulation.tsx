"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Flame,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Thermometer,
  Clock,
  Activity,
  Wind,
  Gauge,
  Eye,
  EyeOff,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ================= MODEL PRESET PROFIL ROASTING =================
interface GasSchedulePoint {
  timeSec: number;
  gas: number; // 0 - 100%
  air: number; // 0 - 100%
}

interface RoastProfilePreset {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  flavorHighlight: string;
  roastLevel: "Light" | "Medium" | "Dark";
  chargeTemp: number; // °C
  tpSec: number;
  tpTemp: number;
  dryEndSec: number;
  dryEndTemp: number;
  fcSec: number;
  fcTemp: number;
  scSec?: number;
  scTemp?: number;
  dropSec: number;
  dropTemp: number;
  targetDtrPercent: number;
  gasSchedule: GasSchedulePoint[];
}

const PRESETS: RoastProfilePreset[] = [
  {
    id: "light-filter",
    name: "Ciwidey Filter (Light Roast)",
    shortName: "Light Filter",
    tagline: "First crack cerah, acidity kompleks, floral & berry prima",
    description:
      "Profil sangrai pour-over spesialti. Menghentikan reaksi tepat setelah first crack usai untuk memaksimalkan keasaman buah alami dan senyawa aromatik bunga.",
    flavorHighlight: "Jasmine, Strawberry Wine, Citric Bergamot",
    roastLevel: "Light",
    chargeTemp: 195,
    tpSec: 75,
    tpTemp: 94,
    dryEndSec: 260,
    dryEndTemp: 160,
    fcSec: 480, // 08:00
    fcTemp: 198,
    dropSec: 560, // 09:20
    dropTemp: 204,
    targetDtrPercent: 14.3, // (80 / 560) * 100 = 14.3%
    gasSchedule: [
      { timeSec: 0, gas: 85, air: 30 },
      { timeSec: 75, gas: 80, air: 40 },
      { timeSec: 260, gas: 60, air: 50 },
      { timeSec: 400, gas: 45, air: 70 },
      { timeSec: 480, gas: 25, air: 85 },
      { timeSec: 560, gas: 0, air: 100 },
    ],
  },
  {
    id: "medium-balanced",
    name: "Bio-Honey (Medium Balanced)",
    shortName: "Medium Roast",
    tagline: "Maillard diperpanjang, karamel manis & body seimbang",
    description:
      "Sweet spot specialty roasting. Fase Maillard diperpanjang untuk pembentukan asam laktat dan gula karamel yang menghasilkan sweetness tebal tanpa rasa gosong.",
    flavorHighlight: "Caramelized Honey, Orange Peel, Brown Sugar",
    roastLevel: "Medium",
    chargeTemp: 200,
    tpSec: 75,
    tpTemp: 96,
    dryEndSec: 270,
    dryEndTemp: 160,
    fcSec: 510, // 08:30
    fcTemp: 199,
    dropSec: 620, // 10:20
    dropTemp: 212,
    targetDtrPercent: 17.7, // (110 / 620) * 100 = 17.7%
    gasSchedule: [
      { timeSec: 0, gas: 90, air: 30 },
      { timeSec: 75, gas: 85, air: 40 },
      { timeSec: 270, gas: 65, air: 55 },
      { timeSec: 420, gas: 50, air: 70 },
      { timeSec: 510, gas: 30, air: 85 },
      { timeSec: 620, gas: 0, air: 100 },
    ],
  },
  {
    id: "dark-espresso",
    name: "Espresso Blend (Second Crack Touch)",
    shortName: "Dark Espresso",
    tagline: "Sentuhan second crack awal, minyak alami keluar, body tebal",
    description:
      "Profil espresso klasik nusantara. Masuk ke ambang second crack awal, selulosa biji terpecah melepaskan aroma cokelat pekat dan crema tebal yang cocok dipadukan dengan susu.",
    flavorHighlight: "Dark Cocoa, Roasted Walnut, Molasses",
    roastLevel: "Dark",
    chargeTemp: 205,
    tpSec: 78,
    tpTemp: 98,
    dryEndSec: 280,
    dryEndTemp: 160,
    fcSec: 530, // 08:50
    fcTemp: 200,
    scSec: 645, // 10:45
    scTemp: 224,
    dropSec: 685, // 11:25
    dropTemp: 226,
    targetDtrPercent: 22.6, // (155 / 685) * 100 = 22.6%
    gasSchedule: [
      { timeSec: 0, gas: 95, air: 30 },
      { timeSec: 78, gas: 90, air: 40 },
      { timeSec: 280, gas: 70, air: 55 },
      { timeSec: 450, gas: 55, air: 70 },
      { timeSec: 530, gas: 35, air: 85 },
      { timeSec: 645, gas: 15, air: 90 },
      { timeSec: 685, gas: 0, air: 100 },
    ],
  },
];

// Reference Ghost Curve (Benchmark kurva ideal master roaster ala Artisan/Cropster)
const GHOST_REFERENCE: RoastProfilePreset = {
  id: "ghost-reference",
  name: "Master Target Curve (Gold Reference)",
  shortName: "Ghost Reference",
  tagline: "Profil acuan master roaster dengan declining RoR sempurna",
  description: "Kurva target acuan untuk konsistensi batch roasting.",
  flavorHighlight: "Optimal Balance Standard",
  roastLevel: "Medium",
  chargeTemp: 200,
  tpSec: 75,
  tpTemp: 95,
  dryEndSec: 265,
  dryEndTemp: 160,
  fcSec: 500,
  fcTemp: 199,
  dropSec: 600,
  dropTemp: 209,
  targetDtrPercent: 16.7,
  gasSchedule: [],
};

// 7 Fase Kimiawi sesuai SOP Roaster Biosphere
interface PhaseMarker {
  key: string;
  label: string;
  title: string;
  suhuRange: string;
  startSec: number;
  endSec: number;
  color: string;
  isCritical: boolean;
  desc: string;
}

const PHASES_BASE: PhaseMarker[] = [
  {
    key: "drying",
    label: "Tahap 01",
    title: "Drying phase",
    suhuRange: "100–160°C",
    startSec: 75,
    endSec: 260,
    color: "#84a95a",
    isCritical: false,
    desc: "Penguapan air bebas dari dalam biji kopi. Biji menyerap energi panas drum roaster secara endotermik.",
  },
  {
    key: "yellowing",
    label: "Tahap 02",
    title: "Yellowing",
    suhuRange: "160–170°C",
    startSec: 260,
    endSec: 340,
    color: "#d4a948",
    isCritical: false,
    desc: "Kadar air turun drastis, reaksi Maillard awal dimulai antara asam amino dan gula pereduksi menghasilkan aroma mirip roti panggang segar.",
  },
  {
    key: "maillard",
    label: "Tahap 03",
    title: "Maillard & karamelisasi",
    suhuRange: "170–198°C",
    startSec: 340,
    endSec: 480,
    color: "#b0733a",
    isCritical: false,
    desc: "Ratusan senyawa volatil dan melanoidin terbentuk di tahap ini. Gula terkaramelisasi dan aroma khas kopi spesialti mulai menguar kuat.",
  },
  {
    key: "first_crack",
    label: "Tahap 04",
    title: "First crack",
    suhuRange: "198–205°C",
    startSec: 480,
    endSec: 550,
    color: "#e6602e",
    isCritical: true,
    desc: "Tekanan uap air & akumulasi gas CO2 memecah struktur sel dinding biji dengan letupan keras. Transisi penting dari reaksi endotermik ke eksotermik.",
  },
  {
    key: "development",
    label: "Tahap 05",
    title: "Development time",
    suhuRange: "205–224°C",
    startSec: 550,
    endSec: 645,
    color: "#7a3d1d",
    isCritical: false,
    desc: "Fase krusial penentu profil rasa akhir. Reaksi Strecker menghasilkan pirazin kompleks penentu ketebalan body, rasa manis, dan acidity.",
  },
  {
    key: "second_crack",
    label: "Tahap 06",
    title: "Second crack",
    suhuRange: "224–230°C",
    startSec: 645,
    endSec: 685,
    color: "#c22b2b",
    isCritical: true,
    desc: "Dinding sel kayu biji retak lebih jauh dan minyak esensial mulai mengalir ke permukaan. Karakteristik khas profil dark roast / espresso pekat.",
  },
  {
    key: "cooling",
    label: "Tahap 07",
    title: "Cooling",
    suhuRange: "Rapid Air Cooling",
    startSec: 685,
    endSec: 720,
    color: "#2f5c43",
    isCritical: false,
    desc: "Biji dikeluarkan ke cooling tray berputar dengan hisapan udara dingin kuat untuk menghentikan carryover roast dalam waktu kurang dari 3 menit.",
  },
];

// Helper kalkulasi telemetri presisi berdasarkan preset dan waktu detik
function calculateTelemetry(timeSec: number, preset: RoastProfilePreset) {
  let bt = preset.tpTemp;
  let et = 205;
  let ror = 0;

  const { chargeTemp, tpSec, tpTemp, dryEndSec, dryEndTemp, fcSec, fcTemp, dropSec, dropTemp } = preset;

  // 1. BEAN TEMPERATURE (BT)
  if (timeSec <= 0) {
    bt = chargeTemp;
    et = 215;
    ror = 0;
  } else if (timeSec < tpSec) {
    // Charge drop to Turning Point (Exponential drop curve)
    const p = timeSec / tpSec;
    bt = chargeTemp - Math.pow(p, 0.75) * (chargeTemp - tpTemp);
    et = 215 - p * 35;
    ror = -14 * (1 - p);
  } else if (timeSec < dryEndSec) {
    // Drying Phase (tpTemp -> dryEndTemp 160°C)
    const p = (timeSec - tpSec) / (dryEndSec - tpSec);
    bt = tpTemp + Math.pow(p, 0.9) * (dryEndTemp - tpTemp);
    et = 180 + p * 30;
    ror = 24 - p * 6; // RoR declines from 24 to 18
  } else if (timeSec < fcSec) {
    // Yellowing & Maillard (160°C -> fcTemp ~198-200°C)
    const p = (timeSec - dryEndSec) / (fcSec - dryEndSec);
    bt = dryEndTemp + Math.pow(p, 0.92) * (fcTemp - dryEndTemp);
    et = 210 + p * 20;
    ror = 18 - p * 8.5; // RoR declines from 18 to 9.5
  } else if (timeSec < dropSec) {
    // Development Phase (fcTemp -> dropTemp)
    const p = (timeSec - fcSec) / (dropSec - fcSec);
    bt = fcTemp + Math.pow(p, 0.88) * (dropTemp - fcTemp);
    et = 230 + p * 12;
    ror = 9.5 - p * 5.0; // RoR declines from 9.5 to 4.5
  } else {
    // Rapid Cooling (dropTemp -> ~55°C)
    const p = Math.min(1, (timeSec - dropSec) / 25);
    bt = dropTemp - p * (dropTemp - 55);
    et = 242 - p * 185;
    ror = -42 * (1 - p);
  }

  // 2. DEVELOPMENT TIME RATIO (DTR)
  let dtrPercent = 0;
  let dtrLabel = "Pre-Crack";
  if (timeSec >= fcSec) {
    const devSec = Math.min(timeSec, dropSec) - fcSec;
    const currentRoastDuration = Math.min(timeSec, dropSec);
    dtrPercent = (devSec / currentRoastDuration) * 100;
    if (dtrPercent < 14) dtrLabel = "Light Development";
    else if (dtrPercent <= 18) dtrLabel = "Optimal SCA Window";
    else if (dtrPercent <= 21) dtrLabel = "Medium-Dark Body";
    else dtrLabel = "Deep Roast DTR";
  }

  // 3. GAS & AIRFLOW SCHEDULER
  let currentGas = 0;
  let currentAir = 30;
  if (preset.gasSchedule && preset.gasSchedule.length > 0) {
    for (let i = preset.gasSchedule.length - 1; i >= 0; i--) {
      if (timeSec >= preset.gasSchedule[i].timeSec) {
        currentGas = preset.gasSchedule[i].gas;
        currentAir = preset.gasSchedule[i].air;
        break;
      }
    }
  }

  // 4. DETEKSI FASE AKTIF
  let activePhase = PHASES_BASE[0];
  if (timeSec < tpSec) {
    activePhase = {
      key: "charge",
      label: "Charge & TP",
      title: "Turning Point",
      suhuRange: `${chargeTemp}°C → ${tpTemp}°C`,
      startSec: 0,
      endSec: tpSec,
      color: "#6c855a",
      isCritical: false,
      desc: "Biji kopi hijau dimasukkan ke dalam drum roaster. Biji dingin menyerap panas drum hingga titik suhu terendah sebelum mulai naik.",
    };
  } else if (timeSec >= dropSec) {
    activePhase = PHASES_BASE[6]; // Cooling
  } else if (preset.scSec && timeSec >= preset.scSec) {
    activePhase = PHASES_BASE[5]; // Second crack
  } else if (timeSec >= fcSec + 40) {
    activePhase = PHASES_BASE[4]; // Development
  } else if (timeSec >= fcSec) {
    activePhase = PHASES_BASE[3]; // First crack
  } else if (timeSec >= dryEndSec + 70) {
    activePhase = PHASES_BASE[2]; // Maillard
  } else if (timeSec >= dryEndSec) {
    activePhase = PHASES_BASE[1]; // Yellowing
  } else {
    activePhase = PHASES_BASE[0]; // Drying
  }

  return {
    bt: Math.round(bt * 10) / 10,
    et: Math.round(et * 10) / 10,
    ror: Math.round(ror * 10) / 10,
    dtrPercent: Math.round(dtrPercent * 10) / 10,
    dtrLabel,
    gas: currentGas,
    air: currentAir,
    phase: activePhase,
  };
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function RoastGraphSimulation() {
  const [activePresetId, setActivePresetId] = useState<string>("medium-balanced");
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(515); // Default di first crack yang dramatis
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playSpeed, setPlaySpeed] = useState<number>(1);

  // Layer Toggles
  const [showBT, setShowBT] = useState<boolean>(true);
  const [showET, setShowET] = useState<boolean>(true);
  const [showRoR, setShowRoR] = useState<boolean>(true);
  const [showGhost, setShowGhost] = useState<boolean>(true);

  const animFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const activePreset = useMemo(
    () => PRESETS.find((p) => p.id === activePresetId) || PRESETS[0],
    [activePresetId]
  );

  // Animasi Playback Loop
  useEffect(() => {
    if (!isPlaying) return;

    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      const deltaSec = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setCurrentTimeSec((prev) => {
        const next = prev + deltaSec * 8 * playSpeed;
        if (next >= activePreset.dropSec + 30) {
          return 0; // Loop kembali ke charge
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playSpeed, activePreset.dropSec]);

  // Telemetri realtime di detik saat ini
  const telemetry = useMemo(
    () => calculateTelemetry(currentTimeSec, activePreset),
    [currentTimeSec, activePreset]
  );

  // SVG Dimension Mapping:
  // ViewBox: 0 0 760 360
  // X: 0 - 720 sec -> maps to 60 - 690
  // Y Temp: 50°C - 250°C -> maps to 305 - 35 (inverted)
  // Y RoR: 0 - 30°C/min -> maps to 305 - 45
  const mapX = (sec: number) => 60 + (sec / 720) * 630;
  const mapYTemp = (temp: number) => {
    const clamped = Math.max(50, Math.min(250, temp));
    return 305 - ((clamped - 50) / 200) * 270;
  };
  const mapYRoR = (ror: number) => {
    const clamped = Math.max(0, Math.min(30, ror));
    return 305 - (clamped / 30) * 260;
  };

  // Generate SVG Path Curves
  const { btPath, etPath, rorPath, ghostPath } = useMemo(() => {
    const samples = 144; // setiap 5 detik
    let btD = "";
    let etD = "";
    let rorD = "";
    let ghostD = "";

    for (let i = 0; i <= samples; i++) {
      const s = (i / samples) * 720;
      const x = mapX(s);

      // Active preset curve
      const data = calculateTelemetry(s, activePreset);
      const yBt = mapYTemp(data.bt);
      const yEt = mapYTemp(data.et);
      const yRor = mapYRoR(Math.max(0, data.ror));

      // Ghost reference curve
      const ghostData = calculateTelemetry(s, GHOST_REFERENCE);
      const yGhost = mapYTemp(ghostData.bt);

      if (i === 0) {
        btD += `M ${x} ${yBt}`;
        etD += `M ${x} ${yEt}`;
        rorD += `M ${x} ${yRor}`;
        ghostD += `M ${x} ${yGhost}`;
      } else {
        btD += ` L ${x} ${yBt}`;
        etD += ` L ${x} ${yEt}`;
        rorD += ` L ${x} ${yRor}`;
        ghostD += ` L ${x} ${yGhost}`;
      }
    }

    return { btPath: btD, etPath: etD, rorPath: rorD, ghostPath: ghostD };
  }, [activePreset]);

  const currentX = mapX(currentTimeSec);
  const currentY = mapYTemp(telemetry.bt);

  return (
    <div className="glossy-card relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gold/40 bg-gradient-to-br from-[#071610] via-[#0b2118] to-[#040e0a] text-white shadow-2xl w-full max-w-full">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* ================= TOP HUD: STATUS & PRESET SELECTION ================= */}
      <div className="border-b border-white/10 p-3.5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="gold" className="text-primary font-bold px-2.5 py-0.5 text-[11px] gap-1 shadow-sm">
                <Activity className="h-3 w-3 animate-pulse" /> Live Roaster Scope
              </Badge>
              <span className="font-mono text-[11px] text-gold-light tracking-wider font-semibold">
                BIOSPHERE LAB v2.4 • ARTISAN TELEMETRY
              </span>
            </div>
            <h3 className="mt-1 font-[var(--font-display)] text-lg sm:text-2xl font-black tracking-wide text-white flex flex-wrap items-center gap-2">
              Cockpit Kurva Roasting Kimiawi
              {telemetry.phase.isCritical && (
                <span className="rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] px-2.5 py-0.5 font-mono animate-pulse">
                  CRITICAL MILESTONE
                </span>
              )}
            </h3>
            <p className="text-xs text-white/70 mt-0.5 max-w-xl line-clamp-1 sm:line-clamp-none">
              {activePreset.description}
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-white/15 bg-black/50 p-1.5 overflow-x-auto max-w-full">
            {PRESETS.map((p) => {
              const isSelected = activePreset.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setActivePresetId(p.id);
                    setCurrentTimeSec(p.fcSec);
                    setIsPlaying(false);
                  }}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5",
                    isSelected
                      ? "metal-gold text-primary font-extrabold shadow-md scale-[1.02]"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Flame className={cn("h-3.5 w-3.5", isSelected ? "text-primary" : "text-gold-light")} />
                  <span>{p.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= 5 LIVE TELEMETRY CARDS ================= */}
        <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
          {/* Card 1: Bean Temp (BT) */}
          <div className="rounded-2xl border border-gold/40 bg-black/40 p-3 sm:p-3.5 backdrop-blur-xs min-w-0 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gold-light flex items-center gap-1">
                <Thermometer className="h-3 w-3 text-gold shrink-0" /> Bean Temp (BT)
              </span>
              <span className="text-[9px] font-mono text-gold-light/60">Probe 1</span>
            </div>
            <p className="mt-1 font-mono text-xl sm:text-2xl font-black text-gold-light">
              {telemetry.bt.toFixed(1)} <span className="text-xs font-medium text-white/50">°C</span>
            </p>
            <p className="text-[10px] text-white/70 mt-0.5 truncate font-medium">
              {telemetry.phase.title}
            </p>
          </div>

          {/* Card 2: Drum / Air Temp (ET) */}
          <div className="rounded-2xl border border-emerald-500/40 bg-black/40 p-3 sm:p-3.5 backdrop-blur-xs min-w-0 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Flame className="h-3 w-3 text-emerald-400 shrink-0" /> Drum / Air (ET)
              </span>
              <span className="text-[9px] font-mono text-emerald-400/60">Chamber</span>
            </div>
            <p className="mt-1 font-mono text-xl sm:text-2xl font-black text-emerald-300">
              {telemetry.et.toFixed(1)} <span className="text-xs font-medium text-white/50">°C</span>
            </p>
            <p className="text-[10px] text-white/70 mt-0.5 truncate">
              {currentTimeSec < activePreset.dropSec ? "Thermal Convection" : "Air Cooling"}
            </p>
          </div>

          {/* Card 3: Rate of Rise (RoR) */}
          <div className="rounded-2xl border border-amber-500/40 bg-black/40 p-3 sm:p-3.5 backdrop-blur-xs min-w-0 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-400 shrink-0" /> RoR Speed
              </span>
              <span className="text-[9px] font-mono text-amber-400/60">30s Delta</span>
            </div>
            <p className="mt-1 font-mono text-xl sm:text-2xl font-black text-amber-300">
              {telemetry.ror > 0 ? `+${telemetry.ror.toFixed(1)}` : telemetry.ror.toFixed(1)}{" "}
              <span className="text-xs font-medium text-white/50">°C/m</span>
            </p>
            <p className="text-[10px] text-white/70 mt-0.5 truncate">
              {telemetry.ror > 0 ? "Declining Curve" : "Rapid Drop"}
            </p>
          </div>

          {/* Card 4: Development Time Ratio (DTR) */}
          <div className="rounded-2xl border border-indigo-400/40 bg-black/40 p-3 sm:p-3.5 backdrop-blur-xs min-w-0 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                <Gauge className="h-3 w-3 text-indigo-400 shrink-0" /> Live DTR %
              </span>
              <span className="text-[9px] font-mono text-indigo-300/60">SCA Spec</span>
            </div>
            <p className="mt-1 font-mono text-xl sm:text-2xl font-black text-indigo-200">
              {telemetry.dtrPercent > 0 ? `${telemetry.dtrPercent.toFixed(1)}%` : "0.0%"}
            </p>
            <p className="text-[10px] text-indigo-300/80 mt-0.5 truncate font-medium">
              {telemetry.dtrLabel}
            </p>
          </div>

          {/* Card 5: Gas & Airflow Machine Status */}
          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-white/20 bg-black/40 p-3 sm:p-3.5 backdrop-blur-xs min-w-0 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/80 flex items-center gap-1">
                <Wind className="h-3 w-3 text-white/80 shrink-0" /> Burner & Air
              </span>
              <span className="text-[9px] font-mono text-white/50">Controls</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 font-mono">
              <div>
                <span className="text-[10px] text-amber-400 block font-bold">GAS</span>
                <span className="text-base sm:text-lg font-black text-white">{telemetry.gas}%</span>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <span className="text-[10px] text-cyan-400 block font-bold">AIR</span>
                <span className="text-base sm:text-lg font-black text-white">{telemetry.air}%</span>
              </div>
            </div>
            <p className="text-[10px] text-white/60 mt-0.5 truncate font-mono">
              Timer: {formatTime(currentTimeSec)}
            </p>
          </div>
        </div>
      </div>

      {/* ================= LAYER TOGGLES & SCOPE OPTIONS ================= */}
      <div className="px-3 sm:px-6 py-2.5 bg-black/30 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono text-[11px]">
          <span className="text-white/50 uppercase text-[10px] tracking-wider font-bold">Scope Layers:</span>

          {/* BT Toggle */}
          <button
            onClick={() => setShowBT(!showBT)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all",
              showBT
                ? "border-gold/60 bg-gold/15 text-gold-light font-bold"
                : "border-white/10 text-white/40 line-through"
            )}
          >
            {showBT ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span>Bean Temp (BT)</span>
          </button>

          {/* ET Toggle */}
          <button
            onClick={() => setShowET(!showET)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all",
              showET
                ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300 font-bold"
                : "border-white/10 text-white/40 line-through"
            )}
          >
            {showET ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span>Drum Temp (ET)</span>
          </button>

          {/* RoR Toggle */}
          <button
            onClick={() => setShowRoR(!showRoR)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all",
              showRoR
                ? "border-amber-500/60 bg-amber-500/15 text-amber-300 font-bold"
                : "border-white/10 text-white/40 line-through"
            )}
          >
            {showRoR ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span>Rate of Rise (RoR)</span>
          </button>

          {/* Ghost Reference Toggle */}
          <button
            onClick={() => setShowGhost(!showGhost)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all",
              showGhost
                ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-200 font-bold"
                : "border-white/10 text-white/40 line-through"
            )}
          >
            {showGhost ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span className="flex items-center gap-1">
              <span className="h-1 w-2 border-b-2 border-dashed border-cyan-300" /> Ghost Reference
            </span>
          </button>
        </div>

        {/* Target Profile Highlight */}
        <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-white/60 font-mono">
          <Target className="h-3 w-3 text-gold" /> Target DTR: <strong className="text-gold-light">{activePreset.targetDtrPercent}%</strong>
        </span>
      </div>

      {/* ================= MAIN SVG ROASTER SCOPE CANVAS ================= */}
      <div className="relative px-2 py-3 sm:px-6 sm:py-5 overflow-hidden w-full max-w-full">
        <svg
          viewBox="0 0 760 360"
          className="w-full h-auto select-none block"
          style={{ maxHeight: "400px" }}
        >
          <defs>
            {/* Gradient BT Main Curve */}
            <linearGradient id="scopeBtGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#84a95a" />
              <stop offset="28%" stopColor="#d4a948" />
              <stop offset="65%" stopColor="#e6602e" />
              <stop offset="88%" stopColor="#c22b2b" />
              <stop offset="100%" stopColor="#2f5c43" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#f5d78e" floodOpacity="0.8" />
            </filter>
            <filter id="subtleLineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#f5d78e" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Phase Background Shading */}
          {PHASES_BASE.map((p) => {
            const x1 = mapX(p.startSec);
            const x2 = mapX(p.endSec);
            const width = Math.max(0, x2 - x1);
            return (
              <g key={p.key}>
                <rect
                  x={x1}
                  y={35}
                  width={width}
                  height={270}
                  fill={p.color}
                  opacity={p.isCritical ? 0.16 : 0.05}
                />
                <line
                  x1={x1}
                  y1={35}
                  x2={x1}
                  y2={305}
                  stroke={p.color}
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  opacity={0.35}
                />
              </g>
            );
          })}

          {/* Horizontal Temperature Grid Lines (100°C, 150°C, 200°C, 250°C) */}
          {[100, 150, 200, 250].map((temp) => {
            const y = mapYTemp(temp);
            return (
              <g key={temp}>
                <line
                  x1={60}
                  y1={y}
                  x2={690}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                />
                <text
                  x={54}
                  y={y + 4}
                  textAnchor="end"
                  fill="rgba(255,255,255,0.45)"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {temp}°C
                </text>
              </g>
            );
          })}

          {/* Right Y-Axis: Rate of Rise Markers (5, 10, 15, 20, 25 °C/m) */}
          {[5, 10, 15, 20, 25].map((rorVal) => {
            const y = mapYRoR(rorVal);
            return (
              <g key={`ror-${rorVal}`}>
                <text
                  x={696}
                  y={y + 4}
                  textAnchor="start"
                  fill="rgba(251, 191, 36, 0.45)"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  +{rorVal}
                </text>
              </g>
            );
          })}

          {/* Time Axis Grid & Markers (0m, 2m, 4m, 6m, 8m, 10m, 12m) */}
          {[0, 120, 240, 360, 480, 600, 720].map((sec) => {
            const x = mapX(sec);
            return (
              <g key={sec}>
                <line
                  x1={x}
                  y1={35}
                  x2={x}
                  y2={305}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={324}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.5)"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {formatTime(sec)}
                </text>
              </g>
            );
          })}

          {/* Ghost Reference Profile Curve (Artisan/Cropster Ideal Benchmark) */}
          {showGhost && (
            <g opacity={0.65}>
              <path
                d={ghostPath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.8"
                strokeDasharray="4,4"
              />
              <text
                x={mapX(GHOST_REFERENCE.dropSec) - 10}
                y={mapYTemp(GHOST_REFERENCE.dropTemp) - 8}
                fill="#38bdf8"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="end"
              >
                GHOST REF
              </text>
            </g>
          )}

          {/* Environmental Temp Curve (ET) */}
          {showET && (
            <path
              d={etPath}
              fill="none"
              stroke="#34d399"
              strokeWidth="1.8"
              strokeDasharray="4,3"
              opacity={0.7}
            />
          )}

          {/* Rate of Rise Curve (RoR) */}
          {showRoR && (
            <path
              d={rorPath}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.6"
              opacity={0.65}
            />
          )}

          {/* Bean Temperature Curve (BT) - Main Glowing Curve */}
          {showBT && (
            <path
              d={btPath}
              fill="none"
              stroke="url(#scopeBtGradient)"
              strokeWidth="3.4"
              filter="url(#subtleLineGlow)"
            />
          )}

          {/* ================= CRITICAL EVENT MARKERS ON ACTIVE CURVE ================= */}
          {/* Turning Point Marker */}
          <g>
            <circle
              cx={mapX(activePreset.tpSec)}
              cy={mapYTemp(activePreset.tpTemp)}
              r={4.5}
              fill="#84a95a"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <text
              x={mapX(activePreset.tpSec)}
              y={mapYTemp(activePreset.tpTemp) + 16}
              fontSize="9"
              fill="#84a95a"
              textAnchor="middle"
              fontFamily="monospace"
              fontWeight="bold"
            >
              TP {activePreset.tpTemp}°C
            </text>
          </g>

          {/* Dry End Marker */}
          <g>
            <circle
              cx={mapX(activePreset.dryEndSec)}
              cy={mapYTemp(activePreset.dryEndTemp)}
              r={4.5}
              fill="#d4a948"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <text
              x={mapX(activePreset.dryEndSec)}
              y={mapYTemp(activePreset.dryEndTemp) - 10}
              fontSize="9"
              fill="#fef08a"
              textAnchor="middle"
              fontFamily="monospace"
              fontWeight="bold"
            >
              DE 160°C
            </text>
          </g>

          {/* First Crack Start (FCs) Marker */}
          <g>
            <circle
              cx={mapX(activePreset.fcSec)}
              cy={mapYTemp(activePreset.fcTemp)}
              r={5.5}
              fill="#e6602e"
              stroke="#fef08a"
              strokeWidth="2"
              filter="url(#laserGlow)"
            />
            <text
              x={mapX(activePreset.fcSec)}
              y={mapYTemp(activePreset.fcTemp) - 12}
              fontSize="10"
              fill="#fef08a"
              textAnchor="middle"
              fontFamily="monospace"
              fontWeight="bold"
            >
              💥 FCs ({activePreset.fcTemp}°C)
            </text>
          </g>

          {/* Second Crack Marker (Jika Dark Roast) */}
          {activePreset.scSec && activePreset.scTemp && (
            <g>
              <circle
                cx={mapX(activePreset.scSec)}
                cy={mapYTemp(activePreset.scTemp)}
                r={5.5}
                fill="#c22b2b"
                stroke="#ffffff"
                strokeWidth="2"
                filter="url(#laserGlow)"
              />
              <text
                x={mapX(activePreset.scSec)}
                y={mapYTemp(activePreset.scTemp) - 12}
                fontSize="10"
                fill="#fca5a5"
                textAnchor="middle"
                fontFamily="monospace"
                fontWeight="bold"
              >
                🔥 SC ({activePreset.scTemp}°C)
              </text>
            </g>
          )}

          {/* Drop / Discharge Marker */}
          <g>
            <circle
              cx={mapX(activePreset.dropSec)}
              cy={mapYTemp(activePreset.dropTemp)}
              r={5}
              fill="#2f5c43"
              stroke="#f5d78e"
              strokeWidth="2"
            />
            <text
              x={mapX(activePreset.dropSec)}
              y={mapYTemp(activePreset.dropTemp) - 12}
              fontSize="10"
              fill="#a7f3d0"
              textAnchor="middle"
              fontFamily="monospace"
              fontWeight="bold"
            >
              ❄️ DROP ({activePreset.dropTemp}°C)
            </text>
          </g>

          {/* ================= INTERACTIVE PLAYHEAD LASER SCANNER ================= */}
          <line
            x1={currentX}
            y1={35}
            x2={currentX}
            y2={305}
            stroke="#f5d78e"
            strokeWidth="1.8"
            strokeDasharray="2,2"
            opacity={0.9}
          />

          {/* Animated Crosshair Head */}
          <circle
            cx={currentX}
            cy={currentY}
            r={7}
            fill="#ffffff"
            stroke="#eab308"
            strokeWidth="3"
            filter="url(#laserGlow)"
          />
          <circle
            cx={currentX}
            cy={currentY}
            r={13}
            fill="none"
            stroke="#f5d78e"
            strokeWidth="1.5"
            opacity={0.7}
            className="animate-ping"
          />

          {/* Telemetry Tag Attached to Playhead */}
          <g transform={`translate(${Math.min(610, Math.max(80, currentX))}, ${Math.max(50, currentY - 24)})`}>
            <rect
              x="-55"
              y="-14"
              width="110"
              height="22"
              rx="6"
              fill="#06120d"
              stroke="#f5d78e"
              strokeWidth="1.2"
              opacity="0.95"
            />
            <text
              x="0"
              y="1"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#fef08a"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {telemetry.bt.toFixed(1)}°C • {formatTime(currentTimeSec)}
            </text>
          </g>
        </svg>

        {/* Scope Coordinate Axis Labels Footer */}
        <div className="flex items-center justify-between text-[10px] text-white/50 px-2 pt-1 font-mono">
          <span>Y-Axis: Bean Temp (50°C – 250°C)</span>
          <span className="text-amber-400/80">Right: RoR Delta (0 – 30°C/m)</span>
          <span>X-Axis: Time (00:00 – 12:00)</span>
        </div>
      </div>

      {/* ================= MILESTONE QUICK JUMP BUTTONS ================= */}
      <div className="px-3 sm:px-6 py-2.5 bg-black/40 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-mono uppercase text-gold-light/70 font-bold shrink-0 mr-1">
          Milestones:
        </span>

        {/* 1. Charge */}
        <button
          onClick={() => {
            setCurrentTimeSec(0);
            setIsPlaying(false);
          }}
          className="shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-mono border border-white/15 bg-white/5 hover:bg-white/10 hover:border-gold/40 text-white/80 transition-colors"
        >
          ⚡ Charge (0:00)
        </button>

        {/* 2. Turning Point */}
        <button
          onClick={() => {
            setCurrentTimeSec(activePreset.tpSec);
            setIsPlaying(false);
          }}
          className="shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-mono border border-white/15 bg-white/5 hover:bg-white/10 hover:border-gold/40 text-white/80 transition-colors"
        >
          🔄 TP ({formatTime(activePreset.tpSec)})
        </button>

        {/* 3. Dry End */}
        <button
          onClick={() => {
            setCurrentTimeSec(activePreset.dryEndSec);
            setIsPlaying(false);
          }}
          className="shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-mono border border-white/15 bg-white/5 hover:bg-white/10 hover:border-gold/40 text-white/80 transition-colors"
        >
          🌾 Dry End ({formatTime(activePreset.dryEndSec)})
        </button>

        {/* 4. First Crack */}
        <button
          onClick={() => {
            setCurrentTimeSec(activePreset.fcSec);
            setIsPlaying(false);
          }}
          className="shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-mono border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold transition-colors"
        >
          💥 First Crack ({formatTime(activePreset.fcSec)})
        </button>

        {/* 5. Second Crack (if applicable) */}
        {activePreset.scSec && (
          <button
            onClick={() => {
              setCurrentTimeSec(activePreset.scSec!);
              setIsPlaying(false);
            }}
            className="shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-mono border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold transition-colors"
          >
            🔥 Second Crack ({formatTime(activePreset.scSec)})
          </button>
        )}

        {/* 6. Drop */}
        <button
          onClick={() => {
            setCurrentTimeSec(activePreset.dropSec);
            setIsPlaying(false);
          }}
          className="shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-mono border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold transition-colors"
        >
          ❄️ Drop ({formatTime(activePreset.dropSec)})
        </button>
      </div>

      {/* ================= CONTROLS & TIMELINE SCRUBBER ================= */}
      <div className="border-t border-white/10 bg-black/50 p-3.5 sm:p-6 space-y-3.5 sm:space-y-4">
        <div className="flex items-center gap-3">
          {/* Play / Pause Button */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl metal-gold text-primary shadow-md hover:scale-105 transition-transform"
            aria-label={isPlaying ? "Jeda Simulasi" : "Mulai Simulasi"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={() => {
              setCurrentTimeSec(0);
              setIsPlaying(false);
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            title="Reset ke Awal (Charge 00:00)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Range Slider for Scrubbing */}
          <div className="flex-1 relative">
            <input
              type="range"
              min={0}
              max={720}
              step={1}
              value={currentTimeSec}
              onChange={(e) => {
                setCurrentTimeSec(Number(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full h-2.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Play Speed Multiplier */}
          <div className="flex items-center gap-1 text-[11px] font-mono">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaySpeed(spd)}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-colors font-semibold",
                  playSpeed === spd
                    ? "bg-gold/25 text-gold font-bold border border-gold/50"
                    : "text-white/50 hover:text-white"
                )}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* ================= DYNAMIC CHEMICAL & SENSORY BANNER ================= */}
        <div className="rounded-2xl border border-gold/30 bg-gradient-to-r from-secondary/20 via-black/40 to-secondary/20 p-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-white/10 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold-light shrink-0" />
              <span className="font-bold text-gold-light text-sm">
                {telemetry.phase.label}: {telemetry.phase.title} ({telemetry.phase.suhuRange})
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-white/70">
              <span>Profil: <strong className="text-white">{activePreset.flavorHighlight}</strong></span>
              <span className="text-gold-light font-bold">
                {formatTime(currentTimeSec)} / 12:00
              </span>
            </div>
          </div>

          <p className="text-white/85 text-[11px] sm:text-xs leading-relaxed">
            {telemetry.phase.desc}
          </p>
        </div>
      </div>
    </div>
  );
}

export default RoastGraphSimulation;
