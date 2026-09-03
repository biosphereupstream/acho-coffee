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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Preset Profil Roasting Kafe
interface RoastProfilePreset {
  id: string;
  name: string;
  description: string;
  targetDropSec: number;
  targetDropTemp: number;
  dtrPercent: number; // Development Time Ratio
}

const PRESETS: RoastProfilePreset[] = [
  {
    id: "light-filter",
    name: "Ciwidey Filter (Light Roast)",
    description: "First crack cerah, acidity kompleks, floral & fruity notes prima.",
    targetDropSec: 560, // 09:20
    targetDropTemp: 204,
    dtrPercent: 14.5,
  },
  {
    id: "medium-balanced",
    name: "Bio-Honey (Medium Balanced)",
    description: "Maillard diperpanjang, karamelisasi kaya, body & sweetness bulat.",
    targetDropSec: 620, // 10:20
    targetDropTemp: 212,
    dtrPercent: 18.0,
  },
  {
    id: "dark-espresso",
    name: "Espresso Blend (Second Crack Touch)",
    description: "Masuk ke second crack awal, minyak keluar, body pekat minim asam.",
    targetDropSec: 685, // 11:25
    targetDropTemp: 226,
    dtrPercent: 22.5,
  },
];

// 7 Fase Kimiawi sesuai PDF Biosphere Roast Works
interface PhaseMarker {
  key: string;
  label: string;
  title: string;
  suhuRange: string;
  startSec: number;
  endSec: number;
  startTemp: number;
  endTemp: number;
  color: string;
  isCritical: boolean;
  desc: string;
}

const PHASES: PhaseMarker[] = [
  {
    key: "drying",
    label: "Tahap 01",
    title: "Drying phase",
    suhuRange: "100–160°C",
    startSec: 75,
    endSec: 260,
    startTemp: 94,
    endTemp: 160,
    color: "#84a95a",
    isCritical: false,
    desc: "Penguapan air bebas dari dalam biji. Belum ada reaksi pencokelatan; biji masih hijau kekuningan.",
  },
  {
    key: "yellowing",
    label: "Tahap 02",
    title: "Yellowing",
    suhuRange: "160–170°C",
    startSec: 260,
    endSec: 340,
    startTemp: 160,
    endTemp: 170,
    color: "#d4a948",
    isCritical: false,
    desc: "Kadar air turun drastis, reaksi Maillard mulai antara asam amino dan gula pereduksi. Muncul bau seperti roti panggang.",
  },
  {
    key: "maillard",
    label: "Tahap 03",
    title: "Maillard & karamelisasi",
    suhuRange: "170–200°C",
    startSec: 340,
    endSec: 510,
    startTemp: 170,
    endTemp: 198,
    color: "#b0733a",
    isCritical: false,
    desc: "Ratusan senyawa volatil terbentuk di tahap ini. Gula mulai terkaramelisasi, warna coklat dan aroma khas kopi mulai terbentuk.",
  },
  {
    key: "first_crack",
    label: "Tahap 04",
    title: "First crack",
    suhuRange: "196–205°C",
    startSec: 510,
    endSec: 580,
    startTemp: 198,
    endTemp: 206,
    color: "#e6602e",
    isCritical: true,
    desc: "Tekanan uap air dan CO2 di dalam biji melebihi kekuatan struktur sel sehingga biji retak dan mengembang. Titik acuan untuk light roast.",
  },
  {
    key: "development",
    label: "Tahap 05",
    title: "Development time",
    suhuRange: "205–224°C",
    startSec: 580,
    endSec: 670,
    startTemp: 206,
    endTemp: 224,
    color: "#7a3d1d",
    isCritical: false,
    desc: "Fase pasca first crack yang menentukan profil rasa akhir. Reaksi Strecker menghasilkan senyawa aromatik kompleks dan membangun body.",
  },
  {
    key: "second_crack",
    label: "Tahap 06",
    title: "Second crack",
    suhuRange: "224–230°C",
    startSec: 670,
    endSec: 700,
    startTemp: 224,
    endTemp: 228,
    color: "#c22b2b",
    isCritical: true,
    desc: "Struktur sel pecah lebih jauh dan minyak dari dalam biji mulai keluar ke permukaan. Ciri khas dark roast.",
  },
  {
    key: "cooling",
    label: "Tahap 07",
    title: "Cooling",
    suhuRange: "Rapid Air Cooling",
    startSec: 700,
    endSec: 720,
    startTemp: 228,
    endTemp: 60,
    color: "#2f5c43",
    isCritical: false,
    desc: "Pendinginan cepat (biasanya dengan udara) untuk menghentikan reaksi kimia tepat pada titik yang diinginkan, mencegah carryover roast.",
  },
];

