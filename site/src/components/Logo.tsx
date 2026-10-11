import { PRODUCT_NAME } from "@/lib/product";

// The brand files live in /brand at the repository root; this copy is the orange sign with white letters (E-A + O-D,
// 03/10/2026), kept as is by Boutique on the ivory header and the espresso footer. 232 x 100 viewBox; its 17/100
// corner radius gives the 5 px corners of the mockup at 30 px high.
const LOGO_SRC = "/brand/logo-horizontal-dark.svg";

type Props = { height?: number; className?: string };

/** The horizontal logo (the sign); its accessible name is the product name. */
export function Logo({ height = 36, className }: Props) {
  // A static SVG from public/: no image proxy, no optimisation needed. The height goes inline:
  // the CSS reset's `height: auto` on images would override the attribute.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt={PRODUCT_NAME}
      width={Math.round(height * 2.32)}
      height={height}
      style={{ height, width: "auto" }}
      decoding="async"
      className={className}
    />
  );
}
