import { PRO_HOST } from "./site";

/** Whether a request's Host header is Plazo Pro's own address (pro.plazo.fr), port and case ignored. */
export function isProHost(host: string | null | undefined): boolean {
  return !!host && host.toLowerCase().split(":")[0] === PRO_HOST.toLowerCase().split(":")[0];
}
