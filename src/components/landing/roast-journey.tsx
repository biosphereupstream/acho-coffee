"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { ROAST_STAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STAGE_COLORS = ["#6f8f3a", "#c8a165", "#8b5e3c", "#5b3a21", "#f5efe2"];
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
  const geo = useMemo(createBeanGeometry, []);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const group = useRef<THREE.Group>(null);
  const targetColor = useMemo(() => new THREE.Color(STAGE_COLORS[Math.min(stage, 3)]), [stage]);

  useFrame((_, delta) => {
    if (mat.current) {
      mat.current.color.lerp(targetColor, 0.07);
      // makin gelap & glossy saat ter-roasting
      mat.current.roughness = THREE.MathUtils.lerp(mat.current.roughness, stage >= 2 ? 0.22 : 0.42, 0.05);
    }
    if (group.current) {
      const grinding = stage === 3;
      group.current.rotation.y += delta * (grinding ? 7 : 0.55);
      const targetScale = grinding ? 0.1 : 1;
      group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, targetScale, 0.09));
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial ref={mat} color="#6f8f3a" roughness={0.42} metalness={0.12} />
      </mesh>
    </group>
  );
}

/* ---------- hujan bubuk kopi (tahap grind) ---------- */
function GroundRain() {
  const COUNT = 260;
  const ref = useRef<THREE.Points>(null);

  const { positions, speeds, rest } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    const rest = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.15 + Math.random() * 1.05;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = 0.6 + Math.random() * 2.4;
      positions[i * 3 + 2] = Math.sin(a) * r;
      speeds[i] = 0.8 + Math.random() * 1.4;
      rest[i] = 0.02 + Math.random() * 0.16;
    }
    return { positions, speeds, rest };
  }, []);

  useFrame((_, delta) => {
    const attr = ref.current?.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (!attr) return;
    for (let i = 0; i < COUNT; i++) {
      let y = attr.getY(i) - speeds[i] * delta;
      if (y < rest[i]) y = rest[i];
      attr.setY(i, y);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#5b3a21" size={0.055} sizeAttenuation />
    </points>
  );
}

/* ---------- cangkir + uap (tahap brew) ---------- */
function Cup() {
  const cupGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.001, 0),
      new THREE.Vector2(0.4, 0.002),
      new THREE.Vector2(0.47, 0.035),
      new THREE.Vector2(0.5, 0.44),
      new THREE.Vector2(0.5, 0.5),
      new THREE.Vector2(0.455, 0.52),
      new THREE.Vector2(0.44, 0.53),
    ];
    return new THREE.LatheGeometry(pts, 56);
  }, []);

  const steamRef = useRef<THREE.Points>(null);
  const STEAM = 26;

  const steamData = useMemo(() => {
    const positions = new Float32Array(STEAM * 3);
    const speeds = new Float32Array(STEAM);
    for (let i = 0; i < STEAM; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.3;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = 0.62 + Math.random() * 0.8;
      positions[i * 3 + 2] = Math.sin(a) * r;
      speeds[i] = 0.25 + Math.random() * 0.5;
    }
    return { positions, speeds };
  }, []);

  useFrame((_, delta) => {
    const attr = steamRef.current?.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (!attr) return;
    for (let i = 0; i < STEAM; i++) {
      let y = attr.getY(i) + steamData.speeds[i] * delta;
      if (y > 1.5) y = 0.6;
      attr.setY(i, y);
    }
    attr.needsUpdate = true;
  });

  return (
    <group position={[0, -0.42, 0]} scale={1.06}>
      {/* cangkir */}
      <mesh geometry={cupGeo} castShadow>
        <meshStandardMaterial color="#f6f1e6" roughness={0.18} metalness={0.05} />
      </mesh>
      {/* permukaan kopi */}
      <mesh position={[0, 0.49, 0]}>
        <cylinderGeometry args={[0.465, 0.465, 0.03, 56]} />
        <meshStandardMaterial color="#3e2415" roughness={0.25} />
      </mesh>
      {/* tatakan */}
      <mesh position={[0, -0.035, 0]}>
        <cylinderGeometry args={[0.72, 0.62, 0.05, 56]} />
        <meshStandardMaterial color="#f6f1e6" roughness={0.2} />
      </mesh>
      {/* gagang */}
      <mesh position={[0.72, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.24, 0.055, 12, 28, Math.PI]} />
        <meshStandardMaterial color="#f6f1e6" roughness={0.18} />
      </mesh>
      {/* uap */}
      <points ref={steamRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[steamData.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#ffffff" size={0.11} sizeAttenuation transparent opacity={0.4} depthWrite={false} />
      </points>
    </group>
  );
}

/* ---------- scene utama ---------- */
function JourneyScene({ stage }: { stage: number }) {
  return (
    <Canvas camera={{ position: [0, 0.35, 4.3], fov: 38 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }} shadows>
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 3]} intensity={1.7} castShadow />
      <pointLight position={[-3, 2, 2.5]} intensity={0.9} color="#f5d78e" />

      {stage < 4 && (
        <Float speed={1.6} rotationIntensity={0.35} floatIntensity={0.9}>
          <CoffeeBean stage={stage} />
        </Float>
      )}

      {(stage === 1 || stage === 2) && (
        <Sparkles count={42} scale={[2.6, 1.8, 1.6]} size={3.5} speed={0.4} color="#f0d678" position={[0, 0.25, 0]} />
      )}

      {stage === 3 && <GroundRain />}
      {stage === 4 && <Cup />}

      <ContactShadows position={[0, -0.95, 0]} opacity={0.35} scale={7} blur={2.4} far={2.2} color="#0a3d28" />
    </Canvas>
  );
}

/* ---------- komponen utama dengan overlay teks & kontrol ---------- */
export default function RoastJourney() {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setStage((s) => (s + 1) % ROAST_STAGES.length), STAGE_DURATION);
    return () => clearInterval(id);
  }, [playing]);

  const current = ROAST_STAGES[stage];

  return (
    <div className="glossy-card relative overflow-hidden rounded-2xl border border-gold/30">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 metal-green opacity-[0.04]" />

      <div className="relative h-[340px] w-full sm:h-[400px]">
        <JourneyScene stage={stage} />
      </div>

      <div className="relative border-t border-border/60 px-5 pb-5 pt-4 text-center">
        <p key={current.key + "-label"} className="animate-fade-up text-[11px] font-bold uppercase tracking-[0.2em] text-gold-deep">
          {current.label}
        </p>
        <h3 key={current.key + "-title"} className="animate-fade-up mt-1 font-[var(--font-display)] text-xl font-bold text-green-deep">
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
