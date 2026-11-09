import prisma from '@/database';
import { ParkingValues, parkingValuesOf } from '@/domain/day-before-sms';

/**
 * 09/11/2026 (« variabilise au maximum, c'est pour tous les parkings »): the parking's details for the variables of the
 * day-before text ({parking}, {adresse}, {téléphone}, {rendez-vous}, {consignes}, {navette}, {services}); null when the
 * parking is gone.
 */
export async function loadParkingValues(parkingId: string): Promise<ParkingValues | null> {
  const parking = await prisma.parking.findUnique({
    where: { id: parkingId },
    select: {
      name: true,
      address: true,
      shuttleTravelMinutes: true,
      returnMeetingLabel: true,
      returnMeetingInstructions: true,
      listing: { select: { title: true, contactPhone: true, shuttleMinutes: true, airport: { select: { name: true } } } },
    },
  });
  if (!parking) return null;
  const services = await prisma.parkingExtra.findMany({
    where: { parkingId, enabled: true, archivedAt: null },
    select: { label: true, priceCents: true },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });
  return parkingValuesOf(parking, services);
}
