"use client";

import { useEffect, useRef } from "react";
import { timeOptions } from "@/lib/calendar";

const GRADIENT = "border-transparent bg-[linear-gradient(96deg,#a427c3,#cf4f96_55%,#f0a36b)] text-white";

/**
 * Half-hour slots as pills (a listbox): a 2-column scrolling grid in the desktop popover, one
 * horizontally scrolling row in the phone sheet. Arrows move, Enter or Space picks.
 */
export function TimeList({
  value,
  onPick,
  label,
  layout,
  autoFocus = false,
}: {
  value: string | null;
  onPick: (time: string) => void;
  label: string;
  layout: "grid" | "row";
  autoFocus?: boolean;
}) {
  const list = useRef<HTMLDivElement>(null);
  const options = timeOptions(value);
  const current = value && options.includes(value) ? value : "08:00";

  // Bring the chosen slot into view (and focus it when the list opens from the keyboard or a click).
  useEffect(() => {
    const el = list.current?.querySelector<HTMLElement>('[aria-selected="true"]') ?? list.current?.querySelector<HTMLElement>(`[data-time="${current}"]`);
    if (!el || !list.current) return;
    const box = list.current;
    // Grid: the chosen slot on the third row, rows aligned to the top edge.
    if (layout === "grid") box.scrollTop = Math.max(0, el.offsetTop - 2 * (el.offsetHeight + 8) - 2);
    else box.scrollLeft = el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2;
    if (autoFocus) el.focus({ preventScroll: true });
  }, [current, layout, autoFocus]);

  const move = (event: React.KeyboardEvent, index: number) => {
    const step = layout === "grid" ? { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -2, ArrowDown: 2 } : { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1 };
    let next: number | null = null;
    if (event.key in step) next = index + step[event.key as keyof typeof step];
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onPick(options[index]);
      return;
    }
    if (next === null) return;
    event.preventDefault();
    const target = list.current?.querySelector<HTMLElement>(`[data-time="${options[Math.max(0, Math.min(options.length - 1, next))]}"]`);
    target?.focus();
    target?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  };

  return (
    <div
      ref={list}
      role="listbox"
      aria-label={label}
      aria-orientation={layout === "row" ? "horizontal" : undefined}
      className={
        layout === "grid"
          ? "relative grid max-h-[316px] grid-cols-2 gap-2 overflow-y-auto overscroll-contain p-0.5"
          : "relative flex snap-x gap-2 overflow-x-auto overscroll-contain p-0.5 pb-1 [scrollbar-width:none]"
      }
    >
      {options.map((time, i) => {
        const selected = time === value;
        return (
          <div
            key={time}
            role="option"
            data-time={time}
            aria-selected={selected}
            tabIndex={time === current ? 0 : -1}
            onClick={() => onPick(time)}
            onKeyDown={e => move(e, i)}
            className={`flex h-11 flex-none cursor-pointer snap-start items-center justify-center rounded-full border text-sm font-semibold tabular-nums select-none focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-accent ${
              layout === "row" ? "px-4 text-base" : ""
            } ${selected ? GRADIENT : "border-line bg-white hover:border-accent"}`}
          >
            {time}
          </div>
        );
      })}
    </div>
  );
}
