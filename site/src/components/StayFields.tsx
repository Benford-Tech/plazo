"use client";

import { useState } from "react";
import { FieldError } from "./FieldError";
import { fr } from "@/lib/fr";
import { parseLocal } from "@/lib/dates";

/**
 * Drop-off and return, each as a native date input and a native time input. Submitted as
 * date_depot, heure_depot, date_retour and heure_retour (joined by the /recherche handler).
 */
export function StayFields({
  idPrefix,
  arrivee,
  retour,
  minDate,
  errors = {},
  compactLabels = false,
  className = "",
}: {
  idPrefix: string;
  arrivee: string | null;
  retour: string | null;
  /** Today at the parking, computed by the server (no hydration mismatch). */
  minDate: string;
  errors?: { arrivalAt?: string; returnAt?: string };
  compactLabels?: boolean;
  className?: string;
}) {
  const a = parseLocal(arrivee);
  const r = parseLocal(retour);
  const [arrivalDate, setArrivalDate] = useState(a?.date ?? "");
  const returnMin = arrivalDate && arrivalDate > minDate ? arrivalDate : minDate;

  const group = (
    key: "depot" | "retour",
    legend: string,
    dateLabel: string,
    timeLabel: string,
    value: { date: string; time: string } | null,
    error: string | undefined,
    min: string,
  ) => {
    const errorId = `${idPrefix}-${key}-error`;
    return (
      <fieldset className="min-w-0 flex-1" aria-describedby={error ? errorId : undefined}>
        <legend className="label">{legend}</legend>
        <div className="flex gap-2">
          <label htmlFor={`${idPrefix}-date-${key}`} className="sr-only">
            {dateLabel}
          </label>
          <input
            id={`${idPrefix}-date-${key}`}
            name={`date_${key}`}
            type="date"
            required
            min={min}
            defaultValue={value?.date}
            aria-invalid={error ? true : undefined}
            onChange={key === "depot" ? e => setArrivalDate(e.currentTarget.value) : undefined}
            className="field flex-1 font-semibold tabular-nums"
          />
          <label htmlFor={`${idPrefix}-heure-${key}`} className="sr-only">
            {timeLabel}
          </label>
          <input
            id={`${idPrefix}-heure-${key}`}
            name={`heure_${key}`}
            type="time"
            required
            step={300}
            defaultValue={value?.time}
            aria-invalid={error ? true : undefined}
            className="field w-[8.75rem] flex-none font-semibold tabular-nums"
          />
        </div>
        <FieldError id={errorId} code={error} />
      </fieldset>
    );
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {group(
        "depot",
        compactLabels ? fr.parking.dropOff : fr.search.dropOff,
        fr.search.dropOffDate,
        fr.search.dropOffTime,
        a,
        errors.arrivalAt,
        minDate,
      )}
      {group("retour", compactLabels ? fr.parking.pickUp : fr.search.pickUp, fr.search.pickUpDate, fr.search.pickUpTime, r, errors.returnAt, returnMin)}
    </div>
  );
}
