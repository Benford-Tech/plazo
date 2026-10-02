"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { CalendarMonths } from "./CalendarMonths";
import { trapTab, useAnchoredPosition, usePopupBehaviour } from "./popup";
import { TimeList } from "./TimeList";
import { rangeSummary, type RangeDraft, type Side } from "@/lib/calendar";
import { formatDay } from "@/lib/dates";
import { fr } from "@/lib/fr";

const GRADIENT_BTN =
  "bg-[linear-gradient(96deg,#a427c3,#cf4f96_55%,#f0a36b)] font-bold text-white shadow-[0_8px_22px_-8px_rgba(207,79,110,.55)] disabled:opacity-50 disabled:shadow-none";
const panel = "rounded-[22px] bg-white text-ink shadow-[0_30px_70px_-20px_rgba(40,10,50,.45)]";

export interface StayValue {
  arrivalDate: string;
  arrivalTime: string;
  returnDate: string;
  returnTime: string;
}

function Summary({ start, end }: { start: string | null; end: string | null }) {
  const { dates, days } = rangeSummary(start, end);
  return (
    <span aria-live="polite" className="text-sm text-soft">
      {dates}
      {days && (
        <>
          {" · "}
          <b className="text-accent">{days}</b>
        </>
      )}
    </span>
  );
}

