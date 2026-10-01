"use client";

import { useState, useSyncExternalStore } from "react";
import { fr } from "@/lib/fr";
import { formatWholeEuros } from "@/lib/money";

const subscribe = () => () => {};

/** Maximum total price slider, in whole euros, with its live value. */
export function PriceRange({ id, max, value }: { id: string; max: number; value: number }) {
  const [current, setCurrent] = useState(value);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  // With JavaScript, the slider at its maximum means "no limit" and stays out of the URL.
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {fr.results.maxPrice}
      </label>
      <input
        id={id}
        name={!hydrated || current < max ? "prix_max" : undefined}
        type="range"
        min={0}
        max={max}
        step={5}
        defaultValue={value}
        onInput={e => setCurrent(Number(e.currentTarget.value))}
        aria-valuetext={fr.results.upTo(formatWholeEuros(current * 100))}
        className="h-11 w-full accent-accent"
      />
      <div className="flex justify-between text-[13px] text-soft">
        <span>{formatWholeEuros(0)}</span>
        <span aria-hidden="true">{fr.results.upTo(formatWholeEuros(current * 100))}</span>
      </div>
    </div>
  );
}
