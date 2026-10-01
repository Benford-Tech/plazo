import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { getDb } from "@/db/client";
import { fr } from "@/i18n/fr";
import { requireUser } from "@/server/auth/current";
import { getPrimaryParking } from "@/server/services/parkings";

export const metadata: Metadata = { title: fr.dashboard.title };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser("dashboard:view");
  const parking = await getPrimaryParking(getDb(), user);
  const t = fr.dashboard;
  return (
    <>
      <h1 className="text-2xl font-semibold">{t.hello(user.name)}</h1>
      <Card title={parking.name}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t.totalCapacity} value={t.places(parking.totalCapacity)} />
          <Stat label={t.bookableCapacity} value={t.places(parking.bookableCapacity)} />
          <Stat label={t.safetyMargin} value={`${parking.safetyMarginPct} %`} />
          <Stat label={t.shuttle} value={t.minutes(parking.shuttleTravelMinutes)} />
        </div>
        <p className="mt-3 text-sm text-slate-500">{t.bookableHelp}</p>
      </Card>
    </>
  );
}
