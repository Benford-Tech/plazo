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
import type { ParkingFile } from "@/lib/plan/parkingFiles";
import type { ParkingPlanView, PlanPatch } from "@/lib/plan/types";

export type AutoStep = "parcel" | "buildings" | "zones" | "spots" | "files";
export const AUTO_STEPS: AutoStep[] = [
  "parcel",
  "buildings",
  "zones",
  "spots",
  "files",
];
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
  parkingId: string;
  /** The parking's position, for the parcel step; null when the plan already has an outline. */
  position: [number, number] | null;
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
  /** The plan as the server saved it, with the generated spots. */
  view: ParkingPlanView;
  /** The files proposed from the valet spots, or null when none came out. */
  files: ParkingFile[] | null;
}

export class NoParcelError extends Error {}

/**
 * R-C (07/10/2026): the first pass on an empty plan. From the parking's position: its cadastral
 * parcel becomes the outline, the IGN buildings its obstacles, Claude (or the land itself)
 * its zones, the chosen layout its spots, and (S-C) the valet files of those spots the files of
 * the parking. Everything is saved as it goes, so a stop halfway leaves a usable plan the
 * operator continues by hand.
 *
 * "Me proposer des files" (07/10/2026) runs the same pass on a plan already begun: the outline
 * stays (the parcel step is skipped), as do the zones the plan already holds in manual mode.
 */
export async function autoSetup(deps: AutoSetupDeps): Promise<AutoSetupResult> {
  const { parkingId, position, newId, save, onProgress } = deps;
  const settings = settingsOf(deps.study);

  // ---- Parcel: the outline, unless the plan already has one ----------------------------------
  let study: CapacityStudy = deps.study;
  let outline = study.outline;
  if (outline) {
    onProgress({
      step: "parcel",
      state: "skipped",
      note: fr.planEditor.auto.outlineKept,
    });
  } else {
    onProgress({ step: "parcel", state: "running" });
    if (!position) throw new NoParcelError();
    const { parcels } = await adminApi.parcelsAt(position[0], position[1]);
    const polygons = parcels.flatMap((p) =>
      p.geometry ? polygonsOf(p.geometry) : [],
    );
    if (!polygons.length) throw new NoParcelError();
    outline = unionPolygons(polygons, estimateFrame(polygons[0]))[0] ?? null;
    if (!outline) throw new NoParcelError();
    study = {
      ...study,
      outline,
      parcels: parcels.slice(0, 1),
      settings: {
        ...study.settings,
        outlineSource: "parcels",
        zonesAuto: true,
        ignBuildingsSynced: true,
      },
    };
    onProgress({ step: "parcel", state: "done", note: parcels[0].commune });
  }

  // ---- Buildings: the IGN ones on the land become obstacles ----------------------------------
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
  study = {
    ...study,
    exclusions,
    settings: { ...study.settings, ignBuildingsSynced: true },
  };
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

  // ---- Zones: Claude's proposal, else the land minus its buildings. Zones already there in
  // manual mode (painted, edited, or a proposal already accepted) are kept as they are. --------
  let zones: Zone[] = study.zones;
  const zonesKept = zones.length > 0 && settings.zonesAuto === false;
  if (zonesKept) {
    onProgress({
      step: "zones",
      state: "skipped",
      note: fr.planEditor.auto.zonesKept,
    });
  } else {
    onProgress({ step: "zones", state: "running" });
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
  }

  // ---- Spots: the chosen layout on the zones, saved on the server ----------------------------
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
  const { data: view } = await adminApi.replaceSpots(
    parkingId,
    deps.layout,
    spots,
  );
  onProgress({ step: "spots", state: "done", note: String(spots.length) });

  // ---- Files (S-C): each valet file of the generated spots becomes a file of the parking -----
  let files: ParkingFile[] | null = null;
  if (view.spots.some((s) => s.active && s.depth != null)) {
    onProgress({ step: "files", state: "running" });
    files = (await adminApi.filesFromPlan(parkingId)).data;
    onProgress({ step: "files", state: "done", note: String(files.length) });
  } else {
    onProgress({
      step: "files",
      state: "skipped",
      note: fr.planEditor.auto.noValetSpots,
    });
  }
  return {
    outline,
    parcels: study.parcels,
    zones,
    spots,
    layout: deps.layout,
    view,
    files,
  };
}
