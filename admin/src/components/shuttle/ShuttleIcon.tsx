import { SHUTTLE_COLOURS, SHUTTLE_PATH, shuttleTransform, type ShuttleTone } from "@/lib/shuttle-icon";

/** I-C (06/10/2026): the minibus pictogram, tinted by its direction and turned the way it drives. */
export function ShuttleIcon({ tone = "terminal", heading = null, size = 18, className = "" }: { tone?: ShuttleTone; heading?: number | null; size?: number; className?: string }) {
  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 ${className}`} style={{ color: SHUTTLE_COLOURS[tone], transform: shuttleTransform(heading) || undefined }}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
        <path d={SHUTTLE_PATH} />
      </svg>
    </span>
  );
}
