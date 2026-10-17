"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Flame,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Thermometer,
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
  peakRor: number;
  endRor: number;
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
    targetDtrPercent: 14.3,
    peakRor: 21.8,
    endRor: 5.4,
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
    targetDtrPercent: 17.7,
    peakRor: 22.8,
    endRor: 4.8,
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
    fcSec: 525, // 08:45
    fcTemp: 200,
    scSec: 635, // 10:35
    scTemp: 222,
    dropSec: 685, // 11:25
    dropTemp: 226,
    targetDtrPercent: 23.4,
    peakRor: 23.6,
    endRor: 4.2,
    gasSchedule: [
      { timeSec: 0, gas: 95, air: 30 },
      { timeSec: 78, gas: 90, air: 40 },
      { timeSec: 280, gas: 70, air: 55 },
      { timeSec: 450, gas: 55, air: 70 },
      { timeSec: 525, gas: 35, air: 85 },
      { timeSec: 635, gas: 15, air: 90 },
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
  fcSec: 495,
  fcTemp: 199,
  dropSec: 600,
  dropTemp: 209,
  targetDtrPercent: 17.5,
  peakRor: 22.4,
  endRor: 5.0,
  gasSchedule: [],
};

// ================= DYNAMIC 7 PHASE ENGINE =================
interface PhaseMarker {
  key: string;
  label: string;
  shortTag: string;
  title: string;
  suhuRange: string;
  startSec: number;
  endSec: number;
  color: string;
  isCritical: boolean;
  desc: string;
}

function buildDynamicPhases(preset: RoastProfilePreset): PhaseMarker[] {
  const { chargeTemp, tpSec, tpTemp, dryEndSec, fcSec, fcTemp, scSec, scTemp, dropSec, dropTemp } =
    preset;

  const yellowEndSec = Math.round(dryEndSec + (fcSec - dryEndSec) * 0.36);
  const fcEndSec = Math.min((scSec ?? dropSec) - 25, fcSec + 50);

  const phases: PhaseMarker[] = [
    {
      key: "charge",
      label: "Tahap 00",
      shortTag: "TP",
      title: "Charge & Turning Point",
      suhuRange: `${chargeTemp}°C → ${tpTemp}°C`,
      startSec: 0,
      endSec: tpSec,
      color: "#6c9a76",
      isCritical: false,
      desc: "Biji kopi hijau dimasukkan ke dalam drum roaster panas. Biji menyerap energi termal hingga mencapai titik suhu terendah (Turning Point) sebelum berbalik naik.",
    },
    {
      key: "drying",
      label: "Tahap 01",
      shortTag: "DRYING",
      title: "Drying Phase",
      suhuRange: `${tpTemp}–160°C`,
      startSec: tpSec,
      endSec: dryEndSec,
      color: "#84a95a",
      isCritical: false,
      desc: "Penguapan air bebas dari dalam struktur sel biji kopi (11% → ~5%). Biji menyerap energi panas drum roaster secara endotermik.",
    },
    {
      key: "yellowing",
      label: "Tahap 02",
      shortTag: "YELLOW",
      title: "Yellowing",
      suhuRange: "160–174°C",
      startSec: dryEndSec,
      endSec: yellowEndSec,
      color: "#d4a948",
      isCritical: false,
      desc: "Klorofil terurai dan warna biji berubah kuning jerami. Reaksi Maillard awal dimulai menghasilkan aroma basmati dan roti panggang segar.",
    },
    {
      key: "maillard",
      label: "Tahap 03",
      shortTag: "MAILLARD",
      title: "Maillard & Karamelisasi",
      suhuRange: `174–${fcTemp}°C`,
      startSec: yellowEndSec,
      endSec: fcSec,
      color: "#c87d3b",
      isCritical: false,
      desc: "Ratusan senyawa volatil dan melanoidin terbentuk dari reaksi asam amino & gula pereduksi. Gula mulai terkaramelisasi membentuk manis dan body kopi.",
    },
    {
      key: "first_crack",
      label: "Tahap 04",
      shortTag: "1ST CRACK",
      title: "First Crack",
      suhuRange: `${fcTemp}–${Math.min(dropTemp, fcTemp + 6)}°C`,
      startSec: fcSec,
      endSec: fcEndSec,
      color: "#e6602e",
      isCritical: true,
      desc: "Tekanan uap air & gas CO₂ memecah dinding sel biji dengan letupan seperti popcorn. Transisi krusial dari reaksi endotermik ke eksotermik.",
    },
    {
      key: "development",
      label: "Tahap 05",
      shortTag: "DEV TIME",
      title: "Development Time",
      suhuRange: `${Math.min(dropTemp, fcTemp + 6)}–${scTemp ?? dropTemp}°C`,
      startSec: fcEndSec,
      endSec: scSec ?? dropSec,
      color: "#9e4d24",
      isCritical: false,
      desc: "Fase penentu keseimbangan akhir (DTR). Reaksi Strecker membentuk senyawa aromatik kompleks, memperhalus keasaman, dan menebalkan sweetness.",
    },
  ];

  if (scSec && scTemp) {
    phases.push({
      key: "second_crack",
      label: "Tahap 06",
      shortTag: "2ND CRACK",
      title: "Second Crack",
      suhuRange: `${scTemp}–${dropTemp}°C`,
      startSec: scSec,
      endSec: dropSec,
      color: "#dc2626",
      isCritical: true,
      desc: "Matriks selulosa biji retak lebih lanjut dan minyak esensial alami naik ke permukaan. Menghasilkan karakter body pekat, smoky-sweet, dan crema tebal.",
    });
  }

  phases.push({
    key: "cooling",
    label: scSec ? "Tahap 07" : "Tahap 06",
    shortTag: "COOLING",
    title: "Rapid Air Cooling",
    suhuRange: `${dropTemp}°C → <65°C`,
    startSec: dropSec,
    endSec: 720,
    color: "#2dd4bf",
    isCritical: false,
    desc: "Biji dilepas (Drop) ke cooling tray berputar dengan hisapan udara dingin bertekanan tinggi untuk menghentikan reaksi pemanggangan secara presisi.",
  });

  return phases;
}

