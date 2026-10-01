"use client";

import { formatPlate } from "@/lib/plate";

/** Plate field drawn as a French plate; the dashes of French plates are added when leaving the field. */
export function PlateInput({
  id,
  name,
  defaultValue,
  invalid,
  describedBy,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <span
      className={`flex h-12 items-stretch overflow-hidden rounded-lg border-[1.5px] bg-white focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-accent ${invalid ? "border-danger" : "border-ink"}`}
    >
      <span aria-hidden="true" className="flex w-[18px] flex-none items-end justify-center bg-plate-blue pb-1.5 text-[11px] font-bold text-white">
        F
      </span>
      <input
        id={id}
        name={name}
        type="text"
        defaultValue={defaultValue}
        required
        maxLength={15}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        placeholder="AB-123-CD"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onBlur={e => {
          if (e.currentTarget.value.trim()) e.currentTarget.value = formatPlate(e.currentTarget.value);
        }}
        className="min-w-0 flex-1 border-none bg-white px-2.5 text-lg font-extrabold tracking-[.03em] text-plate-ink uppercase outline-none placeholder:font-semibold placeholder:text-soft/60"
      />
    </span>
  );
}
