import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";

/** The pastel pairs of the initials (background, text): the states' tints of the pro space. */
const TINTS = [
  "bg-[#ECFCCB] text-[#1E5E2E]",
  "bg-[#E0E7FF] text-[#4F46E5]",
  "bg-[#FEF3C7] text-[#B45309]",
  "bg-[#DCFCE7] text-[#15803D]",
  "bg-[#FCE7F3] text-[#BE185D]",
  "bg-[#E0F2FE] text-[#0369A1]",
];

// eslint-disable-next-line react-refresh/only-export-components
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  const first = words[0][0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

function tintOf(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

/**
 * A member's photo (30/10/2026), or their initials on a pastel disc. The photo is fetched with the session (no public
 * link) and cached by its date: a changed photo is fetched again.
 */
export function Avatar({
  staff,
  size = 32,
  className,
}: {
  staff: { id: string; name: string; photoUpdatedAt?: string | null };
  size?: number;
  className?: string;
}) {
  const version = staff.photoUpdatedAt ?? null;
  const { data: url } = useQuery({
    queryKey: ["staff-photo", staff.id, version],
    queryFn: async () => URL.createObjectURL(await adminApi.staffPhoto(staff.id, version!)),
    enabled: !!version,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) };
  if (version && url)
    return (
      <img
        src={url}
        alt=""
        data-testid="avatar-photo"
        style={style}
        className={cn("shrink-0 rounded-full object-cover ring-1 ring-panel-line", className)}
      />
    );
  return (
    <span
      aria-hidden="true"
      data-testid="avatar-initials"
      style={style}
      className={cn("flex shrink-0 items-center justify-center rounded-full font-bold", tintOf(staff.id), className)}
    >
      {initialsOf(staff.name)}
    </span>
  );
}
