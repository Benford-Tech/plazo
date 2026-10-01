import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { getDb } from "@/db/client";
import { fr } from "@/i18n/fr";
import { requireUser } from "@/server/auth/current";
import { listTeam } from "@/server/services/team";
import { CreateStaffForm, MemberActions } from "./team-forms";

export const metadata: Metadata = { title: fr.team.title };

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" });

export default async function TeamPage() {
  const user = await requireUser("team:manage");
  const team = await listTeam(getDb(), user);
  const t = fr.team;
  return (
    <>
      <h1 className="text-2xl font-semibold">{t.title}</h1>
      <Card>
        <ul className="divide-y divide-slate-100">
          {team.map((m) => (
            <li key={m.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium">
                  {m.name}
                  {m.id === user.id && <span className="ml-1 text-sm text-slate-500">({t.you})</span>}
                </p>
                <p className="text-sm text-slate-600">
                  {m.email}
                  {m.phone && ` · ${m.phone}`}
                </p>
                <p className="text-sm text-slate-500">
                  {fr.roles[m.role]} · {m.active ? t.active : t.inactive} · {t.lastLogin} :{" "}
                  {m.lastLoginAt ? dateFormat.format(m.lastLoginAt) : fr.common.never}
                </p>
              </div>
              {m.id !== user.id && <MemberActions member={{ id: m.id, role: m.role, active: m.active }} />}
            </li>
          ))}
        </ul>
      </Card>
      <Card title={t.add}>
        <CreateStaffForm />
      </Card>
    </>
  );
}
