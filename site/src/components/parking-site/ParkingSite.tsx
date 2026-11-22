import { fr } from "@/lib/fr";
import type { ParkingResponse, ParkingSiteInfo, SiteBlockKind } from "@/lib/types";
import { BLOCKS, knownBlocks, menuEntry } from "./blocks";

/** « Parking des Cèdres » → « PC »: the tile that stands for a logo. */
const initials = (title: string) =>
  title
    .split(/\s+/)
    .filter(w => /^\p{L}/u.test(w) && w.length > 2)
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join("") || title.slice(0, 1).toUpperCase();

/**
 * A parking's own site (22/11/2026): its name and colour, a menu drawn from its blocks, then the blocks in the order
 * the manager chose. Nothing of Plazo's own header and footer; « Réservation par Plazo » only at the foot.
 */
export function ParkingSite({ site, data, idempotencyKey }: { site: ParkingSiteInfo; data: ParkingResponse; idempotencyKey: string }) {
  const blocks = knownBlocks(site.blocks);
  const menu = blocks.map(menuEntry).filter(e => e !== null);
  const accent = { "--ps-accent": site.accent, "--ps-ink": site.accentInk } as React.CSSProperties;
  const { parking, airport } = data;
  return (
    <div style={accent} className="flex min-h-screen flex-col bg-ground text-ink" data-testid="parking-site">
      {site.preview && (
        <p role="status" className="bg-ink px-4 py-2 text-center text-[13.5px] font-semibold text-paper">
          {fr.parkingSite.preview}
        </p>
      )}
      <header className="sticky top-0 z-20 border-b border-line bg-paper">
        <div className="mx-auto flex w-full max-w-[1040px] items-center gap-3 px-4 py-2.5 md:px-8">
          <span aria-hidden="true" className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-[var(--ps-accent)] text-[14px] font-bold text-[var(--ps-ink)]">
            {initials(parking.title)}
          </span>
          <span className="min-w-0 flex-1 truncate text-[16px] font-bold">{parking.title}</span>
          <nav aria-label={parking.title} className="hidden items-center gap-5 text-[14px] font-medium text-soft md:flex">
            {menu.map(entry => (
              <a key={entry.href} href={entry.href} className="text-soft no-underline hover:text-ink">
                {entry.label}
              </a>
            ))}
          </nav>
          <a href="#reserver" className="flex-none rounded-[10px] bg-[var(--ps-accent)] px-4 py-2 text-[14px] font-semibold text-[var(--ps-ink)]">
            {fr.bookingPage.meta}
          </a>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1040px] flex-1 flex-col gap-8 px-4 py-6 md:gap-10 md:px-8 md:py-10">
        <div className="flex flex-col gap-2">
          <h1 className="font-title text-[30px] leading-[1.1] md:text-[44px]">{parking.title}</h1>
          <p className="text-[15px] font-medium text-soft md:text-[16px]">{[airport.name, parking.address].filter(Boolean).join(" · ")}</p>
        </div>
        {blocks.map(block => {
          const Block = BLOCKS[block.kind as SiteBlockKind];
          return <Block key={block.id} block={block} site={site} data={data} idempotencyKey={idempotencyKey} />;
        })}
      </main>

      <footer className="border-t border-line bg-paper">
        <div className="mx-auto flex w-full max-w-[1040px] flex-wrap items-center justify-between gap-2 px-4 py-4 text-[13px] text-soft md:px-8">
          <span>{[parking.title, parking.phone].filter(Boolean).join(" · ")}</span>
          <span>{fr.bookingPage.by}</span>
        </div>
      </footer>
    </div>
  );
}
