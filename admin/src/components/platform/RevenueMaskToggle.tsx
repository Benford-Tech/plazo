import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fr } from "@/lib/fr";
import { useRevenueHidden } from "@/lib/revenue-mask";
import { cn } from "@/lib/utils";

/**
 * « Masquer le CA » / « Afficher le CA » for the platform admin (in their own space and while viewing an
 * operator's): hides every revenue figure on this browser. Nothing for the operators' staff.
 */
export function RevenueMaskToggle({ className }: { className?: string }) {
  const { user } = useAuth();
  const [hidden, setHidden] = useRevenueHidden();
  if (!user?.isPlatformAdmin) return null;
  const t = fr.revenue.mask;
  const Icon = hidden ? EyeOff : Eye;
  return (
    <button
      type="button"
      aria-pressed={hidden}
      data-testid="revenue-mask"
      onClick={() => setHidden(!hidden)}
      title={hidden ? t.showTitle : t.hideTitle}
      className={cn(
        "flex min-h-11 items-center gap-1.5 border px-3 text-sm font-medium",
        hidden
          ? "border-warn bg-warn-soft text-[#92400E]"
          : "border-border text-muted-foreground hover:bg-accent",
        className,
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {hidden ? t.show : t.hide}
    </button>
  );
}
