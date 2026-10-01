import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { getDb } from "@/db/client";
import { fr } from "@/i18n/fr";
import { requireUser } from "@/server/auth/current";
import { getPrimaryParking } from "@/server/services/parkings";
import { ParkingForm } from "./parking-form";

export const metadata: Metadata = { title: fr.parking.title };

export default async function ParkingPage() {
  const user = await requireUser("parking:manage");
  const p = await getPrimaryParking(getDb(), user);
  return (
    <>
      <h1 className="text-2xl font-semibold">{fr.parking.title}</h1>
      <Card>
        <ParkingForm
          initial={{
            name: p.name,
            address: p.address ?? "",
            totalCapacity: p.totalCapacity,
            safetyMarginPct: p.safetyMarginPct,
            shuttleTravelMinutes: p.shuttleTravelMinutes,
          }}
        />
      </Card>
    </>
  );
}
