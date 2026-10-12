import { formatDay } from "@/lib/dates";
import { fr } from "@/lib/fr";

/** "2026-10-17T08:00": the day in words, the hour in the mono face of the hours. */
function When({ local }: { local: string }) {
  return (
    <>
      <span>{formatDay(local.slice(0, 10))}</span> <span className="font-hour text-[13.5px]">{local.slice(11, 16)}</span>
    </>
  );
}

/**
 * « Dépôt » and « Retour » on two cream tiles, with the booked day and hour: the booking recap and the payment step
 * (where the hours explain a « Frais de nuit · dépôt à 23:30 » line under them).
 */
export function StayTiles({ arrivalAt, returnAt }: { arrivalAt: string; returnAt: string }) {
  return (
    <dl className="grid grid-cols-2 gap-2">
      <div className="rounded-field bg-tint px-3 py-2.5">
        <dt className="eyebrow">{fr.booking.summaryDropOff}</dt>
        <dd className="mt-1 text-[14.5px] leading-snug font-bold">
          <When local={arrivalAt} />
        </dd>
      </div>
      <div className="rounded-field bg-tint px-3 py-2.5">
        <dt className="eyebrow">{fr.booking.summaryPickUp}</dt>
        <dd className="mt-1 text-[14.5px] leading-snug font-bold">
          <When local={returnAt} />
        </dd>
      </div>
    </dl>
  );
}
