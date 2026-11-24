import { fr } from "@/lib/fr";
import { hasPages, PAGE_BLOCKS, pageOf, sitePath } from "@/lib/parking-site";
import type { ParkingResponse, ParkingSiteInfo, SiteBlock, SiteBlockKind } from "@/lib/types";
import { BAND_BLOCKS, BLOCKS, knownBlocks, menuEntry } from "./blocks";

/** « Parking des Cèdres » → « PC »: the tile that stands for a logo. */
const initials = (title: string) =>
  title
    .split(/\s+/)
    .filter(w => /^\p{L}/u.test(w) && w.length > 2)
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join("") || title.slice(0, 1).toUpperCase();

const container = "mx-auto w-full max-w-[1040px] px-4 md:px-8";

interface Props {
  site: ParkingSiteInfo;
  data: ParkingResponse;
  idempotencyKey: string;
  /** The page shown, by its name; null: the home page. */
  page?: string | null;
}

/** The blocks of the page shown: the manager's order on the home page, a fixed choice among his blocks elsewhere. */
function blocksFor(site: ParkingSiteInfo, kind: keyof typeof PAGE_BLOCKS | null): SiteBlock[] {
  const blocks = knownBlocks(site.blocks);
  if (!kind) return blocks;
  return PAGE_BLOCKS[kind].flatMap(k => blocks.filter(b => b.kind === k));
}

function Menu({ site, blocks, narrow = false }: { site: ParkingSiteInfo; blocks: SiteBlock[]; narrow?: boolean }) {
  const t = fr.parkingSite;
  // One page: the menu jumps to the blocks. Several pages: it opens them.
  const entries = hasPages(site)
    ? [
        { href: sitePath(site), label: t.home },
        ...(site.destinations ?? []).slice(0, 3).map(d => ({ href: sitePath(site, d.slug), label: d.name })),
        { href: sitePath(site, "questions"), label: t.questions },
        { href: sitePath(site, "contact"), label: t.contact },
      ]
    : blocks.map(menuEntry).filter(e => e !== null);
  return (
    <nav
      aria-label={site.title}
      className={
        narrow
          ? `${container} flex gap-5 overflow-x-auto border-t border-line-soft py-2 text-[14px] font-medium whitespace-nowrap lg:hidden`
          : "hidden min-w-0 items-center gap-5 text-[14px] font-medium text-soft lg:flex"
      }
    >
      {entries.map(entry => (
        <a key={entry.href} href={entry.href} className={`${narrow ? "flex-none" : "truncate"} text-soft no-underline hover:text-ink`}>
          {entry.label}
        </a>
      ))}
    </nav>
  );
}

function Legal({ site, data }: { site: ParkingSiteInfo; data: ParkingResponse }) {
  const t = fr.parkingSite;
  const legal = site.legal;
  const known = legal && (legal.name || legal.siret);
  return (
    <section className="flex flex-col gap-3 text-[15px] leading-relaxed">
      <h2 className="font-title text-[22px] leading-tight md:text-[26px]">{t.publisher}</h2>
      {known ? (
        <div className="rounded-[16px] border border-line bg-paper p-4 md:px-5">
          <p className="font-semibold">{legal.name ?? data.parking.title}</p>
          <p>{legal.address ?? data.parking.address}</p>
          {legal.siret && <p>SIRET {legal.siret}</p>}
          {legal.vatNumber && (
            <p>
              {t.vat} {legal.vatNumber}
            </p>
          )}
          {data.parking.phone && <p className="tabular-nums">{data.parking.phone}</p>}
        </div>
      ) : (
        <p className="text-soft">{t.legalMissing}</p>
      )}
      <p className="text-soft">{t.hosting}</p>
      <p className="text-soft">
        <a href="https://www.plazo.fr/confidentialite" className="underline">
          {t.privacy}
        </a>
      </p>
    </section>
  );
}

/**
 * A parking's own site (22/11/2026): its name and colour, a menu, then its blocks. Two looks (24/11/2026): « simple »,
 * and « showcase » with a contact bar, a photo behind the title, the Google rating and bands in a second colour. With
 * several pages, each destination, the questions, the contact and the legal notice have their own address. Nothing of
 * Plazo's own header and footer; « Réservation par Plazo » only at the foot.
 */
