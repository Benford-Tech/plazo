import { PRODUCT } from "@/lib/product";
import { cn } from "@/lib/utils";
// The dark variant of the brand's horizontal logo (copied from /brand at the repository root):
// the pro space is direction B, black background. 317 x 100 viewBox.
import logoDark from "@/assets/logo-horizontal-dark.svg";

type Props = { height?: number; className?: string; suffix?: string };

/** The horizontal logo; its accessible name is the product name, plus an optional text suffix ("PRO"). */
export function Logo({ height = 28, className, suffix }: Props) {
  return (
    <span className={cn("inline-flex items-end gap-2", className)}>
      <img src={logoDark} alt={PRODUCT.name} width={Math.round(height * 3.17)} height={height} />
      {suffix && (
        // Sits on the wordmark's baseline (76 % down the logo), a step smaller than the wordmark.
        <span
          className="truncate font-bold uppercase leading-none tracking-wider text-primary"
          style={{ fontSize: Math.round(height * 0.58), marginBottom: Math.round(height * 0.22) }}
        >
          {suffix}
        </span>
      )}
    </span>
  );
}