/** Desktop: the two-month calendar under the date pills. Valider applies the dates, Escape or a click outside discards them. */
export function DatesPopover({
  value,
  side,
  minDate,
  months,
  trigger,
  onApply,
  onClose,
}: {
  value: StayValue;
  side: Side;
  minDate: string;
  months: 1 | 2;
  trigger: RefObject<HTMLElement | null>;
  onApply: (start: string, end: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<RangeDraft>({ start: value.arrivalDate || null, end: value.returnDate || null, picking: side });
  const box = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const width = months === 2 ? 720 : 360;
  const position = useAnchoredPosition(true, trigger, width);
  usePopupBehaviour(true, box, trigger, onClose);
  const focus = (side === "end" ? draft.end : draft.start) ?? draft.start;

  return createPortal(
    <div
      ref={box}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className={`${panel} absolute z-50 flex flex-col gap-4 p-[22px]`}
      style={{ width, maxWidth: "calc(100vw - 32px)", top: position?.top ?? -9999, left: position?.left ?? 0 }}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id={titleId} className="font-title text-[22px]">
          {fr.picker.yourDates}
        </h2>
        <span className="ml-auto">
          <Summary start={draft.start} end={draft.end} />
        </span>
      </div>
      <CalendarMonths draft={draft} onChange={setDraft} minDate={minDate} count={months} initialFocus={focus} autoFocus />
      <div className="flex flex-wrap items-center gap-2.5 border-t border-line pt-3.5">
        <span className="text-sm text-soft">{fr.picker.hint}</span>
        <button
          type="button"
          onClick={() => setDraft({ start: null, end: null, picking: "start" })}
          className="ml-auto h-11 rounded-full border border-line bg-white px-4 text-sm font-semibold hover:border-accent"
        >
          {fr.picker.clear}
        </button>
        <button
          type="button"
          disabled={!draft.start || !draft.end}
          onClick={() => draft.start && draft.end && onApply(draft.start, draft.end)}
          className={`h-11 rounded-full px-5 text-sm ${GRADIENT_BTN}`}
        >
          {fr.picker.confirm}
        </button>
      </div>
    </div>,
    document.body,
  );
}

/** Desktop: half-hour slots under a time pill; picking one applies it. */
export function TimePopover({
  value,
  label,
  trigger,
  onPick,
  onClose,
}: {
  value: string | null;
  label: string;
  trigger: RefObject<HTMLElement | null>;
  onPick: (time: string) => void;
  onClose: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const position = useAnchoredPosition(true, trigger, 228);
  usePopupBehaviour(true, box, trigger, onClose);

  return createPortal(
    <div
      ref={box}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className={`${panel} absolute z-50 w-[228px] p-4`}
      style={{ top: position?.top ?? -9999, left: position?.left ?? 0 }}
    >
      <h2 id={titleId} className="mb-2.5 font-bold">
        {label}
      </h2>
      <TimeList value={value} onPick={onPick} label={label} layout="grid" autoFocus />
      <p className="mt-2.5 text-center text-xs text-soft">{fr.picker.moreTimes}</p>
    </div>,
    document.body,
  );
}

/**
 * Phones: a bottom sheet with the dates (one month, swipe or arrows), the active side's time and a
 * big "Valider les dates" button. The page behind is dimmed and does not scroll; focus stays inside.
 */
export function StaySheet({
  value,
  side: initialSide,
  minDate,
  onApply,
  onClose,
}: {
  value: StayValue;
  side: Side;
  minDate: string;
  onApply: (value: StayValue) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<RangeDraft>({ start: value.arrivalDate || null, end: value.returnDate || null, picking: initialSide });
  const [times, setTimes] = useState({ start: value.arrivalTime || "08:00", end: value.returnTime || "18:00" });
  const box = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const side = draft.picking;
  const days = rangeSummary(draft.start, draft.end).days;

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else trapTab(event, box.current);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const tile = (s: Side) => {
    const date = s === "start" ? draft.start : draft.end;
    const active = side === s;
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={() => setDraft(d => ({ ...d, picking: s }))}
        className={`min-w-0 rounded-[14px] border bg-white px-2.5 py-2 text-left ${
          active ? "border-accent shadow-[inset_0_0_0_1px_#a427c3]" : "border-line"
        }`}
      >
        <span className="block text-[11px] font-semibold text-soft uppercase">{s === "start" ? fr.picker.dropOff : fr.picker.pickUp}</span>
        <b className="block truncate text-[15px] tabular-nums">
          {date ? `${formatDay(date)} · ${s === "start" ? times.start : times.end}` : fr.picker.choose}
        </b>
      </button>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div aria-hidden="true" className="absolute inset-0 bg-[rgba(30,10,40,.45)]" onClick={onClose} />
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[94dvh] flex-col gap-3 overflow-y-auto rounded-t-[24px] bg-white px-4 pt-2.5 pb-[max(18px,env(safe-area-inset-bottom))] text-ink shadow-[0_-20px_50px_-20px_rgba(0,0,0,.5)]"
      >
        <span aria-hidden="true" className="h-[5px] w-11 self-center rounded-full bg-line" />
        <div className="flex items-center gap-2">
          <h2 id={titleId} className="font-title text-[22px]">
            {fr.picker.yourDates}
          </h2>
          <span aria-live="polite" className="ml-auto text-[13px] font-bold text-accent">
            {days}
          </span>
          <button type="button" onClick={onClose} aria-label={fr.picker.close} className="-mr-2 flex size-11 items-center justify-center text-2xl text-soft">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {tile("start")}
          {tile("end")}
        </div>
        <CalendarMonths
          draft={draft}
          onChange={setDraft}
          minDate={minDate}
          count={1}
          initialFocus={(initialSide === "end" ? draft.end : draft.start) ?? draft.start}
          autoFocus
        />
        <div>
          <h3 className="mt-1 mb-2 text-sm font-bold">{side === "start" ? fr.picker.dropOffTime : fr.picker.pickUpTime}</h3>
          <TimeList
            key={side}
            value={side === "start" ? times.start : times.end}
            onPick={time => setTimes(t => ({ ...t, [side]: time }))}
            label={side === "start" ? fr.picker.dropOffTime : fr.picker.pickUpTime}
            layout="row"
          />
        </div>
        <button
          type="button"
          disabled={!draft.start || !draft.end}
          onClick={() =>
            draft.start &&
            draft.end &&
            onApply({ arrivalDate: draft.start, arrivalTime: times.start, returnDate: draft.end, returnTime: times.end })
          }
          className={`h-[52px] flex-none rounded-full text-base ${GRADIENT_BTN}`}
        >
          {fr.picker.confirmDates}
        </button>
      </div>
    </div>,
    document.body,
  );
}
