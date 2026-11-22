import { readReviewUrl } from '@/domain/review-link';

describe('lien d’avis Google (22/11/2026)', () => {
  it('accepte les adresses de Google seulement, en https', () => {
    expect(readReviewUrl(undefined)).toBeUndefined();
    expect(readReviewUrl(null)).toBeNull();
    expect(readReviewUrl('  ')).toBeNull();
    expect(readReviewUrl(' https://g.page/r/CbX1234/review ')).toBe('https://g.page/r/CbX1234/review');
    expect(readReviewUrl('https://search.google.com/local/writereview?placeid=ChIJ123')).toBe(
      'https://search.google.com/local/writereview?placeid=ChIJ123',
    );
    expect(readReviewUrl('https://maps.app.goo.gl/AbCd')).toBe('https://maps.app.goo.gl/AbCd');
    expect(readReviewUrl('https://www.google.com/maps/place/x')).toBe('https://www.google.com/maps/place/x');
    for (const bad of [
      'http://g.page/r/x/review',
      'https://g.page.example.com/r',
      'https://evilgoogle.com/r',
      'https://google.com.evil.fr/r',
      'https://user@g.page/r',
      'https://g.page:8443/r',
      'javascript:alert(1)',
      'g.page/r/x',
      `https://g.page/${'a'.repeat(500)}`,
      42,
    ]) {
      expect(readReviewUrl(bad)).toBe('invalid');
    }
  });
});
