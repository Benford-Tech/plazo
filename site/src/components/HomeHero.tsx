import { Breadcrumb } from "./Breadcrumb";
import { SearchForm } from "./SearchForm";
import { fr } from "@/lib/fr";

/**
 * Phone layout (below 640 px) of the hero, kept in this one object (`max-sm:` utilities, and
 * `sm:hidden` for the phone-only parts) so that it can change on its own: the rest of each class
 * list is the tablet and desktop layout.
 *
 * Phones (M-A, 02/10/2026): the airport as a kicker, a shorter title, no lead, one "Vos dates" pill
 * opening the bottom sheet, and the reassurance points as three chips on the photo.
 */
const MOBILE = {
  section: "max-sm:min-h-0",
  inner: "max-sm:gap-3.5 max-sm:px-4 max-sm:pt-6 max-sm:pb-8",
  kicker: "sm:hidden flex items-center gap-1.5 text-[13px] font-semibold tracking-[.06em] text-white/90 uppercase",
  title: "max-sm:text-[32px] max-sm:leading-[1.1]",
  longTitle: "max-sm:hidden",
  shortTitle: "sm:hidden",
  lead: "max-sm:hidden",
  form: "max-sm:mt-1",
  chips: "sm:hidden flex flex-wrap gap-1.5",
  chip: "rounded-full border border-white/45 bg-white/15 px-2.5 py-1 text-[13px] font-semibold whitespace-nowrap text-white backdrop-blur-[2px]",
  credit: "max-sm:right-3 max-sm:bottom-1.5",
  trust: "max-sm:hidden",
};

/** The airport's name never breaks at its hyphen ("Saint-/Exupéry"). */
function nameKeptWhole(title: string, name: string) {
  const i = title.indexOf(name);
  if (i < 0) return title;
  return (
    <>
      {title.slice(0, i)}
      <span className="whitespace-nowrap">{name}</span>
      {title.slice(i + name.length)}
    </>
  );
}

const HERO_IMAGE = "/images/hero-tarmac";

/**
 * Hero of the home and airport pages: photo of a tarmac at sunset (Pexels licence, credited)
 * under a prune veil, the title, the search card, then the reassurance strip under the photo.
 */
export function HomeHero({
  airport,
  arrivee,
  retour,
  minDate,
  breadcrumb,
}: {
  airport: { slug: string; name: string; code?: string };
  arrivee: string;
  retour: string;
  minDate: string;
  breadcrumb: boolean;
}) {
  return (
    <>
      <section className={`on-dark relative isolate text-white sm:min-h-[560px] ${MOBILE.section}`}>
        <picture>
          <source type="image/webp" srcSet={`${HERO_IMAGE}-800.webp 800w, ${HERO_IMAGE}-1600.webp 1600w`} sizes="100vw" />
          {/* A static, pre-sized photo: no image proxy needed; fetched first (largest paint). */}
          <img
            src={`${HERO_IMAGE}-1600.jpg`}
            srcSet={`${HERO_IMAGE}-800.jpg 800w, ${HERO_IMAGE}-1600.jpg 1600w`}
            sizes="100vw"
            alt=""
            width={1600}
            height={900}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_60%]"
          />
        </picture>
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(75,22,76,.92)_0%,rgba(114,42,126,.75)_45%,rgba(155,62,107,.15)_100%)]"
        />
        <div className={`mx-auto flex max-w-[1280px] flex-col gap-5 px-12 pt-14 pb-16 md:pt-16 ${MOBILE.inner}`}>
          {breadcrumb && <Breadcrumb onDark items={[{ label: fr.nav.home, href: "/" }, { label: airport.name }]} />}
          <p className={MOBILE.kicker}>
            <span aria-hidden="true">✈</span>
            {airport.name}
          </p>
          <h1 className={`font-title max-w-[880px] text-[44px] leading-[1.05] md:text-[56px] ${MOBILE.title}`}>
            <span className={MOBILE.longTitle}>{nameKeptWhole(fr.home.heroTitle(airport.name), airport.name)}</span>{" "}
            <span className={MOBILE.shortTitle}>{fr.home.heroTitleShort}</span>
          </h1>
          <p className={`max-w-[640px] text-lg text-[#f1dff3] ${MOBILE.lead}`}>{fr.home.heroLead}</p>
          <div className={`sm:mt-4 ${MOBILE.form}`}>
            <SearchForm floating compactPhone airport={airport} arrivee={arrivee} retour={retour} minDate={minDate} idPrefix="accueil" />
          </div>
          <ul className={MOBILE.chips}>
            {fr.home.chips.map(chip => (
              <li key={chip} className={MOBILE.chip}>
                {chip}
              </li>
            ))}
          </ul>
        </div>
        <span className={`absolute right-4 bottom-2.5 text-[11px] text-white/75 ${MOBILE.credit}`}>{fr.home.photoCredit}</span>
      </section>
      <ul className={`mx-auto flex w-full max-w-[1280px] flex-wrap gap-x-6 gap-y-2 px-12 pt-7 text-[15px] text-soft ${MOBILE.trust}`}>
        {fr.home.trust.map(([title, text]) => (
          <li key={title}>
            <span aria-hidden="true" className="font-bold text-accent">
              ✓{" "}
            </span>
            <b className="font-semibold text-ink">{title}</b> <span>· {text}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
