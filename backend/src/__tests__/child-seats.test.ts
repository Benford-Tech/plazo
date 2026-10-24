import { childSeatsRefusal, childSeatsSummary, sumChildSeats } from '@/domain/child-seats';

describe('sièges auto (domaine)', () => {
  it('résume les sièges en français, au singulier et au pluriel', () => {
    expect(childSeatsSummary({ infant: 1, toddler: 0, booster: 2 })).toBe('1 siège bébé · 2 réhausseurs');
    expect(childSeatsSummary({ infant: 0, toddler: 1, booster: 0 }, ', ')).toBe('1 siège 1 à 4 ans');
    expect(childSeatsSummary({ infant: 0, toddler: 0, booster: 0 })).toBe('');
    expect(childSeatsSummary(null)).toBe('');
  });

  it('refuse autant de sièges que de passagers, et plus de 4 d’une sorte', () => {
    expect(childSeatsRefusal({ infant: 1, toddler: 0, booster: 1 }, 3)).toBeNull();
    expect(childSeatsRefusal({ infant: 1, toddler: 1, booster: 0 }, 2)).toBe('child_seats_exceed_passengers');
    expect(childSeatsRefusal({ infant: 0, toddler: 0, booster: 0 }, 1)).toBeNull();
    expect(childSeatsRefusal({ infant: 5, toddler: 0, booster: 0 }, 9)).toBe('child_seats_range');
    expect(childSeatsRefusal({ infant: -1, toddler: 0, booster: 0 }, 2)).toBe('child_seats_range');
  });

  it('additionne les sièges de plusieurs réservations pour le départ', () => {
    expect(sumChildSeats([{ infant: 1, toddler: 0, booster: 1 }, null, { infant: 0, toddler: 1, booster: 0 }])).toEqual({
      infant: 1,
      toddler: 1,
      booster: 1,
    });
  });
});
