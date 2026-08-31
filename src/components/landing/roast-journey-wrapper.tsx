"use client";

import { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";

const RoastJourney = dynamic(() => import("@/components/landing/roast-journey"), {
  ssr: false,
  loading: () => <div className="h-[420px] w-full shimmer rounded-2xl" />,
});

/** Fallback elegan bila WebGL tidak tersedia / scene 3D gagal dimuat. */
class JourneyBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="metal-green-strong flex h-[420px] w-full items-center justify-center rounded-2xl">
          <div className="text-center text-white/85">
            <div className="text-5xl">🫘</div>
            <p className="mt-3 text-sm">Animasi 3D tidak didukung perangkat ini — kopinya tetap enak! ☕</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function RoastJourneyWrapper() {
  return (
    <JourneyBoundary>
      <RoastJourney />
    </JourneyBoundary>
  );
}
