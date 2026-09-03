/* eslint-disable react-hooks/purity -- inisialisasi partikel 3D memakai Math.random() yang disengaja & stabil (useMemo []); tidak memengaruhi kemurnian render UI */
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float, OrbitControls, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Rotate3d } from "lucide-react";
import { ROAST_STAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STAGE_COLORS = [
  "#7a9a4b", // 0: Drying phase (hijau kekuningan)
  "#c4a45a", // 1: Yellowing (kuning)
  "#9c683b", // 2: Maillard & karamelisasi (cokelat harum)
  "#7a4b28", // 3: First crack (retak mengembang)
  "#5c351b", // 4: Development time (matang aromatik)
  "#381e0f", // 5: Second crack (gelap berminyak)
  "#283b30", // 6: Cooling (pendinginan cepat)
];
const STAGE_DURATION = 4200;

/* ---------- geometri biji kopi prosedural (ellipsoid + alur tengah) ---------- */
function createBeanGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 56, 36);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    const z = pos.getZ(i);
    x *= 1.18;
    y *= 0.76;
    const zz = z * 0.58;
    // alur khas biji kopi di sepanjang sumbu x
    const crease = Math.exp(-(zz * zz) / 0.055) * 0.34;
    y -= crease * (1 - Math.abs(x) / 1.5);
    pos.setXYZ(i, x, y, zz);
  }
  geo.computeVertexNormals();
  return geo;
}

function CoffeeBean({ stage }: { stage: number }) {
  const geo = useMemo(() => createBeanGeometry(), []);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const group = useRef<THREE.Group>(null);
  const targetColor = useMemo(() => new THREE.Color(STAGE_COLORS[Math.min(stage, STAGE_COLORS.length - 1)]), [stage]);

  useFrame((_, delta) => {
    if (mat.current) {
      mat.current.color.lerp(targetColor, 0.07);
      // Makin glossy saat ter-roasting (minyak keluar di second crack)
      const targetRoughness = stage >= 5 ? 0.16 : stage >= 3 ? 0.26 : 0.44;
      mat.current.roughness = THREE.MathUtils.lerp(mat.current.roughness, targetRoughness, 0.05);
    }
    if (group.current) {
      group.current.rotation.y += delta * 0.45;
      // Biji retak & mengembang mulai First Crack (tahap 3+)
      const targetScale = stage >= 3 ? 1.14 : 1.0;
      group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, targetScale, 0.06));
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial ref={mat} color="#7a9a4b" roughness={0.44} metalness={0.08} />
      </mesh>
    </group>
  );
}

