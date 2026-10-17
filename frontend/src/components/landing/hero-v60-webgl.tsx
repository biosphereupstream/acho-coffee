"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  ChevronDown,
  Clock,
  Coffee,
  Droplets,
  Flame,
  Scale,
  Sparkles,
  Thermometer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ================= 7 CHAPTERS V60 SCROLLYTELLING DATA =================
interface V60ChapterInfo {
  index: number;
  code: string;
  shortTitle: string;
  badgeText: string;
  headlinePrimary: string;
  headlineAccent: string;
  description: string;
  doseGrams: string;
  waterMl: string;
  tempC: string;
  timerText: string;
  sensoryNote: string;
  baristaTip: string;
}

const V60_CHAPTERS: V60ChapterInfo[] = [
  {
    index: 0,
    code: "01",
    shortTitle: "Biji Kopi",
    badgeText: "CHAPTER 01 • SINGLE ORIGIN SELECTION (15.0g)",
    headlinePrimary: "Dimulai dari 60 Biji Pilihan,",
    headlineAccent: "Disangrai Segar Sesuai Pesananmu",
    description:
      "Biji kopi Arabika pilihan dengan alur tengah presisi ditimbang tepat 15 gram. Setiap biji menyimpan ratusan senyawa aromatik yang siap dibuka melalui ritual seduh V60.",
    doseGrams: "15.0g",
    waterMl: "0 ml",
    tempC: "26°C",
    timerText: "00:00",
    sensoryNote: "Floral Jasmine, Sweet Berry, Cocoa Nibs",
    baristaTip: "Rasio emas V60: 1:16 (15g kopi untuk 240ml air seduhan).",
  },
  {
    index: 1,
    code: "02",
    shortTitle: "Hand Grinder",
    badgeText: "CHAPTER 02 • MANUAL CONICAL BURR GRINDING",
    headlinePrimary: "Gilingan Manual Presisi,",
    headlineAccent: "Menjaga Aroma Volatil Tetap Utuh",
    description:
      "Crank handle berputar menggerakkan conical burr baja. Biji kopi terpecah seragam menjadi butiran medium-fine (600µm) dan jatuh memenuhi catch cup kaca bening.",
    doseGrams: "15.0g",
    waterMl: "0 ml",
    tempC: "28°C",
    timerText: "00:00",
    sensoryNote: "Freshly Ground Caramel, Citrus Zest & Spice",
    baristaTip: "Kecepatan putar stabil mencegah panas gesekan berlebih pada bubuk kopi.",
  },
  {
    index: 2,
    code: "03",
    shortTitle: "V60 & Dosing",
    badgeText: "CHAPTER 03 • PAPER RINSE & COFFEE BED DOSING",
    headlinePrimary: "Kerucut Spiral 60° &",
    headlineAccent: "Hamparan Bubuk Kopi Merata",
    description:
      "Kertas filter kerucut terpasang rapat di atas rusuk spiral V60 Dripper. Bubuk kopi segar dituang dari catch cup membentuk permukaan bed kopi yang rata di atas Glass Server.",
    doseGrams: "15.0g",
    waterMl: "0 ml",
    tempC: "93°C",
    timerText: "00:00",
    sensoryNote: "Sweet Malt, Brown Sugar, Dry Fragrance Peak",
    baristaTip: "Permukaan bed yang rata menjamin ekstraksi air yang seragam di setiap titik.",
  },
  {
    index: 3,
    code: "04",
    shortTitle: "The Bloom",
    badgeText: "CHAPTER 04 • PRE-INFUSION & CO₂ BLOOMING (00:00 – 00:45)",
    headlinePrimary: "Tuangan Pertama 45 ml:",
    headlineAccent: "Mekar Sempurna Melepas Gas CO₂",
    description:
      "Gooseneck kettle mengalirkan air bersuhu 93°C secara lembut. Bed kopi mengembang naik membentuk kubah keemasan seiring pelepasan gas CO₂ tanda kesegaran sangrai.",
    doseGrams: "15.0g",
    waterMl: "45 ml",
    tempC: "93°C",
    timerText: "00:35",
    sensoryNote: "Honeyed Bloom, Bergamot Vapor, Sweet Acidity",
    baristaTip: "Biarkan kopi mekar selama 35–45 detik agar air menembus pori-pori seluler.",
  },
  {
    index: 4,
    code: "05",
    shortTitle: "Spiral Pour",
    badgeText: "CHAPTER 05 • SPIRAL POUR & ACTIVE EXTRACTION (00:45 – 02:00)",
    headlinePrimary: "Aliran Spiral Leher Angsa,",
    headlineAccent: "Melarutkan Manis & Karakter Buah",
    description:
      "Spout melengkung mengalirkan air tipis dengan gerakan melingkar konstan dari tengah ke tepi. Rusuk spiral V60 menjaga sirkulasi udara saat tetesan kopi mulai mengalir ke carafe.",
    doseGrams: "15.0g",
    waterMl: "185 ml",
    tempC: "92°C",
    timerText: "01:40",
    sensoryNote: "Juicy Peach, Red Cherry, Silky Caramel Body",
    baristaTip: "Aliran spiral stabil menjaga tinggi permukaan air (slurry) tetap konstan.",
  },
  {
    index: 5,
    code: "06",
    shortTitle: "Drawdown",
    badgeText: "CHAPTER 06 • DRAWDOWN & CARAFE SWIRL (02:00 – 02:45)",
    headlinePrimary: "Ekstraksi Tuntas Menuju",
    headlineAccent: "240 ml Seduhan Ruby-Amber",
    description:
      "Air di dalam V60 surut perlahan meninggalkan ampas kopi yang rata. Di bawahnya, Glass Server Carafe terisi penuh oleh seduhan kopi berwarna ruby-amber yang jernih dan berkilau.",
    doseGrams: "15.0g",
    waterMl: "240 ml",
    tempC: "84°C",
    timerText: "02:35",
    sensoryNote: "Clean Finish, Cane Sugar, Floral Aftertaste",
    baristaTip: "Flat coffee bed di akhir drawdown menandakan ekstraksi yang seimbang tanpa channeling.",
  },
  {
    index: 6,
    code: "07",
    shortTitle: "Siap Disajikan",
    badgeText: "CHAPTER 07 • ARTISANAL SERVE IN CERAMIC CUP",
    headlinePrimary: "Siap Disajikan Hangat —",
    headlineAccent: "Rasakan Kesegaran 72 Jam di Rumahmu",
    description:
      "Glass Server menuangkan hasil seduhan V60 ke dalam cangkir keramik hangat dengan kepulan uap aromatik. Pesan biji kopi sangrai segar atau minuman favoritmu hari ini.",
    doseGrams: "15.0g",
    waterMl: "240 ml",
    tempC: "65°C",
    timerText: "02:45",
    sensoryNote: "Balanced Sweetness, Bright Acidity, Velvety Clean Cup",
    baristaTip: "Suhu 60–65°C adalah titik terbaik bagi lidah untuk mengecap seluruh spektrum rasa.",
  },
];

// ================= SHARED TIMELINE STATE SCRUBBED BY GSAP =================
interface V60TimelineState {
  totalProgress: number;
  activeChapter: number;
  // Per-chapter progress (0 -> 1)
  ch1Beans: number;
  ch2Grind: number;
  ch3Dose: number;
  ch4Bloom: number;
  ch5Pour: number;
  ch6Drawdown: number;
  ch7Serve: number;
  // Camera keyframe state interpolated by GSAP
  camX: number;
  camY: number;
  camZ: number;
  lookX: number;
  lookY: number;
  lookZ: number;
}

function createInitialTimelineState(): V60TimelineState {
  return {
    totalProgress: 0,
    activeChapter: 0,
    ch1Beans: 0,
    ch2Grind: 0,
    ch3Dose: 0,
    ch4Bloom: 0,
    ch5Pour: 0,
    ch6Drawdown: 0,
    ch7Serve: 0,
    camX: -1.65,
    camY: 1.55,
    camZ: 3.35,
    lookX: -1.65,
    lookY: 0.35,
    lookZ: 0.1,
  };
}