// ================= SMOOTH CUBIC HERMITE SPLINE INTERPOLATION =================
interface KnotPoint {
  t: number;
  v: number;
}

function evaluateMonotoneHermite(t: number, knots: KnotPoint[], zeroSlopeFirst = false): number {
  const n = knots.length;
  if (n === 0) return 0;
  if (t <= knots[0].t) return knots[0].v;
  if (t >= knots[n - 1].t) return knots[n - 1].v;

  // Hitung secant slopes antar titik
  const d: number[] = [];
  const h: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dt = Math.max(1e-5, knots[i + 1].t - knots[i].t);
    h.push(dt);
    d.push((knots[i + 1].v - knots[i].v) / dt);
  }

  // Hitung tangent slopes di setiap knot (Fritsch-Carlson)
  const m: number[] = new Array(n).fill(0);
  m[0] = zeroSlopeFirst ? 0 : d[0];
  m[n - 1] = d[n - 2];

  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) {
      m[i] = 0;
    } else {
      const w1 = 2 * h[i] + h[i - 1];
      const w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
  }

  // Cari segmen aktif
  let seg = 0;
  for (let i = 0; i < n - 1; i++) {
    if (t >= knots[i].t && t <= knots[i + 1].t) {
      seg = i;
      break;
    }
  }

  const dt = h[seg];
  const u = (t - knots[seg].t) / dt;
  const u2 = u * u;
  const u3 = u2 * u;

  const h00 = 2 * u3 - 3 * u2 + 1;
  const h10 = u3 - 2 * u2 + u;
  const h01 = -2 * u3 + 3 * u2;
  const h11 = u3 - u2;

  return h00 * knots[seg].v + h10 * dt * m[seg] + h01 * knots[seg + 1].v + h11 * dt * m[seg + 1];
}

