import { getDb } from "@/db/client";
import { getBearerUser } from "@/server/auth/current";
import { getPrimaryParking } from "@/server/services/parkings";

export async function GET(request: Request) {
  const user = await getBearerUser(request);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parking = await getPrimaryParking(getDb(), user);
  return Response.json({
    user,
    parking: {
      id: parking.id,
      name: parking.name,
      address: parking.address,
      totalCapacity: parking.totalCapacity,
      bookableCapacity: parking.bookableCapacity,
      shuttleTravelMinutes: parking.shuttleTravelMinutes,
      timezone: parking.timezone,
    },
  });
}
