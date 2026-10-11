"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { FieldError } from "./FieldError";
import {
  CalendarIcon,
  Caret,
  ClockIcon,
  IconChip,
  pillActive,
  pillBox,
  pillFocus,
  pillFocusWithin,
  pillInvalid,
  pillHour,
  pillIdle,
  pillLabel,
  pillNative,
  pillNativeHour,
  pillNativeLabel,
  pillValue,
} from "./stay/pill";
import { hasRoomForTwoMonths, isPhone } from "./stay/popup";
import { DatesPopover, StaySheet, TimePopover, type StayValue } from "./stay/StayPickers";
import { formatDayLong, validDateOrNull, type Side } from "@/lib/calendar";
import { formatDay, parseLocal } from "@/lib/dates";
import { fr } from "@/lib/fr";

const subscribe = () => () => {};

type Open = { kind: "dates" | "time" | "sheet"; side: Side } | null;

/**
 * Drop-off and return, each as a date pill and a time pill. Submitted as date_depot, heure_depot,
 * date_retour and heure_retour (joined by the /recherche handler).
 *
 * Without JavaScript (and in the server HTML) the pills hold native date and time inputs. Once the
 * page is hydrated they become buttons opening the stay pickers (a popover on larger screens, a
 * bottom sheet on phones) and the values travel in hidden inputs with the same names.
 *
 * With `phoneSummary`, a hydrated page shows phones one "Vos dates" field in two rows, Dépôt and
 * Retour, each with its date and hour (Boutique, 11/10/2026: never one truncated line), each row
 * opening the bottom sheet on its side, instead of the four pills; without JavaScript phones keep the
 * natives.
 */
