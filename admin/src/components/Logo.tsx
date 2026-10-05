import { PRODUCT } from "@/lib/product";
import { cn } from "@/lib/utils";
// The pro variant of the brand's sign (L-A, 05/10/2026; copied from /brand at the repository root):
// yellow sign, black letters, for direction B's black background. 232 x 100 viewBox.
import logoPro from "@/assets/logo-horizontal-pro.svg";

type Props = { height?: number; className?: string; suffix?: string };

/** The horizontal logo; its accessible name is the product name, plus an optional text suffix ("PRO"). */
export function Logo({ height = 28, className, suffix }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img src={logoPro} alt={PRODUCT.name} width={Math.round(height * 2.32)} height={height} />
      {suffix && (
        // Centred on the sign, a step smaller than its letters.
        <span className="truncate font-bold uppercase leading-none tracking-wider text-primary" style={{ fontSize: Math.round(height * 0.5) }}>
          {suffix}
        </span>
      )}
    </span>
  );
}
