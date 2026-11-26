import { fr } from "@/lib/fr";
import { lp } from "@/lib/i18n/runtime";
import { trustTiles } from "@/lib/highlights";
import { mapsUrl } from "@/lib/listing";
import { formatEuros } from "@/lib/money";
import { priceRows } from "@/lib/parking-more";
import { siteUrl } from "@/lib/site";
import { hasPages, isRich, PAGE_BLOCKS, pageOf, sitePath } from "@/lib/parking-site";
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

type Look = NonNullable<ParkingSiteInfo["theme"]>;

/**
 * The models that have their own ground (24/11/2026): the page's colour tokens are redefined on the site's root, so
 * every block, the booking included, follows without knowing the model.
 */
const TOKENS: Partial<Record<Look, Record<string, string>>> = {
  night: {
    "--color-ground": "#10141b",
    "--color-paper": "#1a212c",
    // `.card` boxes are drawn on white: in the dark they take the paper's tone.
    "--color-white": "#1a212c",
    "--color-tint": "#232c38",
    "--color-line": "#2f3a49",
    "--color-line-soft": "#232c38",
    "--color-ink": "#f2eee6",
    "--color-soft": "#a8b2be",
    "--color-accent-dark": "#f0c98a",
    "--color-ok": "#7fc8a2",
    "--color-ok-bg": "#17322a",
    "--color-warn": "#e6b662",
    "--color-warn-bg": "#35290f",
    "--color-danger": "#f09aa3",
    "--color-danger-bg": "#3a1a1f",
    "--color-danger-line": "#5c2a31",
    colorScheme: "dark",
  },
  home: {
    "--color-ground": "#fbf4e8",
    "--color-paper": "#ffffff",
    "--color-tint": "#f4e9d6",
    "--color-line": "#eadcc6",
    "--color-line-soft": "#f2e8d6",
    "--color-ink": "#3b2a1e",
    "--color-soft": "#75604f",
  },
  express: {
    "--color-ground": "#ffffff",
    "--color-paper": "#ffffff",
    "--color-tint": "#f3f5f7",
    "--color-line": "#dfe2e6",
    "--color-line-soft": "#eceef1",
    "--color-ink": "#0b0b0c",
    "--color-soft": "#55595f",
  },
  // « Prestige » (26/11/2026): white and greys, titles in the text face, black for the action.
  prestige: {
    "--color-ground": "#ffffff",
    "--color-paper": "#ffffff",
    "--color-tint": "#f3f3f3",
    "--color-line": "#dfe3e8",
    "--color-line-soft": "#ececec",
    "--color-ink": "#0d0d0d",
    "--color-soft": "#4a5568",
    "--color-accent-dark": "#0d0d0d",
    "--font-display": "var(--font-sans)",
  },
};

/** « Prestige »: its header is black, so the header's own tokens turn white. */
const DARK_HEADER = {
  "--color-paper": "#0d0d0d",
  "--color-ink": "#ffffff",
  "--color-soft": "rgba(255,255,255,.82)",
  "--color-line": "#2c2c2c",
  "--color-line-soft": "#2c2c2c",
  "--ps-accent": "#ffffff",
  "--ps-ink": "#0d0d0d",
} as React.CSSProperties;

/** « Prestige » keeps to black and white whatever the parking's colours. */
const PRESTIGE_COLOURS = { "--ps-accent": "#0d0d0d", "--ps-ink": "#ffffff", "--ps-accent2": "#ffffff", "--ps-ink2": "#0d0d0d", "--ps-dark": "#0d0d0d" };

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

/** One page: the menu jumps to the blocks. Several pages: it opens them. */
function menuEntries(site: ParkingSiteInfo, blocks: SiteBlock[]): { href: string; label: string }[] {
  const t = fr.parkingSite;
  return hasPages(site)
    ? [
        { href: sitePath(site), label: t.home },
        ...(site.destinations ?? []).slice(0, 3).map(d => ({ href: sitePath(site, d.slug), label: d.name })),
        ...(site.pages?.includes("tarifs") ? [{ href: sitePath(site, "tarifs"), label: t.prices }] : []),
        { href: sitePath(site, "questions"), label: t.questions },
        { href: sitePath(site, "contact"), label: t.contact },
      ]
    : blocks.map(menuEntry).filter(e => e !== null);
}

