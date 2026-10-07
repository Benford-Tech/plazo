import { adminApi } from "@/lib/api";
import {
  autoZones,
  estimate,
  unionPolygons,
  withIgnBuildings,
} from "@/lib/capacity/estimate";
import { boundsOf, polygonsOf } from "@/lib/capacity/mapData";
import { estimateFrame } from "@/lib/capacity/studyFrame";
import {
  settingsOf,
  type CapacityStudy,
  type GeoPolygon,
  type LayoutKey,
  type ParcelRef,
  type Zone,
  type ZoneSuggestion,
} from "@/lib/capacity/types";
import { fr } from "@/lib/fr";
import { spotsFromLayout, type NumberedSpot } from "@/lib/plan/numbering";
import type { PlanPatch } from "@/lib/plan/types";

export type AutoStep = "parcel" | "buildings" | "zones" | "spots";
export type AutoProgress = {
  step: AutoStep;
  state: "running" | "done" | "skipped";
  note?: string;
};

/** Zones proposed by Claude when the key is set; else the land minus its buildings. */
export type SuggestFn = (options: {
  allowGrass: boolean;
}) => Promise<ZoneSuggestion>;

export interface AutoSetupDeps {
  position: [number, number];
  study: CapacityStudy;
  layout: LayoutKey;
  newId: () => string;
  /** Saves a patch at once (the zone proposal reads the saved outline). */
  save: (patch: PlanPatch) => Promise<boolean>;
  suggest: SuggestFn;
  onProgress: (p: AutoProgress) => void;
  /** Let the banner paint before a long synchronous estimate. */
  yieldToUi?: () => Promise<void>;
}

export interface AutoSetupResult {
  outline: GeoPolygon;
  parcels: ParcelRef[];
  zones: Zone[];
  spots: NumberedSpot[];
  layout: LayoutKey;
}

export class NoParcelError extends Error {}

/**
 * R-C (07/10/2026): the first pass on an empty plan. From the parking's position: its cadastral
 * parcel becomes the outline, the IGN buildings its obstacles, Claude (or the land itself)
 * its zones, and the chosen layout its spots. Everything is saved as it goes, so a stop halfway
 * leaves a usable plan the operator continues by hand.
 */
export async function autoSetup(deps: AutoSetupDeps): Promise<AutoSetupResult> {
  const { position, newId, save, onProgress } = deps;
  const settings = settingsOf(deps.study);

  onProgress({ step: "parcel", state: "running" });
  const { parcels } = await adminApi.parcelsAt(position[0], position[1]);
  const polygons = parcels.flatMap((p) =>
    p.geometry ? polygonsOf(p.geometry) : [],
  );
  if (!polygons.length) throw new NoParcelError();
  const outline = unionPolygons(polygons, estimateFrame(polygons[0]))[0];
  if (!outline) throw new NoParcelError();
  let study: CapacityStudy = {
    ...deps.study,
    outline,
    parcels: parcels.slice(0, 1),
    settings: {
      ...deps.study.settings,
      outlineSource: "parcels",
      zonesAuto: true,
      ignBuildingsSynced: true,
    },
  };
  onProgress({ step: "parcel", state: "done", note: parcels[0].commune });

  onProgress({ step: "buildings", state: "running" });
  let exclusions = study.exclusions;
  if (settings.ignBuildings !== false) {
    const bounds = boundsOf(outline.coordinates[0]);
    if (bounds) {
      const [[w, s], [e, n]] = bounds;
      try {
        const { buildings } = await adminApi.buildingsIn([w, s, e, n]);
        exclusions = withIgnBuildings(
          study,
          buildings,
          fr.capacity.exclusionKinds.building,
        );
      } catch {
        // No IGN answer: the plan goes on without buildings; the operator adds them by hand.
      }
    }
  }
  study = { ...study, exclusions };
  onProgress({
    step: "buildings",
    state: "done",
    note: String(exclusions.filter((e) => e.source === "ign").length),
  });
  await save({
    outline,
    parcels: study.parcels,
    exclusions,
    settings: study.settings,
  });

  onProgress({ step: "zones", state: "running" });
  let zones: Zone[];
  let zonesNote = fr.planEditor.auto.zonesAuto;
  try {
    const proposal = await deps.suggest({
      allowGrass: settings.suggestGrass !== false,
    });
    zones = proposal.zones;
    zonesNote = fr.planEditor.auto.zonesByClaude;
    if (!zones.length) zones = autoZones(study, fr.capacity.zoneName, newId);
  } catch {
    zones = autoZones(study, fr.capacity.zoneName, newId);
  }
  study = {
    ...study,
    zones,
    settings: {
      ...study.settings,
      zonesAuto: zonesNote === fr.planEditor.auto.zonesAuto,
    },
  };
  onProgress({ step: "zones", state: "done", note: zonesNote });
  await save({ zones, settings: study.settings });

  onProgress({ step: "spots", state: "running" });
  await deps.yieldToUi?.();
  const result = estimate({
    outline,
    zones,
    exclusions,
    scaleFactor: study.scaleFactor,
    settings: study.settings,
  });
  const frame = estimateFrame(outline, study.scaleFactor);
  const slotLength = (
    deps.layout === "selfPark" ? settings.selfParkSlot : settings.valetSlot
  ).length;
  const spots = spotsFromLayout(result, zones, deps.layout, frame, slotLength);
  onProgress({ step: "spots", state: "done", note: String(spots.length) });
  return { outline, parcels: study.parcels, zones, spots, layout: deps.layout };
}
