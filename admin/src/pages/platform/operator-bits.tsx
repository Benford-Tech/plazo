import { fr } from "@/lib/fr";
import { operatorState, type OperatorState } from "@/lib/platform";
import type { OperatorKind, PlatformOperator } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATE_TONE: Record<OperatorState, string> = {
  active: "bg-[#15803D] text-white",
  invitation: "bg-[#4F46E5] text-white",
  suspended: "bg-[#B91C1C] text-white",
  archived: "bg-[#E4E6E2] text-foreground",
};

/** 11/11/2026: the operator's state as a full pill (Actif · Invitation · Suspendu · Archivé). */
export function OperatorStatePill({
  operator,
  className,
}: {
  operator: PlatformOperator;
  className?: string;
}) {
  const state = operatorState(operator);
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATE_TONE[state],
        className,
      )}
    >
      {fr.platform.operatorState[state]}
    </span>
  );
}

/** « Tests », « Démo », « Votre compte » next to an operator's name; nothing for a real one. */
export function KindPill({ kind }: { kind?: OperatorKind }) {
  if (!kind || kind === "real") return null;
  return (
    <span
      className={cn(
        "ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        kind === "demo"
          ? "bg-[#E0E7FF] text-[#3730A3]"
          : "bg-[#E4E6E2] text-foreground",
      )}
    >
      {fr.platform.kinds[kind]}
    </span>
  );
}
