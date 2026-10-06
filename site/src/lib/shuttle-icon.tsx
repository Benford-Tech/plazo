import type { LatLng } from "./types";

/**
 * I-C (06/10/2026): the shuttle pictogram — a minibus seen from the side (Material "airport_shuttle"),
 * in a white pill bordered with the colour of its direction, turned the way it drives.
 * Orange: to the terminal (drop-off); peach: to the airport to fetch travellers (pickup); grey: no position.
 */
export const SHUTTLE_PATH =
  "M17 5H3c-1.1 0-2 .89-2 2v9h2c0 1.65 1.34 3 3 3s3-1.35 3-3h5.5c0 1.65 1.34 3 3 3s3-1.35 3-3H23v-5l-6-6zM3 11V7h4v4H3zm3 6.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM13 11H9V7h4v4zm4.5 6.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM15 11V7h1l4 4h-5z";

export type ShuttleTone = "terminal" | "airport" | "unknown";

export const SHUTTLE_COLOURS: Record<ShuttleTone, string> = { terminal: "#ff6600", airport: "#f0a36b", unknown: "#9a948e" };

export function shuttleTone(direction: "pickup" | "dropoff", hasPosition: boolean): ShuttleTone {
  if (!hasPosition) return "unknown";
  return direction === "dropoff" ? "terminal" : "airport";
}

/** The bus faces east at rest; a heading west mirrors it so it never drives upside down. */
export function shuttleTransform(heading: number | null): string {
  if (heading === null) return "";
  const h = ((heading % 360) + 360) % 360;
  return h <= 180 ? `rotate(${h - 90}deg)` : `scaleX(-1) rotate(${270 - h}deg)`;
}

/** Compass bearing from one position to the next (0 = north, 90 = east); null when too close to tell. */
export function bearing(from: LatLng, to: LatLng): number | null {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(to.lat));
  const x = Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) - Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(dLng);
  // Under ~8 m the GPS jitter would spin the bus.
  const dist = Math.hypot((to.lat - from.lat) * 111_000, (to.lng - from.lng) * 111_000 * Math.cos(toRad(from.lat)));
  if (dist < 8) return null;
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function shuttleSvg(size = 20): string {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true"><path d="${SHUTTLE_PATH}"/></svg>`;
}

/** The map marker's HTML: the pill with the turned bus. */
export function shuttleMarkerHtml(tone: ShuttleTone, heading: number | null): string {
  const colour = SHUTTLE_COLOURS[tone];
  return (
    `<span style="position:absolute;inset:0;border-radius:9999px;background:${colour};opacity:.45" class="animate-ping motion-reduce:hidden"></span>` +
    `<span style="position:relative;display:flex;width:38px;height:38px;align-items:center;justify-content:center;border-radius:9999px;background:#fff;border:2.5px solid ${colour};color:${colour};box-shadow:0 6px 14px -6px rgba(0,0,0,.5)">` +
    `<span style="display:flex;transform:${shuttleTransform(heading) || "none"}">${shuttleSvg(22)}</span></span>`
  );
}

export function ShuttleIcon({ tone = "terminal", heading = null, size = 18, className = "" }: { tone?: ShuttleTone; heading?: number | null; size?: number; className?: string }) {
  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 ${className}`} style={{ color: SHUTTLE_COLOURS[tone], transform: shuttleTransform(heading) || undefined }}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
        <path d={SHUTTLE_PATH} />
      </svg>
    </span>
  );
}
