import { StayFields } from "./StayFields";
import { Caret, IconChip, PlaneIcon, pillBox, pillFocusWithin, pillNative, pillNativeLabel } from "./stay/pill";
import { fr } from "@/lib/fr";
import { AIRPORTS } from "@/lib/site";

/**
 * Search bar (airport, drop-off, return) as a white card of pills. A plain GET form to /recherche,
 * which joins the date and time fields and redirects to the results page: it works without JavaScript.
 */
export function SearchForm({
  airport,
  arrivee,
  retour,
  minDate,
  errors,
  idPrefix = "recherche",
  floating = false,
  keepMap = false,
  compactPhone = false,
}: {
  airport: { slug: string; name: string; code?: string };
  arrivee: string | null;
  retour: string | null;
  minDate: string;
  errors?: { arrivalAt?: string; returnAt?: string };
  idPrefix?: string;
  /** White card on the hero photo (home) rather than a bordered panel. */
  floating?: boolean;
  /** Results page with the map shown: the new results show it too. */
  keepMap?: boolean;
  /**
   * Home hero on phones (below 640 px): one "Vos dates" pill instead of the four date and time
   * pills, and no airport pill while there is a single airport (its value is still sent).
   */
  compactPhone?: boolean;
}) {
  const airports = AIRPORTS.some(a => a.slug === airport.slug) ? AIRPORTS : [{ slug: airport.slug, name: airport.name }, ...AIRPORTS];
  return (
    <form
      action="/recherche"
      method="get"
      className={`flex flex-col gap-2.5 rounded-[20px] bg-white p-3 text-ink xl:flex-row xl:items-start ${
        floating ? "shadow-[0_24px_50px_-20px_rgba(30,10,40,.55)]" : "border border-line"
      }`}
    >
      {keepMap && <input type="hidden" name="carte" value="1" />}
      <div className={`${pillBox} ${pillFocusWithin} w-full xl:w-[250px] xl:flex-none ${compactPhone && airports.length === 1 ? "max-sm:hidden" : ""}`}>
        <IconChip>
          <PlaneIcon />
        </IconChip>
        <label htmlFor={`${idPrefix}-aeroport`} className={pillNativeLabel}>
          {fr.search.airport}
        </label>
        <select id={`${idPrefix}-aeroport`} name="aeroport" defaultValue={airport.slug} className={`${pillNative} cursor-pointer truncate pr-8`}>
          {airports.map(a => (
            <option key={a.slug} value={a.slug}>
              {a.name}
            </option>
          ))}
        </select>
        <Caret />
      </div>
      <StayFields
        idPrefix={idPrefix}
        arrivee={arrivee}
        retour={retour}
        minDate={minDate}
        errors={errors}
        phoneSummary={compactPhone}
        className="sm:flex-row xl:min-w-0 xl:flex-1"
      />
      <button type="submit" className="btn-primary h-14 flex-none px-7 text-[17px]">
        {fr.search.submit}
      </button>
    </form>
  );
}