/* ---------- asap roasting (tahap light & medium roast) ---------- */
function RoastSmoke() {
  const COUNT = 22;
  const ref = useRef<THREE.Points>(null);

  const { positions, speeds, drifts } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    const drifts = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.35;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = 0.2 + Math.random() * 1.0;
      positions[i * 3 + 2] = Math.sin(a) * r;
      speeds[i] = 0.35 + Math.random() * 0.45;
      drifts[i] = (Math.random() - 0.5) * 0.15;
    }
    return { positions, speeds, drifts };
  }, []);

  useFrame((_, delta) => {
    const attr = ref.current?.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (!attr) return;
    for (let i = 0; i < COUNT; i++) {
      let y = attr.getY(i) + speeds[i] * delta;
      let x = attr.getX(i) + drifts[i] * delta;
      if (y > 1.6) {
        y = 0.15;
        x = (Math.random() - 0.5) * 0.3;
      }
      attr.setY(i, y);
      attr.setX(i, x);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#eedac2" size={0.12} sizeAttenuation transparent opacity={0.35} depthWrite={false} />
    </points>
  );
}



/* ---------- scene utama dengan OrbitControls & camera bounds ---------- */
function JourneyScene({ stage, inView, onInteract }: { stage: number; inView: boolean; onInteract: () => void }) {
  return (
    <Canvas
      camera={{ position: [0, 0.35, 4.3], fov: 38 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={inView ? "always" : "demand"}
      shadows
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 3]} intensity={1.7} castShadow />
      <pointLight position={[-3, 2, 2.5]} intensity={0.9} color="#f5d78e" />

      <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.8}>
        <CoffeeBean stage={stage} />
      </Float>

      {/* Asap pembentukan senyawa volatil saat Maillard & Roasting (tahap 2-5) */}
      {stage >= 2 && stage <= 5 && <RoastSmoke />}

      {/* Percikan pelepasan gas First Crack (tahap 3) & Second Crack (tahap 5) */}
      {(stage === 3 || stage === 5) && (
        <Sparkles
          count={48}
          scale={[2.8, 2.0, 1.8]}
          size={3.8}
          speed={0.8}
          color={stage === 3 ? "#f5d78e" : "#e68a35"}
          position={[0, 0.25, 0]}
        />
      )}

      {/* Sirkulasi udara pendinginan cepat (tahap 6) */}
      {stage === 6 && (
        <Sparkles
          count={32}
          scale={[2.4, 2.4, 2.4]}
          size={2.4}
          speed={0.4}
          color="#a8e6cf"
          position={[0, 0.1, 0]}
        />
      )}

      <ContactShadows position={[0, -0.95, 0]} opacity={0.35} scale={7} blur={2.4} far={2.2} color="#0a3d28" />

      {/* OrbitControls: touch damping, no zoom to prevent hijacking page scroll */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        dampingFactor={0.08}
        rotateSpeed={0.7}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.65}
        onStart={onInteract}
      />
    </Canvas>
  );
}

/* ---------- komponen utama dengan overlay teks & kontrol ---------- */
export default function RoastJourney() {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [inView, setInView] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport IntersectionObserver: matikan frameloop dan interval saat di luar layar
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !inView) return;
    const id = setInterval(() => setStage((s) => (s + 1) % ROAST_STAGES.length), STAGE_DURATION);
    return () => clearInterval(id);
  }, [playing, inView]);

  const current = ROAST_STAGES[stage];

  return (
    <div ref={containerRef} className="glossy-card relative overflow-hidden rounded-2xl border border-gold/30">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 metal-green opacity-[0.04]" />

      {/* Hint Badge: Geser untuk memutar */}
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-gold/40 bg-background/85 px-3 py-1 text-xs font-semibold text-gold-deep shadow-sm backdrop-blur-md transition-all duration-500",
          hasInteracted ? "opacity-0 -translate-y-2" : "opacity-100 animate-pulse"
        )}
      >
        <Rotate3d className="h-3.5 w-3.5 text-gold" />
        <span>Geser untuk memutar 3D</span>
      </div>

      <div className="relative h-[340px] w-full sm:h-[400px] touch-pan-y">
        <JourneyScene stage={stage} inView={inView} onInteract={() => setHasInteracted(true)} />
      </div>

      <div className="relative border-t border-border/60 px-5 pb-5 pt-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <p key={current.key + "-label"} className="animate-fade-up text-[11px] font-bold uppercase tracking-[0.2em] text-gold-deep">
            {current.label}
          </p>
          <span className="text-[11px] font-bold text-muted-foreground">•</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-extrabold text-foreground border border-border">
            {current.suhu}
          </span>
          {current.isCritical && (
            <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-extrabold text-rose-700 border border-rose-400/40">
              Titik Kritis
            </span>
          )}
        </div>
        <h3 key={current.key + "-title"} className="animate-fade-up mt-1.5 font-[var(--font-display)] text-xl font-bold text-green-deep">
          {current.title}
        </h3>
        <p key={current.key + "-desc"} className="animate-fade-up mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {current.desc}
        </p>

        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-gold hover:text-gold-deep"
            aria-label={playing ? "Jeda animasi" : "Putar animasi"}
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          {ROAST_STAGES.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setStage(i)}
              aria-label={s.title}
              className={cn(
                "h-2.5 rounded-full transition-all",
                i === stage ? "metal-gold w-7" : "w-2.5 bg-secondary hover:bg-gold/40"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
