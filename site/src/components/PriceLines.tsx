import { Fragment } from "react";
import { fr } from "@/lib/fr";
import { formatEuros } from "@/lib/money";
import { basePriceOf, chargedNightFee, nightFeeParts, nightRuleSentence } from "@/lib/night-fees";
import type { NightFee, NightRule } from "@/lib/types";

/** « Frais de nuit · dépôt à 23:30 », the hour in the hours' mono face (Boutique: hours only). */
export function NightFeeLabel({ fee, arrivalAt, returnAt }: { fee: NightFee | null | undefined; arrivalAt: string; returnAt: string }) {
  const parts = nightFeeParts(fee, arrivalAt, returnAt);
  if (!parts) return null;
  return (
    <>
      {parts.map((part, i) =>
        "hour" in part ? (
          <span key={i} className="font-hour text-[13.5px]">
            {part.hour}
          </span>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * The price detail of a stay (direction B, 12/10/2026): « Forfait N jours » (the price grid's part), the night fee
 * line when the stay pays one, « Frais de service 0,00 € » where the page shows it, then the total. Used by the
 * parking page's booking card, the booking recap and the payment step, so the three always add up the same way.
 */
export function PriceLines({
  days,
  priceCents,
  basePriceCents,
  nightFee,
  arrivalAt,
  returnAt,
  totalLabel,
  serviceFee = false,
  packageLine = "always",
  className = "",
  totalClassName = "text-[18px]",
}: {
  days: number;
  /** The total, night fees included. */
  priceCents: number;
  basePriceCents?: number | null;
  nightFee?: NightFee | null;
  /** Booked local times "YYYY-MM-DDTHH:mm", for the hours on the night fee line. */
  arrivalAt: string;
  returnAt: string;
  totalLabel: string;
  /** « Frais de service 0,00 € » (the parking page and the booking recap). */
  serviceFee?: boolean;
  /** "withNightFee": the package line only when a night fee line follows it (payment step: the total alone otherwise). */
  packageLine?: "always" | "withNightFee";
  className?: string;
  totalClassName?: string;
}) {
  const fee = chargedNightFee(nightFee);
  const base = basePriceOf({ priceCents, basePriceCents, nightFee }) ?? priceCents;
  const line = "flex justify-between gap-3";
  return (
    <dl className={`flex flex-col gap-2 text-[14.5px] font-medium tabular-nums ${className}`}>
      {(packageLine === "always" || fee) && (
        <div className={line}>
          <dt className="text-soft">{fr.parking.packageLine(days)}</dt>
          <dd className="font-semibold">{formatEuros(base)}</dd>
        </div>
      )}
      {fee && (
        <div className={line}>
          <dt className="text-soft">
            <NightFeeLabel fee={fee} arrivalAt={arrivalAt} returnAt={returnAt} />
          </dt>
          <dd className="font-semibold">{formatEuros(fee.totalCents)}</dd>
        </div>
      )}
      {serviceFee && (
        <div className={line}>
          <dt className="text-soft">{fr.parking.serviceFee}</dt>
          <dd className="font-semibold">{formatEuros(0)}</dd>
        </div>
      )}
      <div className={`${line} mt-1 border-t border-line-soft pt-3 font-extrabold ${totalClassName}`}>
        <dt>{totalLabel}</dt>
        <dd>{formatEuros(priceCents)}</dd>
      </div>
    </dl>
  );
}

/** The parking's night rule under its price lines: « Ce parking ajoute 15 € pour un dépôt ou un retour entre 22:00 et 06:00. » */
export function NightRuleNote({ rule, className = "" }: { rule: NightRule | null | undefined; className?: string }) {
  const sentence = nightRuleSentence(rule);
  if (!sentence) return null;
  return <p className={`text-[12.5px] leading-snug font-medium text-soft ${className}`}>{sentence}</p>;
}
