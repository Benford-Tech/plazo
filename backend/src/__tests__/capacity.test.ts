import { bookableCapacity } from '@/domain/capacity';

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
