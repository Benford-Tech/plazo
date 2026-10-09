import { activeFilesCapacity, activeSpotCount, bookableCapacity, effectiveCapacity } from '@/domain/capacity';

describe('bookableCapacity', () => {
  it('rend toute la capacité sans marge', () => {
    expect(bookableCapacity(200, 0)).toBe(200);
  });

  it('retire la marge et arrondit à l’inférieur', () => {
    expect(bookableCapacity(200, 5)).toBe(190);
    expect(bookableCapacity(73, 5)).toBe(69); // 69.35 -> 69
  });

  it('refuse les valeurs invalides', () => {
    expect(() => bookableCapacity(0, 5)).toThrow(RangeError);
    expect(() => bookableCapacity(100, 51)).toThrow(RangeError);
    expect(() => bookableCapacity(100, -1)).toThrow(RangeError);
    expect(() => bookableCapacity(10.5, 0)).toThrow(RangeError);
  });
});

describe('effectiveCapacity (09/10/2026, les places du plan comptent partout)', () => {
  it('prend la capacité des files actives quand il y en a', () => {
    expect(effectiveCapacity({ declared: 200, activeFilesCapacity: 42, activeSpots: 60 })).toEqual({ total: 42, source: 'files' });
  });

  it('sinon les places actives du plan, quel que soit le chiffre déclaré', () => {
    expect(effectiveCapacity({ declared: 200, activeFilesCapacity: 0, activeSpots: 60 })).toEqual({ total: 60, source: 'spots' });
    expect(effectiveCapacity({ declared: 10, activeFilesCapacity: 0, activeSpots: 60 })).toEqual({ total: 60, source: 'spots' });
  });

  it('sans plan, le chiffre déclaré', () => {
    expect(effectiveCapacity({ declared: 200, activeFilesCapacity: 0, activeSpots: 0 })).toEqual({ total: 200, source: 'declared' });
  });

  it('la marge s’applique ensuite sur la capacité retenue', () => {
    const { total } = effectiveCapacity({ declared: 200, activeFilesCapacity: 0, activeSpots: 40 });
    expect(bookableCapacity(total, 10)).toBe(36);
  });
});

describe('activeFilesCapacity et activeSpotCount', () => {
  it('ignorent les files fermées et les places inactives', () => {
    expect(
      activeFilesCapacity([
        { active: true, capacity: 3 },
        { active: false, capacity: 5 },
        { active: true, capacity: 2 },
      ]),
    ).toBe(5);
    expect(activeSpotCount([{ active: true }, { active: false }, { active: true }])).toBe(2);
    expect(activeFilesCapacity([])).toBe(0);
    expect(activeSpotCount([])).toBe(0);
  });
});
