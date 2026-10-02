import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MapView, type MapLayer, type MapViewHandle } from "@/components/capacity/MapView";
import { Aside, AsideActions, PanelLabel, ToolButton } from "@/components/capacity/ui";
import { dec1, m2 } from "@/lib/capacity/format";
import { IGN_PHOTO_DATE } from "@/lib/capacity/ign";
import { boundsOf, fc, feature, positionsOf } from "@/lib/capacity/mapData";
import type { LonLat } from "@/lib/capacity/types";
import { fr } from "@/lib/fr";
import type { StepProps } from "./CapacityStudyPage";
import type { EstimateState } from "./CapacityStep";

const YELLOW = "#F5C400";
/** A click this close to a marker (pixels) removes it. */
const HIT_PX = 10;

/** Photo check: the user clicks every car visible on the IGN photo; the count is compared with the estimate. */
export default function PhotoStep({ study, update, flush, go, estimate }: StepProps & { estimate: EstimateState }) {
  const mapRef = useRef<MapViewHandle>(null);
  const [savingNow, setSavingNow] = useState(false);
  const markers = study.carMarkers;

  function onMapClick(lngLat: LonLat, point: { x: number; y: number }) {
    const map = mapRef.current;
    let hit = -1;
    let best = HIT_PX;
    markers.forEach((m, i) => {
      const p = map?.project(m);
      if (!p) return;
      const d = Math.hypot(p.x - point.x, p.y - point.y);
      if (d <= best) {
        best = d;
        hit = i;
      }
    });
    const rounded: LonLat = [Math.round(lngLat[0] * 1e7) / 1e7, Math.round(lngLat[1] * 1e7) / 1e7];
    update({ carMarkers: hit >= 0 ? markers.filter((_, i) => i !== hit) : [...markers, rounded] });
  }

  const layers = useMemo<MapLayer[]>(
    () => [
      ...study.zones.map(z => ({
        id: `zone-${z.id}`,
        type: "line" as const,
        data: fc([feature(z.geometry)]),
        paint: { "line-color": YELLOW, "line-width": 1.5, "line-dasharray": [3, 2] },
      })),
      ...(study.outline ? [{ id: "outline", type: "line" as const, data: fc([feature(study.outline)]), paint: { "line-color": YELLOW, "line-width": 2.5 } }] : []),
      {
        id: "cars",
        type: "circle",
        data: fc(markers.map(m => feature({ type: "Point", coordinates: m }))),
        paint: { "circle-radius": 7, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": YELLOW, "circle-stroke-width": 2.5 },
      },
    ],
    [study.zones, study.outline, markers],
  );

  const initialBounds = useMemo(
    () => boundsOf(positionsOf(study.outline?.coordinates ?? study.zones[0]?.geometry.coordinates)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const usableArea = estimate.result?.usableArea ?? study.results.usableArea ?? 0;
  const valet = estimate.result?.totals.valet24 ?? study.results.totals?.valet24 ?? 0;
  const observed = markers.length > 0 ? dec1.format(usableArea / markers.length) : "—";
  const estimated = valet > 0 ? dec1.format(usableArea / valet) : "—";

  return (
    <>
      <div className="relative min-w-0 flex-1">
        <MapView ref={mapRef} layers={layers} initialBounds={initialBounds} onMapClick={onMapClick} cursor="crosshair" />
      </div>
      <Aside className="gap-3">
        <PanelLabel>{fr.capacity.photoTitle}</PanelLabel>
        <div className="font-mono text-[40px] font-bold leading-none text-primary" data-testid="car-count">
          {markers.length}
        </div>
        <div className="text-muted-foreground">{fr.capacity.photoHelp(IGN_PHOTO_DATE)}</div>
        <div className="border border-border p-2.5 leading-[1.6]">
          {fr.capacity.occupied(m2.format(usableArea))}
          <br />
          {fr.capacity.observed}
          <b className="font-mono">{observed} m²</b>
          {fr.capacity.perCarSuffix}
          <br />
          {fr.capacity.estimated}
          <b className="font-mono">{estimated} m²</b>
        </div>
        <p className="m-0 text-sm leading-[1.45] text-muted-foreground">{fr.capacity.photoNote}</p>
        <button type="button" className="self-start text-sm text-primary underline" onClick={() => go("capacite")}>
          {fr.capacity.backToEstimate}
        </button>
        <AsideActions>
          <ToolButton disabled={!markers.length} onClick={() => update({ carMarkers: [] })}>
            {fr.capacity.clearCount}
          </ToolButton>
          <ToolButton
            variant="primary"
            disabled={savingNow}
            onClick={async () => {
              setSavingNow(true);
              try {
                if (await flush()) toast.success(fr.common.saved);
                else toast.error(fr.errors.network ?? fr.errors.unknown);
              } finally {
                setSavingNow(false);
              }
            }}
          >
            {fr.capacity.save}
          </ToolButton>
        </AsideActions>
      </Aside>
    </>
  );
}
