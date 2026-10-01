import { fr } from "@/lib/fr";

/** A parking photo, or the striped placeholder when the operator has not added any yet. */
export function Photo({ src, alt, className = "" }: { src: string | null | undefined; alt: string; className?: string }) {
  if (!src) {
    return (
      <div role="img" aria-label={fr.a11y.photoPlaceholder} className={`bg-stripes ${className}`}>
        <span className="sr-only">{fr.a11y.photoPlaceholder}</span>
      </div>
    );
  }
  // Operators' photos are plain https URLs on any host: a regular <img> avoids an image proxy allow-list.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={`object-cover ${className}`} />;
}
