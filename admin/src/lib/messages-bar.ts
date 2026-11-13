import type { WhatsappConversation } from "@/lib/types";

/** Barre des messages (13/11/2026, choix A): rules shared by the bar and its tests. */
export const COLLAPSED_KEY = "plazo:messages-bar-collapsed";
/** At most two open windows; the others stay as small tabs at the bottom. */
export const MAX_OPEN = 2;
export const MAX_TABS = 4;

export const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
};

export const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

export const nameOf = (c: WhatsappConversation) => c.name ?? c.reservation?.customerName ?? c.phone;

export const initialsOf = (name: string) => {
  const words = name.replace(/[^\p{L}\s]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
};

/** The client wrote within Meta's 24 hours (a free reply is still possible). */
export const wroteRecently = (c: WhatsappConversation, now = Date.now()) =>
  !!c.lastInboundAt && now - new Date(c.lastInboundAt).getTime() < 24 * 3600_000;

/** Unread first, then the latest message. */
export const sortForBar = (rows: WhatsappConversation[]) =>
  [...rows].sort(
    (a, b) =>
      Number(b.unread > 0) - Number(a.unread > 0) ||
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );

