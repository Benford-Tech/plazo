import { billableDays, quoteCents, splitPayment } from '@/domain/pricing';
import { parseInstant } from '@/domain/time';

const TZ = 'Europe/Paris';
const at = (local: string) => parseInstant(local, TZ)!;

describe('jours facturés', () => {
  it('compte chaque jour touché, arrivée et retour compris', () => {
    expect(billableDays(at('2026-10-01T08:30'), at('2026-10-03T17:00'), TZ)).toBe(3);
    expect(billableDays(at('2026-10-04T06:00'), at('2026-10-04T22:00'), TZ)).toBe(1);
    expect(billableDays(at('2026-10-04T06:30'), at('2026-10-11T15:05'), TZ)).toBe(8);
  });
});

describe('forfaits « jusqu’à N jours »', () => {
  const tiers = [
    { days: 1, priceCents: 1500 },
    { days: 3, priceCents: 3499 },
    { days: 7, priceCents: 5900 },
  ];

  it('prend le forfait le moins cher qui couvre le séjour', () => {
    expect(quoteCents(tiers, 600, 1)).toBe(1500);
    expect(quoteCents(tiers, 600, 2)).toBe(3499);
    expect(quoteCents(tiers, 600, 3)).toBe(3499);
    expect(quoteCents(tiers, 600, 7)).toBe(5900);
  });

  it('ajoute le prix par jour au-delà du plus long forfait', () => {
    expect(quoteCents(tiers, 600, 10)).toBe(5900 + 3 * 600);
  });

  it('ne devine pas un prix que la grille ne donne pas', () => {
    expect(quoteCents(tiers, null, 10)).toBeNull();
    expect(quoteCents([], 600, 2)).toBeNull();
  });

  it('retient le moins cher si un forfait plus long coûte moins', () => {
    expect(
      quoteCents(
        [
          { days: 5, priceCents: 5000 },
          { days: 7, priceCents: 4500 },
        ],
        null,
        4,
      ),
    ).toBe(4500);
  });
});

describe('commission', () => {
  it('partage au centime près', () => {
    expect(splitPayment(3499, 1500)).toEqual({ commissionCents: 525, operatorCents: 2974 });
    expect(splitPayment(1000, 0)).toEqual({ commissionCents: 0, operatorCents: 1000 });
  });
});
