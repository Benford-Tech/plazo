import { Bell, ChevronRight, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar } from "@/components/Avatar";
import { flatPages, NAV, type Icon } from "@/components/nav-items";
import { useAuth } from "@/contexts/AuthContext";
import { fr } from "@/lib/fr";
import { can } from "@/lib/roles";

type Row = { label: string; to: string; icon: Icon };

function Group({ title, rows }: { title: string; rows: Row[] }) {
  if (rows.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</h2>
      <ul className="divide-y divide-panel-line overflow-hidden rounded-[14px] border border-panel-line bg-panel">
        {rows.map((row) => (
          <li key={row.to}>
            <Link to={row.to} className="flex min-h-12 items-center gap-3 px-4 text-[15px] hover:bg-panel-2">
              <row.icon className="h-[18px] w-[18px] shrink-0 text-lime-deep" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{row.label}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * « Plus » of the phone's tab bar (direction A, 10/11/2026): the manager's pages (chiffre d'affaires, Sur Plazo, équipe,
 * contrats), then the account, the notifications, the platform for its admin, and sign out.
 */
export default function MorePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const manager = flatPages(
    NAV.filter((i) => i.section === "manager" && (!i.permission || can(user.role, i.permission))).map((i) => ({
      ...i,
      children: i.children?.filter((c) => !c.permission || can(user.role, c.permission)),
    })),
  ).map((page) => ({
    ...page,
    // A group's pages carry its name (« Sur Plazo · Fiche », « Sur Plazo · Tarifs »).
    label: page.group && page.page ? `${page.group} · ${page.page}` : page.label,
  }));
  const account: Row[] = [
    { label: fr.nav.account, to: "/mon-compte", icon: UserRound },
    { label: fr.nav.notifications, to: "/notifications", icon: Bell },
    ...(user.isPlatformAdmin && !user.viewAs ? [{ label: fr.nav.platform, to: "/plateforme", icon: ShieldCheck }] : []),
  ];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link to="/mon-compte" className="flex items-center gap-3 rounded-[14px] border border-panel-line bg-panel p-4 hover:bg-panel-2">
        <Avatar staff={user} size={44} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{user.name}</span>
          <span className="block truncate text-sm text-muted-foreground">
            {fr.roles[user.role]} · {user.operatorName}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
      <Group title={fr.nav.sections.manager} rows={manager} />
      <Group title={fr.nav.accountSection} rows={account} />
      <button
        type="button"
        onClick={async () => {
          await logout();
          navigate("/login", { replace: true });
        }}
        className="flex min-h-12 w-full items-center gap-3 rounded-[14px] border border-panel-line bg-panel px-4 text-[15px] text-bad-text hover:bg-panel-2"
      >
        <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
        {fr.nav.logout}
      </button>
    </div>
  );
}
