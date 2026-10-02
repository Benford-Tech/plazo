import type { Estimate } from "./estimate";
import { areaM2 } from "./estimate";
import type { CapacityStudy } from "./types";

/** GeoJSON (WGS84) of the outline, zones, excluded parts and generated slots of every layout. */
export function studyToGeoJSON(study: CapacityStudy, result: Estimate | null) {
  const features: object[] = [];
  if (study.outline) {
    features.push({
      type: "Feature",
      geometry: study.outline,
      properties: { kind: "outline", name: study.name, areaM2: Math.round(areaM2(study.outline, study.scaleFactor)), parcels: study.parcels.map(p => p.id) },
    });
  }
  for (const zone of study.zones) {
    features.push({ type: "Feature", geometry: zone.geometry, properties: { kind: "zone", id: zone.id, name: zone.name } });
  }
  for (const ex of study.exclusions) {
    features.push({ type: "Feature", geometry: ex.geometry, properties: { kind: "exclusion", id: ex.id, name: ex.name, exclusionKind: ex.kind, clearanceM: ex.clearance } });
  }
  for (const zone of result?.zones ?? []) {
    for (const [layout, estimate] of Object.entries(zone.layouts)) {
      estimate.slots.forEach((ring, index) =>
        features.push({
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [ring] },
          properties: { kind: "slot", layout, zoneId: zone.zoneId, index: index + 1 },
        }),
      );
    }
  }
  return { type: "FeatureCollection", features, properties: { scaleFactor: study.scaleFactor, crs: "EPSG:4326" } };
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data)], { type: "application/geo+json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
