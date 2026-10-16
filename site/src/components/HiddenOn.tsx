"use client";

import { usePathname } from "next/navigation";

/** Renders its children except on the given paths (the help card is not repeated under the contact form itself). */
export function HiddenOn({ paths, children }: { paths: string[]; children: React.ReactNode }) {
  const pathname = usePathname();
  return pathname && paths.includes(pathname) ? null : children;
}
