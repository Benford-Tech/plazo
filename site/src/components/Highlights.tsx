import { fr } from "@/lib/fr";
import type { ChipIcon, FactChip, TileKind, TrustTile } from "@/lib/highlights";
import { SHUTTLE_PATH } from "@/lib/shuttle-icon";

/**
 * Small pieces of reassurance shared by the home, the results and the parking page: the badges of a
 * result, the fact chips of a card and the trust tiles of a parking page. Icons are inline SVG, in the
 * stroke style of the search pills (components/stay/pill.tsx).
 *
 * Boutique (11/10/2026): the facts are cream chips with a warm-grey line icon (`chip`), the badges soft
 * pills (« Le moins cher » orange on cream, « Navette la plus rapide » neutral), the trust tiles white
 * hairline cards with the icon on a cream tile.
 */

const svg = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function FactIcon({ icon, size = 14 }: { icon: ChipIcon; size?: number }) {
  const props = { ...svg, width: size, height: size, "aria-hidden": true as const };
  switch (icon) {
    case "shuttle":
      // The same minibus as the map pins and the live blocks (Material "airport_shuttle", filled), not a second drawing.
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d={SHUTTLE_PATH} />
        </svg>
      );
    case "fenced":
      return (
        <svg {...props}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
        </svg>
      );
    case "covered":
      return (
        <svg {...props}>
          <path d="M3.5 11 12 4l8.5 7" />
          <path d="M6 9.5V20h12V9.5" />
        </svg>
      );
    case "ev":
      return (
        <svg {...props}>
          <path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" />
        </svg>
      );
    case "valet":
      return (
        <svg {...props}>
          <circle cx="8" cy="15" r="4.5" />
          <path d="M11.5 11.5 20 3m-3 3 2.5 2.5M14.5 8.5 17 11" />
        </svg>
      );
    case "cancel":
      return (
        <svg {...props}>
          <path d="M9 14 4 9l5-5" />
          <path d="M4 9h10a6 6 0 0 1 0 12h-4" />
        </svg>
      );
    case "warning":
      return (
        <svg {...props}>
          <path d="M12 3.5 2.5 20h19z" />
          <path d="M12 10v4M12 17h.01" />
        </svg>
      );
  }
}

const TILE_ICON: Record<TileKind, ChipIcon> = { shuttle: "shuttle", security: "fenced", cancellation: "cancel", keys: "valet" };

/** The fact chips of a result card ("8 min", "Clôturé", "Gratuit 24 h"…): cream, a line icon in warm grey. */
export function FactChips({ chips, className = "" }: { chips: FactChip[]; className?: string }) {
  if (chips.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {chips.map(chip => (
        // A warning (non-refundable…) is rose, its icon too: the colour never carries it alone, the label says it.
        <li key={chip.icon} title={chip.title} className={`chip ${chip.icon === "warning" ? "bg-danger-bg text-danger [&_svg]:text-danger" : ""}`}>
          <FactIcon icon={chip.icon} />
          {chip.label}
          {chip.title && <span className="sr-only"> ({chip.title})</span>}
        </li>
      ))}
    </ul>
  );
}

/** The trust band of a parking page (« L'essentiel »): up to four hairline tiles, one row on a wide screen. */
export function TrustBand({ tiles }: { tiles: TrustTile[] }) {
  if (tiles.length === 0) return null;
  return (
    <ul aria-label={fr.highlights.bandLabel} className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-2.5">
      {tiles.map(tile => (
        <li key={tile.kind} data-tile={tile.kind} className="card flex items-start gap-2.5 rounded-field p-3">
          <span aria-hidden="true" className="flex size-8 flex-none items-center justify-center rounded-field bg-tint text-soft">
            <FactIcon icon={TILE_ICON[tile.kind]} size={16} />
          </span>
          <span className="min-w-0 text-[12.5px] leading-snug">
            <b className="block text-[14px] leading-tight font-bold text-ink md:text-[14.5px]">{tile.title}</b>
            <span className="font-medium text-soft">{tile.text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
