import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";

/**
 * The parking's logo (02/11/2026, direction B), fetched with the session (no public link) and cached by its date.
 * Nothing when the parking has none.
 */
export function ParkingLogo({
  version,
  name,
  size = 28,
  className,
}: {
  version: string | null | undefined;
  name?: string;
  size?: number;
  className?: string;
}) {
  const { data: url } = useQuery({
    queryKey: ["operator-logo", version],
    queryFn: async () => URL.createObjectURL(await adminApi.operatorLogo(version!)),
    enabled: !!version,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
  if (!version || !url) return null;
  return (
    <img
      src={url}
      alt={fr.parkingLogo.alt.replace("{name}", name ?? "")}
      data-testid="parking-logo"
      style={{ width: size, height: size }}
      className={cn("shrink-0 rounded-md object-contain", className)}
    />
  );
}
