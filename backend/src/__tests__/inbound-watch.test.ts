import { readFileSync } from 'fs';
import { join } from 'path';
import { Container } from 'typedi';
import prisma from '@/database';
import { stripHtml } from '@/domain/inbound-email';
import { reportDay, staleAlert } from '@/domain/inbound-watch';
import { InboundWatchService } from '@/services/inbound-watch.service';
import { NotificationService } from '@/services/notification.service';
import { PushService } from '@/services/push.service';
import { api, resetDatabase, setupOperator } from './utils/helpers';

/**
 * 09/11/2026 (« faut un job qui parcourt les mails en continu pour voir si tout est ok »): the emails the rules now read
 * otherwise are read again by themselves, the managers hear of a comparator's email still « À traiter » after two hours,
 * and the platform gets its morning report. Fictional data only.
 */

const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8');
const retry = () => api().post('/api/public/inbound/retry').set('X-Inbound-Secret', 'inbound-test-secret');
const watch = () => Container.get(InboundWatchService);
const ONEPARK = { fromName: 'Onepark', fromAddress: 'partner.service@onepark.co' };

beforeEach(async () => {
  await resetDatabase();
  delete process.env.PLATFORM_ADMIN_EMAILS;
});
afterEach(() => jest.restoreAllMocks());
afterAll(() => prisma.$disconnect());

const stored = (operatorId: string, over: Record<string, unknown>) =>
  prisma.inboundEmail.create({
    data: {
      operatorId,
      status: 'unrecognised',
      ...ONEPARK,
      subject: 'Annulation de la réservation #5900011',
      textBody: stripHtml(fixture('onepark-cancellation-short.html')),
      receivedAt: new Date(Date.now() - 3 * 3_600_000),
      ...over,
    } as never,
  });

describe('relire avec les règles du jour', () => {
  it('un mail lu par une ancienne règle est relu seul et la réservation est annulée ; une seule fois', async () => {
    const op = await setupOperator();
    const booking = await prisma.reservation.create({
      data: {
        operatorId: op.operator.id,
        parkingId: op.parking.id,
        reference: 'PZWATCH1',
        channel: 'aggregator',
        channelDetail: 'Onepark',
        externalReference: '5900011',
        customerName: 'Camille Exemple',
        customerFirstName: 'Camille',
        customerLastName: 'Exemple',
        customerPhone: '06 12 34 56 78',
        plate: '',
        plateKey: '',
        arrivalAt: new Date('2026-11-11T08:30:00Z'),
        returnAt: new Date('2026-11-15T08:30:00Z'),
        passengers: 1,
        status: 'upcoming',
      },
    });
    // Read at its reception by the rule of the day before (the number not found): left « À traiter ».
    const email = await stored(op.operator.id, {
      reading: {
        kind: 'cancellation',
        provider: 'Onepark',
        confidence: 1,
        summary: '',
        model: '',
        source: 'rules',
        rule: 'onepark.cancellation-wording',
      },
    });
    const first = await retry();
    expect(first.body.newRules).toMatchObject({ due: 1, tried: 1 });
    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe('cancelled');
    const after = await prisma.inboundEmail.findUniqueOrThrow({ where: { id: email.id } });
    expect(after).toMatchObject({ reservationId: booking.id });
    expect(after.reading).toMatchObject({ rule: 'onepark.cancellation' });
    // Read with the current rule: nothing more to do.
    expect((await retry()).body.newRules).toBeUndefined();
  });

  it('jamais un mail que les règles lisent toujours de la même façon', async () => {
    const op = await setupOperator();
    await stored(op.operator.id, {
      subject: 'Votre réservation a été modifiée',
      textBody: 'Onepark : votre réservation a été modifiée.',
      reading: { kind: 'modification', provider: 'Onepark', confidence: 1, summary: '', model: '', source: 'rules', rule: 'onepark.change-wording' },
    });
    expect((await retry()).body.newRules).toBeUndefined();
  });
});