// Helper kalkulasi suhu & RoR berdasarkan waktu detik (0 - 720s)
function calculateTelemetry(timeSec: number) {
  let bt = 94; // Bean Temp
  let et = 200; // Environment Temp
  let ror = 0; // Rate of Rise (°C/min)

  if (timeSec <= 0) {
    bt = 195;
    et = 215;
    ror = 0;
  } else if (timeSec < 75) {
    // Charge & Turning Point drop
    const progress = timeSec / 75;
    bt = 195 - progress * (195 - 94);
    et = 215 - progress * 45;
    ror = -12 * (1 - progress);
  } else if (timeSec < 260) {
    // Drying Phase (94°C -> 160°C)
    const progress = (timeSec - 75) / (260 - 75);
    bt = 94 + progress * (160 - 94);
    et = 170 + progress * (195 - 170);
    ror = 24 - progress * 5; // 24 -> 19
  } else if (timeSec < 340) {
    // Yellowing (160°C -> 170°C)
    const progress = (timeSec - 260) / (340 - 260);
    bt = 160 + progress * (170 - 160);
    et = 195 + progress * (210 - 195);
    ror = 19 - progress * 3; // 19 -> 16
  } else if (timeSec < 510) {
    // Maillard (170°C -> 198°C)
    const progress = (timeSec - 340) / (510 - 340);
    bt = 170 + progress * (198 - 170);
    et = 210 + progress * (228 - 210);
    ror = 16 - progress * 6; // 16 -> 10
  } else if (timeSec < 580) {
    // First Crack (198°C -> 206°C)
    const progress = (timeSec - 510) / (580 - 510);
    bt = 198 + progress * (206 - 198);
    et = 228 + progress * 8;
    ror = 10 - progress * 3; // 10 -> 7
  } else if (timeSec < 670) {
    // Development Time (206°C -> 224°C)
    const progress = (timeSec - 580) / (670 - 580);
    bt = 206 + progress * (224 - 206);
    et = 236 + progress * 6;
    ror = 7 - progress * 3; // 7 -> 4
  } else if (timeSec < 700) {
    // Second Crack (224°C -> 228°C)
    const progress = (timeSec - 670) / (700 - 670);
    bt = 224 + progress * 4;
    et = 242 + progress * 3;
    ror = 4 - progress * 1.5;
  } else {
    // Rapid Cooling (228°C -> 60°C)
    const progress = Math.min(1, (timeSec - 700) / 20);
    bt = 228 - progress * (228 - 60);
    et = 245 - progress * 190;
    ror = -40 * (1 - progress);
  }

  // Cari fase aktif
  let currentPhase = PHASES[0];
  if (timeSec < 75) {
    currentPhase = {
      key: "charge",
      label: "Charge & TP",
      title: "Turning Point",
      suhuRange: "195°C → 94°C",
      startSec: 0,
      endSec: 75,
      startTemp: 195,
      endTemp: 94,
      color: "#6c855a",
      isCritical: false,
      desc: "Biji kopi hijau dimasukkan ke dalam drum roaster yang panas. Suhu turun cepat hingga titik terendah (Turning Point).",
    };
  } else {
    for (const p of PHASES) {
      if (timeSec >= p.startSec && timeSec <= p.endSec) {
        currentPhase = p;
        break;
      }
    }
  }

  return {
    bt: Math.round(bt * 10) / 10,
    et: Math.round(et * 10) / 10,
    ror: Math.round(ror * 10) / 10,
    phase: currentPhase,
  };
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function RoastGraphSimulation() {
  const [activePreset, setActivePreset] = useState<string>("light-filter");
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(530); // Default di first crack yang dramatis
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playSpeed, setPlaySpeed] = useState<number>(1);
  const [showRoR, setShowRoR] = useState<boolean>(true);
  const [showET, setShowET] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // Loop animasi kontinu bila sedang playing
  useEffect(() => {
    if (!isPlaying) return;

    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      const deltaSec = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setCurrentTimeSec((prev) => {
        const next = prev + deltaSec * 8 * playSpeed; // 8 detik simulasi per 1 detik nyata pada speed 1x
        if (next >= 720) {
          return 0; // loop
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playSpeed]);

  const telemetry = useMemo(() => calculateTelemetry(currentTimeSec), [currentTimeSec]);

  // SVG Coordinate Mapper
  // ViewBox: 0 0 680 340
  // X: 0 to 720 sec -> maps to 50 to 640
  // Y Temp: 50°C to 250°C -> maps to 290 to 30 (inverted)
  // Y RoR: 0 to 30°C/min -> maps to 290 to 40
  const mapX = (sec: number) => 50 + (sec / 720) * 590;
  const mapYTemp = (temp: number) => {
    const clamped = Math.max(50, Math.min(250, temp));
    return 290 - ((clamped - 50) / 200) * 260;
  };
  const mapYRoR = (ror: number) => {
    const clamped = Math.max(0, Math.min(30, ror));
    return 290 - (clamped / 30) * 250;
  };

  // Generate Sample Points for Curves
  const { btPath, etPath, rorPath } = useMemo(() => {
    const pointsCount = 144; // setiap 5 detik
    let btD = "";
    let etD = "";
    let rorD = "";

    for (let i = 0; i <= pointsCount; i++) {
      const s = (i / pointsCount) * 720;
      const data = calculateTelemetry(s);
      const x = mapX(s);
      const yBt = mapYTemp(data.bt);
      const yEt = mapYTemp(data.et);
      const yRor = mapYRoR(Math.max(0, data.ror));

      if (i === 0) {
        btD += `M ${x} ${yBt}`;
        etD += `M ${x} ${yEt}`;
        rorD += `M ${x} ${yRor}`;
      } else {
        btD += ` L ${x} ${yBt}`;
        etD += ` L ${x} ${yEt}`;
        rorD += ` L ${x} ${yRor}`;
      }
    }

    return { btPath: btD, etPath: etD, rorPath: rorD };
  }, []);

  const currentX = mapX(currentTimeSec);
  const currentY = mapYTemp(telemetry.bt);

  return (
    <div
      ref={containerRef}
      className="glossy-card relative overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-[#0c1f17] via-[#0d241c] to-[#071711] text-white shadow-2xl"
    >
      {/* Background radial glow */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Top Header: Telemetry HUD */}
      <div className="border-b border-white/10 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="gold" className="text-primary font-bold px-2.5 py-0.5 text-[11px] gap-1">
                <Activity className="h-3 w-3 animate-pulse" /> Live Roaster Scope
              </Badge>
              <span className="font-mono text-[11px] text-gold-light tracking-wider font-semibold">
                BIOSPHERE LAB v2.4
              </span>
            </div>
            <h3 className="mt-1 font-[var(--font-display)] text-xl font-black tracking-wide text-white sm:text-2xl flex items-center gap-2">
              Simulasi Kurva Roasting Kimiawi
              {telemetry.phase.isCritical && (
                <span className="rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] px-2 py-0.5 font-mono animate-pulse">
                  CRITICAL PHASE
                </span>
              )}
            </h3>
          </div>

          {/* Quick Presets Toggle */}
          <div className="flex items-center gap-1 rounded-2xl border border-white/15 bg-black/40 p-1">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setActivePreset(p.id);
                  setCurrentTimeSec(p.targetDropSec - 30);
                }}
                className={cn(
                  "rounded-xl px-2.5 py-1 text-xs font-semibold transition-all",
                  activePreset === p.id
                    ? "metal-gold text-primary font-extrabold shadow-sm"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                {p.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Live Gauges Dashboard */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-gold/30 bg-black/30 p-3.5 backdrop-blur-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gold-light/80 flex items-center gap-1">
              <Thermometer className="h-3 w-3 text-gold" /> Bean Temp (BT)
            </span>
            <p className="mt-1 font-mono text-2xl sm:text-3xl font-black text-gold-light">
              {telemetry.bt.toFixed(1)} <span className="text-sm font-medium text-white/50">°C</span>
            </p>
            <p className="text-[10px] text-white/60 mt-0.5 truncate">
              {telemetry.phase.title}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-black/30 p-3.5 backdrop-blur-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400/80 flex items-center gap-1">
              <Flame className="h-3 w-3 text-emerald-400" /> Drum / Air (ET)
            </span>
            <p className="mt-1 font-mono text-2xl sm:text-3xl font-black text-emerald-300">
              {telemetry.et.toFixed(1)} <span className="text-sm font-medium text-white/50">°C</span>
            </p>
            <p className="text-[10px] text-white/60 mt-0.5">Suhu drum roaster</p>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-black/30 p-3.5 backdrop-blur-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400/80 flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-400" /> Rate of Rise (RoR)
            </span>
            <p className="mt-1 font-mono text-2xl sm:text-3xl font-black text-amber-300">
              {telemetry.ror > 0 ? `+${telemetry.ror.toFixed(1)}` : telemetry.ror.toFixed(1)}{" "}
              <span className="text-sm font-medium text-white/50">°C/m</span>
            </p>
            <p className="text-[10px] text-white/60 mt-0.5">
              {telemetry.ror > 0 ? "Declining RoR Stabil" : "Cooling Drop"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-black/30 p-3.5 backdrop-blur-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/70 flex items-center gap-1">
              <Clock className="h-3 w-3 text-white/70" /> Roast Timer
            </span>
            <p className="mt-1 font-mono text-2xl sm:text-3xl font-black text-white">
              {formatTime(currentTimeSec)}
            </p>
            <p className="text-[10px] text-gold-light mt-0.5 font-mono">
              Fase {telemetry.phase.label}
            </p>
          </div>
        </div>
      </div>

      {/* Main SVG Graph Canvas */}
      <div className="relative px-3 py-4 sm:px-6">
        <svg
          viewBox="0 0 680 340"
          className="w-full h-auto overflow-visible select-none"
          style={{ maxHeight: "380px" }}
        >
          <defs>
            {/* Gradient untuk Bean Temperature */}
            <linearGradient id="btGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#84a95a" />
              <stop offset="35%" stopColor="#d4a948" />
              <stop offset="65%" stopColor="#e6602e" />
              <stop offset="88%" stopColor="#b22b2b" />
              <stop offset="100%" stopColor="#2f5c43" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#f5d78e" floodOpacity="0.7" />
            </filter>
            <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#f5d78e" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Phase Background Shading Bars */}
          {PHASES.map((p) => {
            const x1 = mapX(p.startSec);
            const x2 = mapX(p.endSec);
            const width = Math.max(0, x2 - x1);
            return (
              <g key={p.key}>
                <rect
                  x={x1}
                  y={30}
                  width={width}
                  height={260}
                  fill={p.color}
                  opacity={p.isCritical ? 0.15 : 0.06}
                />
                {/* Garis vertikal pembatas fase */}
                <line
                  x1={x1}
                  y1={30}
                  x2={x1}
                  y2={290}
                  stroke={p.color}
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  opacity={0.4}
                />
              </g>
            );
          })}

          {/* Horizontal Grid Lines (Suhu: 100°C, 150°C, 200°C, 250°C) */}
          {[100, 150, 200, 250].map((temp) => {
            const y = mapYTemp(temp);
            return (
              <g key={temp}>
                <line
                  x1={50}
                  y1={y}
                  x2={640}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                />
                <text
                  x={44}
                  y={y + 4}
                  textAnchor="end"
                  fill="rgba(255,255,255,0.4)"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {temp}°C
                </text>
              </g>
            );
          })}

          {/* Time Axis Markers (0m, 2m, 4m, 6m, 8m, 10m, 12m) */}
          {[0, 120, 240, 360, 480, 600, 720].map((sec) => {
            const x = mapX(sec);
            return (
              <g key={sec}>
                <line
                  x1={x}
                  y1={30}
                  x2={x}
                  y2={290}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={308}
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

          {/* Environmental Temp Curve (ET) */}
          {showET && (
            <path
              d={etPath}
              fill="none"
              stroke="#34d399"
              strokeWidth="1.8"
              strokeDasharray="4,3"
              opacity={0.65}
            />
          )}

          {/* Rate of Rise Curve (RoR) */}
          {showRoR && (
            <path
              d={rorPath}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.5"
              opacity={0.6}
            />
          )}

          {/* Bean Temperature Curve (BT) - Glowing Main Curve */}
          <path
            d={btPath}
            fill="none"
            stroke="url(#btGradient)"
            strokeWidth="3.2"
            filter="url(#subtleGlow)"
          />

          {/* Critical Markers Labels on Curve */}
          {/* Turning Point */}
          <circle cx={mapX(75)} cy={mapYTemp(94)} r={4} fill="#84a95a" stroke="#ffffff" strokeWidth="1.5" />
          <text x={mapX(75)} y={mapYTemp(94) + 16} fontSize="9" fill="#84a95a" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
            TP 94°C
          </text>

          {/* First Crack */}
          <circle cx={mapX(510)} cy={mapYTemp(198)} r={5} fill="#e6602e" stroke="#fef08a" strokeWidth="2" filter="url(#goldGlow)" />
          <text x={mapX(510)} y={mapYTemp(198) - 10} fontSize="10" fill="#fef08a" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
            💥 First Crack (198°C)
          </text>

          {/* Second Crack */}
          <circle cx={mapX(670)} cy={mapYTemp(224)} r={5} fill="#c22b2b" stroke="#ffffff" strokeWidth="2" filter="url(#goldGlow)" />
          <text x={mapX(670)} y={mapYTemp(224) - 10} fontSize="10" fill="#fca5a5" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
            🔥 Second Crack (224°C)
          </text>

          {/* Interactive Playhead Scanning Line */}
          <line
            x1={currentX}
            y1={30}
            x2={currentX}
            y2={290}
            stroke="#f5d78e"
            strokeWidth="1.8"
            strokeDasharray="2,2"
            opacity={0.9}
          />

          {/* Current Animated Bean Temp Dot */}
          <circle
            cx={currentX}
            cy={currentY}
            r={7}
            fill="#ffffff"
            stroke="#eab308"
            strokeWidth="3"
            filter="url(#goldGlow)"
          />
          <circle
            cx={currentX}
            cy={currentY}
            r={12}
            fill="none"
            stroke="#f5d78e"
            strokeWidth="1.5"
            opacity={0.6}
            className="animate-ping"
          />

          {/* Tooltip Tag on Playhead */}
          <g transform={`translate(${Math.min(580, Math.max(70, currentX))}, ${Math.max(45, currentY - 22)})`}>
            <rect
              x="-45"
              y="-14"
              width="90"
              height="20"
              rx="6"
              fill="#06120d"
              stroke="#f5d78e"
              strokeWidth="1"
            />
            <text
              x="0"
              y="0"
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

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono border-t border-white/10 pt-3 text-white/60">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-bold text-gold-light">
              <span className="h-2 w-4 rounded-full bg-gradient-to-r from-gold to-amber-500" /> Bean Temp (BT)
            </span>
            <button
              onClick={() => setShowET(!showET)}
              className={cn("flex items-center gap-1.5 transition-colors", showET ? "text-emerald-400" : "text-white/30 line-through")}
            >
              <span className="h-1.5 w-3 border-b-2 border-dashed border-emerald-400" /> Drum Temp (ET)
            </button>
            <button
              onClick={() => setShowRoR(!showRoR)}
              className={cn("flex items-center gap-1.5 transition-colors", showRoR ? "text-amber-400" : "text-white/30 line-through")}
            >
              <span className="h-1.5 w-3 bg-amber-400" /> Rate of Rise (RoR)
            </button>
          </div>

          <span className="text-[10px] text-white/40">
            Geser slider / klik fase di bawah untuk eksplorasi reaksi kimia
          </span>
        </div>
      </div>

      {/* Scrubbing Slider & Controls */}
      <div className="border-t border-white/10 bg-black/40 p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl metal-gold text-primary shadow-md hover:scale-105 transition-transform"
            aria-label={isPlaying ? "Jeda Simulasi" : "Mulai Simulasi"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => setCurrentTimeSec(0)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            title="Reset ke Awal (Charge)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Range Slider for scrubbing */}
          <div className="flex-1">
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

          {/* Speed Toggles */}
          <div className="flex items-center gap-1 text-[11px] font-mono">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaySpeed(spd)}
                className={cn(
                  "px-2 py-1 rounded-lg transition-colors",
                  playSpeed === spd
                    ? "bg-gold/20 text-gold font-bold border border-gold/40"
                    : "text-white/50 hover:text-white"
                )}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* 7 Phase Quick Jump Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {PHASES.map((p) => {
            const isActive = telemetry.phase.key === p.key;
            return (
              <button
                key={p.key}
                onClick={() => {
                  setCurrentTimeSec(p.startSec + 2);
                  setIsPlaying(false);
                }}
                className={cn(
                  "shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all flex items-center gap-1.5",
                  isActive
                    ? "metal-gold text-primary font-bold shadow-sm ring-1 ring-gold"
                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span>{p.title}</span>
                {p.isCritical && (
                  <span className="text-[9px] font-extrabold text-rose-300 uppercase">★</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Chemical Explanation Banner from PDF */}
        <div className="rounded-2xl border border-gold/30 bg-gradient-to-r from-secondary/20 via-black/40 to-secondary/20 p-3.5 text-xs">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold-deep shrink-0" />
              <span className="font-bold text-gold-light">
                {telemetry.phase.label}: {telemetry.phase.title} ({telemetry.phase.suhuRange})
              </span>
            </div>
            <span className="text-[10px] font-mono text-white/60">
              {formatTime(currentTimeSec)} / 12:00
            </span>
          </div>

          <p className="text-white/85 text-[11px] leading-relaxed">
            {telemetry.phase.desc}
          </p>
        </div>
      </div>
    </div>
  );
}

export default RoastGraphSimulation;
