import httpStatus from 'http-status';
import { Service } from 'typedi';
import prisma from '@/database';
import { reservationHistory, HistoryEvent } from '@/domain/reservation-history';
import { STAFF_VISIBLE } from './reservation.service';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';

/** At most this many entries (a stay rarely has more than a few dozen). */
const MAX_ENTRIES = 300;

/** « Historique » of a reservation (30/10/2026, direction A): who did what, newest first. */
@Service()
export class ReservationHistoryService {
  /** GET /internal/reservations/:id/history */
  public async history(actor: AuthenticatedStaff, id: string): Promise<{ data: HistoryEvent[] }> {
    const reservation = await prisma.reservation.findFirst({
      where: { id, operatorId: actor.operatorId, AND: [STAFF_VISIBLE] },
      select: { id: true, customerName: true, channelDetail: true, parking: { select: { timezone: true } } },
    });
    if (!reservation) throw new HttpException(httpStatus.NOT_FOUND, 'Reservation not found', 'not_found');
    const rows = await prisma.auditLog.findMany({
      where: { operatorId: actor.operatorId, entityType: 'reservation', entityId: id },
      orderBy: { createdAt: 'desc' },
      take: MAX_ENTRIES,
      select: {
        id: true,
        action: true,
        details: true,
        createdAt: true,
        staff: { select: { id: true, firstName: true, name: true, photoUpdatedAt: true } },
      },
    });
    return { data: reservationHistory(rows, reservation, reservation.parking.timezone) };
  }
}
