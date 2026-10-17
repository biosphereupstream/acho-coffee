"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ArrowRight,
  CalendarClock,
  ChevronDown,
  Flame,
  Gauge,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Wind,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ================= STAGE DEFINITIONS FOR SCROLLYTELLING =================
interface RoastStageInfo {
  index: number;
  id: string;
  stepCode: string;
  shortTitle: string;
  phaseBadge: string;
  tempLabel: string;
  headlinePrimary: string;
  headlineAccent: string;
  description: string;
  aromaNotes: string;
  chemistryNote: string;
  scrollRange: [number, number];
  accentHex: string;
}

const ROAST_STAGES: RoastStageInfo[] = [
  {
    index: 0,
    id: "green-charge",
    stepCode: "01",
    shortTitle: "Green Bean",
    phaseBadge: "TAHAP 01 • CHARGE & DRYING (95°C – 150°C)",
    tempLabel: "95°C",
    headlinePrimary: "Dipesan Hari Ini,",
    headlineAccent: "Dipanggang Khusus Untukmu",
    description:
      "Pilih single origin atau blend nusantara, tentukan profil roasting & gilingan, lalu jadwalkan pengambilan di roastery atau kirim ke rumahmu — lengkap dengan tracing kurir dan update di setiap tahap.",
    aromaNotes: "Fresh Grass, Sweet Pea, Raw Botanical",
    chemistryNote: "Endotermik • Penguapan kadar air bebas (11.5% → 6%)",
    scrollRange: [0, 0.25],
    accentHex: "#6e9968",
  },
  {
    index: 1,
    id: "maillard-gold",
    stepCode: "02",
    shortTitle: "Maillard",
    phaseBadge: "TAHAP 02 • YELLOWING & MAILLARD (160°C – 192°C)",
    tempLabel: "174°C",
    headlinePrimary: "Reaksi Maillard &",
    headlineAccent: "800+ Senyawa Karamel",
    description:
      "Saat suhu melampaui 160°C, asam amino dan gula pereduksi mulai menyatu membentuk melanoidin. Biji kopi menguning keemasan lalu berubah cokelat hangat dengan aroma roti panggang & madu.",
    aromaNotes: "Toasted Brioche, Caramelized Honey, Roasted Almond",
    chemistryNote: "Maillard & Strecker • Pembentukan struktur manis & body",
    scrollRange: [0.25, 0.55],
    accentHex: "#d4a948",
  },
  {
    index: 2,
    id: "first-crack",
    stepCode: "03",
    shortTitle: "First Crack",
    phaseBadge: "TAHAP 03 • FIRST CRACK EXOTHERMIC (198°C – 205°C)",
    tempLabel: "201°C",
    headlinePrimary: "First Crack:",
    headlineAccent: "Ledakan Seluler & Kompleksitas Rasa",
    description:
      "Tekanan uap air dan gas CO₂ memecah dinding sel biji kopi secara eksotermik. Belahan tengah biji membara dan mengembang, melepaskan karakter floral, keasaman buah cerah, dan sweetness puncak.",
    aromaNotes: "Jasmine Blossom, Strawberry Wine, Citric Bergamot",
    chemistryNote: "Eksotermik Kritis • Transisi struktur berpori & pelepasan CO₂",
    scrollRange: [0.55, 0.82],
    accentHex: "#e6602e",
  },
  {
    index: 3,
    id: "artisanal-drop",
    stepCode: "04",
    shortTitle: "Artisanal Drop",
    phaseBadge: "TAHAP 04 • OPTIMAL DTR & COOLING (212°C → <65°C)",
    tempLabel: "212°C",
    headlinePrimary: "Presisi DTR 17.7% —",
    headlineAccent: "Segar di Tanganmu dalam 72 Jam",
    description:
      "Roaster menghentikan reaksi tepat di sweet-spot Development Time Ratio (DTR) dengan pendinginan udara bertekanan tinggi. Dikemas dengan one-way valve dan langsung dikirim ke alamatmu.",
    aromaNotes: "Dark Chocolate Truffle, Brown Sugar, Velvety Crema",
    chemistryNote: "Rapid Quenching • Mengunci senyawa aromatik tanpa baked flavor",
    scrollRange: [0.82, 1.0],
    accentHex: "#f59e0b",
  },
];

