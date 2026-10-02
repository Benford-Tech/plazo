"use client";

import dynamic from "next/dynamic";
import { fr } from "@/lib/fr";

// The map's code (MapLibre, a few hundred kB) is fetched only when the traveller shows the map.
const ResultsMap = dynamic(() => import("./ResultsMap"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-tint text-soft">{fr.map.loading}</div>,
});

export function ResultsMapPanel(props: React.ComponentProps<typeof ResultsMap>) {
  return <ResultsMap {...props} />;
}