// Helper kalkulasi telemetri mulus (C1 continuous) berdasarkan preset dan waktu detik
function calculateTelemetry(timeSec: number, preset: RoastProfilePreset) {
  const {
    chargeTemp,
    tpSec,
    tpTemp,
    dryEndSec,
    dryEndTemp,
    fcSec,
    fcTemp,
    scSec,
    scTemp,
    dropSec,
    dropTemp,
    peakRor,
    endRor,
  } = preset;

  let bt = tpTemp;
  let et = 205;
  let ror = 0;

  // 1. BEAN TEMPERATURE (BT) - Smooth Spline
  if (timeSec <= 0) {
    bt = chargeTemp;
  } else if (timeSec < tpSec) {
    // Penurunan mulus dari Charge ke Turning Point dengan gradien 0 tepat di TP
    const p = timeSec / tpSec;
    const easeOut = 1 - Math.pow(1 - p, 2.2) * (1 + 0.45 * p);
    bt = chargeTemp - easeOut * (chargeTemp - tpTemp);
  } else if (timeSec <= dropSec) {
    // Monotone Cubic Hermite melewati tepat seluruh titik milestone
    const btKnots: KnotPoint[] = [
      { t: tpSec, v: tpTemp },
      { t: tpSec + (dryEndSec - tpSec) * 0.35, v: tpTemp + (dryEndTemp - tpTemp) * 0.28 },
      { t: dryEndSec, v: dryEndTemp },
      { t: dryEndSec + (fcSec - dryEndSec) * 0.5, v: dryEndTemp + (fcTemp - dryEndTemp) * 0.56 },
      { t: fcSec, v: fcTemp },
    ];
    if (scSec && scTemp) {
      btKnots.push({ t: scSec, v: scTemp });
    }
    btKnots.push({ t: dropSec, v: dropTemp });

    bt = evaluateMonotoneHermite(timeSec, btKnots, true);
  } else {
    // Cooling tray eksponensial mulus setelah Drop
    const elapsedCool = timeSec - dropSec;
    bt = 68 + (dropTemp - 68) * Math.exp(-elapsedCool / 58);
  }

  // 2. ENVIRONMENTAL / DRUM TEMPERATURE (ET) - Smooth Spline
  if (timeSec <= 0) {
    et = chargeTemp + 22;
  } else if (timeSec < tpSec) {
    const p = timeSec / tpSec;
    const ease = 0.5 * (1 - Math.cos(Math.PI * p));
    et = chargeTemp + 22 - ease * 36;
  } else if (timeSec <= dropSec) {
    const etStart = chargeTemp - 14;
    const etKnots: KnotPoint[] = [
      { t: tpSec, v: etStart },
      { t: dryEndSec, v: 208 },
      { t: fcSec, v: 228 },
      { t: dropSec, v: scSec ? 240 : 234 },
    ];
    et = evaluateMonotoneHermite(timeSec, etKnots, true);
  } else {
    const elapsedCool = timeSec - dropSec;
    const etDrop = scSec ? 240 : 234;
    et = 78 + (etDrop - 78) * Math.exp(-elapsedCool / 65);
  }

  // 3. RATE OF RISE (RoR °C/min) - Natural Artisan Curve tanpa lompatan tajam
  const rorPeakSec = tpSec + 38;
  if (timeSec < tpSec) {
    const p = Math.max(0, timeSec / tpSec);
    ror = -14 * Math.cos(p * (Math.PI / 2));
  } else if (timeSec <= rorPeakSec) {
    const u = (timeSec - tpSec) / (rorPeakSec - tpSec);
    ror = peakRor * 0.5 * (1 - Math.cos(Math.PI * u));
  } else if (timeSec <= dropSec) {
    const w = (timeSec - rorPeakSec) / (dropSec - rorPeakSec);
    ror = peakRor - (peakRor - endRor) * Math.pow(w, 0.84);
  } else {
    const coolProgress = Math.min(1, (timeSec - dropSec) / 45);
    ror = -18 * (1 - coolProgress);
  }

  // 4. DEVELOPMENT TIME RATIO (DTR)
  let dtrPercent = 0;
  let dtrLabel = "Pre-Crack Phase";
  if (timeSec >= fcSec) {
    const devSec = Math.min(timeSec, dropSec) - fcSec;
    const currentRoastDuration = Math.min(timeSec, dropSec);
    dtrPercent = (devSec / currentRoastDuration) * 100;
    if (dtrPercent < 14) dtrLabel = "Light Development";
    else if (dtrPercent <= 18.5) dtrLabel = "Optimal SCA Window";
    else if (dtrPercent <= 21.5) dtrLabel = "Medium-Dark Body";
    else dtrLabel = "Deep Espresso DTR";
  }

  // 5. GAS & AIRFLOW SCHEDULER
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

  // 6. DETEKSI FASE AKTIF DINAMIS
  const phases = buildDynamicPhases(preset);
  let activePhase = phases[0];
  for (const ph of phases) {
    if (timeSec >= ph.startSec && timeSec <= ph.endSec) {
      activePhase = ph;
      break;
    }
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
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(515);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playSpeed, setPlaySpeed] = useState<number>(1);
  const [isScrubbingSvg, setIsScrubbingSvg] = useState<boolean>(false);

  // Layer Toggles
  const [showBT, setShowBT] = useState<boolean>(true);
  const [showET, setShowET] = useState<boolean>(true);
  const [showRoR, setShowRoR] = useState<boolean>(true);
  const [showGhost, setShowGhost] = useState<boolean>(true);

  const animFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const activePreset = useMemo(
    () => PRESETS.find((p) => p.id === activePresetId) || PRESETS[0],
    [activePresetId]
  );

  const dynamicPhases = useMemo(() => buildDynamicPhases(activePreset), [activePreset]);

  // Animasi Playback Loop
  useEffect(() => {
    if (!isPlaying || isScrubbingSvg) return;

    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      const deltaSec = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setCurrentTimeSec((prev) => {
        const next = prev + deltaSec * 8 * playSpeed;
        if (next >= activePreset.dropSec + 35) {
          return 0;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isScrubbingSvg, playSpeed, activePreset.dropSec]);

  // Telemetri realtime di detik saat ini
  const telemetry = useMemo(
    () => calculateTelemetry(currentTimeSec, activePreset),
    [currentTimeSec, activePreset]
  );

  // ================= SVG COORDINATE SYSTEM =================
  // ViewBox: 0 0 760 390
  // Plot X: 58 (00:00) -> 702 (12:00 / 720s) | Width = 644
  // Top Phase Ribbon Y: 10 -> 31
  // Plot Y Temp: 50°C -> 250°C mapped to 334 -> 44 (Height = 290)
  // Plot Y RoR: 0 -> 28°C/m mapped to 322 -> 64
  const PLOT_LEFT = 58;
  const PLOT_RIGHT = 702;
  const PLOT_TOP = 44;
  const PLOT_BOTTOM = 334;
  const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
  const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;

  const mapX = useCallback((sec: number) => {
    const clamped = Math.max(0, Math.min(720, sec));
    return PLOT_LEFT + (clamped / 720) * PLOT_WIDTH;
  }, [PLOT_LEFT, PLOT_WIDTH]);

  const mapYTemp = useCallback((temp: number) => {
    const clamped = Math.max(50, Math.min(250, temp));
    return PLOT_BOTTOM - ((clamped - 50) / 200) * PLOT_HEIGHT;
  }, [PLOT_BOTTOM, PLOT_HEIGHT]);

  const mapYRoR = useCallback((ror: number) => {
    const clamped = Math.max(0, Math.min(28, ror));
    return 322 - (clamped / 28) * 256;
  }, []);

  // Pointer scrubbing langsung di kanvas SVG
  const updateTimeFromPointer = useCallback((clientX: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const svgX = ((clientX - rect.left) / rect.width) * 760;
    const ratio = (svgX - PLOT_LEFT) / PLOT_WIDTH;
    const targetSec = Math.round(Math.max(0, Math.min(720, ratio * 720)));
    setCurrentTimeSec(targetSec);
  }, [PLOT_LEFT, PLOT_WIDTH]);

  // Generate Smooth SVG Paths (In-Drum Roast vs Post-Drop Cooling)
  const {
    btRoastPath,
    btAreaPath,
    btCoolPath,
    etRoastPath,
    etCoolPath,
    rorPath,
    ghostPath,
  } = useMemo(() => {
    const stepSec = 3; // resolusi tinggi setiap 3 detik agar lengkungan sangat halus
    let btRoastD = "";
    let btCoolD = "";
    let etRoastD = "";
    let etCoolD = "";
    let rorD = "";
    let ghostD = "";

    // 1. Active BT & ET Roast Path (0 -> dropSec)
    for (let s = 0; s <= activePreset.dropSec; s += stepSec) {
      const clampedS = Math.min(s, activePreset.dropSec);
      const x = mapX(clampedS);
      const d = calculateTelemetry(clampedS, activePreset);
      const yBt = mapYTemp(d.bt);
      const yEt = mapYTemp(d.et);

      if (s === 0) {
        btRoastD += `M ${x.toFixed(1)} ${yBt.toFixed(1)}`;
        etRoastD += `M ${x.toFixed(1)} ${yEt.toFixed(1)}`;
      } else {
        btRoastD += ` L ${x.toFixed(1)} ${yBt.toFixed(1)}`;
        etRoastD += ` L ${x.toFixed(1)} ${yEt.toFixed(1)}`;
      }
    }
    // Pastikan titik tepat di dropSec masuk
    const dropX = mapX(activePreset.dropSec);
    const dropData = calculateTelemetry(activePreset.dropSec, activePreset);
    btRoastD += ` L ${dropX.toFixed(1)} ${mapYTemp(dropData.bt).toFixed(1)}`;
    etRoastD += ` L ${dropX.toFixed(1)} ${mapYTemp(dropData.et).toFixed(1)}`;

    // Area di bawah kurva BT (0 -> dropSec)
    const btAreaD = `${btRoastD} L ${dropX.toFixed(1)} ${PLOT_BOTTOM} L ${PLOT_LEFT} ${PLOT_BOTTOM} Z`;

    // 2. Post-Drop Cooling Tail (dropSec -> 720s)
    for (let s = activePreset.dropSec; s <= 720; s += stepSec) {
      const x = mapX(s);
      const d = calculateTelemetry(s, activePreset);
      const yBt = mapYTemp(d.bt);
      const yEt = mapYTemp(d.et);

      if (s === activePreset.dropSec) {
        btCoolD += `M ${x.toFixed(1)} ${yBt.toFixed(1)}`;
        etCoolD += `M ${x.toFixed(1)} ${yEt.toFixed(1)}`;
      } else {
        btCoolD += ` L ${x.toFixed(1)} ${yBt.toFixed(1)}`;
        etCoolD += ` L ${x.toFixed(1)} ${yEt.toFixed(1)}`;
      }
    }

    // 3. Natural RoR Path (tpSec -> dropSec, seperti Artisan/Cropster)
    for (let s = activePreset.tpSec; s <= activePreset.dropSec; s += stepSec) {
      const x = mapX(s);
      const d = calculateTelemetry(s, activePreset);
      const yRor = mapYRoR(Math.max(0, d.ror));
      if (s === activePreset.tpSec) {
        rorD += `M ${x.toFixed(1)} ${yRor.toFixed(1)}`;
      } else {
        rorD += ` L ${x.toFixed(1)} ${yRor.toFixed(1)}`;
      }
    }
    rorD += ` L ${dropX.toFixed(1)} ${mapYRoR(Math.max(0, dropData.ror)).toFixed(1)}`;

    // 4. Ghost Reference Curve (0 -> GHOST_REFERENCE.dropSec)
    for (let s = 0; s <= GHOST_REFERENCE.dropSec; s += stepSec) {
      const x = mapX(s);
      const gd = calculateTelemetry(s, GHOST_REFERENCE);
      const yG = mapYTemp(gd.bt);
      if (s === 0) {
        ghostD += `M ${x.toFixed(1)} ${yG.toFixed(1)}`;
      } else {
        ghostD += ` L ${x.toFixed(1)} ${yG.toFixed(1)}`;
      }
    }

    return {
      btRoastPath: btRoastD,
      btAreaPath: btAreaD,
      btCoolPath: btCoolD,
      etRoastPath: etRoastD,
      etCoolPath: etCoolD,
      rorPath: rorD,
      ghostPath: ghostD,
    };
  }, [activePreset, mapX, mapYTemp, mapYRoR, PLOT_BOTTOM, PLOT_LEFT]);

  // Daftar Milestone dengan posisi Callout Badge bertingkat (Staggered Leader Lines) agar bebas tabrakan
  const milestones = useMemo(() => {
    const items: Array<{
      id: string;
      code: string;
      temp: number;
      timeSec: number;
      x: number;
      y: number;
      badgeX: number;
      badgeY: number;
      badgeW: number;
      color: string;
      borderColor: string;
      textColor: string;
      isCritical?: boolean;
    }> = [
      {
        id: "tp",
        code: `TP ${activePreset.tpTemp}°C`,
        temp: activePreset.tpTemp,
        timeSec: activePreset.tpSec,
        x: mapX(activePreset.tpSec),
        y: mapYTemp(activePreset.tpTemp),
        // Badge di bawah lembah TP
        badgeX: mapX(activePreset.tpSec) + 24,
        badgeY: Math.min(PLOT_BOTTOM - 16, mapYTemp(activePreset.tpTemp) + 32),
        badgeW: 76,
        color: "#84a95a",
        borderColor: "rgba(132,169,90,0.85)",
        textColor: "#d9f99d",
      },
      {
        id: "de",
        code: `DE ${activePreset.dryEndTemp}°C`,
        temp: activePreset.dryEndTemp,
        timeSec: activePreset.dryEndSec,
        x: mapX(activePreset.dryEndSec),
        y: mapYTemp(activePreset.dryEndTemp),
        // Badge di atas-kiri titik DE
        badgeX: mapX(activePreset.dryEndSec) - 18,
        badgeY: mapYTemp(activePreset.dryEndTemp) - 34,
        badgeW: 80,
        color: "#d4a948",
        borderColor: "rgba(212,169,72,0.88)",
        textColor: "#fef08a",
      },
      {
        id: "fcs",
        code: `FCs ${activePreset.fcTemp}°C`,
        temp: activePreset.fcTemp,
        timeSec: activePreset.fcSec,
        x: mapX(activePreset.fcSec),
        y: mapYTemp(activePreset.fcTemp),
        // Badge di atas-kiri titik FCs
        badgeX: mapX(activePreset.fcSec) - 32,
        badgeY: mapYTemp(activePreset.fcTemp) - 36,
        badgeW: 88,
        color: "#e6602e",
        borderColor: "rgba(249,115,22,0.92)",
        textColor: "#ffedd5",
        isCritical: true,
      },
    ];

    if (activePreset.scSec && activePreset.scTemp) {
      items.push({
        id: "sc",
        code: `SC ${activePreset.scTemp}°C`,
        temp: activePreset.scTemp,
        timeSec: activePreset.scSec,
        x: mapX(activePreset.scSec),
        y: mapYTemp(activePreset.scTemp),
        // Badge SC ditaruh di BAWAH-KIRI kurva supaya tidak pernah bertumpuk dengan FCs maupun DROP
        badgeX: mapX(activePreset.scSec) - 18,
        badgeY: mapYTemp(activePreset.scTemp) + 38,
        badgeW: 82,
        color: "#dc2626",
        borderColor: "rgba(248,113,113,0.92)",
        textColor: "#fecaca",
        isCritical: true,
      });
    }

    items.push({
      id: "drop",
      code: `DROP ${activePreset.dropTemp}°C`,
      temp: activePreset.dropTemp,
      timeSec: activePreset.dropSec,
      x: mapX(activePreset.dropSec),
      y: mapYTemp(activePreset.dropTemp),
      // Badge DROP di atas titik akhir sangrai (digeser sedikit ke kiri agar tidak keluar batas kanan)
      badgeX: Math.min(PLOT_RIGHT - 52, mapX(activePreset.dropSec) - 12),
      badgeY: Math.max(PLOT_TOP + 16, mapYTemp(activePreset.dropTemp) - 30),
      badgeW: 94,
      color: "#2dd4bf",
      borderColor: "rgba(45,212,191,0.9)",
      textColor: "#ccfbf1",
    });

    return items;
  }, [activePreset, mapX, mapYTemp, PLOT_BOTTOM, PLOT_RIGHT, PLOT_TOP]);

  const currentX = mapX(currentTimeSec);
  const currentY = mapYTemp(telemetry.bt);

  // Posisi HUD Playhead Tag: ditaruh di jalur bawah (y=316) agar tidak menutupi milestone di kurva,
  // dan otomatis pindah ke jalur atas (y=62) saat di awal sangrai (dekat lembah TP)
  const playheadTagY = currentTimeSec < 135 ? PLOT_TOP + 20 : PLOT_BOTTOM - 18;
  const playheadTagX = Math.min(PLOT_RIGHT - 82, Math.max(PLOT_LEFT + 82, currentX));

  return (
    <div className="glossy-card relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gold/40 bg-gradient-to-br from-[#071610] via-[#0b2118] to-[#040e0a] text-white shadow-2xl w-full max-w-full">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* ================= TOP HUD: STATUS & PRESET SELECTION ================= */}
      <div className="border-b border-white/10 p-3 sm:p-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="gold" className="text-primary font-bold px-2.5 py-0.5 text-[10px] sm:text-[11px] gap-1 shadow-sm">
                  <Activity className="h-3 w-3 animate-pulse" /> Live Roaster Scope
                </Badge>
                <span className="font-mono text-[10px] sm:text-[11px] text-gold-light tracking-wider font-semibold">
                  BIOSPHERE LAB v2.5 • ARTISAN TELEMETRY
                </span>
              </div>
              <h3 className="mt-1 font-[var(--font-display)] text-base sm:text-xl font-black tracking-wide text-white flex flex-wrap items-center gap-2">
                Cockpit Kurva Roasting Kimiawi
                {telemetry.phase.isCritical && (
                  <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] px-2 py-0.5 font-mono animate-pulse">
                    CRITICAL MILESTONE
                  </span>
                )}
              </h3>
            </div>

            {/* Preset Buttons */}
            <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-black/50 p-1 overflow-x-auto max-w-full scrollbar-none">
              {PRESETS.map((p) => {
                const isSelected = activePreset.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActivePresetId(p.id);
                      setCurrentTimeSec(p.fcSec);
                      setIsPlaying(false);
                    }}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5",
                      isSelected
                        ? "metal-gold text-primary font-extrabold shadow-md"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Flame className={cn("h-3 w-3", isSelected ? "text-primary" : "text-gold-light")} />
                    <span>{p.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] sm:text-xs text-white/70 leading-relaxed line-clamp-2">
            {activePreset.description}
          </p>
        </div>

        {/* ================= 5 LIVE TELEMETRY CARDS ================= */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          {/* Card 1: Bean Temp (BT) */}
          <div className="rounded-xl border border-gold/40 bg-black/40 p-2 sm:p-2.5 backdrop-blur-xs min-w-0 shadow-inner">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gold-light flex items-center gap-1 truncate">
                <Thermometer className="h-3 w-3 text-gold shrink-0" /> BT Probe
              </span>
              <span className="text-[9px] font-mono text-gold-light/60 shrink-0">Bean</span>
            </div>
            <p className="mt-0.5 font-mono text-base sm:text-xl font-black text-gold-light leading-tight">
              {telemetry.bt.toFixed(1)} <span className="text-[11px] font-medium text-white/50">°C</span>
            </p>
            <p className="text-[10px] text-white/70 mt-0.5 truncate font-medium">
              {telemetry.phase.title}
            </p>
          </div>

          {/* Card 2: Drum / Air Temp (ET) */}
          <div className="rounded-xl border border-emerald-500/40 bg-black/40 p-2 sm:p-2.5 backdrop-blur-xs min-w-0 shadow-inner">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 truncate">
                <Flame className="h-3 w-3 text-emerald-400 shrink-0" /> ET Drum
              </span>
              <span className="text-[9px] font-mono text-emerald-400/60 shrink-0">Air</span>
            </div>
            <p className="mt-0.5 font-mono text-base sm:text-xl font-black text-emerald-300 leading-tight">
              {telemetry.et.toFixed(1)} <span className="text-[11px] font-medium text-white/50">°C</span>
            </p>
            <p className="text-[10px] text-white/70 mt-0.5 truncate">
              {currentTimeSec < activePreset.dropSec ? "Thermal Convection" : "Air Cooling"}
            </p>
          </div>

          {/* Card 3: Rate of Rise (RoR) */}
          <div className="rounded-xl border border-amber-500/40 bg-black/40 p-2 sm:p-2.5 backdrop-blur-xs min-w-0 shadow-inner">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1 truncate">
                <Zap className="h-3 w-3 text-amber-400 shrink-0" /> RoR Delta
              </span>
              <span className="text-[9px] font-mono text-amber-400/60 shrink-0">30s</span>
            </div>
            <p className="mt-0.5 font-mono text-base sm:text-xl font-black text-amber-300 leading-tight">
              {telemetry.ror > 0 ? `+${telemetry.ror.toFixed(1)}` : telemetry.ror.toFixed(1)}{" "}
              <span className="text-[11px] font-medium text-white/50">°C/m</span>
            </p>
            <p className="text-[10px] text-white/70 mt-0.5 truncate">
              {telemetry.ror > 0 ? "Declining RoR" : "Cooling Drop"}
            </p>
          </div>

          {/* Card 4: Development Time Ratio (DTR) */}
          <div className="rounded-xl border border-indigo-400/40 bg-black/40 p-2 sm:p-2.5 backdrop-blur-xs min-w-0 shadow-inner">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1 truncate">
                <Gauge className="h-3 w-3 text-indigo-400 shrink-0" /> Live DTR
              </span>
              <span className="text-[9px] font-mono text-indigo-300/60 shrink-0">SCA</span>
            </div>
            <p className="mt-0.5 font-mono text-base sm:text-xl font-black text-indigo-200 leading-tight">
              {telemetry.dtrPercent > 0 ? `${telemetry.dtrPercent.toFixed(1)}%` : "0.0%"}
            </p>
            <p className="text-[10px] text-indigo-300/80 mt-0.5 truncate font-medium">
              {telemetry.dtrLabel}
            </p>
          </div>

          {/* Card 5: Gas & Airflow Machine Status */}
          <div className="col-span-2 sm:col-span-2 xl:col-span-1 rounded-xl border border-white/20 bg-black/40 p-2 sm:p-2.5 backdrop-blur-xs min-w-0 shadow-inner">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/80 flex items-center gap-1 truncate">
                <Wind className="h-3 w-3 text-white/80 shrink-0" /> Burner / Air
              </span>
              <span className="text-[9px] font-mono text-gold-light font-semibold shrink-0">
                {formatTime(currentTimeSec)}
              </span>
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2 font-mono">
              <div className="flex items-baseline gap-1">
                <span className="text-[9px] text-amber-400 font-bold">GAS</span>
                <span className="text-sm sm:text-base font-black text-white">{telemetry.gas}%</span>
              </div>
              <div className="h-3.5 w-px bg-white/20" />
              <div className="flex items-baseline gap-1">
                <span className="text-[9px] text-cyan-400 font-bold">AIR</span>
                <span className="text-sm sm:text-base font-black text-white">{telemetry.air}%</span>
              </div>
            </div>
            <p className="text-[10px] text-white/60 mt-0.5 truncate font-mono">
              Target DTR: {activePreset.targetDtrPercent}%
            </p>
          </div>
        </div>
      </div>

      {/* ================= LAYER TOGGLES & SCOPE OPTIONS ================= */}
      <div className="px-3 sm:px-5 py-2 bg-black/35 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 sm:gap-2.5 font-mono text-[10px] sm:text-[11px] overflow-x-auto scrollbar-none max-w-full">
          <span className="text-white/50 uppercase text-[10px] tracking-wider font-bold mr-0.5 shrink-0">
            Layers:
          </span>

          {/* BT Toggle */}
          <button
            type="button"
            onClick={() => setShowBT(!showBT)}
            className={cn(
              "shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md border transition-all",
              showBT
                ? "border-gold/60 bg-gold/15 text-gold-light font-bold"
                : "border-white/10 text-white/40 line-through"
            )}
          >
            {showBT ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span>BT</span>
          </button>

          {/* ET Toggle */}
          <button
            type="button"
            onClick={() => setShowET(!showET)}
            className={cn(
              "shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md border transition-all",
              showET
                ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300 font-bold"
                : "border-white/10 text-white/40 line-through"
            )}
          >
            {showET ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span>ET</span>
          </button>

          {/* RoR Toggle */}
          <button
            type="button"
            onClick={() => setShowRoR(!showRoR)}
            className={cn(
              "shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md border transition-all",
              showRoR
                ? "border-amber-500/60 bg-amber-500/15 text-amber-300 font-bold"
                : "border-white/10 text-white/40 line-through"
            )}
          >
            {showRoR ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span>RoR</span>
          </button>

          {/* Ghost Reference Toggle */}
          <button
            type="button"
            onClick={() => setShowGhost(!showGhost)}
            className={cn(
              "shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md border transition-all",
              showGhost
                ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-200 font-bold"
                : "border-white/10 text-white/40 line-through"
            )}
          >
            {showGhost ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span className="flex items-center gap-1">
              <span className="h-0.5 w-2.5 border-b border-dashed border-cyan-300" /> Ghost Ref
            </span>
          </button>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-white/60 font-mono">
          <Target className="h-3 w-3 text-gold" /> Geser/klik grafik untuk inspeksi
        </span>
      </div>

      {/* ================= MAIN SVG ROASTER SCOPE CANVAS ================= */}
      <div className="relative px-1.5 py-2 sm:px-4 sm:py-3.5 overflow-hidden w-full max-w-full">
        <svg
          ref={svgRef}
          viewBox="0 0 760 390"
          className="w-full h-auto select-none block cursor-crosshair touch-pan-y"
          style={{ maxHeight: "420px" }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setIsScrubbingSvg(true);
            setIsPlaying(false);
            updateTimeFromPointer(e.clientX);
          }}
          onPointerMove={(e) => {
            if (!isScrubbingSvg) return;
            updateTimeFromPointer(e.clientX);
          }}
          onPointerUp={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
              e.currentTarget.releasePointerCapture(e.pointerId);
            }
            setIsScrubbingSvg(false);
          }}
          onPointerCancel={() => setIsScrubbingSvg(false)}
        >
          <defs>
            {/* Gradient BT Main Curve */}
            <linearGradient id="scopeBtGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6c9a76" />
              <stop offset="22%" stopColor="#84a95a" />
              <stop offset="48%" stopColor="#d4a948" />
              <stop offset="76%" stopColor="#e6602e" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>

            {/* Area Fill under BT Curve */}
            <linearGradient id="scopeBtAreaFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.16" />
              <stop offset="65%" stopColor="#e6602e" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#071610" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing filters */}
            <filter id="laserGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#f5d78e" floodOpacity="0.85" />
            </filter>
            <filter id="subtleLineGlow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#f5d78e" floodOpacity="0.38" />
            </filter>
            <filter id="badgeShadow" x="-15%" y="-15%" width="130%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.7" />
            </filter>
          </defs>

          {/* ================= 1. TOP PHASE RIBBON & DYNAMIC PHASE BANDS ================= */}
          {dynamicPhases.map((p) => {
            const x1 = mapX(p.startSec);
            const x2 = mapX(p.endSec);
            const width = Math.max(0, x2 - x1);
            const isActivePhase = telemetry.phase.key === p.key;

            return (
              <g key={p.key}>
                {/* Plot Area Background Band */}
                <rect
                  x={x1}
                  y={PLOT_TOP}
                  width={width}
                  height={PLOT_HEIGHT}
                  fill={p.color}
                  opacity={isActivePhase ? 0.16 : p.isCritical ? 0.1 : 0.04}
                />

                {/* Vertical Phase Divider Line */}
                {p.startSec > 0 && (
                  <line
                    x1={x1}
                    y1={12}
                    x2={x1}
                    y2={PLOT_BOTTOM}
                    stroke={p.color}
                    strokeWidth={isActivePhase ? "1.4" : "1"}
                    strokeDasharray="3,3"
                    opacity={isActivePhase ? 0.65 : 0.32}
                  />
                )}

                {/* Top Phase Header Pill Segment */}
                {width >= 26 && (
                  <g>
                    <rect
                      x={x1 + 1.5}
                      y={11}
                      width={Math.max(4, width - 3)}
                      height={22}
                      rx={4}
                      fill={isActivePhase ? p.color : "rgba(6, 20, 14, 0.88)"}
                      fillOpacity={isActivePhase ? 0.36 : 0.8}
                      stroke={p.color}
                      strokeWidth={isActivePhase ? "1.5" : "0.9"}
                      strokeOpacity={isActivePhase ? 0.95 : 0.5}
                    />
                    <text
                      x={x1 + width / 2}
                      y={22.5}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isActivePhase ? "#ffffff" : "rgba(255,255,255,0.78)"}
                      fontSize={width < 48 ? "8.5" : "9.5"}
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {width < 42 ? p.shortTag.slice(0, 4) : p.shortTag}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Outer Plot Frame Border */}
          <rect
            x={PLOT_LEFT}
            y={PLOT_TOP}
            width={PLOT_WIDTH}
            height={PLOT_HEIGHT}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />

          {/* ================= 2. GRID LINES & AXES ================= */}
          {/* Horizontal Temperature Grid Lines (50°C, 100°C, 150°C, 200°C, 250°C) */}
          {[50, 100, 150, 200, 250].map((temp) => {
            const y = mapYTemp(temp);
            return (
              <g key={temp}>
                <line
                  x1={PLOT_LEFT}
                  y1={y}
                  x2={PLOT_RIGHT}
                  y2={y}
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth="1"
                />
                <text
                  x={PLOT_LEFT - 6}
                  y={y + 4}
                  textAnchor="end"
                  fill="rgba(255,255,255,0.68)"
                  fontSize="10.5"
                  fontFamily="monospace"
                  fontWeight="bold"
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
                <line
                  x1={PLOT_RIGHT - 4}
                  y1={y}
                  x2={PLOT_RIGHT}
                  y2={y}
                  stroke="rgba(251, 191, 36, 0.4)"
                  strokeWidth="1"
                />
                <text
                  x={PLOT_RIGHT + 6}
                  y={y + 3.5}
                  textAnchor="start"
                  fill="rgba(251, 191, 36, 0.8)"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
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
                  y1={PLOT_TOP}
                  x2={x}
                  y2={PLOT_BOTTOM}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={PLOT_BOTTOM + 19}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.72)"
                  fontSize="10.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {formatTime(sec)}
                </text>
              </g>
            );
          })}

          {/* ================= 3. TELEMETRY CURVES ================= */}
          {/* Ghost Reference Profile Curve (Artisan/Cropster Ideal Benchmark) */}
          {showGhost && (
            <g opacity={0.8}>
              <path
                d={ghostPath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.8"
                strokeDasharray="5,4"
              />
              {/* Ghost Badge ditempatkan di area tengah Maillard (t=375s) agar tidak pernah menabrak FCs/DROP */}
              <g
                transform={`translate(${mapX(375)}, ${
                  mapYTemp(calculateTelemetry(375, GHOST_REFERENCE).bt) + 20
                })`}
              >
                <rect
                  x="-40"
                  y="-9"
                  width="80"
                  height="18"
                  rx="4"
                  fill="#04131a"
                  stroke="#38bdf8"
                  strokeWidth="1"
                  opacity="0.92"
                />
                <text
                  x="0"
                  y="0.5"
                  fill="#7dd3fc"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  GHOST REF
                </text>
              </g>
            </g>
          )}

          {/* Environmental Temp Curve (ET) */}
          {showET && (
            <g>
              <path
                d={etRoastPath}
                fill="none"
                stroke="#34d399"
                strokeWidth="2"
                strokeDasharray="5,3"
                opacity={0.78}
              />
              <path
                d={etCoolPath}
                fill="none"
                stroke="#34d399"
                strokeWidth="1.3"
                strokeDasharray="2,4"
                opacity={0.38}
              />
            </g>
          )}

          {/* Rate of Rise Curve (RoR) - Smooth Declining Curve */}
          {showRoR && (
            <path
              d={rorPath}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85}
            />
          )}

          {/* Bean Temperature Curve (BT) - Main Glowing Curve + Subtle Area Fill */}
          {showBT && (
            <g>
              <path d={btAreaPath} fill="url(#scopeBtAreaFill)" />
              <path
                d={btRoastPath}
                fill="none"
                stroke="url(#scopeBtGradient)"
                strokeWidth="3.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#subtleLineGlow)"
              />
              {/* Cooling Tray Tail */}
              <path
                d={btCoolPath}
                fill="none"
                stroke="#2dd4bf"
                strokeWidth="2.2"
                strokeDasharray="4,4"
                opacity={0.68}
              />
            </g>
          )}

          {/* ================= 4. STAGGERED MILESTONE CALLOUT BADGES ================= */}
          {milestones.map((m) => {
            const isNearPlayhead = Math.abs(currentTimeSec - m.timeSec) <= 14;
            const halfW = m.badgeW / 2;
            const isBadgeAbove = m.badgeY < m.y;
            const lineEndY = isBadgeAbove ? m.badgeY + 11 : m.badgeY - 11;

            return (
              <g key={m.id}>
                {/* Leader Line (Garis Penunjuk dari Titik Kurva ke Badge Pill) */}
                <line
                  x1={m.x}
                  y1={m.y}
                  x2={m.badgeX}
                  y2={lineEndY}
                  stroke={m.color}
                  strokeWidth="1.4"
                  strokeDasharray="2,2"
                  opacity={0.9}
                />

                {/* Milestone Node on BT Curve */}
                <circle
                  cx={m.x}
                  cy={m.y}
                  r={m.isCritical ? 5.6 : 4.6}
                  fill={m.color}
                  stroke="#ffffff"
                  strokeWidth={m.isCritical ? "2" : "1.6"}
                  filter={m.isCritical ? "url(#laserGlow)" : undefined}
                />

                {/* Staggered Callout Pill Badge */}
                <g
                  transform={`translate(${m.badgeX}, ${m.badgeY})`}
                  filter="url(#badgeShadow)"
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentTimeSec(m.timeSec);
                    setIsPlaying(false);
                  }}
                >
                  <rect
                    x={-halfW}
                    y={-11}
                    width={m.badgeW}
                    height={22}
                    rx={5}
                    fill="#06140e"
                    fillOpacity={0.96}
                    stroke={isNearPlayhead ? "#fef08a" : m.borderColor}
                    strokeWidth={isNearPlayhead ? "1.8" : "1.2"}
                  />
                  <text
                    x={0}
                    y={0.5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={m.textColor}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {m.code}
                  </text>
                </g>
              </g>
            );
          })}

          {/* ================= 5. INTERACTIVE PLAYHEAD LASER SCANNER ================= */}
          <line
            x1={currentX}
            y1={PLOT_TOP}
            x2={currentX}
            y2={PLOT_BOTTOM}
            stroke="#f5d78e"
            strokeWidth="1.8"
            strokeDasharray="3,3"
            opacity={0.92}
          />

          {/* Animated Crosshair Head on BT Curve */}
          <circle
            cx={currentX}
            cy={currentY}
            r={6.8}
            fill="#ffffff"
            stroke="#eab308"
            strokeWidth="3"
            filter="url(#laserGlow)"
          />
          <circle
            cx={currentX}
            cy={currentY}
            r={12.5}
            fill="none"
            stroke="#f5d78e"
            strokeWidth="1.5"
            opacity={0.65}
            className="animate-ping"
          />

          {/* Non-Overlapping Playhead HUD Tag */}
          <g transform={`translate(${playheadTagX}, ${playheadTagY})`} filter="url(#badgeShadow)">
            <rect
              x="-80"
              y="-12"
              width="160"
              height="24"
              rx="6"
              fill="#06120d"
              stroke="#f5d78e"
              strokeWidth="1.4"
              opacity="0.96"
            />
            <text
              x="0"
              y="0.5"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#fef08a"
              fontSize="10.5"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {telemetry.bt.toFixed(1)}°C • RoR {telemetry.ror > 0 ? `+${telemetry.ror.toFixed(1)}` : telemetry.ror.toFixed(1)} • {formatTime(currentTimeSec)}
            </text>
          </g>
        </svg>

        {/* Scope Coordinate Axis Labels Footer */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[9.5px] sm:text-[10px] text-white/55 px-1.5 sm:px-2 pt-1 font-mono">
          <span>Y-Left: Suhu (50–250°C)</span>
          <span className="text-amber-400/85">Y-Right: RoR (+5–25°C/m)</span>
          <span>X: Waktu (00:00–12:00)</span>
        </div>
      </div>

      {/* ================= MILESTONE QUICK JUMP BUTTONS ================= */}
      <div className="px-3.5 sm:px-5 py-2 bg-black/40 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-mono uppercase text-gold-light/70 font-bold shrink-0 mr-1">
          Milestones:
        </span>

        {/* 1. Charge */}
        <button
          type="button"
          onClick={() => {
            setCurrentTimeSec(0);
            setIsPlaying(false);
          }}
          className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-mono border border-white/15 bg-white/5 hover:bg-white/10 hover:border-gold/40 text-white/80 transition-colors"
        >
          ⚡ Charge (0:00)
        </button>

        {/* 2. Turning Point */}
        <button
          type="button"
          onClick={() => {
            setCurrentTimeSec(activePreset.tpSec);
            setIsPlaying(false);
          }}
          className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-mono border border-white/15 bg-white/5 hover:bg-white/10 hover:border-gold/40 text-white/80 transition-colors"
        >
          🔄 TP ({formatTime(activePreset.tpSec)})
        </button>

        {/* 3. Dry End */}
        <button
          type="button"
          onClick={() => {
            setCurrentTimeSec(activePreset.dryEndSec);
            setIsPlaying(false);
          }}
          className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-mono border border-white/15 bg-white/5 hover:bg-white/10 hover:border-gold/40 text-white/80 transition-colors"
        >
          🌾 Dry End ({formatTime(activePreset.dryEndSec)})
        </button>

        {/* 4. First Crack */}
        <button
          type="button"
          onClick={() => {
            setCurrentTimeSec(activePreset.fcSec);
            setIsPlaying(false);
          }}
          className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-mono border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold transition-colors"
        >
          💥 First Crack ({formatTime(activePreset.fcSec)})
        </button>

        {/* 5. Second Crack (if applicable) */}
        {activePreset.scSec && (
          <button
            type="button"
            onClick={() => {
              setCurrentTimeSec(activePreset.scSec!);
              setIsPlaying(false);
            }}
            className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-mono border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold transition-colors"
          >
            🔥 Second Crack ({formatTime(activePreset.scSec)})
          </button>
        )}

        {/* 6. Drop */}
        <button
          type="button"
          onClick={() => {
            setCurrentTimeSec(activePreset.dropSec);
            setIsPlaying(false);
          }}
          className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-mono border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold transition-colors"
        >
          ❄️ Drop ({formatTime(activePreset.dropSec)})
        </button>
      </div>

      {/* ================= CONTROLS & TIMELINE SCRUBBER ================= */}
      <div className="border-t border-white/10 bg-black/50 p-3.5 sm:p-5 space-y-3">
        <div className="flex items-center gap-3">
          {/* Play / Pause Button */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl metal-gold text-primary shadow-md hover:scale-105 transition-transform"
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
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Play Speed Multiplier */}
          <div className="flex items-center gap-1 text-[11px] font-mono">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaySpeed(spd)}
                className={cn(
                  "px-2 py-1 rounded-lg transition-colors font-semibold",
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
        <div className="rounded-xl border border-gold/30 bg-gradient-to-r from-secondary/20 via-black/40 to-secondary/20 p-3.5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-white/10 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-gold-light shrink-0" />
              <span className="font-bold text-gold-light text-xs sm:text-sm">
                {telemetry.phase.label}: {telemetry.phase.title} ({telemetry.phase.suhuRange})
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-white/70">
              <span className="truncate">
                Notes: <strong className="text-white">{activePreset.flavorHighlight}</strong>
              </span>
              <span className="text-gold-light font-bold shrink-0">
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