export function ParkingSite({ site, data, idempotencyKey, page = null }: Props) {
  const t = fr.parkingSite;
  const { parking, airport } = data;
  const opened = page ? pageOf(site, page) : null;
  const pageKind = opened ? (opened.kind === "destination" ? "destination" : opened.kind) : null;
  const blocks = blocksFor(site, pageKind);
  const showcase = site.theme === "showcase";
  const accent2 = site.accent2 ?? site.accent;
  const colours = {
    "--ps-accent": site.accent,
    "--ps-ink": site.accentInk,
    "--ps-accent2": accent2,
    "--ps-ink2": site.accent2 ? (site.accent2Ink ?? site.accentInk) : site.accentInk,
  } as React.CSSProperties;
  const destination = opened?.kind === "destination" ? opened.destination : null;
  const heading = destination
    ? t.nearTitle(destination.name)
    : pageKind === "questions"
      ? fr.parkingMore.faqTitle(parking.title)
      : pageKind === "contact"
        ? t.contact
        : pageKind === "mentions-legales"
          ? t.legal
          : parking.title;
  const lead = destination ? t.nearIntro(parking.title, destination.name) : [airport.name, parking.address].filter(Boolean).join(" · ");
  // In the showcase look the booking sits on the photo's edge, whatever its place in the list.
  const booking = showcase ? blocks.find(b => b.kind === "booking") : undefined;
  const rest = booking ? blocks.filter(b => b !== booking) : blocks;
  const draw = (block: SiteBlock) => {
    const Block = BLOCKS[block.kind as SiteBlockKind];
    return <Block block={block} site={site} data={data} idempotencyKey={idempotencyKey} />;
  };
  const reserve = sitePath(site, pageKind === "destination" ? page : null, "#reserver");
  const logo = site.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={site.logoUrl} alt="" className="size-10 flex-none rounded-[10px] object-contain" />
  ) : (
    <span aria-hidden="true" className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-[var(--ps-accent)] text-[14px] font-bold text-[var(--ps-ink)]">
      {initials(parking.title)}
    </span>
  );

  return (
    <div style={colours} className="flex min-h-screen flex-col bg-ground text-ink" data-testid="parking-site" data-theme-look={site.theme ?? "simple"}>
      {site.preview && (
        <p role="status" className="bg-ink px-4 py-2 text-center text-[13.5px] font-semibold text-paper">
          {t.preview}
        </p>
      )}
      {showcase && (parking.phone || parking.openingHours) && (
        <p data-testid="site-topbar" className="bg-[var(--ps-accent)] text-[13px] text-[var(--ps-ink)]">
          <span className={`${container} flex flex-wrap gap-x-4 gap-y-0.5 py-1.5`}>
            {parking.phone && <span className="font-semibold tabular-nums">{parking.phone}</span>}
            {parking.openingHours && <span>{parking.openingHours}</span>}
          </span>
        </p>
      )}
      <header className="sticky top-0 z-20 border-b border-line bg-paper">
        <div className={`${container} flex items-center gap-3 py-2.5`}>
          <a href={sitePath(site)} className="flex min-w-0 flex-1 items-center gap-3 text-ink no-underline">
            {logo}
            <span className="min-w-0 truncate text-[16px] font-bold">{parking.title}</span>
          </a>
          <Menu site={site} blocks={blocks} />
          <a href={reserve} className="flex-none rounded-[10px] bg-[var(--ps-accent)] px-4 py-2 text-[14px] font-semibold text-[var(--ps-ink)]">
            {fr.bookingPage.meta}
          </a>
        </div>
        {/* On a phone the pages of a site with several pages sit in a row that scrolls sideways. */}
        {hasPages(site) && <Menu site={site} blocks={blocks} narrow />}
      </header>

      {showcase ? (
        <div
          data-testid="site-hero"
          className="relative bg-[var(--ps-accent)] bg-cover bg-center text-white"
          style={site.heroPhotoUrl ? { backgroundImage: `linear-gradient(rgba(10,20,35,.55), rgba(10,20,35,.55)), url("${site.heroPhotoUrl}")` } : { color: site.accentInk }}
        >
          <div className={`${container} flex flex-col items-center gap-3 pt-10 text-center md:pt-14 ${booking ? "pb-20" : "pb-10 md:pb-14"}`}>
            <h1 className="font-title text-[32px] leading-[1.1] md:text-[48px]">{heading}</h1>
            <p className="max-w-[60ch] text-[15px] font-medium md:text-[16.5px]">{lead}</p>
            {site.rating && !pageKind && (
              <p data-testid="site-rating" className="flex items-center gap-3 rounded-[12px] bg-paper px-4 py-2 text-left text-ink">
                <span className="text-[24px] font-bold tabular-nums">{site.rating.value.toFixed(1).replace(".", fr.money.decimal)}</span>
                <span className="flex flex-col text-[12.5px] leading-tight">
                  <span aria-hidden="true" className="tracking-[2px] text-[var(--ps-accent2)]">
                    ★★★★★
                  </span>
                  <span className="text-soft">{t.reviews(site.rating.count)}</span>
                </span>
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className={`${container} flex flex-col gap-2 pt-6 md:pt-10`}>
          <h1 className="font-title text-[30px] leading-[1.1] md:text-[44px]">{heading}</h1>
          <p className="max-w-[65ch] text-[15px] font-medium text-soft md:text-[16px]">{lead}</p>
        </div>
      )}

      <main className="flex flex-1 flex-col gap-8 pb-10 md:gap-10">
        {booking && (
          <div className={`${container} relative z-10 -mt-12`}>
            <div className="rounded-[18px] bg-[var(--ps-accent2)] p-3 text-[var(--ps-ink2)] md:p-4">{draw(booking)}</div>
          </div>
        )}
        {!booking && <div aria-hidden="true" className="-mb-4" />}
        {destination?.instructions && (
          <section className={`${container} flex flex-col gap-2`}>
            <h2 className="font-title text-[22px] leading-tight md:text-[26px]">{t.onSite}</h2>
            <p className="text-[15.5px] leading-relaxed whitespace-pre-line">{destination.instructions}</p>
          </section>
        )}
        {rest.map(block =>
          showcase && BAND_BLOCKS.includes(block.kind) ? (
            <div key={block.id} className="empty:hidden">
              {draw(block)}
            </div>
          ) : (
            <div key={block.id} className={`${container} empty:hidden`}>
              {draw(block)}
            </div>
          ),
        )}
        {pageKind === "mentions-legales" && (
          <div className={container}>
            <Legal site={site} data={data} />
          </div>
        )}
      </main>

      <footer className={showcase ? "bg-[var(--ps-accent)] text-[var(--ps-ink)]" : "border-t border-line bg-paper text-soft"}>
        <div className={`${container} flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 text-[13px]`}>
          <span>{[parking.title, parking.phone].filter(Boolean).join(" · ")}</span>
          {hasPages(site) && (
            <a href={sitePath(site, "mentions-legales")} className="text-inherit underline">
              {t.legal}
            </a>
          )}
          <span>{fr.bookingPage.by}</span>
        </div>
      </footer>
    </div>
  );
}
