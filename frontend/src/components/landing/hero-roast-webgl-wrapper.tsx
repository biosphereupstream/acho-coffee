"use client";

import dynamic from "next/dynamic";

const HeroRoastWebGL = dynamic(
  () => import("@/components/landing/hero-roast-webgl"),
  {
    ssr: false,
    loading: () => (
      <div className="relative flex h-screen w-full items-center justify-center bg-[#05120d] text-white overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 50% at 70% 50%, rgba(201,162,39,0.16) 0%, transparent 65%), radial-gradient(45% 45% at 20% 25%, rgba(16,185,129,0.12) 0%, transparent 65%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6">
          <div className="max-w-xl space-y-4">
            <div className="h-6 w-52 rounded-full bg-gold/20 animate-pulse" />
            <div className="h-14 w-full rounded-2xl bg-white/10 animate-pulse" />
            <div className="h-14 w-4/5 rounded-2xl bg-white/10 animate-pulse" />
            <div className="h-20 w-full rounded-2xl bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>
    ),
  }
);

interface HeroRoastWebGLWrapperProps {
  announcementText?: string | null;
}

export default function HeroRoastWebGLWrapper({
  announcementText,
}: HeroRoastWebGLWrapperProps) {
  return <HeroRoastWebGL announcementText={announcementText} />;
}