// ================= PROCEDURAL ARABICA COFFEE BEAN GEOMETRY =================
function createCoffeeBeanGeometry(detail = 64, scale = 1): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(scale, detail, detail);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i) / scale;
    let y = pos.getY(i) / scale;
    let z = pos.getZ(i) / scale;

    // 1. Proporsi elipsoid anatomi biji kopi Arabika
    y *= 1.36;
    x *= 0.94;
    z *= 0.78;

    // 2. Bagian depan (z > 0) lebih rata dibanding punggung cembung (z < 0)
    if (z > 0) {
      z *= 0.72;
    } else {
      z *= 1.06;
    }

    // 3. Belahan tengah berbentuk S (S-shaped Center Cut / Crease) di sisi z > 0
    const sCurveOffset = Math.sin(y * 1.45) * 0.085;
    const dx = Math.abs(x - sCurveOffset);
    const yMask = Math.max(0, 1 - Math.pow(y / 1.28, 4));

    if (z > -0.15 && dx < 0.25) {
      const u = dx / 0.25;
      const trench = Math.pow(1 - u * u, 2.2) * 0.44 * yMask;
      z -= trench;
    }

    // 4. Bibir lipatan (lip ridge) di kanan-kiri belahan tengah
    if (z > 0 && dx >= 0.12 && dx < 0.36) {
      const lip = Math.exp(-Math.pow((dx - 0.22) / 0.085, 2)) * 0.06 * yMask;
      z += lip;
    }

    // 5. Tekstur serat organik mikro di permukaan biji
    const micro =
      (Math.sin(x * 16 + y * 10) * Math.cos(z * 14 - y * 8) +
        Math.sin(y * 22) * 0.4) *
      0.011;

    x += x * micro;
    y += y * micro;
    z += z * micro;

    pos.setXYZ(i, x * scale, y * scale, z * scale);
  }

  geo.computeVertexNormals();
  return geo;
}

// Interpolasi telemetri kontinu dari progress scroll (0.0 -> 1.0)
function interpolateScrollTelemetry(p: number) {
  const clamped = Math.max(0, Math.min(1, p));
  // Suhu: 95°C -> 165°C -> 201°C -> 212°C
  const temp =
    clamped < 0.25
      ? 95 + (clamped / 0.25) * 65
      : clamped < 0.55
      ? 160 + ((clamped - 0.25) / 0.3) * 38
      : clamped < 0.82
      ? 198 + ((clamped - 0.55) / 0.27) * 9
      : 207 + ((clamped - 0.82) / 0.18) * 5;

  // RoR: +22.4 -> +16.2 -> +9.4 -> +4.8 °C/m
  const ror = 22.8 - Math.pow(clamped, 0.85) * 18.0;

  // DTR: muncul setelah First Crack (p >= 0.55)
  const dtr = clamped < 0.55 ? 0 : ((clamped - 0.55) / 0.45) * 17.7;

  // Waktu sangrai: 01:15 (75s) -> 10:20 (620s)
  const sec = Math.round(75 + clamped * 545);
  const mins = Math.floor(sec / 60);
  const remSec = sec % 60;
  const timeFormatted = `${String(mins).padStart(2, "0")}:${String(remSec).padStart(2, "0")}`;

  // Intensity First Crack (puncak di p = 0.68)
  const crackIntensity = Math.exp(-Math.pow((clamped - 0.68) / 0.13, 2));

  return {
    temp: Math.round(temp * 10) / 10,
    ror: Math.round(ror * 10) / 10,
    dtr: Math.round(dtr * 10) / 10,
    timeFormatted,
    crackIntensity,
  };
}

// ================= 3D SCENE INNER COMPONENT =================
interface SceneProps {
  scrollProgressRef: React.MutableRefObject<number>;
}

