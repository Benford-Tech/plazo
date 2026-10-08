import { X } from "lucide-react";
import { ToolButton } from "@/components/capacity/ui";
import { SCALE_MAX, SCALE_MIN } from "@/lib/capacity/projection";
import {
  settingsOf,
  type CapacitySettings,
  type CapacityStudy,
} from "@/lib/capacity/types";
import { fr } from "@/lib/fr";
import type { PlanPatch } from "@/lib/plan/types";

interface Props {
  study: CapacityStudy;
  update: (patch: PlanPatch) => void;
  showPhoto: boolean;
  onShowPhoto: (on: boolean) => void;
  onIgnBuildings: (on: boolean) => void;
  onClose: () => void;
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** The drawer of the numbers the engine uses: nothing here is needed to draw a plan. */
export function PlanSettings({
  study,
  update,
  showPhoto,
  onShowPhoto,
  onIgnBuildings,
  onClose,
}: Props) {
  const t = fr.planEditor.drawer;
  const s = settingsOf(study);
  const set = (patch: Partial<CapacitySettings>) =>
    update({ settings: { ...study.settings, ...patch } });
  const num = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    opts: { min: number; max: number; step?: number },
  ) => (
    <label className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={opts.min}
        max={opts.max}
        step={opts.step ?? 0.1}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(clamp(v, opts.min, opts.max));
        }}
        className="h-9 w-24 border border-border bg-background px-2 text-right font-mono"
      />
    </label>
  );
  const check = (
    label: string,
    checked: boolean,
    onChange: (v: boolean) => void,
  ) => (
    <label className="flex items-center gap-2 py-1.5 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[#A3E635]"
      />
      {label}
    </label>
  );
  const section = (title: string) => (
    <div className="mt-4 text-xs font-semibold uppercase tracking-[1px] text-muted-foreground">
      {title}
    </div>
  );
  return (
    <aside
      role="dialog"
      aria-label={t.title}
      className="absolute inset-y-0 right-0 z-30 flex w-full max-w-[380px] flex-col overflow-y-auto border-l border-border bg-card p-4 shadow-xl"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t.title}</h2>
        <button
          type="button"
          aria-label={t.close}
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {section(t.geometry)}
      {num(t.aisleWidth, s.aisleWidth, (v) => set({ aisleWidth: v }), {
        min: 3,
        max: 12,
      })}
      {num(t.setback, s.setback, (v) => set({ setback: v }), {
        min: 0,
        max: 5,
      })}
      {num(t.edgeMaxFiles, s.edgeMaxFiles, (v) => set({ edgeMaxFiles: v }), {
        min: 1,
        max: 20,
        step: 1,
      })}
      <div className="py-1.5 text-sm">{t.valetSlot}</div>
      <div className="flex gap-2">
        {num(
          "",
          s.valetSlot.width,
          (v) => set({ valetSlot: { ...s.valetSlot, width: v } }),
          { min: 2, max: 4 },
        )}
        {num(
          "",
          s.valetSlot.length,
          (v) => set({ valetSlot: { ...s.valetSlot, length: v } }),
          { min: 4, max: 7 },
        )}
      </div>
      <div className="py-1.5 text-sm">{t.selfParkSlot}</div>
      <div className="flex gap-2">
        {num(
          "",
          s.selfParkSlot.width,
          (v) => set({ selfParkSlot: { ...s.selfParkSlot, width: v } }),
          { min: 2, max: 4 },
        )}
        {num(
          "",
          s.selfParkSlot.length,
          (v) => set({ selfParkSlot: { ...s.selfParkSlot, length: v } }),
          { min: 4, max: 7 },
        )}
      </div>
      <div className="py-1.5 text-sm">{t.orientation}</div>
      <div className="flex items-center gap-2">
        <ToolButton
          className="min-h-9"
          active={s.orientation == null}
          onClick={() => set({ orientation: null })}
        >
          {t.orientationAuto}
        </ToolButton>
        <input
          type="number"
          aria-label={t.orientationFixed}
          placeholder={t.orientationFixed}
          value={s.orientation ?? ""}
          min={0}
          max={179}
          step={1}
          onChange={(e) => {
            const v = Number(e.target.value);
            set({
              orientation:
                e.target.value === "" || !Number.isFinite(v)
                  ? null
                  : clamp(v, 0, 179),
            });
          }}
          className="h-9 w-28 border border-border bg-background px-2 text-right font-mono"
        />
      </div>
      {section(t.stays)}
      {num(
        t.stayShort,
        s.stayShortMaxNights,
        (v) =>
          set({
            stayShortMaxNights: v,
            stayMediumMaxNights: Math.max(v + 1, s.stayMediumMaxNights),
          }),
        { min: 1, max: 30, step: 1 },
      )}
      {num(
        t.stayMedium,
        s.stayMediumMaxNights,
        (v) =>
          set({ stayMediumMaxNights: Math.max(v, s.stayShortMaxNights + 1) }),
        { min: 2, max: 60, step: 1 },
      )}
      {section(t.sources)}
      {check(t.ignBuildings, s.ignBuildings !== false, onIgnBuildings)}
      {check(t.clipToParking, !!s.clipToParking, (v) =>
        set({ clipToParking: v }),
      )}
      {check(t.photo, showPhoto, onShowPhoto)}
      {section(t.scale)}
      {num("", study.scaleFactor, (v) => update({ scaleFactor: v }), {
        min: SCALE_MIN,
        max: SCALE_MAX,
        step: 0.01,
      })}
      <p className="text-xs text-muted-foreground">{t.scaleHelp}</p>
    </aside>
  );
}
