"use client";

import dynamic from "next/dynamic";
import { fr } from "@/lib/fr";

// The map's code (MapLibre, a few hundred kB) is fetched only when the traveller shows the map.
const ResultsMap = dynamic(() => import("./ResultsMap"), {
  ssr: false,
  // On a paper pill: warm grey on the map ground itself would be under 4.5:1.
  loading: () => (
    <div className="flex h-full items-center justify-center bg-map">
      <span className="pill-float font-semibold">{fr.map.loading}</span>
    </div>
  ),
});

export function ResultsMapPanel(props: React.ComponentProps<typeof ResultsMap>) {
  return <ResultsMap {...props} />;
}
