/**
 * The "tableau des vols" backdrop of the sign-in pages (F-A, 05/10/2026, the same as Plazo Pro's
 * login), in the C-B colours: faint lime rules on the light ground, whiter towards the bottom.
 */
export function BoardBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-background">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(163,230,53,0.35) 0 1px, transparent 1px 34px), repeating-linear-gradient(90deg, rgba(163,230,53,0.35) 0 1px, transparent 1px 68px)",
        }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(238,240,238,0.2), rgba(238,240,238,0.95))" }} />
    </div>
  );
}