const COLOR_STOPS = [
  { p: 0.0, color: new THREE.Color("#679460"), emissive: new THREE.Color("#0b2416"), roughness: 0.76 },
  { p: 0.28, color: new THREE.Color("#c99d42"), emissive: new THREE.Color("#2b1904"), roughness: 0.62 },
  { p: 0.55, color: new THREE.Color("#9e5222"), emissive: new THREE.Color("#451604"), roughness: 0.48 },
  { p: 0.72, color: new THREE.Color("#632910"), emissive: new THREE.Color("#7c2208"), roughness: 0.35 },
  { p: 1.0, color: new THREE.Color("#331609"), emissive: new THREE.Color("#1f0a03"), roughness: 0.22 },
];

function sampleBeanMaterialState(p: number) {
  const clamped = Math.max(0, Math.min(1, p));
  let idx = 0;
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    if (clamped >= COLOR_STOPS[i].p && clamped <= COLOR_STOPS[i + 1].p) {
      idx = i;
      break;
    }
  }
  const a = COLOR_STOPS[idx];
  const b = COLOR_STOPS[idx + 1];
  const t = (clamped - a.p) / Math.max(0.0001, b.p - a.p);

  const color = a.color.clone().lerp(b.color, t);
  const emissive = a.emissive.clone().lerp(b.emissive, t);
  const roughness = a.roughness + (b.roughness - a.roughness) * t;
  return { color, emissive, roughness };
}

