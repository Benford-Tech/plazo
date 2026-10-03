import { PRODUCT_NAME } from "@/lib/product";

// The brand files live in /brand at the repository root; this copy is the dark variant
// (white symbol, white wordmark) for the prune header and footer. 317 x 100 viewBox.
const LOGO_SRC = "/brand/logo-horizontal-dark.svg";

type Props = { height?: number; className?: string };

/** The horizontal logo (symbol + wordmark); its accessible name is the product name. */
export function Logo({ height = 36, className }: Props) {
  // A static SVG from public/: no image proxy, no optimisation needed. The height goes inline:
  // the CSS reset's `height: auto` on images would override the attribute.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt={PRODUCT_NAME}
      width={Math.round(height * 3.17)}
      height={height}
      style={{ height, width: "auto" }}
      decoding="async"
      className={className}
    />
  );
}
