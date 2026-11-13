import { CalendarClock, ClipboardList, MessageCircle, MoreHorizontal, SquareParking } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";
import { CountBadge } from "./CountBadge";
import { flatPages, isInItem, type Counter, type Icon, type NavItem, type NavSection } from "./nav-items";

type Counts = Partial<Record<Counter, number | null>> | undefined;
type Tab = "today" | "reservations" | "messages" | "parking" | "more";

const TAB_ICONS: Record<Tab, Icon> = {
  today: CalendarClock,
  reservations: ClipboardList,
  messages: MessageCircle,
  parking: SquareParking,
  more: MoreHorizontal,
};
const TAB_SECTIONS: NavSection[] = ["today", "reservations", "parking"];
/** Pages that live under « Plus » on a phone (the manager's pages, the account, the bell's page). */
const MORE_PATHS = ["/plus", "/mon-compte", "/notifications"];

/** The tab of the page shown: its section's, the manager's pages and the account under « Plus ». */
export function tabOf(items: NavItem[], pathname: string): Tab {
  const item = items.find((i) => isInItem(i, pathname));
  if (item?.ownTab) return "messages";
  if (item && item.section !== "manager") return item.section as Tab;
  if (item || MORE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return "more";
  return "today";
}

/** A section's entries, without those that have a tab of their own (13/11/2026: the messages). */
const inSection = (items: NavItem[], section: NavSection) => items.filter((i) => i.section === section && !i.ownTab);

const sum = (counts: Counts, keys: (Counter | undefined)[]) =>
  keys.reduce((n, k) => n + (k && counts ? (counts[k] ?? 0) : 0), 0);

/**
 * Direction A (10/11/2026, « Change le menu de la version web mobile en tab bar »): on a phone, the four tabs of Plazo
 * Pro at the bottom of the screen, Aujourd'hui · Réservations · Parking · Plus, within thumb's reach; each tab only when
 * the role has one of its pages, « Plus » always. Hidden from 1 024 px, where the rail takes over.
 */
export function MobileTabBar({ items, counts }: { items: NavItem[]; counts: Counts }) {
  const { pathname } = useLocation();
  const current = tabOf(items, pathname);
  const tabs = TAB_SECTIONS.flatMap((section) => {
    const pages = flatPages(inSection(items, section));
    if (pages.length === 0) return [];
    return [{ tab: section as Tab, to: pages[0].to, label: fr.nav.sections[section], badge: sum(counts, pages.map((p) => p.counter)) }];
  });
  // 13/11/2026 (« mets les messages sur le menu en bas »): the clients' messages, a tab of their own after the bookings.
  const messages = items.find((i) => i.ownTab);
  if (messages) {
    const at = tabs.findIndex((t) => t.tab === "reservations");
    tabs.splice(at < 0 ? tabs.length : at + 1, 0, { tab: "messages", to: messages.to, label: messages.label, badge: sum(counts, [messages.counter]) });
  }
  tabs.push({ tab: "more", to: "/plus", label: fr.nav.more, badge: 0 });

  return (
    <nav
      aria-label={fr.nav.tabBar}
      data-testid="tab-bar"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-panel-line bg-panel pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
    >
      <div className="mx-auto grid max-w-xl" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map(({ tab, to, label, badge }) => {
          const TabIcon = TAB_ICONS[tab];
          const active = tab === current;
          return (
            <Link
              key={tab}
              to={to}
              data-testid={`tab-${tab}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-[58px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold",
                active ? "text-lime-deep" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full",
                  active && "bg-primary text-primary-foreground",
                )}
              >
                <TabIcon className="h-[19px] w-[19px]" aria-hidden="true" />
              </span>
              <span className="max-w-full truncate px-1">{label}</span>
              {badge > 0 && (
                <span
                  aria-label={fr.nav.toDo(badge)}
                  className="absolute left-1/2 top-1 ml-2 min-w-[18px] rounded-full bg-[#D97706] px-1 text-center font-mono text-[10px] font-semibold leading-4 text-white"
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** The current tab's pages in pills under the top bar (phone only; none for « Plus », a page of its own). */
export function MobilePagePills({ items, counts }: { items: NavItem[]; counts: Counts }) {
  const { pathname } = useLocation();
  const current = tabOf(items, pathname);
  if (current === "more") return null;
  if (current === "messages") return null;
  const pages = flatPages(inSection(items, current));
  if (pages.length < 2) return null;
  return (
    <div data-testid="nav-subrow" className="flex gap-1.5 overflow-x-auto border-t border-panel-line px-3 py-2 lg:hidden">
      {pages.map((page) => (
        <NavLink
          key={page.to}
          to={page.to}
          end={page.end}
          className={({ isActive }) =>
            cn(
              "flex min-h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 text-[13px] font-semibold",
              isActive
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-panel-line bg-panel text-muted-foreground hover:text-foreground",
            )
          }
        >
          {page.label}
          <CountBadge n={counts && page.counter ? counts[page.counter] : 0} className="ml-1" />
        </NavLink>
      ))}
    </div>
  );
}
