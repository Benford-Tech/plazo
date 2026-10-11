import { fr } from "@/lib/fr";

/**
 * A parking photo, or the placeholder when the operator has not added any yet: a warm cream ground with a small
 * picture outline and the caption in spaced capitals, so that it reads as intended rather than broken.
 */
export function Photo({ src, alt, className = "" }: { src: string | null | undefined; alt: string; className?: string }) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={fr.a11y.photoPlaceholder}
        className={`photo-none flex-col items-start justify-end gap-1.5 bg-linear-160 from-tint to-map ${className}`}
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-mute"
        >
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <circle cx="9" cy="10.5" r="1.8" />
          <path d="m21 16-4.5-4.5L8 19" />
        </svg>
        <span aria-hidden="true" className="max-w-full">
          {fr.a11y.photoPlaceholder}
        </span>
      </div>
    );
  }
  // Operators' photos are plain https URLs on any host: a regular <img> avoids an image proxy allow-list.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={`object-cover ${className}`} />;
}
