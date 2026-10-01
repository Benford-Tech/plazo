import { Container } from 'typedi';
import prisma from '@/database';
import { parseInstant } from '@/domain/time';
import { CapacityService } from '@/services/capacity.service';
import { resetDatabase, setupOperator } from './utils/helpers';

const TZ = 'Europe/Paris';
const capacity = Container.get(CapacityService);
const at = (local: string) => parseInstant(local, TZ)!;

let counter = 0;
async function reserve(op: Awaited<ReturnType<typeof setupOperator>>, arrival: string, ret: string) {
  counter += 1;
  return prisma.reservation.create({
    data: {
      reference: `T${String(counter).padStart(5, '0')}`,
      operatorId: op.operator.id,
      parkingId: op.parking.id,
      channel: 'phone',
      arrivalAt: at(arrival),
      returnAt: at(ret),
      passengers: 1,
      customerName: 'Client Test',
      customerPhone: '0612345678',
      plate: 'AB-123-CD',
      plateKey: 'AB123CD',
    },
  });
}

beforeEach(resetDatabase);

describe('occupation par nuit (dates locales)', () => {
  it('compte une arrivée et un retour entre minuit et 4 h sur la bonne nuit (heure d’été)', async () => {
    const op = await setupOperator();
    // Return at 01:30 local on 6 Oct (stored 5 Oct 23:30Z): occupies the nights of 4 and 5 Oct.
    await reserve(op, '2026-10-04T10:00', '2026-10-06T01:30');
    // Arrival at 02:00 local on 5 Oct (stored 5 Oct 00:00Z): first night is 5 Oct, not 4 Oct.
    await reserve(op, '2026-10-05T02:00', '2026-10-07T10:00');
    const nights = await capacity.nights(op.parking, '2026-10-03', '2026-10-07');
    expect(nights.map(n => [n.date, n.count])).toEqual([
      ['2026-10-03', 0],
      ['2026-10-04', 1],
      ['2026-10-05', 2],
      ['2026-10-06', 1],
      ['2026-10-07', 0],
    ]);
  });

  it('compte correctement en heure d’hiver aussi', async () => {
    const op = await setupOperator();
    await reserve(op, '2026-12-04T00:30', '2026-12-06T00:45');
    const nights = await capacity.nights(op.parking, '2026-12-03', '2026-12-06');
    expect(nights.map(n => [n.date, n.count])).toEqual([
      ['2026-12-03', 0],
      ['2026-12-04', 1],
      ['2026-12-05', 1],
      ['2026-12-06', 0],
    ]);
  });

  it('ne surréserve pas la nuit d’un retour à 01:30', async () => {
    const op = await setupOperator();
    await prisma.parking.update({ where: { id: op.parking.id }, data: { totalCapacity: 1, safetyMarginPct: 0 } });
    const parking = await prisma.parking.findUniqueOrThrow({ where: { id: op.parking.id } });
    await reserve(op, '2026-10-04T10:00', '2026-10-06T01:30');
    const { full } = await capacity.fullNights(parking, at('2026-10-05T12:00'), at('2026-10-07T10:00'));
    expect(full.map(n => n.date)).toEqual(['2026-10-05']);
    // A stay starting at 02:00 on 6 Oct no longer meets that vehicle.
    const later = await capacity.fullNights(parking, at('2026-10-06T02:00'), at('2026-10-08T10:00'));
    expect(later.full).toEqual([]);
  });
});
