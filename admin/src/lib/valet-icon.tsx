// « Voiturier au terminal » (27/10/2026): the little valet (cap, body, key) that marks a valet booking everywhere.
export function ValetIcon({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path d="M7.5 6.2 12 4l4.5 2.2v1.3h-9z" fill="currentColor" />
      <circle cx="12" cy="9.6" r="2.6" fill="currentColor" />
      <path d="M6.5 21v-3.6a5.5 5.5 0 0 1 11 0V21z" fill="currentColor" />
      <path d="M12 13.9v3.4" stroke="white" strokeWidth="1.2" />
      <circle cx="17.6" cy="18.4" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M19.1 19.9l2.2 2.2M20.4 21.2l.9-.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** « Voiturier · Terminal 1 »: the indigo pill of a valet booking. */
export function ValetPill({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-info-soft px-2 py-0.5 text-xs font-semibold text-info ${className ?? ""}`}
      data-testid="valet-pill"
    >
      <ValetIcon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
