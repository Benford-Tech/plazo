/**
 * The "tableau des vols" backdrop of the sign-in pages (F-A, 05/10/2026, the same as Plazo Pro's
 * login): faint yellow rules under a black veil, darker towards the bottom. Pure CSS, nothing to load.
 */
export function BoardBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-background">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(245,196,0,0.16) 0 1px, transparent 1px 34px), repeating-linear-gradient(90deg, rgba(245,196,0,0.16) 0 1px, transparent 1px 68px)",
        }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,11,12,0.35), rgba(11,11,12,0.92))" }} />
    </div>
  );
}
