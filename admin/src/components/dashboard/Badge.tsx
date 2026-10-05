import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "ok" | "warn" | "bad" | "info" | "accent" | "line";

/** Filled pill badges of the "Flotte" mockup (A-A): green, amber, red, blue, yellow, or outlined. */
const TONES: Record<BadgeTone, string> = {
  ok: "bg-ok text-ok-ink",
  warn: "bg-warn text-warn-ink",
  bad: "bg-bad text-white",
  info: "bg-info text-info-ink",
  accent: "bg-primary text-primary-foreground",
  line: "border border-panel-line text-muted-foreground",
};

export function Badge({ tone, children, className }: { tone: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold leading-none", TONES[tone], className)}>
      {children}
    </span>
  );
}

/** Tinted status pills of the "Opérations" strip: "OK", "À voir", "Off". */
const SOFT: Record<"ok" | "warn" | "bad" | "info" | "off", string> = {
  ok: "bg-ok-soft text-ok-text",
  warn: "bg-warn-soft text-warn-text",
  bad: "bg-bad-soft text-bad-text",
  info: "bg-info-soft text-info-text",
  off: "bg-panel-2 text-muted-foreground",
};

export function StatusPill({ tone, children }: { tone: keyof typeof SOFT; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold leading-4", SOFT[tone])}>{children}</span>;
}
