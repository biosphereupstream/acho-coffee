"use client"

import dynamic from "next/dynamic"

const HeroV60WebGL = dynamic(
  () => import("@/components/landing/hero-v60-webgl").then((mod) => mod.HeroV60WebGL),
  {
    ssr: false,
    loading: () => (
      <div className="relative h-screen w-full bg-[#0c0705] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.14)_0%,transparent_65%)]" />
        <div className="relative z-10 flex flex-col items-center gap-3 text-center px-6">
          <div className="h-10 w-10 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
          <p className="text-[11px] uppercase tracking-[0.28em] text-amber-400 font-semibold">
            Warming Up V60 Brew Studio…
          </p>
          <p className="text-xs text-stone-400 max-w-xs">
            Preparing 3D Hario V60, Conical Burr Grinder & Gooseneck Kettle
          </p>
        </div>
      </div>
    ),
  }
)

interface HeroV60WebGLWrapperProps {
  announcementText?: string | null
}

export function HeroV60WebGLWrapper({ announcementText }: HeroV60WebGLWrapperProps) {
  return <HeroV60WebGL announcementText={announcementText} />
}

export default HeroV60WebGLWrapper
