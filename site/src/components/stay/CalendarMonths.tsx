"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  addMonths,
  dayState,
  formatDayLong,
  isDisabled,
  monthOf,
  monthTitle,
  monthWeeks,
  moveFocus,
  pickDay,
  viewFor,
  WEEKDAY_INITIALS,
  WEEKDAY_NAMES,
  type RangeDraft,
} from "@/lib/calendar";
import { fr } from "@/lib/fr";

const GRADIENT = "bg-[linear-gradient(96deg,#ff8a3d,#f0a36b)] font-bold text-white";

/**
 * Calendar of a stay: one or two months, Monday first, past days disabled, the range between the
 * drop-off and the return tinted. Keyboard: arrows move the day, Page Up/Down the month, Home/End
 * the week, Enter or Space picks. Swipe left or right changes the month on touch screens.
 */
export function CalendarMonths({
  draft,
  onChange,
  minDate,
  count,
  initialFocus,
  autoFocus = false,
}: {
  draft: RangeDraft;
  onChange: (draft: RangeDraft) => void;
  /** Today at the parking. */
  minDate: string;
  /** Months shown side by side (2 in the desktop popover, 1 in the phone sheet). */
  count: 1 | 2;
  initialFocus?: string | null;
  /** Moves the keyboard focus to the focused day on mount. */
  autoFocus?: boolean;
}) {
  const start = initialFocus && initialFocus >= minDate ? initialFocus : minDate;
  const [focusDate, setFocusDate] = useState(start);
  const [view, setView] = useState(monthOf(start));
  const grids = useRef<HTMLDivElement>(null);
  const moveFocusToDay = useRef(autoFocus);
  const touchX = useRef<number | null>(null);
  const id = useId();
  const minMonth = monthOf(minDate);
  const months = Array.from({ length: count }, (_, i) => addMonths(view, i));

  useEffect(() => {
    if (!moveFocusToDay.current) return;
    moveFocusToDay.current = false;
    grids.current?.querySelector<HTMLElement>(`[data-date="${focusDate}"]`)?.focus({ preventScroll: true });
  }, [focusDate, view]);

  const focusDay = (date: string) => {
    setFocusDate(date);
    setView(v => viewFor(v, date, count));
    moveFocusToDay.current = true;
  };

  const showMonth = (month: string) => {
    if (month < minMonth) return;
    setView(month);
    // Keep the roving focus on a day of the months shown.
    const day = Math.min(Number(focusDate.slice(8, 10)), 28);
    const candidate = `${month}-${String(day).padStart(2, "0")}`;
    setFocusDate(candidate < minDate ? minDate : candidate);
  };

  const onKeyDown = (event: React.KeyboardEvent, date: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onChange(pickDay(draft, date, minDate));
      return;
    }
    const next = moveFocus(date, event.key, minDate);
    if (next) {
      event.preventDefault();
      focusDay(next);
    }
  };

  const navButton = (dir: -1 | 1) => (
    <button
      type="button"
      onClick={() => showMonth(addMonths(view, dir))}
      disabled={dir < 0 && view <= minMonth}
      aria-label={dir < 0 ? fr.picker.prevMonth : fr.picker.nextMonth}
      className="flex size-11 flex-none items-center justify-center rounded-full text-2xl leading-none text-soft hover:bg-tint disabled:opacity-30"
    >
      <span aria-hidden="true">{dir < 0 ? "‹" : "›"}</span>
    </button>
  );

  return (
    <div
      className="flex items-start gap-2 sm:gap-4"
      onTouchStart={e => (touchX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={e => {
        const from = touchX.current;
        const to = e.changedTouches[0]?.clientX;
        touchX.current = null;
        if (from === null || to === undefined || Math.abs(to - from) < 50) return;
        showMonth(addMonths(view, to < from ? 1 : -1));
      }}
    >
      {count === 2 && navButton(-1)}
      <div ref={grids} className="grid min-w-0 flex-1 gap-6" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
        {months.map(month => {
          const titleId = `${id}-${month}`;
          return (
            <div key={month} className="min-w-0">
              <div className="mb-1.5 flex items-center justify-center gap-1">
                {count === 1 && navButton(-1)}
                <h3 id={titleId} aria-live="polite" className="flex-1 text-center text-base font-bold">
                  {monthTitle(month)}
                </h3>
                {count === 1 && navButton(1)}
              </div>
              <table role="grid" aria-labelledby={titleId} className="w-full table-fixed border-collapse">
                <thead>
                  <tr>
                    {WEEKDAY_INITIALS.map((d, i) => (
                      <th key={d} scope="col" abbr={WEEKDAY_NAMES[i]} className="pb-1 text-xs font-semibold text-soft">
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthWeeks(month).map((week, w) => (
                    <tr key={w}>
                      {week.map((date, i) => {
                        if (!date) return <td key={i} className="h-11" />;
                        const disabled = isDisabled(date, minDate);
                        const state = dayState(date, draft);
                        const ends = state === "start" || state === "end" || state === "single";
                        const today = date === minDate;
                        const label = [
                          formatDayLong(date),
                          today ? fr.picker.today : null,
                          state === "start" || state === "single" ? fr.picker.dropOff.toLowerCase() : null,
                          state === "end" || state === "single" ? fr.picker.pickUp.toLowerCase() : null,
                        ]
                          .filter(Boolean)
                          .join(", ");
                        return (
                          <td
                            key={date}
                            role="gridcell"
                            data-date={date}
                            tabIndex={date === focusDate ? 0 : -1}
                            aria-selected={ends}
                            aria-disabled={disabled || undefined}
                            aria-current={today ? "date" : undefined}
                            aria-label={label}
                            onClick={() => {
                              if (disabled) return;
                              setFocusDate(date);
                              onChange(pickDay(draft, date, minDate));
                            }}
                            onKeyDown={e => onKeyDown(e, date)}
                            className={`group h-11 p-0 text-center text-sm outline-none select-none ${state === "between" ? "bg-tint" : ""} ${
                              disabled ? "cursor-default text-[#c9c2cd]" : "cursor-pointer"
                            }`}
                          >
                            <span
                              className={`mx-auto flex h-11 w-full max-w-11 items-center justify-center rounded-full tabular-nums group-focus-visible:outline-3 group-focus-visible:outline-offset-[-1px] group-focus-visible:outline-accent ${
                                ends ? GRADIENT : !disabled ? "group-hover:bg-tint" : ""
                              } ${today && !ends ? "shadow-[inset_0_0_0_1.5px_#ff8a3d]" : ""}`}
                            >
                              {Number(date.slice(8, 10))}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
      {count === 2 && navButton(1)}
    </div>
  );
}
