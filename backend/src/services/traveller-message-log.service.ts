import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma from '@/database';
import { TravellerMessage, travellerMessages } from '@/domain/traveller-message-log';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { STAFF_VISIBLE } from './reservation.service';

/** GET /internal/reservations/:id/messages (04/11/2026): the SMS and WhatsApp messages sent to the traveller. */
@Service()
export class TravellerMessageLogService {
  public async forReservation(actor: AuthenticatedStaff, id: string) {
    const reservation = await prisma.reservation.findFirst({
      where: { id, operatorId: actor.operatorId, AND: [STAFF_VISIBLE] },
      select: { id: true },
    });
    if (!reservation) throw new HttpException(httpStatus.NOT_FOUND, 'Reservation not found', 'not_found');
    const where = { operatorId: actor.operatorId, reservationId: id };
    const [whatsapp, sms] = await Promise.all([
      prisma.whatsappMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { id: true, kind: true, status: true, waMessageId: true, errorCode: true, createdAt: true, updatedAt: true },
      }),
      prisma.smsOutbox.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { id: true, kind: true, status: true, createdAt: true, updatedAt: true },
      }),
    ]);
    // 12/11/2026: what the traveller wrote back on WhatsApp, and the team's replies.
    const { WhatsappInboxService } = await import('./whatsapp-inbox.service');
    const conversation = await Container.get(WhatsappInboxService).forReservation(actor.operatorId, id);
    return { data: travellerMessages(whatsapp, sms) as TravellerMessage[], conversation };
  }
}
