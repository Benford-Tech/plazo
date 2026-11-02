import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { adminApi } from "@/lib/api";

export const LIVE_SYNC_KEY = ["live-sync"] as const;
export const LIVE_SYNC_INTERVAL_MS = 5_000;
/** Images keyed by their own date (a new date is a new query): never read again for another change. */
const NOT_SYNCED = new Set<string>([LIVE_SYNC_KEY[0], "staff-photo", "operator-logo"]);

/**
 * 02/11/2026 (« les actions doivent être synchronisées entre l'espace admin et l'application »): reads the operator's
 * version every 5 s while the tab is visible; when it moves (a status, keys, a place, a file, a shuttle trip… changed here,
 * in Plazo Pro or by the server), every query shown on screen is read again, so the page follows without reloading.
 */
export function useLiveSync(enabled: boolean) {
  const queryClient = useQueryClient();
  const last = useRef<string | null>(null);
  const { data } = useQuery({
    queryKey: LIVE_SYNC_KEY,
    queryFn: () => adminApi.liveSync(),
    enabled,
    refetchInterval: LIVE_SYNC_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  const version = data?.version ?? null;
  useEffect(() => {
    if (!version) return;
    const previous = last.current;
    last.current = version;
    if (previous === null || previous === version) return;
    void queryClient.invalidateQueries({ predicate: (q) => !NOT_SYNCED.has(String(q.queryKey[0])) });
  }, [version, queryClient]);
}