function Menu({ site, blocks, narrow = false }: { site: ParkingSiteInfo; blocks: SiteBlock[]; narrow?: boolean }) {
  const entries = menuEntries(site, blocks);
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
  const look: Look = site.theme ?? "simple";
  const showcase = look === "showcase";
  const park = look === "park";
  const valet = look === "valet";
  const prestige = look === "prestige";
  const rich = isRich(site);
  const accent2 = site.accent2 ?? site.accent;
  const colours = {
    "--ps-accent": site.accent,
    "--ps-ink": site.accentInk,
    "--ps-accent2": accent2,
    "--ps-ink2": site.accent2 ? (site.accent2Ink ?? site.accentInk) : site.accentInk,
    // « Parc »: a deep blue for its contact bar, its title band and its foot.
    "--ps-dark": "#0e2238",
    ...TOKENS[look],
    // One touch of colour in the dark: the bands take a tone of the night, not the second colour.
    ...(look === "night" ? { "--ps-accent2": "#1a212c", "--ps-ink2": "#f2eee6" } : {}),
    ...(prestige ? PRESTIGE_COLOURS : {}),
  } as React.CSSProperties;
  const destination = opened?.kind === "destination" ? opened.destination : null;
  const heading = destination
    ? t.nearTitle(destination.name)
    : pageKind === "questions"
      ? fr.parkingMore.faqTitle(parking.title)
      : pageKind === "contact"
        ? t.contact
        : pageKind === "tarifs"
          ? t.prices
        : pageKind === "mentions-legales"
          ? t.legal
          : parking.title;
  const lead = destination ? t.nearIntro(parking.title, destination.name) : [airport.name, parking.address].filter(Boolean).join(" · ");
  // In every look but the sober one the booking comes right under the title, whatever its place in the list.
  const booking = rich ? blocks.find(b => b.kind === "booking") : undefined;
  const photo = site.heroPhotoUrl ?? null;
  const veiled = (veil: string) => ({ backgroundImage: `linear-gradient(${veil}), url("${photo}")` });
  const firstPrice = priceRows(parking.pricing)[0] ?? null;
  const chips = look === "express" ? trustTiles(parking, airport.code).map(tile => tile.title) : [];
  const rating = site.rating && !pageKind ? site.rating : null;
  const ratingText = rating ? rating.value.toFixed(1).replace(".", fr.money.decimal) : "";
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
      {(showcase || park || valet || prestige) && (parking.phone || parking.openingHours) && (
        <p
          data-testid="site-topbar"
          className={park ? "bg-[var(--ps-dark)] text-[13px] text-white" : valet || prestige ? `${prestige ? "bg-paper" : "bg-tint"} text-[13px] text-ink` : "bg-[var(--ps-accent)] text-[13px] text-[var(--ps-ink)]"}
        >
          <span className={`${container} flex flex-wrap gap-x-4 gap-y-0.5 py-1.5`}>
            {parking.phone && <span className="font-semibold tabular-nums">{parking.phone}</span>}
            {parking.openingHours && <span>{parking.openingHours}</span>}
          </span>
        </p>
      )}
      <header className="sticky top-0 z-20 border-b border-line bg-paper text-ink" style={prestige ? DARK_HEADER : undefined}>
        <div className={`${container} flex items-center gap-3 py-2.5`}>
          <a href={sitePath(site)} className="flex min-w-0 flex-1 items-center gap-3 text-ink no-underline">
            {logo}
            <span className="min-w-0 truncate text-[16px] font-bold">{parking.title}</span>
          </a>
          <Menu site={site} blocks={blocks} />
          {park && (
            <a href={lp("/ma-reservation")} className="hidden flex-none rounded-[10px] border border-line px-3 py-2 text-[14px] font-semibold text-ink no-underline sm:block">
              {t.myBooking}
            </a>
          )}
          <a
            href={reserve}
            className={prestige ? "flex-none rounded-[4px] bg-white px-4 py-2 text-[14px] font-semibold text-[#0d0d0d]" : "flex-none rounded-[10px] bg-[var(--ps-accent)] px-4 py-2 text-[14px] font-semibold text-[var(--ps-ink)]"}
          >
            {fr.bookingPage.meta}
          </a>
        </div>
        {/* On a phone the pages of a site with several pages sit in a row that scrolls sideways. */}
        {hasPages(site) && <Menu site={site} blocks={blocks} narrow />}
      </header>

      {look === "showcase" && (
        <div
          data-testid="site-hero"
          className="relative bg-[var(--ps-accent)] bg-cover bg-center text-white"
          style={photo ? veiled("rgba(10,20,35,.55), rgba(10,20,35,.55)") : { color: site.accentInk }}
        >
          <div className={`${container} flex flex-col items-center gap-3 pt-10 text-center md:pt-14 ${booking ? "pb-20" : "pb-10 md:pb-14"}`}>
            <h1 className="font-title text-[32px] leading-[1.1] md:text-[48px]">{heading}</h1>
            <p className="max-w-[60ch] text-[15px] font-medium md:text-[16.5px]">{lead}</p>
            {rating && (
              <p data-testid="site-rating" className="flex items-center gap-3 rounded-[12px] bg-paper px-4 py-2 text-left text-ink">
                <span className="text-[24px] font-bold tabular-nums">{ratingText}</span>
                <span className="flex flex-col text-[12.5px] leading-tight">
                  <span aria-hidden="true" className="tracking-[2px] text-[var(--ps-accent2)]">
                    ★★★★★
                  </span>
                  <span className="text-soft">{t.reviews(rating.count)}</span>
                </span>
              </p>
            )}
          </div>
        </div>
      )}
      {look === "postcard" && (
        // The photo fills the first screen; the words sit at its foot.
        <div
          data-testid="site-hero"
          className="relative flex min-h-[70vh] flex-col justify-end bg-dark bg-cover bg-center text-white md:min-h-[82vh]"
          style={photo ? veiled("rgba(12,24,34,.15), rgba(12,24,34,.72)") : undefined}
        >
          <div className={`${container} flex flex-col items-start gap-3 pt-16 ${booking ? "pb-24" : "pb-12"}`}>
            <h1 className="font-title text-[38px] leading-[1.05] md:text-[64px]">{heading}</h1>
            <p className="max-w-[55ch] text-[16px] font-medium md:text-[18px]">{lead}</p>
            {rating && (
              <p data-testid="site-rating" className="text-[14.5px] font-semibold">
                {ratingText} <span aria-hidden="true">★</span> · {t.reviews(rating.count)}
              </p>
            )}
          </div>
        </div>
      )}
      {look === "night" && (
        <div data-testid="site-hero" className="bg-ground bg-cover bg-center" style={photo ? veiled("rgba(16,20,27,.78), rgba(16,20,27,.96)") : undefined}>
          <div className={`${container} flex flex-col items-start gap-3 pt-12 pb-4 md:pt-20 md:pb-8`}>
            <p className="text-[12.5px] font-semibold tracking-[.18em] text-[var(--ps-accent)] uppercase">{airport.name}</p>
            <h1 className="max-w-[18ch] font-title text-[36px] leading-[1.1] md:text-[58px]">{heading}</h1>
            <p className="max-w-[55ch] text-[15.5px] text-soft md:text-[17px]">{destination ? lead : parking.address}</p>
            {rating && (
              <p data-testid="site-rating" className="text-[14px] text-soft">
                <span className="font-semibold text-[var(--ps-accent)]">
                  {ratingText} <span aria-hidden="true">★</span>
                </span>{" "}
                · {t.reviews(rating.count)}
              </p>
            )}
          </div>
        </div>
      )}
      {look === "home" && (
        <div data-testid="site-hero" className={`${container} grid items-center gap-6 pt-8 md:grid-cols-[1.15fr_1fr] md:pt-12`}>
          <div className="flex flex-col items-start gap-3">
            <h1 className="font-title text-[32px] leading-[1.12] md:text-[46px]">{heading}</h1>
            <p className="max-w-[50ch] text-[16px] text-soft">{lead}</p>
            {rating && (
              <p data-testid="site-rating" className="text-[14.5px] font-semibold">
                {ratingText} <span aria-hidden="true" className="text-[var(--ps-accent)]">★</span> · {t.reviews(rating.count)}
              </p>
            )}
            {parking.phone && (
              <a href={`tel:${parking.phone.replace(/\s/g, "")}`} className="rounded-full border border-line bg-paper px-5 py-2.5 text-[17px] font-bold text-ink tabular-nums no-underline">
                {t.call} · {parking.phone}
              </a>
            )}
          </div>
          {(site.teamPhotoUrl ?? photo) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img data-testid="site-team-photo" src={site.teamPhotoUrl ?? photo ?? undefined} alt="" className="aspect-[4/3] w-full rounded-[22px] border border-line object-cover" />
          )}
        </div>
      )}
      {look === "express" && (
        <div data-testid="site-hero" className={`${container} flex flex-col items-start gap-3 pt-6 md:pt-10`}>
          <h1 className="text-[30px] leading-[1.08] font-extrabold tracking-tight md:text-[46px]">{heading}</h1>
          {firstPrice && !pageKind ? (
            <p data-testid="site-price" className="flex flex-wrap items-baseline gap-x-2.5">
              <span className="text-[15px] font-semibold text-soft">{fr.home.from}</span>
              <span className="text-[46px] leading-none font-extrabold text-[var(--ps-accent)] tabular-nums md:text-[60px]">{formatEuros(firstPrice.priceCents)}</span>
              <span className="text-[15px] font-semibold text-soft">{fr.parkingMore.days(firstPrice.days)}</span>
            </p>
          ) : (
            <p className="max-w-[65ch] text-[15px] font-medium text-soft md:text-[16px]">{lead}</p>
          )}
          {(chips.length > 0 || rating) && (
            <ul className="flex flex-wrap gap-2 text-[13.5px] font-semibold">
              {chips.map(chip => (
                <li key={chip} className="rounded-full border border-line px-3 py-1">
                  {chip}
                </li>
              ))}
              {rating && (
                <li data-testid="site-rating" className="rounded-full border border-line px-3 py-1">
                  {ratingText} <span aria-hidden="true">★</span> · {t.reviews(rating.count)}
                </li>
              )}
            </ul>
          )}
        </div>
      )}
      {park && (
        // « Parc » (24/11/2026): the title in capitals over the photo darkened from the left, the booking across its foot.
        <div
          data-testid="site-hero"
          className="bg-[var(--ps-dark)] bg-cover bg-center text-white"
          style={photo ? veiled("90deg, rgba(14,34,56,.94) 35%, rgba(14,34,56,.35)") : undefined}
        >
          <div className={`${container} flex flex-col items-start gap-3 pt-10 md:pt-16 ${booking ? "pb-24" : "pb-12"}`}>
            <h1 className="max-w-[18ch] text-[34px] leading-[1.02] font-extrabold tracking-tight uppercase md:text-[54px]">{heading}</h1>
            <p className="max-w-[52ch] text-[15.5px] font-medium text-white/85 md:text-[17px]">{lead}</p>
            {rating && (
              <p data-testid="site-rating" className="rounded-full bg-white/15 px-3 py-1 text-[14px] font-semibold">
                <span aria-hidden="true" className="tracking-[1px] text-[var(--ps-accent)]">
                  ★★★★★
                </span>{" "}
                {ratingText} · {t.reviews(rating.count)}
              </p>
            )}
          </div>
        </div>
      )}
      {valet && (
        // « Voiturier » (24/11/2026): the title beside the photo, the valet's meeting point laid on it.
        <div data-testid="site-hero" className={`${container} grid items-stretch gap-6 pt-8 md:grid-cols-[1.1fr_1fr] md:pt-12`}>
          <div className="flex flex-col items-start justify-center gap-3">
            <h1 className="font-title text-[34px] leading-[1.06] md:text-[50px]">{heading}</h1>
            <p className="max-w-[48ch] text-[16px] text-soft">{lead}</p>
            {rating && (
              <p data-testid="site-rating" className="text-[14.5px] font-semibold">
                <span aria-hidden="true" className="text-[var(--ps-accent)]">
                  ★★★★★
                </span>{" "}
                {ratingText} · {t.reviews(rating.count)}
              </p>
            )}
          </div>
          <div className="relative min-h-[200px] overflow-hidden rounded-[22px] bg-dark bg-cover bg-center" style={photo ? { backgroundImage: `url("${photo}")` } : undefined}>
            {data.details?.meetingPoint && (
              <p className="absolute bottom-3 left-3 max-w-[80%] rounded-[12px] bg-paper px-3 py-2 text-[13.5px] text-ink">
                <span className="block font-bold">{t.meeting}</span>
                {data.details.meetingPoint}
              </p>
            )}
          </div>
        </div>
      )}
      {prestige && (
        // « Prestige » (26/11/2026): the banner photo in greys behind a centred title, the rating on a white card.
        <div
          data-testid="site-hero"
          className="relative overflow-hidden bg-[#3a3a3a] text-white"
        >
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover grayscale" />
          )}
          <div aria-hidden="true" className="absolute inset-0 bg-black/45" />
          <div className={`${container} relative flex flex-col items-center gap-3 pt-12 text-center md:pt-20 ${booking ? "pb-24" : "pb-12 md:pb-16"}`}>
            <h1 className="max-w-[22ch] text-[30px] leading-[1.12] font-bold md:text-[46px]">{heading}</h1>
            <p className="max-w-[60ch] text-[15px] md:text-[16.5px]">{lead}</p>
            {rating && (
              <p data-testid="site-rating" className="mt-1 flex items-center gap-3 rounded-[10px] bg-white px-4 py-2 text-left text-[#0d0d0d]">
                <span className="text-[26px] font-bold tabular-nums">{ratingText}</span>
                <span className="flex flex-col border-l border-line pl-3 text-[12.5px] leading-tight">
                  <span aria-hidden="true" className="tracking-[2px] text-[#f2a93b]">
                    ★★★★★
                  </span>
                  <span className="text-soft">{t.reviews(rating.count)}</span>
                </span>
              </p>
            )}
          </div>
        </div>
      )}
      {look === "simple" && (
        <div className={`${container} flex flex-col gap-2 pt-6 md:pt-10`}>
          <h1 className="font-title text-[30px] leading-[1.1] md:text-[44px]">{heading}</h1>
          <p className="max-w-[65ch] text-[15px] font-medium text-soft md:text-[16px]">{lead}</p>
        </div>
      )}

      <main className="flex flex-1 flex-col gap-8 pb-10 md:gap-10">
        {booking && showcase && (
          <div className={`${container} relative z-10 -mt-12`}>
            <div className="rounded-[18px] bg-[var(--ps-accent2)] p-3 text-[var(--ps-ink2)] md:p-4">{draw(booking)}</div>
          </div>
        )}
        {booking && look === "postcard" && (
          <div className={`${container} relative z-10 -mt-16`}>
            <div className="rounded-[18px] bg-ground p-3 shadow-[0_12px_40px_rgba(12,24,34,.25)] md:p-4">{draw(booking)}</div>
          </div>
        )}
        {booking && park && (
          <div className={`${container} relative z-10 -mt-16`}>
            <div className="rounded-[18px] bg-paper p-3 shadow-[0_12px_40px_rgba(14,34,56,.22)] md:p-4">{draw(booking)}</div>
          </div>
        )}
        {booking && valet && (
          <div className={`${container} mt-6`}>
            <div className="rounded-[18px] border border-line bg-paper p-3 shadow-[0_12px_32px_rgba(0,0,0,.08)] md:p-4">{draw(booking)}</div>
          </div>
        )}
        {booking && prestige && (
          <div className={`${container} relative z-10 -mt-16`}>
            <div className="rounded-[8px] border border-line bg-paper p-3 shadow-[0_12px_40px_rgba(0,0,0,.18)] md:p-4">{draw(booking)}</div>
          </div>
        )}
        {booking && !showcase && !park && !valet && !prestige && look !== "postcard" && <div className={`${container} mt-6`}>{draw(booking)}</div>}
        {!booking && <div aria-hidden="true" className="-mb-4" />}
        {destination?.instructions && (
          <section className={`${container} flex flex-col gap-2`}>
            <h2 className="font-title text-[22px] leading-tight md:text-[26px]">{t.onSite}</h2>
            <p className="text-[15.5px] leading-relaxed whitespace-pre-line">{destination.instructions}</p>
          </section>
        )}
        {rest.map(block =>
          rich && BAND_BLOCKS.includes(block.kind) ? (
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

      <SiteFooter site={site} data={data} blocks={blocks} dark={park || prestige} logo={site.logoUrl ?? null} />
      {rich && <StickyBar site={site} data={data} reserve={reserve} />}
    </div>
  );
}

/**
 * On a phone, every look but the sober one (24/11/2026, « tout »): a bar fixed at the bottom with call, directions, write
 * and book. The page keeps room for it at its foot.
 */
/**
 * The foot of every page (25/11/2026, « fais un pied de page avec les infos du parking », choix C « Plan d'accès »): in the
 * parking's colour (its deep blue in « Parc »), a small drawn plan with the parking pinned and the airport beside it, then
 * the name, the address, the hours and the phone with « Itinéraire » and « Appeler », the site's links, and a last line
 * with the company (name, SIRET, VAT from its billing details), the legal notice and « Réservation par Plazo ». Anything
 * the parking has not given is left out.
 */
function SiteFooter({ site, data, blocks, dark, logo }: { site: ParkingSiteInfo; data: ParkingResponse; blocks: SiteBlock[]; dark: boolean; logo: string | null }) {
  const t = fr.parkingSite;
  const { parking, airport } = data;
  const legal = site.legal;
  const links = menuEntries(site, blocks);
  const where = parking.address ?? `${parking.title}, ${airport.name}`;
  const company = legal?.name ?? parking.title;
  const button = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[10px] px-4 text-[14px] font-semibold no-underline";
  return (
    <footer
      data-testid="site-footer"
      className={dark ? "bg-[var(--ps-dark)] text-white" : "bg-[var(--ps-accent)] text-[var(--ps-ink)]"}
    >
      <div className={`${container} grid gap-6 py-8 md:grid-cols-2 md:items-center md:py-10`}>
        <a
          href={mapsUrl(where)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t.directions} · ${parking.title}`}
          data-testid="site-footer-plan"
          className="relative block min-h-[150px] overflow-hidden rounded-[14px] bg-[#e6ecf3] md:min-h-[190px]"
        >
          <svg aria-hidden="true" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
            <rect width="400" height="200" fill="#e6ecf3" />
            <path d="M-10 150 L150 95 L420 40" stroke="#ffffff" strokeWidth="14" fill="none" strokeLinecap="round" />
            <path d="M60 -10 L130 210" stroke="#ffffff" strokeWidth="8" fill="none" opacity="0.8" />
            <path d="M260 210 L330 -10" stroke="#ffffff" strokeWidth="6" fill="none" opacity="0.6" />
            <path d="M175 92 C 230 75, 280 70, 320 58" stroke="var(--ps-accent)" strokeWidth="3" strokeDasharray="6 6" fill="none" />
          </svg>
          <span className="absolute top-[38%] left-[40%] flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white bg-[var(--ps-accent)] text-[13px] font-bold text-[var(--ps-ink)] shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
            P
          </span>
          <span className="absolute right-[6%] top-[14%] rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-[#1b2430] shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
            ✈ {parking.shuttleMinutes ? t.footerAirport(airport.name, parking.shuttleMinutes) : airport.name}
          </span>
        </a>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="size-10 flex-none rounded-[10px] bg-white object-contain p-0.5" />
            ) : (
              <span aria-hidden="true" className="flex size-10 flex-none items-center justify-center rounded-[10px] bg-white text-[14px] font-bold text-[var(--ps-accent)]">
                {initials(parking.title)}
              </span>
            )}
            <p className="min-w-0 text-[19px] leading-tight font-bold">{parking.title}</p>
          </div>
          <div className="text-[15px] leading-relaxed">
            {parking.address && <p>{parking.address}</p>}
            {(parking.openingHours || parking.phone) && (
              <p>
                {[parking.openingHours, parking.phone].filter(Boolean).map((part, i) => (
                  <span key={i} className={i ? "tabular-nums" : undefined}>
                    {i ? " · " : ""}
                    {part}
                  </span>
                ))}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={mapsUrl(where)} target="_blank" rel="noopener noreferrer" className={`${button} bg-white text-[#1b2430]`}>
              {t.directions}
            </a>
            {parking.phone && (
              <a href={`tel:${parking.phone.replace(/[^+\d]/g, "")}`} className={`${button} border border-current text-inherit`}>
                {t.call}
              </a>
            )}
          </div>
          {links.length > 0 && (
            <nav aria-label={t.footerLinks} className="flex flex-wrap gap-x-4 gap-y-1 text-[14px] opacity-90">
              {links.map(link => (
                <a key={link.href} href={link.href} className="text-inherit underline-offset-2 hover:underline">
                  {link.label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>
      <div className="bg-black/15">
        <div className={`${container} flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 py-3 text-[12.5px]`}>
          <p className="flex flex-wrap gap-x-3 gap-y-0.5">
            <span>
              © {new Date().getFullYear()} {company}
            </span>
            {legal?.siret && <span>SIRET {legal.siret}</span>}
            {legal?.vatNumber && (
              <span>
                {t.vat} {legal.vatNumber}
              </span>
            )}
            {hasPages(site) && (
              <a href={sitePath(site, "mentions-legales")} className="text-inherit underline">
                {t.legal}
              </a>
            )}
          </p>
          <a href={`${siteUrl()}${lp("/")}`} className="font-semibold text-inherit underline-offset-2 hover:underline">
            {fr.bookingPage.by}
          </a>
        </div>
      </div>
    </footer>
  );
}

function StickyBar({ site, data, reserve }: { site: ParkingSiteInfo; data: ParkingResponse; reserve: string }) {
  const t = fr.parkingSite;
  const { parking, airport } = data;
  const write = hasPages(site) ? sitePath(site, "contact") : sitePath(site, null, "#contact");
  const item = "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[12px] font-semibold no-underline";
  return (
    <>
      <div aria-hidden="true" className="h-16 md:hidden" />
      <nav
        data-testid="site-sticky-bar"
        aria-label={site.title}
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {parking.phone && (
          <a href={`tel:${parking.phone.replace(/[^+\d]/g, "")}`} className={`${item} text-ink`}>
            <span aria-hidden="true">☎</span>
            {t.call}
          </a>
        )}
        <a href={mapsUrl(parking.address ?? `${parking.title}, ${airport.name}`)} target="_blank" rel="noopener noreferrer" className={`${item} text-ink`}>
          <span aria-hidden="true">➤</span>
          {t.directions}
        </a>
        <a href={write} className={`${item} text-ink`}>
          <span aria-hidden="true">✉</span>
          {t.write}
        </a>
        <a href={reserve} className={`${item} bg-[var(--ps-accent)] text-[var(--ps-ink)]`}>
          {t.book}
        </a>
      </nav>
    </>
  );
}
