import { headers } from "next/headers";
import { api, ApiError } from "@/lib/api";
import type { ParkingResponse, ParkingSiteInfo } from "@/lib/types";

/** What the pages of a parking's site share: reading the site and its listing, the preview key, where its links start. */

export type SiteSearch = Promise<Record<string, string | string[] | undefined>>;

export const previewOf = async (searchParams: SiteSearch) => {
  const key = (await searchParams).apercu;
  return typeof key === "string" && /^[a-f0-9]{10,64}$/.test(key) ? key : null;
};

export const requestHost = async () => ((await headers()).get("host") ?? "").toLowerCase().replace(/:\d+$/, "");

export async function loadSite(slug: string, preview: string | null): Promise<{ site: ParkingSiteInfo; data: ParkingResponse } | null> {
  try {
    const read = await api.parkingSite(slug, preview);
    const data = await api.parking(read.airport, read.parking);
    // On the parking's own host the pages sit at the root; on Plazo's, under /s/<slug>. A preview keeps its key.
    const onOwnHost = !!read.domain && !read.preview && (await requestHost()) === read.domain;
    const site = { ...read, links: { base: onOwnHost ? "" : `/s/${read.slug}`, query: read.preview && preview ? `?apercu=${preview}` : "" } };
    return { site, data };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
