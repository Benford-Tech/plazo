import { fr } from "@/lib/fr";
import type { Badge, ChipIcon, FactChip, TileKind, TrustTile } from "@/lib/highlights";

/**
 * Small pieces of reassurance shared by the results and the parking page: the badges of a result,
 * the fact chips of a card and the trust tiles of a parking page. Icons are inline SVG, in the
 * stroke style of the search pills (components/stay/pill.tsx).
 */

const svg = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function FactIcon({ icon, size = 14 }: { icon: ChipIcon; size?: number }) {
  const props = { ...svg, width: size, height: size, "aria-hidden": true as const };
  switch (icon) {
    case "shuttle":
      return (
        <svg {...props}>
          <rect x="4" y="4" width="16" height="13" rx="2.5" />
          <path d="M4 10h16M8 20v-3M16 20v-3M8 14h.01M16 14h.01" />
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

/** The fact chips of a result card ("8 min", "Clôturé", "Gratuit 24 h"…). */
export function FactChips({ chips, className = "" }: { chips: FactChip[]; className?: string }) {
  if (chips.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {chips.map(chip => (
        <li
          key={chip.icon}
          title={chip.title}
          className={`inline-flex h-[26px] items-center gap-1 rounded-[10px] bg-tint px-2 text-[12.5px] ${chip.icon === "warning" ? "text-danger" : "text-ink"}`}
        >
          <FactIcon icon={chip.icon} />
          {chip.label}
          {chip.title && <span className="sr-only"> ({chip.title})</span>}
        </li>
      ))}
    </ul>
  );
}

const BADGE_LABEL: Record<Badge, string> = { cheapest: fr.results.cheapest, fastestShuttle: fr.results.fastestShuttle };
const BADGE_STYLE: Record<Badge, string> = { cheapest: "bg-accent text-white", fastestShuttle: "bg-peach text-white" };

/** Badges of a result, stacked ("Le moins cher" in orange, "Navette la plus rapide" in peach). */
export function ResultBadges({ badges, className = "" }: { badges: Badge[]; className?: string }) {
  if (badges.length === 0) return null;
  return (
    <ul className={`flex flex-col items-start gap-1 ${className}`}>
      {badges.map(badge => (
        <li key={badge} data-badge={badge} className={`rounded-xl px-2.5 py-1 text-xs font-bold ${BADGE_STYLE[badge]}`}>
          {BADGE_LABEL[badge]}
        </li>
      ))}
    </ul>
  );
}

/** The trust band of a parking page: up to four tiles, one row on a wide screen. */
export function TrustBand({ tiles }: { tiles: TrustTile[] }) {
  if (tiles.length === 0) return null;
  return (
    <ul aria-label={fr.highlights.bandLabel} className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-2.5">
      {tiles.map(tile => (
        <li key={tile.kind} data-tile={tile.kind} className="flex items-start gap-2 rounded-[14px] border border-line p-2.5 md:p-3">
          <span aria-hidden="true" className="flex size-7 flex-none items-center justify-center rounded-full bg-tint text-accent">
            <FactIcon icon={TILE_ICON[tile.kind]} size={15} />
          </span>
          <span className="min-w-0 text-[13px] leading-snug">
            <b className="block text-[14px] md:text-[15px]">{tile.title}</b>
            <span className="text-soft">{tile.text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