// ================= PROCEDURAL GEOMETRIES & SHADERS =================
// 1. Ellipsoid Coffee Bean dengan alur tengah (center crease)
function createBeanEllipsoidGeometry(detail = 26, scale = 0.085): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(scale, detail, detail);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i) / scale;
    let y = pos.getY(i) / scale;
    let z = pos.getZ(i) / scale;

    y *= 1.38;
    x *= 0.92;
    z *= z > 0 ? 0.62 : 0.85;

    // Alur belahan tengah berbentuk S halus
    const sOffset = Math.sin(y * 1.4) * 0.07;
    const dx = Math.abs(x - sOffset);
    const yMask = Math.max(0, 1 - Math.pow(y / 1.28, 4));
    if (z > -0.1 && dx < 0.26) {
      const u = dx / 0.26;
      z -= Math.pow(1 - u * u, 2) * 0.42 * yMask;
    }

    pos.setXYZ(i, x * scale, y * scale, z * scale);
  }

  geo.computeVertexNormals();
  return geo;
}

// 2. Shader Material untuk Aliran Air & Kopi (Scroll + Time Driven)
const WATER_STREAM_VERTEX_SHADER = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uFlowSpeed;
  void main() {
    vUv = uv;
    vec3 p = position;
    float wave = sin(uv.y * 28.0 - uTime * uFlowSpeed) * 0.004 * sin(uv.y * 3.14159);
    p.x += wave;
    p.z += cos(uv.y * 24.0 - uTime * uFlowSpeed) * 0.004 * sin(uv.y * 3.14159);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const WATER_STREAM_FRAGMENT_SHADER = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uProgress;
  uniform vec3 uColorTop;
  uniform vec3 uColorBottom;
  uniform float uOpacity;
  void main() {
    if (vUv.y > uProgress) discard;
    float streak = 0.78 + 0.22 * sin(vUv.y * 42.0 - uTime * 16.0 + vUv.x * 6.28);
    vec3 col = mix(uColorTop, uColorBottom, vUv.y) * streak;
    float edgeFade = smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(max(0.0, uProgress - 0.12), uProgress, vUv.y));
    gl_Position;
    gl_FragColor = vec4(col, uOpacity * edgeFade);
  }
