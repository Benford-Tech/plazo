import { useQuery } from "@tanstack/react-query";
import { ChevronRight, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  PLATFORM_GROUPS,
  PLATFORM_TAB_PATHS,
} from "@/components/platform/platform-nav";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { fr } from "@/lib/fr";

/**
 * « Plus » of the Plateforme on a phone (22/11/2026, direction A): every page that has no tab of its own, by group, with
 * the number of listings waiting, then the sign-out. On a computer the rail lists them all; the page still works there.
 */
export default function PlatformMorePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const overview = useQuery({
    queryKey: ["platform", "operators", "overview"],
    queryFn: adminApi.getPlatformOverview,
    staleTime: 60_000,
  });
  const pending =
    overview.data?.todos.filter((t) => t.kind === "listing_review").length ?? 0;
  const groups = PLATFORM_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((i) => !PLATFORM_TAB_PATHS.includes(i.to)),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4" data-testid="platform-more">
      <h1 className="font-narrow text-2xl font-bold text-lime-deep">
        {fr.nav.more}
      </h1>
      {groups.map((group) => (
        <section key={group.label} className="flex flex-col gap-1.5">
          <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {group.label}
          </h2>
          <ul className="overflow-hidden rounded-[14px] border border-panel-line bg-white">
            {group.items.map((item) => (
              <li key={item.to} className="border-b border-panel-line last:border-b-0">
                <Link
                  to={item.to}
                  className="flex min-h-12 items-center gap-2 px-3.5 text-[15px] hover:bg-panel-2"
                >
                  <span className="min-w-0 flex-1">{item.label}</span>
                  {item.badge === "listings" && pending > 0 && (
                    <span className="rounded-full bg-[#B45309] px-2 text-xs font-semibold text-white">
                      {pending}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <button
        type="button"
        onClick={async () => {
          await logout();
          navigate("/login", { replace: true });
        }}
        className="flex min-h-12 items-center gap-2 rounded-[14px] border border-panel-line bg-white px-3.5 text-[15px] font-semibold"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        <span className="min-w-0 flex-1 text-left">{fr.platform.logout}</span>
        <span className="text-xs font-normal text-muted-foreground">
          {user?.firstName ?? user?.name ?? ""}
        </span>
      </button>
    </div>
  );
}
