import prisma, { ReservationStatus } from '@/database';
import { HOLDING_STATUSES } from '@/domain/reservation';

/**
 * 01/11/2026 (« Le numéro de crochet correspond au numéro de place »): the hook the keys hang on is the car's place:
 * its spot's code (« A-12 »), or in a valet file the file and the car's slot counted from the back (« F07-3 »: the third
 * car in, which keeps its slot while the cars in front come and go). Null while the car has no place.
 */
export async function placeHookOf(r: { id: string; spotId: string | null; fileId: string | null; fileRank: number | null }): Promise<string | null> {
  if (r.spotId) {
    const spot = await prisma.parkingSpot.findUnique({ where: { id: r.spotId }, select: { code: true } });
    return spot?.code ?? null;
  }
  if (r.fileId && r.fileRank) {
    const file = await prisma.parkingFile.findUnique({ where: { id: r.fileId }, select: { code: true } });
    if (!file) return null;
    const behind = await prisma.reservation.count({
      where: { fileId: r.fileId, id: { not: r.id }, status: { in: HOLDING_STATUSES as ReservationStatus[] }, fileRank: { lt: r.fileRank } },
    });
    return `${file.code}-${behind + 1}`;
  }
  return null;
}
