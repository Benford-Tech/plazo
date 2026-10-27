"use client";

import { usePathname } from "next/navigation";

/**
 * Renders its children except on the given paths (the help card is not repeated under the contact form itself) and
 * under the given prefixes (the travellers' header and footer are left out of Plazo Pro's pages, /loueurs).
 */
export function HiddenOn({ paths = [], prefixes = [], children }: { paths?: string[]; prefixes?: string[]; children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname && (paths.includes(pathname) || prefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)))) return null;
  return children;
}
