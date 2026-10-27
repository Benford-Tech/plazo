import { useCallback, useSyncExternalStore } from "react";

/**
 * 27/10/2026 (« pouvoir masquer le chiffre d'affaires pour le super admin de la plateforme »): the platform admin can
 * hide the revenue figures (dashboard tile, « Chiffre d'affaires » page) on this browser, e.g. while showing the
 * space to someone. Kept in localStorage, nothing on the server.
 */
export const REVENUE_HIDDEN_KEY = "plazo:revenue-hidden";
const EVENT = "plazo:revenue-hidden";

function read(): boolean {
  try {
    return localStorage.getItem(REVENUE_HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function setRevenueHidden(hidden: boolean) {
  try {
    if (hidden) localStorage.setItem(REVENUE_HIDDEN_KEY, "1");
    else localStorage.removeItem(REVENUE_HIDDEN_KEY);
  } catch {
    /* private window: the choice lasts the page only */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Whether the revenue is hidden on this browser, and a setter that updates every subscriber. */
export function useRevenueHidden(): [boolean, (hidden: boolean) => void] {
  const hidden = useSyncExternalStore(subscribe, read, () => false);
  const set = useCallback((value: boolean) => setRevenueHidden(value), []);
  return [hidden, set];
}