function LivingRoastScene({ scrollProgressRef }: SceneProps) {
  const mainGroupRef = useRef<THREE.Group>(null);
  const heroBeanRef = useRef<THREE.Mesh>(null);
  const heroMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const crackCoreMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const satellitesRef = useRef<THREE.InstancedMesh>(null);
  const satelliteMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const embersRef = useRef<THREE.Points>(null);
  const emberMatRef = useRef<THREE.PointsMaterial>(null);
  const bottomLightRef = useRef<THREE.PointLight>(null);

  const smoothedProgress = useRef(0);

  // Procedural geometries
  const heroGeometry = useMemo(() => createCoffeeBeanGeometry(68, 1.32), []);
  const satelliteGeometry = useMemo(() => createCoffeeBeanGeometry(22, 0.17), []);

  // Crease glowing core curve geometry
  const creaseTubeGeometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = -20; i <= 20; i++) {
      const t = i / 20;
      const y = t * 1.48;
      const x = Math.sin(y * 1.1) * 0.1;
      const z = 0.46 - Math.pow(t, 2) * 0.18;
      pts.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 48, 0.045, 12, false);
  }, []);

  // Data orbit 36 satelit biji kopi
  const satelliteOrbits = useMemo(() => {
    const count = 36;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2.15 + (i % 5) * 0.42;
      const yOffset = ((i % 7) - 3) * 0.55;
      const speed = 0.28 + (i % 4) * 0.09;
      const rotSpeed = 0.6 + (i % 3) * 0.35;
      const scale = 0.72 + (i % 4) * 0.18;
      return { angle, radius, yOffset, speed, rotSpeed, scale, phase: i * 1.7 };
    });
  }, []);

  // Data 240 partikel bara & uap WebGL
  const emberData = useMemo(() => {
    const count = 240;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 0.8 + Math.random() * 4.2;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6.5;
      positions[i * 3 + 2] = Math.sin(theta) * r - 0.5;
      speeds[i] = 0.4 + Math.random() * 1.1;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geo, speeds, count };
  }, []);

  const dummyObj = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    const targetP = scrollProgressRef.current;
    smoothedProgress.current = THREE.MathUtils.lerp(
      smoothedProgress.current,
      targetP,
      Math.min(1, delta * 7.5)
    );
    const p = smoothedProgress.current;
    const t = state.clock.getElapsedTime();

    // Hitung intensitas First Crack (puncak di p ~ 0.68)
    const crackIntensity = Math.exp(-Math.pow((p - 0.68) / 0.13, 2));

    // 1. Update Material Warna & Tekstur Hero Bean
    const matState = sampleBeanMaterialState(p);
    if (heroMatRef.current) {
      heroMatRef.current.color.copy(matState.color);
      heroMatRef.current.emissive.copy(matState.emissive);
      heroMatRef.current.emissiveIntensity = 0.35 + crackIntensity * 1.25;
      heroMatRef.current.roughness = matState.roughness;
      heroMatRef.current.clearcoat = THREE.MathUtils.lerp(0.08, 0.68, Math.max(0, (p - 0.5) * 2));
    }

    // 2. Update Crease Core Pijar Eksotermik saat First Crack
    if (crackCoreMatRef.current) {
      crackCoreMatRef.current.emissiveIntensity =
        0.15 + crackIntensity * 4.5 + (p > 0.7 ? 0.55 : 0);
      crackCoreMatRef.current.opacity = Math.min(1, 0.25 + p * 0.5 + crackIntensity * 0.65);
    }

    // 3. Transformasi & Rotasi Hero Bean Utama + Ekspansi Volume + Getaran First Crack
    if (heroBeanRef.current) {
      const expansion = 1 + p * 0.16 + crackIntensity * 0.04;
      const shakeX = crackIntensity * Math.sin(t * 48) * 0.025;
      const shakeY = crackIntensity * Math.cos(t * 54) * 0.025;

      heroBeanRef.current.scale.setScalar(expansion);
      heroBeanRef.current.rotation.y = t * 0.42 + p * Math.PI * 2.4;
      heroBeanRef.current.rotation.x = Math.sin(t * 0.7) * 0.18 + (p - 0.5) * 0.55;
      heroBeanRef.current.rotation.z = Math.cos(t * 0.5) * 0.12 + Math.sin(p * Math.PI) * 0.25;
      heroBeanRef.current.position.set(
        shakeX,
        Math.sin(t * 1.4) * 0.08 + shakeY,
        0
      );
    }

    // 4. Mouse Parallax pada Main Group
    if (mainGroupRef.current) {
      const targetRotY = state.pointer.x * 0.32;
      const targetRotX = -state.pointer.y * 0.22;
      mainGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        mainGroupRef.current.rotation.y,
        targetRotY,
        delta * 4
      );
      mainGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        mainGroupRef.current.rotation.x,
        targetRotX,
        delta * 4
      );
    }

    // 5. Orbital Thermal Rings (Gyroscope Roaster Chamber)
    const speedMult = 1 + p * 2.2 + crackIntensity * 1.8;
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.25 * speedMult + p * 2;
      ring1Ref.current.rotation.x = 1.15 + Math.sin(t * 0.4) * 0.15;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.32 * speedMult - p * 1.8;
      ring2Ref.current.rotation.x = 0.65 + Math.cos(t * 0.35) * 0.2;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z = -t * 0.18 * speedMult;
      ring3Ref.current.rotation.y = 0.85 + p * 1.4;
    }

    // 6. Update 36 Orbiting Satellite Coffee Beans (InstancedMesh)
    if (satellitesRef.current) {
      if (satelliteMatRef.current) {
        satelliteMatRef.current.color.copy(matState.color);
        satelliteMatRef.current.roughness = matState.roughness;
      }

      for (let i = 0; i < satelliteOrbits.length; i++) {
        const orb = satelliteOrbits[i];
        const currentAngle = orb.angle + t * orb.speed * (1 + p * 1.1) + p * 3.2;
        const radialBurst = orb.radius + crackIntensity * 0.45 - p * 0.2;
        const x = Math.cos(currentAngle) * radialBurst;
        const z = Math.sin(currentAngle) * radialBurst;
        const y =
          orb.yOffset +
          Math.sin(t * 1.2 + orb.phase) * 0.28 +
          Math.cos(currentAngle * 2) * 0.2;

        dummyObj.position.set(x, y, z);
        dummyObj.rotation.set(
          t * orb.rotSpeed + orb.phase,
          t * orb.rotSpeed * 1.3 + p * 2,
          orb.phase
        );
        dummyObj.scale.setScalar(orb.scale * (1 + p * 0.14));
        dummyObj.updateMatrix();
        satellitesRef.current.setMatrixAt(i, dummyObj.matrix);
      }
      satellitesRef.current.instanceMatrix.needsUpdate = true;
    }

    // 7. Update Rising Thermal Embers & Aroma Particles
    if (embersRef.current) {
      const posAttr = embersRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const thermalSpeed = 1 + p * 2.6 + crackIntensity * 2.5;

      for (let i = 0; i < emberData.count; i++) {
        let px = posAttr.getX(i);
        let py = posAttr.getY(i);
        let pz = posAttr.getZ(i);

        py += emberData.speeds[i] * delta * thermalSpeed;
        const swirlAngle = delta * 0.45 * thermalSpeed;
        const cosA = Math.cos(swirlAngle);
        const sinA = Math.sin(swirlAngle);
        const nx = px * cosA - pz * sinA;
        const nz = px * sinA + pz * cosA;
        px = nx;
        pz = nz;

        if (py > 3.4) {
          py = -3.4;
        }
        posAttr.setXYZ(i, px, py, pz);
      }
      posAttr.needsUpdate = true;

      if (emberMatRef.current) {
        emberMatRef.current.color.set(
          p < 0.25 ? "#84cc16" : p < 0.55 ? "#fbbf24" : p < 0.82 ? "#f97316" : "#f59e0b"
        );
        emberMatRef.current.opacity = 0.45 + p * 0.35 + crackIntensity * 0.2;
      }
    }

    // 8. Update Dynamic Roaster Burner PointLight
    if (bottomLightRef.current) {
      bottomLightRef.current.intensity = 2.2 + p * 3.5 + crackIntensity * 4.0;
      bottomLightRef.current.color.set(
        p < 0.25 ? "#34d399" : p < 0.55 ? "#f59e0b" : "#ea580c"
      );
    }
  });

  return (
    <>
      {/* Studio & Roaster Chamber Lighting */}
      <ambientLight intensity={0.65} color="#e2f1e8" />
      <directionalLight position={[4.5, 5.5, 4]} intensity={2.4} color="#fff6d6" />
      <directionalLight position={[-5, 2.5, -3]} intensity={1.4} color="#34d399" />
      <pointLight
        ref={bottomLightRef}
        position={[0, -2.6, 1.5]}
        intensity={3.0}
        distance={10}
        color="#f59e0b"
      />

      <group ref={mainGroupRef} position={[1.05, 0.05, 0]}>
        {/* 1. HERO ARABICA COFFEE BEAN */}
        <mesh ref={heroBeanRef} geometry={heroGeometry} castShadow receiveShadow>
          <meshPhysicalMaterial
            ref={heroMatRef}
            color="#679460"
            emissive="#0b2416"
            emissiveIntensity={0.35}
            roughness={0.75}
            metalness={0.08}
            clearcoat={0.12}
            clearcoatRoughness={0.28}
          />

          {/* Inner Exothermic Glowing Center Cut Filament */}
          <mesh geometry={creaseTubeGeometry}>
            <meshStandardMaterial
              ref={crackCoreMatRef}
              color="#ffedd5"
              emissive="#f97316"
              emissiveIntensity={0.4}
              transparent
              opacity={0.4}
            />
          </mesh>
        </mesh>

        {/* 2. ORBITAL THERMAL GYROSCOPE RINGS */}
        <mesh ref={ring1Ref}>
          <torusGeometry args={[2.15, 0.014, 16, 120]} />
          <meshBasicMaterial color="#eab308" transparent opacity={0.42} />
        </mesh>

        <mesh ref={ring2Ref}>
          <torusGeometry args={[2.62, 0.011, 16, 120]} />
          <meshBasicMaterial color="#34d399" transparent opacity={0.28} />
        </mesh>

        <mesh ref={ring3Ref}>
          <torusGeometry args={[3.15, 0.009, 12, 100]} />
          <meshBasicMaterial color="#f97316" transparent opacity={0.22} />
        </mesh>

        {/* 3. 36 ORBITING SATELLITE COFFEE BEANS */}
        <instancedMesh
          ref={satellitesRef}
          args={[satelliteGeometry, undefined, satelliteOrbits.length]}
        >
          <meshStandardMaterial
            ref={satelliteMatRef}
            color="#679460"
            roughness={0.65}
            metalness={0.1}
          />
        </instancedMesh>

        {/* 4. RISING THERMAL EMBERS & AROMA PARTICLES */}
        <points ref={embersRef} geometry={emberData.geo}>
          <pointsMaterial
            ref={emberMatRef}
            size={0.055}
            color="#fbbf24"
            transparent
            opacity={0.65}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>
    </>
  );
}

