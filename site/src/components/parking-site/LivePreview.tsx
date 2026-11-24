"use client";

import { useEffect, useState } from "react";
import { FIXED_PAGES } from "@/lib/parking-site";
import type { ParkingResponse, ParkingSiteInfo, SiteBlock } from "@/lib/types";
import { ParkingSite } from "./ParkingSite";

/**
 * The preview of a parking's site inside « Mon site » (24/11/2026, « Il faut un aperçu du site en cours d'édition »,
 * choix A côte à côte, en direct): the pro space frames this page with the manager's preview key and sends what the
 * form holds, before « Enregistrer »; the page draws it at once. Only the pro space's origins are listened to, and only
 * the look and the blocks change: the parking's data stay the server's.
 */
export const PREVIEW_ORIGINS = ["https://pro.plazo.fr", "https://www.plazo.fr", "http://localhost:8080"];

export interface SiteDraft {
  theme?: ParkingSiteInfo["theme"];
  accent?: string;
  accent2?: string | null;
  blocks?: SiteBlock[];
  showLogo?: boolean;
  rating?: { value: number; count: number | null } | null;
  pages?: boolean;
  heroPhotoUrl?: string | null;
  teamPhotoUrl?: string | null;
}

const HEX = /^#[0-9A-Fa-f]{6}$/;

/** The text colour on a colour, as the server picks it (domain/booking-page accentInk). */
export function inkOn(colour: string): string {
  const [r, g, b] = [1, 3, 5]
    .map(i => parseInt(colour.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b! > 0.4 ? "#1A1D1A" : "#FFFFFF";
}

const PHOTO = /^\/api\/public\/sites\/[a-z0-9-]+\/(hero|team)\/[0-9a-f]{18}\.(jpeg|png|webp)$/;

/** The site as the draft shows it; anything malformed in the draft keeps the server's value. */
export function withDraft(site: ParkingSiteInfo, draft: SiteDraft): ParkingSiteInfo {
  const next = { ...site };
  if (draft.theme) next.theme = draft.theme;
  if (draft.accent && HEX.test(draft.accent)) {
    next.accent = draft.accent;
    next.accentInk = inkOn(draft.accent);
  }
  if (draft.accent2 === null) {
    next.accent2 = null;
    next.accent2Ink = null;
  } else if (draft.accent2 && HEX.test(draft.accent2)) {
    next.accent2 = draft.accent2;
    next.accent2Ink = inkOn(draft.accent2);
  }
  if (Array.isArray(draft.blocks)) {
    next.blocks = draft.blocks
      .filter(b => b && b.enabled && typeof b.kind === "string")
      .map(b => ({ id: String(b.id), kind: b.kind, enabled: true, title: b.title ?? null, text: b.text ?? null }));
  }
  if (draft.showLogo === false) next.logoUrl = null;
  if (draft.rating === null) next.rating = null;
  else if (draft.rating && draft.rating.value >= 1 && draft.rating.value <= 5) next.rating = draft.rating;
  if (typeof draft.pages === "boolean") {
    next.pages = draft.pages ? [...(site.destinations ?? []).map(d => d.slug), ...FIXED_PAGES] : [];
  }
  for (const key of ["heroPhotoUrl", "teamPhotoUrl"] as const) {
    const url = draft[key];
    if (url === null) next[key] = null;
    else if (typeof url === "string" && PHOTO.test(url)) next[key] = url;
  }
  return next;
}

export function LivePreview(props: { site: ParkingSiteInfo; data: ParkingResponse; idempotencyKey: string; page?: string | null }) {
  const [draft, setDraft] = useState<SiteDraft | null>(null);
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin && !PREVIEW_ORIGINS.includes(event.origin)) return;
      const message = event.data as { type?: string; draft?: SiteDraft } | null;
      if (message?.type === "plazo-site-draft" && message.draft && typeof message.draft === "object") setDraft(message.draft);
    };
    window.addEventListener("message", onMessage);
    // Tell the pro space the page is ready: it answers with the draft.
    if (window.parent !== window) window.parent.postMessage({ type: "plazo-site-ready" }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);
  return <ParkingSite {...props} site={draft ? withDraft(props.site, draft) : props.site} />;
}
