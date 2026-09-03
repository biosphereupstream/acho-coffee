"use client";

import dynamic from "next/dynamic";

const RoastGraphSimulation = dynamic(
  () => import("@/components/landing/roast-graph-simulation"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[480px] w-full shimmer rounded-3xl border border-white/10 bg-[#0c1f17]/60" />
    ),
  }
);

export default function RoastJourneyWrapper() {
  return <RoastGraphSimulation />;
}
