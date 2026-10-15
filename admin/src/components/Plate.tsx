import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";

/**
 * A plate drawn like a French one: blue EU band with "F", black on white (borrowed from direction C). 15/10/2026 (« ne pas
 * planter à l'import quand la plaque est manquante »): a booking imported without its plate shows « À saisir » in the plate.
 */
export function Plate({ value, size = "md", className }: { value: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = {
    sm: { box: "h-6", band: "w-3 text-[8px] pb-0.5", text: "px-1.5 text-[13px]" },
    md: { box: "h-7", band: "w-3.5 text-[10px] pb-[3px]", text: "px-2 text-base" },
    lg: { box: "h-11", band: "w-5 text-xs pb-1", text: "px-3 text-2xl" },
  }[size];
  const missing = !value?.trim();
  return (
    <span
      aria-label={missing ? "Plaque à saisir" : undefined}
      className={cn("inline-flex shrink-0 items-stretch overflow-hidden rounded-[4px] border-[1.5px] border-[#F3F3F0]", sizes.box, className)}
    >
      <span aria-hidden="true" className={cn("flex items-end justify-center bg-plate-band font-bold text-white", sizes.band)}>
        F
      </span>
      <span
        className={cn(
          "flex items-center bg-white tracking-wide",
          missing ? "font-normal text-muted-foreground" : "font-bold text-[#0B0B0C]",
          sizes.text,
        )}
      >
        {missing ? fr.common.plateMissing : value}
      </span>
    </span>
  );
}
