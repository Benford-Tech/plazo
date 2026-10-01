import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { PRODUCT } from "@/config/product";
import { can } from "@/domain/roles";
import { fr } from "@/i18n/fr";
import { requireUser } from "@/server/auth/current";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const links = [
    { href: "/espace", label: fr.nav.dashboard, show: true },
    { href: "/espace/parking", label: fr.nav.parking, show: can(user.role, "parking:manage") },
    { href: "/espace/equipe", label: fr.nav.team, show: can(user.role, "team:manage") },
    { href: "/espace/mon-compte", label: fr.nav.account, show: true },
  ].filter((l) => l.show);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-lg font-bold text-sky-800">{PRODUCT.name}</p>
            <p className="text-sm text-slate-500">
              {user.operatorName} · {user.name} ({fr.roles[user.role]})
            </p>
          </div>
          <form action={logoutAction}>
            <button className="min-h-11 rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-100">{fr.nav.logout}</button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 pb-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">{children}</main>
    </div>
  );
}
