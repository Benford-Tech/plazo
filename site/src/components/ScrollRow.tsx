"use client";

import type { FocusEvent, ReactNode } from "react";

/**
 * A row of chips that scrolls sideways (globals.css `scroll-row`, with a fade on its right edge). When a chip gets the
 * keyboard focus, the whole chip is scrolled into view, clear of the fade (the row's `scroll-padding-inline`): the
 * browser's own focus scrolling leaves a partly visible chip where it is. Without JavaScript the row still scrolls.
 */
export function ScrollRow({ className = "", children }: { className?: string; children: ReactNode }) {
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const chip = event.target.closest<HTMLElement>(".chip-toggle") ?? event.target;
    if (!event.currentTarget.contains(chip)) return;
    chip.scrollIntoView({ inline: "nearest", block: "nearest" });
  };
  return (
    <div className={`scroll-row ${className}`} onFocus={onFocus}>
      {children}
    </div>
  );
}
