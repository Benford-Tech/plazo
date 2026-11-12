import prisma from '@/database';
import { ParkingValues, parkingValuesOf } from '@/domain/day-before-sms';
import { nightRule } from '@/domain/night-fees';
import { surchargeConditions } from '@/domain/surcharges';

/**
 * 09/11/2026 (« variabilise au maximum, c'est pour tous les parkings »): the parking's details for the variables of the
 * day-before text ({parking}, {adresse}, {téléphone}, {rendez-vous}, {consignes}, {navette}, {services}); null when the
 * parking is gone. With the booking's stop, the return meeting point is that stop.
 */
export async function loadParkingValues(parkingId: string, stopId: string | null = null): Promise<ParkingValues | null> {
  const parking = await prisma.parking.findUnique({
    where: { id: parkingId },
    select: {
      name: true,
      operatorId: true,
      address: true,
      shuttleTravelMinutes: true,
      returnMeetingLabel: true,
      returnMeetingInstructions: true,
      driverPhone: true,
      travellerConditions: true,
      surcharges: true,
      nightFeeEnabled: true,
      nightStart: true,
      nightEnd: true,
      nightArrivalFeeCents: true,
      nightReturnFeeCents: true,
      listing: { select: { title: true, contactPhone: true, shuttleMinutes: true, openingHours: true, airport: { select: { name: true } } } },
    },
  });
  if (!parking) return null;
  const services = await prisma.parkingExtra.findMany({
    where: { parkingId, enabled: true, archivedAt: null },
    select: { label: true, priceCents: true },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });
  // The booking's stop (null = the airport): only one of this parking's.
  const stop = stopId
    ? await prisma.shuttleStop.findFirst({ where: { id: stopId, parkingId }, select: { name: true, instructions: true, lat: true, lng: true } })
    : null;
  // The meeting point's position, in PostGIS (Unsupported for Prisma).
  const [point] = await prisma.$queryRaw<{ lat: number | null; lng: number | null }[]>`
    SELECT ST_Y("returnMeetingPoint") AS lat, ST_X("returnMeetingPoint") AS lng FROM parkings WHERE id = ${parkingId}`;
  // 11/11/2026: without a listing phone, {téléphone} is the parking's SMS phone (the traveller can call or answer it).
  const sms = parking.listing?.contactPhone?.trim()
    ? null
    : await prisma.operatorSmsSettings.findUnique({ where: { operatorId: parking.operatorId }, select: { senderPhone: true } });
  const night = nightRule({
    enabled: parking.nightFeeEnabled,
    start: parking.nightStart,
    end: parking.nightEnd,
    arrivalFeeCents: parking.nightArrivalFeeCents,
    returnFeeCents: parking.nightReturnFeeCents,
  });
  return parkingValuesOf(parking, services, stop, {
    meetingPoint: point && point.lat !== null && point.lng !== null ? { lat: point.lat, lng: point.lng } : null,
    night,
    senderPhone: sms?.senderPhone ?? null,
    surcharges: surchargeConditions(parking),
  });
}
