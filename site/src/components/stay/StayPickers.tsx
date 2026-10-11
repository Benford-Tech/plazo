"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { CalendarMonths } from "./CalendarMonths";
import { trapTab, useAnchoredPosition, usePopupBehaviour } from "./popup";
import { CloseIcon } from "./pill";
import { TimeList } from "./TimeList";
import { rangeSummary, type RangeDraft, type Side } from "@/lib/calendar";
import { formatDay } from "@/lib/dates";
import { fr } from "@/lib/fr";

/** Boutique: the pickers are sheets (white, hairline, 16 px corners, sheet shadow); their one action is orange. */
const panel = "rounded-card border border-line bg-white text-ink shadow-sheet";

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
          <b className="text-ink">{days}</b>
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
      <div className="flex flex-wrap items-center gap-2.5 border-t border-line-soft pt-3.5">
        <span className="text-sm text-soft">{fr.picker.hint}</span>
        <button type="button" onClick={() => setDraft({ start: null, end: null, picking: "start" })} className="btn-secondary btn-sm ml-auto">
          {fr.picker.clear}
        </button>
        <button
          type="button"
          disabled={!draft.start || !draft.end}
          onClick={() => draft.start && draft.end && onApply(draft.start, draft.end)}
          className="btn-primary min-h-11 px-6 text-[14px] disabled:cursor-not-allowed disabled:opacity-45"
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
      <h2 id={titleId} className="eyebrow mb-3">
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
        className={`min-h-[58px] min-w-0 rounded-field border bg-white px-3 py-2 text-left text-ink ${active ? "border-dark inset-ring inset-ring-dark" : "border-line"}`}
      >
        <span className="block text-[10.5px] leading-tight font-bold tracking-[.12em] text-soft uppercase">{s === "start" ? fr.picker.dropOff : fr.picker.pickUp}</span>
        {date ? (
          <span className="mt-0.5 flex items-baseline gap-1.5 truncate text-[15px] leading-tight">
            <b className="truncate font-bold">{formatDay(date)}</b>
            <span aria-hidden="true" className="text-mute">
              ·
            </span>
            <span className="font-hour">{s === "start" ? times.start : times.end}</span>
          </span>
        ) : (
          <b className="mt-0.5 block truncate text-[15px] leading-tight font-semibold text-soft">{fr.picker.choose}</b>
        )}
      </button>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div aria-hidden="true" className="absolute inset-0 bg-dark/45" onClick={onClose} />
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[94dvh] flex-col gap-3 overflow-y-auto rounded-t-card border-t border-line bg-white px-4 pt-2.5 pb-[max(18px,env(safe-area-inset-bottom))] text-ink shadow-sheet"
      >
        <span aria-hidden="true" className="h-[5px] w-11 self-center rounded-full bg-line" />
        <div className="flex items-center gap-2">
          <h2 id={titleId} className="font-title text-[22px]">
            {fr.picker.yourDates}
          </h2>
          <span aria-live="polite" className="ml-auto text-[13px] font-bold text-ink">
            {days}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={fr.picker.close}
            className="-mr-2 flex size-11 items-center justify-center rounded-full text-soft hover:bg-tint hover:text-ink"
          >
            <CloseIcon />
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
          <h3 className="eyebrow mt-1 mb-2">{side === "start" ? fr.picker.dropOffTime : fr.picker.pickUpTime}</h3>
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
          className="btn-primary min-h-[52px] flex-none text-base disabled:cursor-not-allowed disabled:opacity-45"
        >
          {fr.picker.confirmDates}
        </button>
      </div>
    </div>,
    document.body,
  );
}
