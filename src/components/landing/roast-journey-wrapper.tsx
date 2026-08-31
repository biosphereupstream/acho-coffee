"use client";

import dynamic from "next/dynamic";

const RoastJourney = dynamic(() => import("@/components/landing/roast-journey"), {
  ssr: false,
  loading: () => <div className="h-[420px] w-full shimmer rounded-2xl" />,
});

export default function RoastJourneyWrapper() {
  return <RoastJourney />;
}
