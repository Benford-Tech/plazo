import { StayFields } from "./StayFields";
import { fr } from "@/lib/fr";
import { AIRPORTS } from "@/lib/site";

/**
 * Search bar (airport, drop-off, return). A plain GET form to /recherche, which joins the date and
 * time fields and redirects to the results page: it works without JavaScript.
 */
export function SearchForm({
  airport,
  arrivee,
  retour,
  minDate,
  errors,
  idPrefix = "recherche",
  floating = false,
}: {
  airport: { slug: string; name: string; code?: string };
  arrivee: string | null;
  retour: string | null;
  minDate: string;
  errors?: { arrivalAt?: string; returnAt?: string };
  idPrefix?: string;
  /** White card on the hero gradient (home) rather than a bordered panel. */
  floating?: boolean;
}) {
  const airports = AIRPORTS.some(a => a.slug === airport.slug) ? AIRPORTS : [{ slug: airport.slug, name: airport.name }, ...AIRPORTS];
  return (
    <form
      action="/recherche"
      method="get"
      className={`flex flex-col gap-3 rounded-[16px] bg-white p-3.5 text-ink xl:flex-row xl:items-start xl:rounded-[20px] ${
        floating ? "shadow-[0_18px_40px_-18px_rgba(0,0,0,.5)]" : "border border-line"
      }`}
    >
      <div className="min-w-0 xl:flex-1">
        <label htmlFor={`${idPrefix}-aeroport`} className="label">
          {fr.search.airport}
        </label>
        <select id={`${idPrefix}-aeroport`} name="aeroport" defaultValue={airport.slug} className="field font-medium">
          {airports.map(a => (
            <option key={a.slug} value={a.slug}>
              {a.name}
              {a.slug === airport.slug && airport.code ? ` (${airport.code})` : ""}
            </option>
          ))}
        </select>
      </div>
      <StayFields
        idPrefix={idPrefix}
        arrivee={arrivee}
        retour={retour}
        minDate={minDate}
        errors={errors}
        className="sm:flex-row xl:flex-[2.2]"
      />
      <button type="submit" className="btn-primary h-[52px] px-7 text-[17px] xl:mt-[22px] xl:h-12">
        {fr.search.submit}
      </button>
    </form>
  );
}