// ================= MAIN SCROLLYTELLING HERO COMPONENT =================
interface HeroRoastWebGLProps {
  announcementText?: string | null;
}

export function HeroRoastWebGL({ announcementText }: HeroRoastWebGLProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef<number>(0);
  const [uiProgress, setUiProgress] = useState<number>(0);

  // Hitung progress scroll di sepanjang track 320vh
  useEffect(() => {
    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const scrollableDistance = Math.max(1, rect.height - window.innerHeight);
        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance));
        scrollProgressRef.current = progress;
        setUiProgress(progress);
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Tentukan stage aktif (0..3) berdasarkan uiProgress
  const activeStage = useMemo(() => {
    for (let i = ROAST_STAGES.length - 1; i >= 0; i--) {
      if (uiProgress >= ROAST_STAGES[i].scrollRange[0]) {
        return ROAST_STAGES[i];
      }
    }
    return ROAST_STAGES[0];
  }, [uiProgress]);

  const liveTelemetry = useMemo(
    () => interpolateScrollTelemetry(uiProgress),
    [uiProgress]
  );

  // Fungsi klik untuk melompat ke tahap tertentu di track scroll
  const scrollToStage = useCallback((stageIndex: number) => {
    if (!containerRef.current) return;
    const stage = ROAST_STAGES[stageIndex];
    if (!stage) return;
    const rect = containerRef.current.getBoundingClientRect();
    const containerTopAbs = window.scrollY + rect.top;
    const scrollableDistance = Math.max(1, rect.height - window.innerHeight);
    // Ambil titik tengah rentang stage (atau 0 untuk stage pertama)
    const targetProgress =
      stageIndex === 0
        ? 0
        : stageIndex === ROAST_STAGES.length - 1
        ? 0.92
        : (stage.scrollRange[0] + stage.scrollRange[1]) * 0.5;

    window.scrollTo({
      top: containerTopAbs + targetProgress * scrollableDistance,
      behavior: "smooth",
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-[320vh] w-full bg-[#05120d] text-white select-none"
    >
      {/* ================= STICKY FULL-VIEWPORT 3D STAGE ================= */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Ambient Radial Backdrops */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-700"
          style={{
            background: `radial-gradient(55% 50% at 72% 48%, ${activeStage.accentHex}2e 0%, transparent 68%), radial-gradient(45% 45% at 18% 25%, rgba(16, 185, 129, 0.14) 0%, transparent 65%)`,
          }}
        />

        {/* Subtle Technical Grid Overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        {/* ================= THREE.JS WEBGL CANVAS ================= */}
        <div className="absolute inset-0 z-0">
          <Canvas
            dpr={[1, 2]}
            camera={{ position: [0, 0, 5.4], fov: 42 }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          >
            <LivingRoastScene scrollProgressRef={scrollProgressRef} />
          </Canvas>
        </div>

        {/* Vignette Gradient untuk menjaga keterbacaan teks di sisi kiri & bawah */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(90deg, rgba(5,18,13,0.92) 0%, rgba(5,18,13,0.72) 44%, rgba(5,18,13,0.18) 76%, rgba(5,18,13,0.45) 100%), linear-gradient(180deg, rgba(5,18,13,0.45) 0%, transparent 22%, transparent 78%, rgba(5,18,13,0.94) 100%)",
          }}
        />

        {/* ================= FOREGROUND HUD & SCROLLYTELLING CONTENT ================= */}
        <div className="relative z-20 mx-auto flex h-full max-w-7xl flex-col justify-between px-4 py-6 sm:px-6 sm:py-10 lg:py-12">
          {/* TOP BAR: BRAND BADGES & LIVE ROASTER TELEMETRY PILL */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="gold" className="px-3 py-1 text-xs font-bold shadow-md">
                ☕ Fresh Roast dalam 72 Jam
              </Badge>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-950/70 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-300 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                3D WebGL Interactive Roaster
              </span>
              {announcementText && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 border border-gold/45 px-3 py-1 text-xs text-gold-light font-semibold backdrop-blur-md">
                  <Sparkles className="h-3 w-3 text-gold-light shrink-0" />
                  <span>{announcementText}</span>
                </div>
              )}
            </div>

            {/* Live Mini Telemetry Readout on Top-Right */}
            <div className="hidden sm:flex items-center gap-3 rounded-2xl border border-white/15 bg-black/55 px-4 py-2 font-mono text-xs backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-1.5 text-gold-light">
                <Thermometer className="h-3.5 w-3.5 text-gold" />
                <span className="font-black text-sm">{liveTelemetry.temp.toFixed(1)}°C</span>
              </div>
              <div className="h-3.5 w-px bg-white/15" />
              <div className="flex items-center gap-1 text-amber-300">
                <Zap className="h-3.5 w-3.5" />
                <span>RoR +{liveTelemetry.ror.toFixed(1)}</span>
              </div>
              <div className="h-3.5 w-px bg-white/15" />
              <div className="flex items-center gap-1 text-cyan-300">
                <Gauge className="h-3.5 w-3.5" />
                <span>DTR {liveTelemetry.dtr.toFixed(1)}%</span>
              </div>
              <div className="h-3.5 w-px bg-white/15" />
              <span className="text-white/70">{liveTelemetry.timeFormatted}</span>
            </div>
          </div>

          {/* CENTER-LEFT STORYTELLING COLUMN */}
          <div className="my-auto max-w-xl lg:max-w-2xl space-y-4 sm:space-y-5">
            {/* Dynamic Phase Tag */}
            <div className="inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-black/55 px-3.5 py-1.5 backdrop-blur-md">
              <Flame
                className="h-3.5 w-3.5 shrink-0 transition-colors duration-300"
                style={{ color: activeStage.accentHex }}
              />
              <span className="font-mono text-[10px] sm:text-xs font-bold tracking-wider text-gold-light uppercase">
                {activeStage.phaseBadge}
              </span>
            </div>

            {/* Dynamic Stage Headline */}
            <h1 className="font-[var(--font-display)] text-3xl sm:text-5xl lg:text-[3.35rem] font-bold leading-[1.14] tracking-tight text-white drop-shadow-md transition-all duration-300">
              {activeStage.headlinePrimary}{" "}
              <span className="text-gold-gradient inline-block">
                {activeStage.headlineAccent}
              </span>
            </h1>

            {/* Dynamic Stage Description */}
            <p className="max-w-xl text-sm sm:text-base lg:text-lg leading-relaxed text-white/80 transition-all duration-300">
              {activeStage.description}
            </p>

            {/* Dynamic Chemistry & Sensory Pill Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl pt-1">
              <div className="rounded-xl border border-white/12 bg-black/50 p-3 backdrop-blur-md">
                <span className="font-mono text-[10px] uppercase tracking-wider text-gold-light/80 block">
                  Sensory & Aroma Aktif
                </span>
                <p className="mt-0.5 text-xs sm:text-sm font-bold text-white truncate">
                  {activeStage.aromaNotes}
                </p>
              </div>
              <div className="rounded-xl border border-white/12 bg-black/50 p-3 backdrop-blur-md">
                <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-300/80 block">
                  Reaksi Fisika & Kimia
                </span>
                <p className="mt-0.5 text-xs sm:text-sm font-semibold text-white/90 truncate">
                  {activeStage.chemistryNote}
                </p>
              </div>
            </div>

            {/* Primary CTA Buttons (Always Accessible) */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                size="lg"
                variant="gold"
                className="w-full sm:w-auto h-12 text-sm font-bold shadow-xl justify-center"
                asChild
              >
                <Link href="/menu">
                  Eksplor Menu & Pesan <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-12 text-sm font-semibold justify-center border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white backdrop-blur-md"
                asChild
              >
                <a href="#roast-cockpit">
                  Cockpit Kurva & Sains 7 Fase
                </a>
              </Button>
            </div>

            {/* Trust Highlights */}
            <div className="hidden sm:flex flex-wrap gap-x-5 gap-y-2 pt-1 text-xs text-white/70">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" /> Pembayaran Aman
              </span>
              <span className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-gold-light shrink-0" /> 4 Profil Roasting Presisi
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4 text-emerald-400 shrink-0" /> Ambil / Kirim Biteship
              </span>
            </div>
          </div>

          {/* BOTTOM BAR: INTERACTIVE 4-STAGE SCROLL PROGRESS RAIL & SCROLL HINT */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-4 border-t border-white/10 pt-4">
            {/* Clickable 4-Stage Scrollytelling Rail */}
            <div className="flex-1 max-w-3xl">
              <div className="flex items-center justify-between text-[11px] font-mono text-white/60 mb-2">
                <span className="flex items-center gap-1.5">
                  <Wind className="h-3.5 w-3.5 text-gold-light" />
                  <span>SCROLL UNTUK MEMANGGANG BIJI KOPI 3D (ATAU KLIK TAHAP)</span>
                </span>
                <span className="text-gold-light font-bold">
                  {Math.round(uiProgress * 100)}% ROAST PROGRESS
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
                {ROAST_STAGES.map((st) => {
                  const isCurrent = activeStage.id === st.id;
                  const isPassed = uiProgress >= st.scrollRange[1];
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => scrollToStage(st.index)}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border p-2 sm:px-3 sm:py-2 text-left transition-all backdrop-blur-md",
                        isCurrent
                          ? "border-gold bg-gold/20 shadow-lg scale-[1.02]"
                          : isPassed
                          ? "border-emerald-500/40 bg-emerald-950/40 hover:border-gold/50"
                          : "border-white/10 bg-black/45 hover:border-white/30"
                      )}
                    >
                      <div className="flex items-center justify-between gap-1 font-mono text-[10px]">
                        <span
                          className={cn(
                            "font-bold",
                            isCurrent ? "text-gold-light" : "text-white/50"
                          )}
                        >
                          {st.stepCode}
                        </span>
                        <span className="text-[10px] text-white/70 font-semibold">
                          {st.tempLabel}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "mt-0.5 text-[11px] sm:text-xs font-bold truncate",
                          isCurrent ? "text-white" : "text-white/70 group-hover:text-white"
                        )}
                      >
                        {st.shortTitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stats & Scroll Down Prompt */}
            <div className="flex items-center justify-between lg:justify-end gap-6">
              <div className="hidden xl:flex items-center gap-6 border-r border-white/15 pr-6">
                {[
                  ["49", "Menu & Varian"],
                  ["7", "Fase Kimiawi"],
                  ["4.9★", "Kepuasan 500+"],
                ].map(([num, label]) => (
                  <div key={label}>
                    <p className="text-lg font-extrabold text-gold-light leading-none">{num}</p>
                    <p className="text-[11px] text-white/60 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              <a
                href="#roast-cockpit"
                className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-black/60 px-4 py-2 text-xs font-semibold text-gold-light hover:bg-gold/20 transition-colors backdrop-blur-md shrink-0"
              >
                <span>Ke Kurva Telemetri</span>
                <ChevronDown className="h-4 w-4 animate-bounce" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroRoastWebGL;
