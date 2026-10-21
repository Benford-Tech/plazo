import { BatteryCharging, PlugZap, Sparkles, type LucideIcon } from "lucide-react";
import type { ExtraKind } from "@/lib/types";

/** Services for the car (21/10/2026): one icon per service. */
export const EXTRA_ICONS: Record<ExtraKind, LucideIcon> = {
  interior_wash: Sparkles,
  hybrid_charge: PlugZap,
  ev_charge: BatteryCharging,
};