export function StayFields({
  idPrefix,
  arrivee,
  retour,
  minDate,
  errors = {},
  compactLabels = false,
  layout = "bar",
  phoneSummary = false,
  className = "",
}: {
  idPrefix: string;
  arrivee: string | null;
  retour: string | null;
  /** Today at the parking, computed by the server (no hydration mismatch). */
  minDate: string;
  errors?: { arrivalAt?: string; returnAt?: string };
  compactLabels?: boolean;
  /** "bar": search bar (wide time pills); "card": narrow booking card. */
  layout?: "bar" | "card";
  /** Phones (below 640 px), once hydrated: one "Vos dates" field (two rows) opening the bottom sheet. */
  phoneSummary?: boolean;
  className?: string;
}) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const a = parseLocal(arrivee);
  const r = parseLocal(retour);
  const [value, setValue] = useState<StayValue>({
    arrivalDate: validDateOrNull(a?.date) ?? "",
    arrivalTime: a?.time ?? "",
    returnDate: validDateOrNull(r?.date) ?? "",
    returnTime: r?.time ?? "",
  });
  const [open, setOpen] = useState<Open>(null);
  const [months, setMonths] = useState<1 | 2>(2);
  const trigger = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(null);
    trigger.current?.focus();
  }, []);

  const toggle = (kind: "dates" | "time", side: Side, el: HTMLElement) => {
    if (open && open.kind === kind && open.side === side) {
      close();
      return;
    }
    trigger.current = el;
    setMonths(hasRoomForTwoMonths() ? 2 : 1);
    setOpen({ kind: isPhone() ? "sheet" : kind, side });
  };

  const summary = phoneSummary && hydrated;

  /** A row of the phone's field opens the bottom sheet on its side (data-side). */
  const openSheet = (event: React.MouseEvent<HTMLButtonElement>) => {
    trigger.current = event.currentTarget;
    setOpen({ kind: "sheet", side: event.currentTarget.dataset.side === "end" ? "end" : "start" });
  };

  const timeWidth = layout === "bar" ? "w-[136px] xl:w-[150px]" : "w-[136px]";

  const group = (key: "depot" | "retour", side: Side, legend: string, error: string | undefined) => {
    const errorId = `${idPrefix}-${key}-error`;
    const date = side === "start" ? value.arrivalDate : value.returnDate;
    const time = side === "start" ? value.arrivalTime : value.returnTime;
    const dateId = `${idPrefix}-date-${key}`;
    const timeId = `${idPrefix}-heure-${key}`;
    const dateLabel = side === "start" ? fr.picker.dropOff : fr.picker.pickUp;
    const dateName = side === "start" ? fr.search.dropOffDate : fr.search.pickUpDate;
    const timeName = side === "start" ? fr.search.dropOffTime : fr.search.pickUpTime;
    const border = error ? pillInvalid : pillIdle;
    const isOpen = (kind: "dates" | "time") => !!open && open.side === side && (open.kind === kind || (open.kind === "sheet" && kind === "dates"));

    const pill = (kind: "dates" | "time") => {
      const id = kind === "dates" ? dateId : timeId;
      const label = kind === "dates" ? dateLabel : fr.picker.time;
      const icon = kind === "dates" ? <CalendarIcon /> : <ClockIcon />;
      const width = kind === "dates" ? "min-w-0 flex-1" : `${timeWidth} flex-none`;
      if (!hydrated) {
        // Native field: works without JavaScript.
        return (
          <div className={`${pillBox} ${pillFocusWithin} ${border} ${width}`}>
            <IconChip>{icon}</IconChip>
            <label htmlFor={id} className={pillNativeLabel}>
              {label}
              <span className="sr-only"> ({kind === "dates" ? dateName : timeName})</span>
            </label>
            <input
              id={id}
              name={kind === "dates" ? `date_${key}` : `heure_${key}`}
              type={kind === "dates" ? "date" : "time"}
              required
              min={kind === "dates" ? minDate : undefined}
              step={kind === "time" ? 300 : undefined}
              defaultValue={kind === "dates" ? date : time}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={kind === "dates" ? pillNative : pillNativeHour}
            />
          </div>
        );
      }
      const shown = kind === "dates" ? (date ? formatDay(date) : null) : time || null;
      const spoken = kind === "dates" ? (date ? formatDayLong(date) : null) : time || null;
      return (
        <button
          id={id}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isOpen(kind)}
          aria-label={fr.picker.pill(kind === "dates" ? dateName : timeName, spoken)}
          aria-describedby={error ? errorId : undefined}
          onClick={e => toggle(kind, side, e.currentTarget)}
          className={`${pillBox} ${pillFocus} ${isOpen(kind) ? pillActive : border} ${width} cursor-pointer`}
        >
          <IconChip>{icon}</IconChip>
          <span className="flex min-w-0 flex-col">
            <span className={pillLabel}>{label}</span>
            {shown ? (
              <span className={kind === "dates" ? pillValue : `block truncate ${pillHour}`}>{shown}</span>
            ) : (
              <span className={`${pillValue} font-semibold text-soft`}>{fr.picker.choose}</span>
            )}
          </span>
          {kind === "dates" ? (
            <Caret />
          ) : (
            // Narrow time pills keep their room for the value: caret only in the wide search bar.
            layout === "bar" && (
              <span className="ml-auto hidden xl:flex">
                <Caret />
              </span>
            )
          )}
        </button>
      );
    };

    return (
      <fieldset className={`min-w-0 flex-1 ${summary ? "max-sm:hidden" : ""}`}>
        <legend className="sr-only">{legend}</legend>
        <div className="flex gap-2">
          {pill("dates")}
          {pill("time")}
        </div>
        <FieldError id={errorId} code={error} />
      </fieldset>
    );
  };

  const timeLabel = open?.side === "end" ? fr.picker.pickUpTime : fr.picker.dropOffTime;

  /**
   * Phones: the stay as one field in two rows, Dépôt then Retour, each with its date and hour (never one
   * truncated line). Each row opens the bottom sheet on its side.
   */
  const summaryField = () => {
    const at = (date: string, time: string) => `${formatDayLong(date)}${time ? ` à ${time}` : ""}`;
    const error = errors.arrivalAt ?? errors.returnAt;
    const errorId = `${idPrefix}-dates-error`;
    const row = (side: Side) => {
      const date = side === "start" ? value.arrivalDate : value.returnDate;
      const time = side === "start" ? value.arrivalTime : value.returnTime;
      const label = side === "start" ? fr.picker.dropOff : fr.picker.pickUp;
      return (
        <button
          id={`${idPrefix}-dates-${side === "start" ? "depot" : "retour"}`}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open?.kind === "sheet" && open.side === side}
          aria-label={fr.picker.pill(label, date ? at(date, time) : null)}
          aria-describedby={error ? errorId : undefined}
          data-side={side}
          onClick={openSheet}
          className="flex min-h-12 w-full cursor-pointer items-center gap-3 px-3.5 py-2 text-left text-ink first:rounded-t-field last:rounded-b-field hover:bg-ground/60 focus-visible:outline-2 focus-visible:-outline-offset-2"
        >
          <span aria-hidden="true" className="flex size-5 flex-none items-center justify-center text-soft">
            <CalendarIcon />
          </span>
          <span className={`${pillLabel} w-[54px] flex-none`}>{label}</span>
          {date ? (
            <span className="min-w-0 flex-1 truncate text-[15px] leading-tight font-bold">{formatDay(date)}</span>
          ) : (
            <span className="min-w-0 flex-1 truncate text-[15px] leading-tight font-semibold text-soft">{fr.picker.choose}</span>
          )}
          {date && time && <span className={`${pillHour} flex-none`}>{time}</span>}
        </button>
      );
    };
    return (
      <fieldset className="min-w-0 sm:hidden">
        <legend className="sr-only">{fr.picker.yourDates}</legend>
        <div className={`flex flex-col divide-y divide-line-soft rounded-field border bg-white ${open?.kind === "sheet" ? pillActive : error ? pillInvalid : "border-line"}`}>
          {row("start")}
          {row("end")}
        </div>
        <FieldError id={errorId} code={error} />
      </fieldset>
    );
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {summary && summaryField()}
      {group("depot", "start", compactLabels ? fr.parking.dropOff : fr.search.dropOff, errors.arrivalAt)}
      {group("retour", "end", compactLabels ? fr.parking.pickUp : fr.search.pickUp, errors.returnAt)}
      {hydrated && (
        <>
          <input type="hidden" name="date_depot" value={value.arrivalDate} />
          <input type="hidden" name="heure_depot" value={value.arrivalTime} />
          <input type="hidden" name="date_retour" value={value.returnDate} />
          <input type="hidden" name="heure_retour" value={value.returnTime} />
        </>
      )}
      {open?.kind === "dates" && (
        <DatesPopover
          value={value}
          side={open.side}
          minDate={minDate}
          months={months}
          trigger={trigger}
          onApply={(start, end) => {
            setValue(v => ({ ...v, arrivalDate: start, returnDate: end }));
            close();
          }}
          onClose={close}
        />
      )}
      {open?.kind === "time" && (
        <TimePopover
          value={(open.side === "start" ? value.arrivalTime : value.returnTime) || null}
          label={timeLabel}
          trigger={trigger}
          onPick={time => {
            setValue(v => (open.side === "start" ? { ...v, arrivalTime: time } : { ...v, returnTime: time }));
            close();
          }}
          onClose={close}
        />
      )}
      {open?.kind === "sheet" && (
        <StaySheet
          value={value}
          side={open.side}
          minDate={minDate}
          onApply={next => {
            setValue(next);
            close();
          }}
          onClose={close}
        />
      )}
    </div>
  );
}