describe('alerte aux gérants', () => {
  it('un mail de comparateur « À traiter » depuis 2 h : un push par loueur, une seule fois ; jamais la nuit, jamais un autre mail', async () => {
    const op = await setupOperator();
    const push = jest.spyOn(Container.get(PushService), 'notifyStaff').mockResolvedValue(1);
    const day = new Date('2026-11-09T13:00:00Z'); // 14:00 Paris
    const email = await stored(op.operator.id, { receivedAt: new Date(day.getTime() - 3 * 3_600_000) });
    const recent = await stored(op.operator.id, { receivedAt: new Date(day.getTime() - 30 * 60_000) });
    const customer = await stored(op.operator.id, {
      fromName: 'Client',
      fromAddress: 'client@example.com',
      subject: 'Une question',
      textBody: 'Bonjour, avez-vous des places couvertes ?',
      receivedAt: new Date(day.getTime() - 3 * 3_600_000),
    });

    // At night: nothing, nothing marked (told at 07:00).
    expect(await watch().alertStale(new Date('2026-11-09T22:30:00Z'))).toEqual({ alerted: 0, operators: 0 });
    expect(push).not.toHaveBeenCalled();

    expect(await watch().alertStale(day)).toEqual({ alerted: 1, operators: 1 });
    expect(push).toHaveBeenCalledWith(
      op.operator.id,
      'inbox',
      { title: 'Mail à vérifier depuis plus de 2 h', body: 'Onepark · Annulation de la réservation #5900011' },
      expect.objectContaining({ data: expect.objectContaining({ type: 'inbox', event: 'stale', emailId: email.id }) }),
    );
    expect((await prisma.inboundEmail.findUniqueOrThrow({ where: { id: customer.id } })).staleAlertedAt).not.toBeNull();
    expect((await prisma.inboundEmail.findUniqueOrThrow({ where: { id: recent.id } })).staleAlertedAt).toBeNull();

    // Once only.
    push.mockClear();
    expect(await watch().alertStale(day)).toEqual({ alerted: 0, operators: 0 });
    expect(push).not.toHaveBeenCalled();
  });

  it('le texte du push', () => {
    expect(
      staleAlert([
        { sender: 'Onepark', subject: 'Annulation' },
        { sender: 'Allopark', subject: null },
        { sender: 'Parclick', subject: 'Voici votre réservation !' },
      ]),
    ).toEqual({ title: '3 mails à vérifier depuis plus de 2 h', body: 'Onepark · Annulation · et 2 autres' });
  });
});

describe('rapport pour la plateforme', () => {
  it('chaque matin, une fois, aux administrateurs : les mails des 24 h et ceux à vérifier', async () => {
    const op = await setupOperator('Parking Exemple');
    process.env.PLATFORM_ADMIN_EMAILS = 'admin@example.com';
    const notifications = Container.get(NotificationService);
    jest.spyOn(notifications, 'canSendEmail').mockReturnValue(true);
    const email = jest.spyOn(notifications, 'emailStaff').mockResolvedValue(true);
    const morning = new Date('2026-11-09T07:15:00Z'); // 08:15 Paris
    await stored(op.operator.id, {
      receivedAt: new Date(morning.getTime() - 5 * 3_600_000),
      reading: {
        kind: 'cancellation',
        provider: 'Onepark',
        confidence: 1,
        summary: '',
        model: '',
        source: 'rules',
        rule: 'onepark.cancellation-wording',
      },
    });
    await stored(op.operator.id, { status: 'imported', receivedAt: new Date(morning.getTime() - 6 * 3_600_000) });

    expect(await watch().sendReport(new Date('2026-11-09T05:00:00Z'))).toBe('not_due');
    expect(await watch().sendReport(morning)).toBe('sent');
    expect(email).toHaveBeenCalledTimes(1);
    const [to, tag, , message] = email.mock.calls[0];
    expect(to).toEqual({ email: 'admin@example.com', name: '' });
    expect(tag).toBe('inbound-report');
    expect(message.subject).toBe('Mails entrants du 09/11/2026 : 1 à vérifier');
    expect(message.text).toMatch(/Parking Exemple[^:]* : 2 reçus, 1 importés, 1 à vérifier/);
    expect(message.text).toContain(
      'Annulation de la réservation #5900011 · Onepark · Non reconnu · Annulation · Onepark · onepark.cancellation-wording',
    );
    expect(await watch().sendReport(new Date(morning.getTime() + 15 * 60_000))).toBe('already_sent');
  });

  it("un envoi refusé est retenté au passage suivant ; l'heure du rapport", async () => {
    process.env.PLATFORM_ADMIN_EMAILS = 'admin@example.com';
    const notifications = Container.get(NotificationService);
    jest.spyOn(notifications, 'canSendEmail').mockReturnValue(true);
    const email = jest.spyOn(notifications, 'emailStaff').mockResolvedValueOnce(false).mockResolvedValue(true);
    const morning = new Date('2026-11-09T07:15:00Z');
    expect(await watch().sendReport(morning)).toBe('not_sent');
    expect(await watch().sendReport(morning)).toBe('sent');
    expect(email.mock.calls[1][3].subject).toBe('Mails entrants du 09/11/2026 : tout est en ordre');
    expect(reportDay(new Date('2026-11-09T11:30:00Z'))).toBeNull(); // 12:30 Paris
  });
});
