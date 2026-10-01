import { euros } from "@/lib/pricing";
import { fr } from "@/lib/fr";
import type { CancellationPolicy, ListingService } from "@/lib/types";

/** The card travellers see in the Plazo results (direction M3), updated as the form changes. */
export function ListingPreview(props: {
  title: string;
  photo?: string;
  services: ListingService[];
  shuttleMinutes: number | null;
  openingHours: string;
  cancellationPolicy: CancellationPolicy;
  fromPriceCents: number | null;
}) {
  const facts = [
    props.services.includes("shuttle") && props.shuttleMinutes ? `Navette ${props.shuttleMinutes} min` : null,
    props.openingHours || (props.services.includes("open_24h") ? fr.services.open_24h : null),
    ...props.services.filter(s => !["shuttle", "open_24h"].includes(s)).map(s => fr.services[s]),
    fr.cancellationShort[props.cancellationPolicy],
  ].filter(Boolean);
  return (
    <div className="w-[330px] overflow-hidden rounded-[22px] bg-white text-[#1e1e1e] shadow-[0_20px_50px_-20px_rgba(0,0,0,.8)]" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="bg-[#4b164c] px-3.5 py-2.5 text-xl text-white" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
        Plazo
      </div>
      <div className="p-3">
        <article className="overflow-hidden rounded-2xl border-2 border-[#a427c3]">
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
            <div className="text-[13px] text-[#6f6675]">{facts.join(" · ")}</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-lg font-bold">{props.fromPriceCents !== null ? fr.plazo.from(euros(props.fromPriceCents)) : fr.plazo.noPrice}</span>
              <span className="flex h-9 items-center rounded-full bg-[linear-gradient(96deg,#a427c3,#cf4f96_55%,#f0a36b)] px-3.5 text-sm font-bold text-white">
                {fr.plazo.see}
              </span>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
