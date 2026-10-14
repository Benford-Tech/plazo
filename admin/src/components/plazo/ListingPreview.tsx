import { Clock, KeyRound, Lock, Sun, TriangleAlert, Undo2, Warehouse, Zap, type LucideIcon } from "lucide-react";
import { ShuttleIcon } from "@/components/shuttle/ShuttleIcon";
import { euros } from "@/lib/pricing";
import { fr } from "@/lib/fr";
import { listingTags, shuttleTag, type ShuttleTag, type TagIcon } from "@/lib/listing-tags";
import { PRODUCT } from "@/lib/product";
import type { CancellationPolicy, ListingService } from "@/lib/types";
import { cn } from "@/lib/utils";

const TAG_ICONS: Record<TagIcon, LucideIcon> = {
  outdoor: Sun,
  covered: Warehouse,
  keys: KeyRound,
  open24h: Clock,
  fenced: Lock,
  ev: Zap,
  cancel: Undo2,
  warning: TriangleAlert,
};

/** « Navette gratuite · trajet 8 min · attente moy. 5 min » (a figure without data is left out), in the pro tokens. */
function ShuttleLine({ shuttle }: { shuttle: ShuttleTag }) {
  const t = fr.plazo.previewTags;
  const sep = <span className="text-muted-foreground"> · </span>;
  return (
    <p data-testid="preview-shuttle" className="flex items-start gap-1.5 rounded-lg border border-panel-line bg-panel-2 px-2.5 py-1.5 text-[12.5px] leading-snug text-foreground">
      <ShuttleIcon size={15} className="mt-px" />
      <span>
        <b className="font-bold">{t.shuttle}</b>
        {shuttle.rideMinutes !== null && (
          <>
            {sep}
            <span className="text-muted-foreground">{t.ride} </span>
            <span className="font-mono">{t.minutes(shuttle.rideMinutes)}</span>
          </>
        )}
        {shuttle.waitMinutes !== null && (
          <>
            {sep}
            <span className="text-muted-foreground">
              <span aria-hidden="true">{t.wait}</span>
              <span className="sr-only">{t.waitFull}</span>{" "}
            </span>
            <span className="font-mono">{t.minutes(shuttle.waitMinutes)}</span>
          </>
        )}
      </span>
    </p>
  );
}

/**
 * The card travellers see in the Plazo results (direction M3), updated as the form changes; since 14/10/2026 it carries
 * the tags of the results (direction C, `lib/listing-tags.ts`): the shuttle line, then the chips, in the pro tokens.
 */
export function ListingPreview(props: {
  title: string;
  photo?: string;
  services: ListingService[];
  shuttleMinutes: number | null;
  /** The declared average wait (14/10/2026); left out when not declared. */
  shuttleWaitMinutes?: number | null;
  openingHours: string | null;
  cancellationPolicy: CancellationPolicy;
  fromPriceCents: number | null;
}) {
  const shuttle = shuttleTag(props);
  const tags = listingTags(props);
  return (
    <div className="w-[330px] overflow-hidden rounded-[22px] bg-white text-[#1e1e1e] shadow-[0_20px_50px_-20px_rgba(0,0,0,.8)]" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="bg-[#ff6600] px-3.5 py-2.5 text-xl text-white" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
        {PRODUCT.name}
      </div>
      <div className="p-3">
        <article className="overflow-hidden rounded-2xl border-2 border-[#ff8a3d]">
          {props.photo ? (
            <img src={props.photo} alt="" className="h-[100px] w-full object-cover" />
          ) : (
            <div className="h-[100px] bg-[repeating-linear-gradient(135deg,#e6e0ea_0_10px,#ffffff_10px_20px)]" />
          )}
          <div className="flex flex-col gap-1 px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-lg" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                {props.title || "—"}
              </span>
              <span className="whitespace-nowrap text-xs text-[#6f6675]">{fr.plazo.newOnPlazo}</span>
            </div>
            {shuttle && <ShuttleLine shuttle={shuttle} />}
            <ul aria-label={fr.plazo.previewTags.label} className="flex flex-wrap gap-1">
              {tags.map(tag => {
                const Icon = TAG_ICONS[tag.icon];
                const warning = tag.icon === "warning";
                return (
                  <li
                    key={tag.label}
                    title={tag.title}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-semibold text-foreground",
                      // Non-refundable: the amber tint of the pro states (the site's pill is tinted too), the text kept dark.
                      warning ? "border-warn/30 bg-warn-soft" : "border-panel-line bg-panel-2",
                    )}
                  >
                    <Icon aria-hidden="true" className={cn("h-3 w-3", warning ? "text-warn" : "text-lime-deep")} strokeWidth={2.25} />
                    {tag.label}
                    {tag.title && <span className="sr-only"> ({tag.title})</span>}
                  </li>
                );
              })}
            </ul>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-lg font-bold">{props.fromPriceCents !== null ? fr.plazo.from(euros(props.fromPriceCents)) : fr.plazo.noPrice}</span>
              <span className="flex h-9 items-center rounded-full bg-[linear-gradient(96deg,#ff8a3d,#f0a36b)] px-3.5 text-sm font-bold text-white">
                {fr.plazo.see}
              </span>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