`;

// ================= THREE.JS 3D V60 BREWING SCENE =================
interface V60SceneProps {
  tlStateRef: React.MutableRefObject<V60TimelineState>;
}

function V60BrewingScene({ tlStateRef }: V60SceneProps) {
  const { camera, size, pointer } = useThree();

  // Refs untuk seluruh aktor 3D
  const beansMeshRef = useRef<THREE.InstancedMesh>(null);
  const groundsMeshRef = useRef<THREE.InstancedMesh>(null);

  const grinderGroupRef = useRef<THREE.Group>(null);
  const crankGroupRef = useRef<THREE.Group>(null);
  const burrMeshRef = useRef<THREE.Mesh>(null);
  const catchCupGroupRef = useRef<THREE.Group>(null);
  const catchCupGroundsRef = useRef<THREE.Mesh>(null);

  const v60GroupRef = useRef<THREE.Group>(null);
  const filterPaperRef = useRef<THREE.Mesh>(null);
  const coffeeBedRef = useRef<THREE.Mesh>(null);
  const slurrySurfaceRef = useRef<THREE.Mesh>(null);
  const bloomFoamRingRef = useRef<THREE.Mesh>(null);

  const kettleGroupRef = useRef<THREE.Group>(null);
  const kettleSteamRef = useRef<THREE.Points>(null);
  const waterStreamMeshRef = useRef<THREE.Mesh>(null);
  const waterShaderMatRef = useRef<THREE.ShaderMaterial>(null);

  const serverGroupRef = useRef<THREE.Group>(null);
  const serverLiquidRef = useRef<THREE.Mesh>(null);
  const dripDropsRef = useRef<THREE.InstancedMesh>(null);

  const cupGroupRef = useRef<THREE.Group>(null);
  const cupLiquidRef = useRef<THREE.Mesh>(null);
  const cupSteamRef = useRef<THREE.Points>(null);
  const serveStreamMeshRef = useRef<THREE.Mesh>(null);
  const serveShaderMatRef = useRef<THREE.ShaderMaterial>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 1. Geometri & Warna Variasi 60 Biji Kopi (InstancedMesh)
  const beanGeo = useMemo(() => createBeanEllipsoidGeometry(24, 0.082), []);
  const beanData = useMemo(() => {
    const count = 60;
    const palette = [
      new THREE.Color("#8a4b24"),
      new THREE.Color("#733a18"),
      new THREE.Color("#5c2b0e"),
      new THREE.Color("#471f08"),
      new THREE.Color("#9c582c"),
    ];
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 6;
      const radius = 0.14 + (i % 7) * 0.065;
      const startY = 0.85 + (i / count) * 1.45;
      const rotSpeed = 0.8 + (i % 5) * 0.35;
      const color = palette[i % palette.length];
      return { angle, radius, startY, rotSpeed, color, phase: i * 1.3 };
    });
  }, []);

  useEffect(() => {
    if (!beansMeshRef.current) return;
    beanData.forEach((b, i) => {
      beansMeshRef.current!.setColorAt(i, b.color);
    });
    if (beansMeshRef.current.instanceColor) {
      beansMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [beanData]);

  // 2. Data 180 Partikel Bubuk Kopi (Grounds InstancedMesh)
  const groundParticleGeo = useMemo(() => new THREE.DodecahedronGeometry(0.018, 0), []);
  const groundsData = useMemo(() => {
    const count = 180;
    return Array.from({ length: count }, (_, i) => ({
      seed: (i * 1.6180339) % 1,
      angle: (i / count) * Math.PI * 12,
      radius: 0.03 + ((i * 7) % 19) * 0.012,
      speed: 0.65 + (i % 7) * 0.15,
    }));
  }, []);

  // 3. Geometri 12 Spiral Ridges di dalam V60 Dripper
  const v60SpiralRibs = useMemo(() => {
    const ribs: THREE.BufferGeometry[] = [];
    const ribCount = 12;
    for (let r = 0; r < ribCount; r++) {
      const baseAngle = (r / ribCount) * Math.PI * 2;
      const pts: THREE.Vector3[] = [];
      for (let step = 0; step <= 20; step++) {
        const u = step / 20; // 0 (bawah) -> 1 (atas)
        const y = -0.38 + u * 0.78;
        const radius = 0.14 + u * 0.49;
        const theta = baseAngle + u * Math.PI * 0.85;
        pts.push(
          new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius)
        );
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      ribs.push(new THREE.TubeGeometry(curve, 24, 0.012, 6, false));
    }
    return ribs;
  }, []);

  // 4. Geometri Gooseneck Spout Melengkung (TubeGeometry) & Handle Kettle
  const gooseneckSpoutGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.32, -0.25, 0),
      new THREE.Vector3(-0.62, -0.22, 0),
      new THREE.Vector3(-0.78, 0.06, 0),
      new THREE.Vector3(-0.92, 0.34, 0),
      new THREE.Vector3(-1.12, 0.36, 0),
    ]);
    return new THREE.TubeGeometry(curve, 40, 0.034, 12, false);
  }, []);

  // 5. Geometri Aliran Air dari Spout ke V60 (TubeGeometry)
  const waterStreamGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.18, 0),
      new THREE.Vector3(0.02, 0.82, 0.02),
      new THREE.Vector3(0.03, 0.45, 0.01),
      new THREE.Vector3(0, 0.08, 0),
    ]);
    return new THREE.TubeGeometry(curve, 36, 0.024, 12, false);
  }, []);

  // 6. Geometri Aliran Kopi saat disajikan dari Server ke Cangkir (Chapter 7)
  const serveStreamGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.12, -0.35, 0.15),
      new THREE.Vector3(1.32, -0.62, 0.18),
      new THREE.Vector3(1.48, -0.95, 0.2),
      new THREE.Vector3(1.55, -1.28, 0.2),
    ]);
    return new THREE.TubeGeometry(curve, 32, 0.026, 12, false);
  }, []);

  // 7. Partikel Uap Tipis (Spout Kettle & Cangkir Keramik)
  const steamGeo = useMemo(() => {
    const count = 48;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.14;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = Math.random() * 0.75;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  const waterShaderUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFlowSpeed: { value: 18.0 },
      uProgress: { value: 0 },
      uColorTop: { value: new THREE.Color("#e0f2fe") },
      uColorBottom: { value: new THREE.Color("#fbbf24") },
      uOpacity: { value: 0.85 },
    }),
    []
  );

  const serveShaderUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFlowSpeed: { value: 15.0 },
      uProgress: { value: 0 },
      uColorTop: { value: new THREE.Color("#9a3412") },
      uColorBottom: { value: new THREE.Color("#451a03") },
      uOpacity: { value: 0.92 },
    }),
    []
  );

  // ================= MASTER FRAME UPDATE LOOP =================
  useFrame((state, delta) => {
    const tl = tlStateRef.current;
    const t = state.clock.getElapsedTime();
    const isPortraitMobile = size.width < 768;

    // 1. Kamera Sinematik dari GSAP Keyframes + Penyesuaian Otomatis Smartphone + Parallax Halus
    const mobileZPullback = isPortraitMobile ? 1.55 : 0;
    const mobileYShift = isPortraitMobile ? -0.32 : 0;
    const targetCamX = tl.camX + pointer.x * 0.14;
    const targetCamY = tl.camY + pointer.y * 0.1;
    const targetCamZ = tl.camZ + mobileZPullback;

    camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), Math.min(1, delta * 8));
    camera.lookAt(tl.lookX, tl.lookY + mobileYShift, tl.lookZ);

    // 2. Update 60 Biji Kopi (Chapter 1 & 2)
    if (beansMeshRef.current) {
      const p1 = tl.ch1Beans;
      const p2 = tl.ch2Grind;

      for (let i = 0; i < beanData.length; i++) {
        const b = beanData[i];
        // Saat Chapter 1: biji turun dari udara masuk ke hopper grinder di (-1.65, 0.35, 0.1)
        const fallRatio = Math.min(1, Math.max(0, p1 * 1.35 - (i / beanData.length) * 0.45));
        const grindConsume = Math.min(1, Math.max(0, p2 * 1.2 - (i / beanData.length) * 0.3));

        const swirlAngle = b.angle + t * 0.6 + fallRatio * Math.PI * 2 + p2 * Math.PI * 6;
        const currentRadius = THREE.MathUtils.lerp(
          b.radius * 2.8,
          b.radius * 0.62 * (1 - grindConsume * 0.6),
          fallRatio
        );

        const bx = -1.65 + Math.cos(swirlAngle) * currentRadius;
        const bz = 0.1 + Math.sin(swirlAngle) * currentRadius;
        const by =
          THREE.MathUtils.lerp(b.startY + 0.9, 0.38, fallRatio) -
          grindConsume * 0.58 +
          Math.sin(t * 2 + b.phase) * 0.02 * (1 - fallRatio);

        // Kecilkan biji saat habis tergiling di akhir Chapter 2
        const beanScale = Math.max(0.001, 1 - Math.max(0, (grindConsume - 0.72) * 3.6));

        dummy.position.set(bx, by, bz);
        dummy.rotation.set(
          t * b.rotSpeed + b.phase,
          swirlAngle,
          b.phase + p2 * 8
        );
        dummy.scale.setScalar(beanScale);
        dummy.updateMatrix();
        beansMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      beansMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 3. Update Manual Hand Grinder, Crank Handle, Burr & Catch Cup (Chapter 2 & 3)
    if (crankGroupRef.current && burrMeshRef.current) {
      const grindSpin = tl.ch2Grind * Math.PI * 18 + (tl.activeChapter === 1 ? t * 2.2 : 0);
      crankGroupRef.current.rotation.y = grindSpin;
      burrMeshRef.current.rotation.y = -grindSpin * 1.5;
    }

    if (grinderGroupRef.current) {
      // Getaran mikro realistis saat menggiling di Chapter 2
      const grindShake = tl.ch2Grind > 0.02 && tl.ch2Grind < 0.98 ? Math.sin(t * 42) * 0.008 : 0;
      grinderGroupRef.current.position.x = -1.65 + grindShake;
    }

    // Catch Cup mengisi bubuk di Ch 2, lalu bergerak & menuang ke atas V60 di Ch 3
    if (catchCupGroupRef.current && catchCupGroundsRef.current) {
      const p2 = tl.ch2Grind;
      const p3 = tl.ch3Dose;

      // Tinggi bubuk di dalam catch cup: naik saat Ch 2, turun saat dituang di Ch 3
      const cupFill = Math.max(0.01, p2 * (1 - Math.min(1, p3 * 1.35)));
      catchCupGroundsRef.current.scale.set(1, cupFill, 1);
      catchCupGroundsRef.current.position.y = -0.32 + cupFill * 0.24;
      catchCupGroundsRef.current.visible = p2 > 0.02 && p3 < 0.85;

      if (p3 <= 0.01) {
        catchCupGroupRef.current.position.set(-1.65, -1.25, 0.1);
        catchCupGroupRef.current.rotation.set(0, 0, 0);
      } else if (p3 < 0.78) {
        // Bergerak melengkung ke atas V60 (0, 1.25, 0) dan miring menuang
        const u = Math.min(1, p3 / 0.55);
        const smoothU = u * u * (3 - 2 * u);
        catchCupGroupRef.current.position.set(
          THREE.MathUtils.lerp(-1.65, -0.38, smoothU),
          THREE.MathUtils.lerp(-1.25, 1.28, Math.sin(smoothU * Math.PI * 0.65)),
          THREE.MathUtils.lerp(0.1, 0, smoothU)
        );
        const tilt = p3 > 0.25 ? Math.min(1, (p3 - 0.25) / 0.35) * -1.95 : 0;
        catchCupGroupRef.current.rotation.set(0, 0, tilt);
      } else {
        // Kembali ke bawah grinder
        const uBack = Math.min(1, (p3 - 0.78) / 0.22);
        catchCupGroupRef.current.position.set(
          THREE.MathUtils.lerp(-0.38, -1.65, uBack),
          THREE.MathUtils.lerp(1.28, -1.25, uBack),
          THREE.MathUtils.lerp(0, 0.1, uBack)
        );
        catchCupGroupRef.current.rotation.set(0, 0, THREE.MathUtils.lerp(-1.95, 0, uBack));
      }
    }

    // 4. Update 180 Partikel Bubuk Kopi Jatuh (Ch 2 di Grinder & Ch 3 saat Dosing ke V60)
    if (groundsMeshRef.current) {
      const p2 = tl.ch2Grind;
      const p3 = tl.ch3Dose;
      const isGrinding = p2 > 0.03 && p2 < 0.98 && p3 < 0.05;
      const isDosingV60 = p3 > 0.22 && p3 < 0.76;

      for (let i = 0; i < groundsData.length; i++) {
        const g = groundsData[i];
        if (isGrinding) {
          const cycle = (t * g.speed * 2.2 + g.seed) % 1;
          const gx = -1.65 + Math.cos(g.angle + t * 3) * g.radius;
          const gz = 0.1 + Math.sin(g.angle + t * 3) * g.radius;
          const gy = THREE.MathUtils.lerp(-0.62, -1.42, cycle);
          dummy.position.set(gx, gy, gz);
          dummy.scale.setScalar(1);
        } else if (isDosingV60) {
          const cycle = (t * g.speed * 2.6 + g.seed) % 1;
          const spread = cycle * 0.16;
          const gx = THREE.MathUtils.lerp(-0.18, 0, cycle) + Math.cos(g.angle) * spread;
          const gz = Math.sin(g.angle) * spread;
          const gy = THREE.MathUtils.lerp(1.12, 0.18, cycle);
          dummy.position.set(gx, gy, gz);
          dummy.scale.setScalar(1.15);
        } else {
          dummy.position.set(0, -10, 0);
          dummy.scale.setScalar(0.0001);
        }
        dummy.rotation.set(t * 3, g.angle, 0);
        dummy.updateMatrix();
        groundsMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      groundsMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 5. Update Filter Paper, Coffee Bed, Blooming & Slurry di V60 Dripper (Ch 3 -> Ch 7)
    if (filterPaperRef.current) {
      const paperDrop = tl.totalProgress < 0.24 ? Math.min(1, Math.max(0, (tl.totalProgress - 0.18) / 0.08)) : 1;
      filterPaperRef.current.position.y = THREE.MathUtils.lerp(0.65, 0.04, paperDrop);
    }

    if (coffeeBedRef.current) {
      const doseLevel = Math.min(1, Math.max(0, (tl.ch3Dose - 0.25) / 0.5));
      // Saat Ch 4 (The Bloom), bed kopi mengembang ke atas (CO2 blooming dome)
      const bloomSwell = Math.sin(tl.ch4Bloom * Math.PI) * 0.42 + (tl.ch4Bloom > 0.5 ? 0.15 : 0);
      const drawdownSettle = tl.ch6Drawdown * 0.12;

      const bedScaleXZ = Math.max(0.001, doseLevel * (1 + bloomSwell * 0.14));
      const bedScaleY = Math.max(0.001, doseLevel * (1 + bloomSwell * 0.85 - drawdownSettle));

      coffeeBedRef.current.visible = doseLevel > 0.01;
      coffeeBedRef.current.scale.set(bedScaleXZ, bedScaleY, bedScaleXZ);
      coffeeBedRef.current.position.y = -0.22 + doseLevel * 0.16 + bloomSwell * 0.06 - drawdownSettle * 0.04;
    }

    // Permukaan Air & Krema (Slurry) di dalam V60 Dripper (Ch 4, 5, 6)
    if (slurrySurfaceRef.current && bloomFoamRingRef.current) {
      const p4 = tl.ch4Bloom;
      const p5 = tl.ch5Pour;
      const p6 = tl.ch6Drawdown;

      const slurryLevel =
        p6 > 0.01
          ? Math.max(0, 1 - p6 * 1.05)
          : p5 > 0.01
          ? 0.45 + p5 * 0.55
          : p4 * 0.45;

      const isSlurryVisible = slurryLevel > 0.02 && tl.ch7Serve < 0.1;
      slurrySurfaceRef.current.visible = isSlurryVisible;
      bloomFoamRingRef.current.visible = isSlurryVisible;

      const yPos = -0.14 + slurryLevel * 0.36;
      const radiusScale = 0.48 + slurryLevel * 0.48;

      slurrySurfaceRef.current.position.y = yPos;
      slurrySurfaceRef.current.scale.set(radiusScale, 1, radiusScale);
      slurrySurfaceRef.current.rotation.y = t * 1.4;

      bloomFoamRingRef.current.position.y = yPos + 0.008;
      bloomFoamRingRef.current.scale.set(radiusScale * 0.92, 1, radiusScale * 0.92);
      bloomFoamRingRef.current.rotation.z = -t * 1.8;
    }

    // 6. Update Gooseneck Kettle, Spiral Motion, Steam & Water Stream Shader (Ch 4 & 5)
    const pourIntensity =
      tl.ch4Bloom > 0.08 && tl.ch4Bloom < 0.92
        ? Math.min(1, (tl.ch4Bloom - 0.08) * 4)
        : tl.ch5Pour > 0.04 && tl.ch5Pour < 0.95
        ? 1
        : 0;

    const spiralAngle = (tl.ch4Bloom * 2 + tl.ch5Pour * 6) * Math.PI * 2 + t * 2.2;
    const spiralRadius = tl.ch5Pour > 0.01 ? 0.11 : 0.04;
    const pourOffsetX = Math.cos(spiralAngle) * spiralRadius;
    const pourOffsetZ = Math.sin(spiralAngle) * spiralRadius;

    if (kettleGroupRef.current) {
      const kettleActive = tl.ch4Bloom > 0.01 && tl.ch6Drawdown < 0.35;
      const enterProgress =
        tl.ch6Drawdown > 0.01
          ? Math.max(0, 1 - tl.ch6Drawdown * 3)
          : Math.min(1, tl.ch4Bloom * 3.2);

      // Posisi ujung spout ketel berada di sekitar (0, 1.18, 0) saat menuang
      kettleGroupRef.current.position.set(
        THREE.MathUtils.lerp(2.2, 1.12 + pourOffsetX, enterProgress),
        THREE.MathUtils.lerp(1.65, 0.86, enterProgress),
        THREE.MathUtils.lerp(-0.4, pourOffsetZ, enterProgress)
      );
      kettleGroupRef.current.rotation.z = THREE.MathUtils.lerp(0, 0.36, enterProgress * (0.6 + pourIntensity * 0.4));
      kettleGroupRef.current.visible = kettleActive || tl.totalProgress < 0.85;
    }

    if (waterStreamMeshRef.current && waterShaderMatRef.current) {
      waterStreamMeshRef.current.visible = pourIntensity > 0.02;
      waterStreamMeshRef.current.position.set(pourOffsetX, 0, pourOffsetZ);
      waterShaderMatRef.current.uniforms.uTime.value = t;
      waterShaderMatRef.current.uniforms.uProgress.value = pourIntensity;
    }

    // Update Partikel Uap Tipis dari Spout Kettle & Cangkir
    const animateSteamPoints = (pts: THREE.Points | null, speed: number) => {
      if (!pts) return;
      const attr = pts.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < attr.count; i++) {
        let sx = attr.getX(i);
        let sy = attr.getY(i);
        const sz = attr.getZ(i);
        sy += delta * speed * (0.5 + (i % 5) * 0.12);
        sx += Math.sin(t * 2 + i) * 0.0015;
        if (sy > 0.75) sy = 0;
        attr.setXYZ(i, sx, sy, sz);
      }
      attr.needsUpdate = true;
    };
    animateSteamPoints(kettleSteamRef.current, 0.38);
    animateSteamPoints(cupSteamRef.current, 0.32);

    // 7. Update Tetesan Ekstraksi & Level Cairan di Glass Server Carafe (Ch 4, 5, 6, 7)
    if (dripDropsRef.current) {
      const isDripping = (tl.ch4Bloom > 0.35 || tl.ch5Pour > 0.01 || tl.ch6Drawdown > 0.01) && tl.ch6Drawdown < 0.92;
      for (let i = 0; i < 14; i++) {
        if (isDripping) {
          const dropCycle = (t * 2.8 + i * 0.21) % 1;
          const dy = THREE.MathUtils.lerp(-0.02, -1.35, dropCycle);
          dummy.position.set(pourOffsetX * 0.25, dy, pourOffsetZ * 0.25);
          dummy.scale.set(0.7, 1.5, 0.7);
        } else {
          dummy.position.set(0, -10, 0);
          dummy.scale.setScalar(0.001);
        }
        dummy.updateMatrix();
        dripDropsRef.current.setMatrixAt(i, dummy.matrix);
      }
      dripDropsRef.current.instanceMatrix.needsUpdate = true;
    }

    // Kenaikan Level Cairan Kopi di Glass Server Carafe
    const brewLiquidProgress = Math.min(
      1,
      tl.ch4Bloom * 0.16 + tl.ch5Pour * 0.56 + tl.ch6Drawdown * 0.28
    );

    if (serverLiquidRef.current) {
      // Saat disajikan ke cangkir di Ch 7, level di server berkurang sedikit
      const remainingServer = Math.max(0.02, brewLiquidProgress - tl.ch7Serve * 0.35);
      serverLiquidRef.current.visible = remainingServer > 0.025;
      serverLiquidRef.current.scale.set(
        0.88 + remainingServer * 0.12,
        Math.max(0.05, remainingServer),
        0.88 + remainingServer * 0.12
      );
      serverLiquidRef.current.position.y = -0.44 + remainingServer * 0.32;
    }

    // 8. Chapter 7: V60 Dripper Terangkat, Glass Server Menuang ke Cangkir Keramik
    const p7 = tl.ch7Serve;
    if (v60GroupRef.current) {
      const liftOut = Math.min(1, p7 * 2.4);
      v60GroupRef.current.position.set(
        THREE.MathUtils.lerp(0, -0.85, liftOut),
        THREE.MathUtils.lerp(0.32, 1.85, liftOut),
        0
      );
    }

    if (serverGroupRef.current) {
      const pourArc = p7 > 0.15 && p7 < 0.88 ? Math.sin(((p7 - 0.15) / 0.73) * Math.PI) : 0;
      serverGroupRef.current.position.set(
        THREE.MathUtils.lerp(0, 0.68, pourArc),
        THREE.MathUtils.lerp(-0.92, -0.22, pourArc),
        THREE.MathUtils.lerp(0, 0.15, pourArc)
      );
      serverGroupRef.current.rotation.z = THREE.MathUtils.lerp(0, -0.78, pourArc);
    }

    if (serveStreamMeshRef.current && serveShaderMatRef.current) {
      const isServing = p7 > 0.24 && p7 < 0.82;
      serveStreamMeshRef.current.visible = isServing;
      serveShaderMatRef.current.uniforms.uTime.value = t;
      serveShaderMatRef.current.uniforms.uProgress.value = isServing
        ? Math.sin(((p7 - 0.24) / 0.58) * Math.PI)
        : 0;
    }

    if (cupLiquidRef.current && cupSteamRef.current) {
      const cupFill = Math.min(1, Math.max(0, (p7 - 0.25) / 0.55));
      cupLiquidRef.current.visible = cupFill > 0.02;
      cupLiquidRef.current.scale.set(1, Math.max(0.05, cupFill), 1);
      cupLiquidRef.current.position.y = -0.18 + cupFill * 0.2;
      cupSteamRef.current.visible = cupFill > 0.35;
    }
  });

  return (
    <>
      {/* ================= ARTISAN COFFEE BAR STUDIO LIGHTING ================= */}
      <ambientLight intensity={0.75} color="#fff5eb" />
      <directionalLight position={[4, 6, 4]} intensity={2.6} color="#ffedd5" />
      <directionalLight position={[-4.5, 3, -2]} intensity={1.3} color="#fed7aa" />
      <pointLight position={[0, 1.5, 1.8]} intensity={2.2} distance={8} color="#f59e0b" />
      <pointLight position={[1.55, -0.4, 1.2]} intensity={1.6} distance={5} color="#fb923c" />

      {/* ================= MEJA BAR KAYU WALNUT & TIMBANGAN DIGITAL ================= */}
      <group position={[0, -1.72, 0]}>
        {/* Permukaan Meja Kayu Walnut */}
        <mesh position={[0, -0.12, 0]} receiveShadow>
          <cylinderGeometry args={[4.2, 4.4, 0.22, 64]} />
          <meshStandardMaterial color="#231209" roughness={0.62} metalness={0.08} />
        </mesh>
        {/* Cincin Brass di tepi meja */}
        <mesh position={[0, -0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[4.18, 0.015, 12, 96]} />
          <meshStandardMaterial color="#d97706" roughness={0.3} metalness={0.85} />
        </mesh>

        {/* Digital Barista Scale di bawah V60 Server */}
        <group position={[0, 0.06, 0]}>
          <mesh>
            <boxGeometry args={[1.38, 0.12, 1.48]} />
            <meshStandardMaterial color="#141413" roughness={0.35} metalness={0.5} />
          </mesh>
          {/* Rubber Weighing Pad */}
          <mesh position={[0, 0.068, -0.04]}>
            <cylinderGeometry args={[0.56, 0.58, 0.02, 40]} />
            <meshStandardMaterial color="#1f2421" roughness={0.85} />
          </mesh>
          {/* Glowing LED Display Strip */}
          <mesh position={[0, 0.065, 0.62]}>
            <boxGeometry args={[0.82, 0.015, 0.14]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#f59e0b"
              emissiveIntensity={1.2}
            />
          </mesh>
        </group>
      </group>

      {/* ================= 1. 60 BIJI KOPI (INSTANCED MESH) ================= */}
      <instancedMesh ref={beansMeshRef} args={[beanGeo, undefined, beanData.length]}>
        <meshStandardMaterial roughness={0.42} metalness={0.08} />
      </instancedMesh>

      {/* ================= 2. MANUAL HAND GRINDER ================= */}
      <group ref={grinderGroupRef} position={[-1.65, -0.25, 0.1]}>
        {/* Upper Brushed Steel Cylinder Body */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 1.15, 40]} />
          <meshStandardMaterial color="#b8c0c8" roughness={0.28} metalness={0.88} />
        </mesh>

        {/* Warm Walnut Wood Grip Band */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.395, 0.395, 0.56, 40]} />
          <meshStandardMaterial color="#5c2d12" roughness={0.55} metalness={0.1} />
        </mesh>

        {/* Copper Trim Rings */}
        <mesh position={[0, 0.31, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.03, 40]} />
          <meshStandardMaterial color="#d97706" roughness={0.25} metalness={0.9} />
        </mesh>
        <mesh position={[0, -0.27, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.03, 40]} />
          <meshStandardMaterial color="#d97706" roughness={0.25} metalness={0.9} />
        </mesh>

        {/* Open Top Hopper Rim */}
        <mesh position={[0, 0.58, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.37, 0.025, 16, 48]} />
          <meshStandardMaterial color="#d97706" roughness={0.25} metalness={0.9} />
        </mesh>

        {/* Internal Conical Burr di dasar ruang giling */}
        <mesh ref={burrMeshRef} position={[0, -0.52, 0]}>
          <coneGeometry args={[0.26, 0.24, 18]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.25} metalness={0.92} />
        </mesh>

        {/* Hinged Crank Handle & Wooden Knob */}
        <group ref={crankGroupRef} position={[0, 0.62, 0]}>
          {/* Center Axle Cap */}
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.08, 24]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.9} />
          </mesh>
          {/* Crank Arm */}
          <mesh position={[0.34, 0.09, 0]} rotation={[0, 0, 0.12]}>
            <boxGeometry args={[0.68, 0.03, 0.06]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.22} metalness={0.9} />
          </mesh>
          {/* Hinge Joint */}
          <mesh position={[0.66, 0.13, 0]}>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial color="#d97706" roughness={0.25} metalness={0.9} />
          </mesh>
          {/* Wooden Knob Handle */}
          <mesh position={[0.66, 0.28, 0]}>
            <cylinderGeometry args={[0.085, 0.055, 0.24, 24]} />
            <meshStandardMaterial color="#4a220b" roughness={0.5} metalness={0.1} />
          </mesh>
        </group>
      </group>

      {/* Transparent Catch Cup Bening (bisa terlepas untuk menuang ke V60 di Chapter 3) */}
      <group ref={catchCupGroupRef} position={[-1.65, -1.25, 0.1]}>
        <mesh>
          <cylinderGeometry args={[0.37, 0.34, 0.72, 40]} />
          <meshPhysicalMaterial
            color="#f8fafc"
            transparent
            opacity={0.34}
            roughness={0.12}
            metalness={0.05}
            transmission={0.65}
          />
        </mesh>
        {/* Rim Logam Catch Cup */}
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.04, 40]} />
          <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.85} />
        </mesh>
        {/* Tumpukan Bubuk Kopi di dalam Catch Cup */}
        <mesh ref={catchCupGroundsRef} position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.33, 0.31, 0.52, 32]} />
          <meshStandardMaterial color="#4e260e" roughness={0.92} />
        </mesh>
      </group>

      {/* ================= 5. PARTIKEL BUBUK KOPI JATUH ================= */}
      <instancedMesh ref={groundsMeshRef} args={[groundParticleGeo, undefined, groundsData.length]}>
        <meshStandardMaterial color="#592b11" roughness={0.9} />
      </instancedMesh>

      {/* ================= 3. V60 DRIPPER, FILTER PAPER & COFFEE BED ================= */}
      <group ref={v60GroupRef} position={[0, 0.32, 0]}>
        {/* Kerucut V60 Keramik Putih / Copper Accent */}
        <mesh>
          <cylinderGeometry args={[0.66, 0.16, 0.84, 48, 1, true]} />
          <meshStandardMaterial
            color="#f8f5f0"
            roughness={0.24}
            metalness={0.06}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Rim Atas Copper V60 */}
        <mesh position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.66, 0.022, 16, 64]} />
          <meshStandardMaterial color="#d97706" roughness={0.25} metalness={0.88} />
        </mesh>

        {/* 12 Internal Spiral Ridges khas V60 */}
        {v60SpiralRibs.map((ribGeo, idx) => (
          <mesh key={idx} geometry={ribGeo}>
            <meshStandardMaterial color="#e7e0d6" roughness={0.3} metalness={0.15} />
          </mesh>
        ))}

        {/* Cincin Dudukan Dasar V60 (Copper Base Plate) */}
        <mesh position={[0, -0.42, 0]}>
          <cylinderGeometry args={[0.52, 0.52, 0.045, 48]} />
          <meshStandardMaterial color="#b45309" roughness={0.28} metalness={0.88} />
        </mesh>

        {/* Gagang Samping V60 */}
        <mesh position={[0.56, 0.04, 0]} rotation={[0, 0, -0.35]}>
          <torusGeometry args={[0.22, 0.032, 12, 32, Math.PI * 1.1]} />
          <meshStandardMaterial color="#b45309" roughness={0.28} metalness={0.88} />
        </mesh>

        {/* Conical Filter Paper (Kertas Saring Kerucut) */}
        <mesh ref={filterPaperRef} position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.63, 0.08, 0.86, 48, 1, true]} />
          <meshStandardMaterial
            color="#fdfaf3"
            roughness={0.82}
            side={THREE.DoubleSide}
            transparent
            opacity={0.94}
          />
        </mesh>

        {/* Coffee Bed di dalam V60 (Mengembang saat Blooming Ch 4) */}
        <mesh ref={coffeeBedRef} position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.38, 0.09, 0.36, 36]} />
          <meshStandardMaterial color="#4a220b" roughness={0.88} />
        </mesh>

        {/* Permukaan Air & Slurry Krema di dalam V60 (Ch 4, 5, 6) */}
        <mesh ref={slurrySurfaceRef} position={[0, 0.1, 0]} visible={false}>
          <cylinderGeometry args={[0.56, 0.42, 0.04, 40]} />
          <meshStandardMaterial
            color="#92400e"
            emissive="#451a03"
            emissiveIntensity={0.45}
            roughness={0.18}
            transparent
            opacity={0.88}
          />
        </mesh>

        {/* Cincin Busa Crema Blooming */}
        <mesh
          ref={bloomFoamRingRef}
          position={[0, 0.12, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          visible={false}
        >
          <torusGeometry args={[0.32, 0.055, 12, 48]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.55} transparent opacity={0.75} />
        </mesh>
      </group>

      {/* ================= GLASS SERVER CARAFE & RISING LIQUID ================= */}
      <group ref={serverGroupRef} position={[0, -0.92, 0]}>
        {/* Badan Kaca Server Bening */}
        <mesh>
          <cylinderGeometry args={[0.42, 0.62, 1.15, 48, 1, true]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transparent
            opacity={0.28}
            roughness={0.08}
            metalness={0.05}
            transmission={0.78}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Leher & Rim Atas Server */}
        <mesh position={[0, 0.58, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42, 0.02, 14, 48]} />
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.55} roughness={0.1} />
        </mesh>
        {/* Sabuk Pengukur Takaran Server (Copper Band) */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.51, 0.52, 0.04, 48, 1, true]} />
          <meshStandardMaterial
            color="#d97706"
            roughness={0.25}
            metalness={0.88}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Gagang Server Kaca/Hitam */}
        <mesh position={[-0.58, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.28, 0.038, 12, 32, Math.PI]} />
          <meshStandardMaterial color="#1c1917" roughness={0.4} metalness={0.3} />
        </mesh>

        {/* Level Cairan Kopi Ruby-Amber di dalam Server (Naik sesuai Scroll Progress) */}
        <mesh ref={serverLiquidRef} position={[0, -0.25, 0]} visible={false}>
          <cylinderGeometry args={[0.44, 0.58, 0.92, 40]} />
          <meshStandardMaterial
            color="#6b1d07"
            emissive="#3b0a02"
            emissiveIntensity={0.65}
            roughness={0.15}
            metalness={0.1}
            transparent
            opacity={0.92}
          />
        </mesh>
      </group>

      {/* Tetesan Ekstraksi Kopi dari V60 ke dalam Server */}
      <instancedMesh ref={dripDropsRef} args={[undefined, undefined, 14]}>
        <sphereGeometry args={[0.022, 10, 10]} />
        <meshStandardMaterial
          color="#9a3412"
          emissive="#7c2d12"
          emissiveIntensity={0.6}
          roughness={0.1}
        />
      </instancedMesh>

      {/* ================= 4. GOOSENECK KETTLE & SHADER WATER STREAM ================= */}
      <group ref={kettleGroupRef} position={[1.15, 0.88, 0]}>
        {/* Badan Ketel Matte Black */}
        <mesh>
          <cylinderGeometry args={[0.36, 0.48, 0.92, 40]} />
          <meshStandardMaterial color="#18181b" roughness={0.42} metalness={0.65} />
        </mesh>
        {/* Aksen Cincin Emas di Dasar Ketel */}
        <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.485, 0.485, 0.035, 40]} />
          <meshStandardMaterial color="#eab308" roughness={0.25} metalness={0.9} />
        </mesh>
        {/* Tutup Ketel & Knob */}
        <mesh position={[0, 0.47, 0]}>
          <cylinderGeometry args={[0.34, 0.36, 0.04, 36]} />
          <meshStandardMaterial color="#27272a" roughness={0.35} metalness={0.75} />
        </mesh>
        <mesh position={[0, 0.54, 0]}>
          <cylinderGeometry args={[0.08, 0.06, 0.1, 24]} />
          <meshStandardMaterial color="#d97706" roughness={0.25} metalness={0.9} />
        </mesh>
        {/* Gagang Penyeimbang Kayu Walnut */}
        <mesh position={[0.56, 0.05, 0]} rotation={[0, 0, -0.25]}>
          <boxGeometry args={[0.32, 0.06, 0.06]} />
          <meshStandardMaterial color="#d97706" roughness={0.3} metalness={0.85} />
        </mesh>
        <mesh position={[0.68, 0.02, 0]} rotation={[0, 0, 0.18]}>
          <cylinderGeometry args={[0.048, 0.055, 0.56, 20]} />
          <meshStandardMaterial color="#4a220b" roughness={0.55} />
        </mesh>

        {/* Spout Melengkung Leher Angsa (TubeGeometry) */}
        <mesh geometry={gooseneckSpoutGeo}>
          <meshStandardMaterial color="#18181b" roughness={0.35} metalness={0.75} />
        </mesh>

        {/* Uap Tipis dari Ujung Spout */}
        <points ref={kettleSteamRef} geometry={steamGeo} position={[-1.12, 0.38, 0]}>
          <pointsMaterial
            size={0.042}
            color="#e2e8f0"
            transparent
            opacity={0.38}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>

      {/* Aliran Air dari Spout Kettle ke V60 (TubeGeometry + Custom Shader) */}
      <mesh ref={waterStreamMeshRef} geometry={waterStreamGeo} visible={false}>
        <shaderMaterial
          ref={waterShaderMatRef}
          vertexShader={WATER_STREAM_VERTEX_SHADER}
          fragmentShader={WATER_STREAM_FRAGMENT_SHADER}
          uniforms={waterShaderUniforms}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* ================= CANGKIR KERAMIK & PENYAJIAN (CHAPTER 7) ================= */}
      <group ref={cupGroupRef} position={[1.55, -1.32, 0.2]}>
        {/* Tatakan Cangkir (Ceramic Saucer) */}
        <mesh position={[0, -0.24, 0]}>
          <cylinderGeometry args={[0.52, 0.36, 0.06, 40]} />
          <meshStandardMaterial color="#f5f0e6" roughness={0.32} metalness={0.05} />
        </mesh>

        {/* Badan Cangkir Keramik */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.34, 0.25, 0.48, 40, 1, true]} />
          <meshStandardMaterial
            color="#f8f5f0"
            roughness={0.28}
            metalness={0.06}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Dasar Cangkir */}
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.04, 36]} />
          <meshStandardMaterial color="#e7e0d6" roughness={0.35} />
        </mesh>
        {/* Bibir Cangkir Aksen Copper */}
        <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.34, 0.015, 12, 48]} />
          <meshStandardMaterial color="#d97706" roughness={0.25} metalness={0.85} />
        </mesh>
        {/* Telinga Cangkir */}
        <mesh position={[0.36, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.13, 0.028, 12, 28, Math.PI]} />
          <meshStandardMaterial color="#f8f5f0" roughness={0.3} />
        </mesh>

        {/* Cairan Kopi di dalam Cangkir (Naik di Chapter 7) */}
        <mesh ref={cupLiquidRef} position={[0, -0.1, 0]} visible={false}>
          <cylinderGeometry args={[0.31, 0.24, 0.38, 36]} />
          <meshStandardMaterial
            color="#5c1906"
            emissive="#3b0a02"
            emissiveIntensity={0.55}
            roughness={0.14}
          />
        </mesh>

        {/* Uap Hangat di atas Cangkir saat disajikan */}
        <points ref={cupSteamRef} geometry={steamGeo} position={[0, 0.22, 0]} visible={false}>
          <pointsMaterial
            size={0.048}
            color="#fde68a"
            transparent
            opacity={0.42}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>

      {/* Aliran Kopi saat Server menuang ke Cangkir di Chapter 7 */}
      <mesh ref={serveStreamMeshRef} geometry={serveStreamGeo} visible={false}>
        <shaderMaterial
          ref={serveShaderMatRef}
          vertexShader={WATER_STREAM_VERTEX_SHADER}
          fragmentShader={WATER_STREAM_FRAGMENT_SHADER}
          uniforms={serveShaderUniforms}
          transparent
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

// ================= MAIN 700VH GSAP SCROLLTRIGGER V60 HERO COMPONENT =================
interface HeroV60WebGLProps {
  announcementText?: string | null;
}

export function HeroV60WebGL({ announcementText }: HeroV60WebGLProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tlStateRef = useRef<V60TimelineState>(createInitialTimelineState());
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);
  const [scrollPct, setScrollPct] = useState<number>(0);

  // Master GSAP Timeline di-scrub oleh ScrollTrigger sepanjang ±700vh (7 Chapter)
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const el = containerRef.current;
    if (!el) return;

    const s = tlStateRef.current;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.7,
          onUpdate: (self) => {
            s.totalProgress = self.progress;
            const chIdx = Math.min(6, Math.floor(self.progress * 7));
            s.activeChapter = chIdx;
            setActiveChapterIdx(chIdx);
            setScrollPct(Math.round(self.progress * 100));
          },
        },
      });

      // CHAPTER 1 (0 -> 1): 60 Biji Kopi melayang & jatuh ke Hopper Hand Grinder
      tl.to(
        s,
        {
          ch1Beans: 1,
          camX: -1.65,
          camY: 1.05,
          camZ: 2.95,
          lookX: -1.65,
          lookY: 0.25,
          lookZ: 0.1,
          duration: 1,
          ease: "power2.inOut",
        },
        0
      );

      // CHAPTER 2 (1 -> 2): Manual Hand Grinding (Crank berputar, Burr menggiling, Catch Cup terisi)
      tl.to(
        s,
        {
          ch2Grind: 1,
          camX: -1.55,
          camY: -0.25,
          camZ: 2.75,
          lookX: -1.65,
          lookY: -0.45,
          lookZ: 0.1,
          duration: 1,
          ease: "power2.inOut",
        },
        1
      );

      // CHAPTER 3 (2 -> 3): V60 Filter Paper & Dosing Bubuk Kopi dari Catch Cup ke V60
      tl.to(
        s,
        {
          ch3Dose: 1,
          camX: -0.25,
          camY: 1.05,
          camZ: 2.85,
          lookX: 0,
          lookY: 0.35,
          lookZ: 0,
          duration: 1,
          ease: "power2.inOut",
        },
        2
      );

      // CHAPTER 4 (3 -> 4): The Bloom (Gooseneck Kettle menuang 45ml 93°C, Coffee Bed mengembang)
      tl.to(
        s,
        {
          ch4Bloom: 1,
          camX: 0.25,
          camY: 1.25,
          camZ: 2.85,
          lookX: 0.15,
          lookY: 0.45,
          lookZ: 0,
          duration: 1,
          ease: "power2.inOut",
        },
        3
      );

      // CHAPTER 5 (4 -> 5): Spiral Pour & Active Extraction (Aliran air melingkar & permukaan slurry)
      tl.to(
        s,
        {
          ch5Pour: 1,
          camX: 0.45,
          camY: 0.85,
          camZ: 2.95,
          lookX: 0.1,
          lookY: 0.2,
          lookZ: 0,
          duration: 1,
          ease: "power2.inOut",
        },
        4
      );

      // CHAPTER 6 (5 -> 6): Drawdown & Rising Liquid di Glass Server Carafe
      tl.to(
        s,
        {
          ch6Drawdown: 1,
          camX: 0.1,
          camY: -0.35,
          camZ: 2.95,
          lookX: 0,
          lookY: -0.65,
          lookZ: 0,
          duration: 1,
          ease: "power2.inOut",
        },
        5
      );

      // CHAPTER 7 (6 -> 7): Penyajian dari Glass Server ke Cangkir Keramik Hangat
      tl.to(
        s,
        {
          ch7Serve: 1,
          camX: 1.05,
          camY: -0.45,
          camZ: 2.95,
          lookX: 1.15,
          lookY: -1.05,
          lookZ: 0.15,
          duration: 1,
          ease: "power2.inOut",
        },
        6
      );
    }, el);

    return () => ctx.revert();
  }, []);

  const currentChapter = V60_CHAPTERS[activeChapterIdx] || V60_CHAPTERS[0];

  // Klik tombol chapter untuk loncat ke chapter tertentu di sepanjang 700vh
  const jumpToChapter = useCallback((idx: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const topAbs = window.scrollY + rect.top;
    const scrollable = Math.max(1, rect.height - window.innerHeight);
    const ratio = idx === 0 ? 0.02 : idx === 6 ? 0.96 : (idx + 0.5) / 7;
    window.scrollTo({
      top: topAbs + ratio * scrollable,
      behavior: "smooth",
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-[700vh] w-full bg-[#0c0705] text-white select-none"
    >
      {/* ================= STICKY FULL-VIEWPORT 3D V60 STAGE ================= */}
      <div className="sticky top-14 sm:top-16 h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] w-full overflow-hidden">
        {/* Warm Copper & Espresso Studio Ambient Glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 62% 42%, rgba(217,119,6,0.18) 0%, transparent 70%), radial-gradient(45% 45% at 20% 25%, rgba(120,53,15,0.22) 0%, transparent 65%)",
          }}
        />

        {/* ================= THREE.JS WEBGL CANVAS ================= */}
        <div className="absolute inset-0 z-0">
          <Canvas
            dpr={[1, 2]}
            camera={{ position: [-1.65, 1.55, 3.35], fov: 42 }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          >
            <V60BrewingScene tlStateRef={tlStateRef} />
          </Canvas>
        </div>

        {/* Mobile Portrait Vignette: Tengah-atas terang untuk Panggung 3D V60, bawah gelap untuk HUD */}
        <div
          className="pointer-events-none absolute inset-0 z-10 lg:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(12,7,5,0.78) 0%, rgba(12,7,5,0.06) 14%, rgba(12,7,5,0.06) 46%, rgba(12,7,5,0.88) 62%, rgba(12,7,5,0.98) 100%)",
          }}
        />

        {/* Desktop Widescreen Vignette */}
        <div
          className="pointer-events-none absolute inset-0 z-10 hidden lg:block"
          style={{
            background:
              "linear-gradient(90deg, rgba(12,7,5,0.92) 0%, rgba(12,7,5,0.68) 42%, rgba(12,7,5,0.12) 72%, rgba(12,7,5,0.45) 100%), linear-gradient(180deg, rgba(12,7,5,0.45) 0%, transparent 20%, transparent 78%, rgba(12,7,5,0.95) 100%)",
          }}
        />

        {/* ================= FOREGROUND HUD & SCROLLYTELLING OVERLAY ================= */}
        <div className="relative z-20 mx-auto flex h-full max-w-7xl flex-col justify-between px-3.5 pt-2.5 pb-[68px] sm:px-6 sm:py-6 md:pb-6 lg:py-9">
          {/* TOP BAR: BRAND BADGES & LIVE BARISTA SCALE METRICS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Badge variant="gold" className="px-2.5 py-0.5 text-[10px] sm:text-xs font-bold shadow-md">
                ☕ V60 Pour-Over Ritual 3D
              </Badge>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-950/70 px-2.5 py-0.5 font-mono text-[10px] sm:text-[11px] font-semibold text-amber-200 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                Chapter {currentChapter.code}/07 • {scrollPct}%
              </span>
              {announcementText && (
                <div className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-gold/20 border border-gold/45 px-3 py-0.5 text-xs text-gold-light font-semibold backdrop-blur-md">
                  <Sparkles className="h-3 w-3 text-gold-light shrink-0" />
                  <span className="truncate max-w-xs">{announcementText}</span>
                </div>
              )}
            </div>

            {/* Live Digital Barista Scale Readout (Mobile & Desktop) */}
            <div className="inline-flex self-start sm:self-auto items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-amber-500/30 bg-black/65 px-2.5 py-1 sm:px-4 sm:py-1.5 font-mono text-[10px] sm:text-xs backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-1 text-amber-300">
                <Scale className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400" />
                <span className="font-bold">{currentChapter.doseGrams}</span>
              </div>
              <div className="h-3 w-px bg-white/15" />
              <div className="flex items-center gap-1 text-cyan-300">
                <Droplets className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="font-bold">{currentChapter.waterMl}</span>
              </div>
              <div className="h-3 w-px bg-white/15" />
              <div className="flex items-center gap-1 text-rose-300">
                <Thermometer className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>{currentChapter.tempC}</span>
              </div>
              <div className="h-3 w-px bg-white/15" />
              <div className="flex items-center gap-1 text-white/85">
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gold-light" />
                <span className="font-bold">{currentChapter.timerText}</span>
              </div>
            </div>
          </div>

          {/* JENDELA PANGGUNG 3D DI LAYAR MOBILE */}
          <div className="flex-1 min-h-[24vh] sm:min-h-[18vh] lg:hidden pointer-events-none" />

          {/* STORYTELLING COLUMN */}
          <div className="lg:my-auto max-w-xl lg:max-w-xl space-y-2.5 sm:space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl border border-amber-500/40 bg-black/65 px-2.5 py-1 sm:px-3.5 sm:py-1.5 backdrop-blur-md">
              <Coffee className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400 shrink-0" />
              <span className="font-mono text-[9.5px] sm:text-xs font-bold tracking-wider text-amber-200 uppercase truncate">
                {currentChapter.badgeText}
              </span>
            </div>

            <h1 className="font-[var(--font-display)] text-2xl sm:text-4xl lg:text-[3.1rem] font-bold leading-[1.14] tracking-tight text-white drop-shadow-md">
              {currentChapter.headlinePrimary}{" "}
              <span className="text-gold-gradient inline-block">
                {currentChapter.headlineAccent}
              </span>
            </h1>

            <p className="max-w-lg text-xs sm:text-base leading-relaxed text-white/80 line-clamp-2 sm:line-clamp-3 lg:line-clamp-none">
              {currentChapter.description}
            </p>

            {/* Sensory & Barista Tip Cards */}
            <div className="grid grid-cols-2 gap-2 max-w-lg">
              <div className="rounded-xl border border-white/12 bg-black/55 p-2 sm:p-2.5 backdrop-blur-md min-w-0">
                <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-amber-300/85 block truncate">
                  Sensory Notes
                </span>
                <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-white truncate">
                  {currentChapter.sensoryNote}
                </p>
              </div>
              <div className="rounded-xl border border-white/12 bg-black/55 p-2 sm:p-2.5 backdrop-blur-md min-w-0">
                <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-emerald-300/85 block truncate">
                  Barista Guide
                </span>
                <p className="mt-0.5 text-[11px] sm:text-xs font-semibold text-white/90 truncate">
                  {currentChapter.baristaTip}
                </p>
              </div>
            </div>

            {/* Primary CTA Buttons */}
            <div className="pt-1 grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                size="lg"
                variant="gold"
                className="w-full sm:w-auto h-10 sm:h-12 px-3 sm:px-6 text-xs sm:text-sm font-bold shadow-xl justify-center"
                asChild
              >
                <Link href="/menu">
                  <span>Pesan Kopi V60</span>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-10 sm:h-12 px-3 sm:px-5 text-xs sm:text-sm font-semibold justify-center border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white backdrop-blur-md"
                asChild
              >
                <a href="#katalog">
                  Lihat Katalog Rasa
                </a>
              </Button>
            </div>
          </div>

          {/* BOTTOM BAR: 7-CHAPTER TIMELINE SCRUBBER RAIL */}
          <div className="mt-2 sm:mt-4 flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-2.5 border-t border-white/10 pt-2 sm:pt-3">
            <div className="flex-1 max-w-4xl min-w-0">
              <div className="flex items-center justify-between text-[9.5px] sm:text-[11px] font-mono text-white/65 mb-1.5">
                <span className="flex items-center gap-1 truncate">
                  <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">SCROLL UNTUK MENYEDUH V60 (ATAU KLIK CHAPTER 01–07)</span>
                </span>
                <span className="text-amber-300 font-bold shrink-0 ml-2">
                  {scrollPct}% BREW TIMELINE
                </span>
              </div>

              {/* 7 Chapter Pills (Swipeable di Smartphone, 7 Kolom di Desktop) */}
              <div className="flex sm:grid sm:grid-cols-7 gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {V60_CHAPTERS.map((ch) => {
                  const isCurrent = activeChapterIdx === ch.index;
                  const isDone = activeChapterIdx > ch.index;
                  return (
                    <button
                      key={ch.code}
                      type="button"
                      onClick={() => jumpToChapter(ch.index)}
                      className={cn(
                        "shrink-0 w-[102px] sm:w-auto rounded-lg sm:rounded-xl border px-2 py-1.5 text-left transition-all backdrop-blur-md",
                        isCurrent
                          ? "border-amber-400 bg-amber-500/25 shadow-md"
                          : isDone
                          ? "border-amber-600/40 bg-amber-950/40 hover:border-amber-400/60"
                          : "border-white/12 bg-black/50 hover:border-white/30"
                      )}
                    >
                      <div className="flex items-center justify-between gap-1 font-mono text-[9px]">
                        <span className={cn("font-bold", isCurrent ? "text-amber-300" : "text-white/50")}>
                          {ch.code}
                        </span>
                        <span className="text-white/70">{ch.waterMl}</span>
                      </div>
                      <p
                        className={cn(
                          "mt-0.5 text-[10px] sm:text-[11px] font-bold truncate",
                          isCurrent ? "text-white" : "text-white/70"
                        )}
                      >
                        {ch.shortTitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <a
              href="#proses"
              className="hidden lg:inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-black/60 px-4 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 transition-colors backdrop-blur-md shrink-0"
            >
              <span>Skip Animasi</span>
              <ChevronDown className="h-4 w-4 animate-bounce" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroV60WebGL;
