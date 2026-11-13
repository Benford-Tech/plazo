import NextLink from "next/link";
import type { ComponentProps } from "react";
import { lp } from "@/lib/i18n/runtime";

type Props = ComponentProps<typeof NextLink>;

/** next/link in the page's language: « /contact » leads to « /en/contact » on the English site (13/11/2026). */
export default function Link({ href, ...props }: Props) {
  const localized =
    typeof href === "string"
      ? lp(href)
      : href.pathname
        ? { ...href, pathname: lp(href.pathname) }
        : href;
  return <NextLink href={localized} {...props} />;
}
