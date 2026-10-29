import { readImportRow } from '@/domain/booking-import';
import { importChanges } from '@/domain/import-change';
import { travellerEmail, travellerEmailIn } from '@/domain/traveller-email';

// 29/10/2026 (« récupère le mail du passager au lieu de celui du comparateur »). Every traveller is fictional.
describe('l’e-mail du voyageur, jamais celui du comparateur', () => {
  it('écarte les adresses des comparateurs et des robots', () => {
    expect(travellerEmail(' Camille.Martin@Gmail.com ')).toBe('camille.martin@gmail.com');
    expect(travellerEmail('reservation@allopark.com')).toBeNull();
    expect(travellerEmail('client-5908369@relay.onepark.fr')).toBeNull();
    expect(travellerEmail('booking@parkvia.com')).toBeNull();
    expect(travellerEmail('contact@park-mundo.com')).toBeNull();
    expect(travellerEmail('noreply@parkingdupont.fr')).toBeNull();
    expect(travellerEmail('ne-pas-repondre@example.org')).toBeNull();
    expect(travellerEmail('dupont@plazo.fr', ['plazo.fr'])).toBeNull();
    expect(travellerEmail('pas une adresse')).toBeNull();
    // A traveller whose name contains « park » is kept.
    expect(travellerEmail('jean.parker@orange.fr')).toBe('jean.parker@orange.fr');
  });

  it('prend la première adresse du voyageur dans le texte', () => {
    expect(travellerEmailIn('E-mail : noreply@onepark.fr Client Email : camille@free.fr')).toBe('camille@free.fr');
    expect(travellerEmailIn('Email : reservation@parclick.fr')).toBeUndefined();
  });

  it('laisse vide la colonne E-mail d’un fichier qui donne l’adresse du comparateur', () => {
    const row = (email: string) =>
      readImportRow(
        { line: 2, name: 'Camille Martin', phone: '0612345678', arrivalDate: '12/11/2030', returnDate: '19/11/2030', email },
        'Europe/Paris',
        new Date('2030-11-01T10:00:00Z'),
      );
    const bad = row('resa@allopark.com');
    expect(bad.booking?.customerEmail).toBeNull();
    expect(bad.warnings).toContain('email_not_traveller');
    const good = row('Camille@Gmail.com');
    expect(good.booking?.customerEmail).toBe('camille@gmail.com');
    expect(good.warnings).not.toContain('email_not_traveller');
  });

  it('une modification ne remplace jamais l’e-mail par celui du comparateur', () => {
    const current = { customerEmail: 'camille@free.fr' } as Parameters<typeof importChanges>[0];
    const result = importChanges(current, { provider: 'Allopark', customerEmail: 'info@allopark.com' }, 'Europe/Paris');
    expect(result.changes.find(c => c.field === 'customerEmail')).toBeUndefined();
  });
});
