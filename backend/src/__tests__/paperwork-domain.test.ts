import { cleanStrokes, codeMatches, contractDocument, contractText, hashCode, maskPhone } from '@/domain/contract';
import { canAnswer, cleanDamages, compareReports, missingForCompletion, missingSlots, photosCutoff, sniffImage } from '@/domain/inspection';

const FACTS = {
  operatorName: 'Parking Test',
  parkingName: 'Parking LYS',
  parkingAddress: '3 avenue Maréchal Juin, 69720 Saint-Laurent-de-Mure',
  customerName: 'Camille Martin',
  plate: 'AB-123-CD',
  vehicle: 'Clio blanche',
  arrivalAt: '2027-03-01T06:30',
  returnAt: '2027-03-03T15:05',
  priceCents: 5800,
  keysEntrusted: true,
  paidOnline: true,
};

describe('contrat', () => {
  it('le texte signé nomme les parties, le séjour et les clauses numérotées', () => {
    const text = contractText(contractDocument(FACTS));
    expect(text.split('\n')[0]).toBe('Contrat de stationnement · Parking LYS');
    expect(text).toContain('Véhicule : Clio blanche · AB-123-CD');
    expect(text).toContain('Prix : 58,00 €, payé en ligne');
    expect(text).toContain('Clés : confiées au parking');
    expect(text).toMatch(/^1\. Objet\./m);
    expect(contractText(contractDocument({ ...FACTS, keysEntrusted: false, priceCents: null }))).not.toContain('Prix');
  });

  it('masque le numéro et vérifie les codes', () => {
    expect(maskPhone('06 12 34 56 78')).toBe('06 •• •• •• 78');
    expect(maskPhone('+33 6 12 34 56 78')).toBe('06 •• •• •• 78');
    const hash = hashCode('secret', 'sc_1', '123456');
    expect(codeMatches('secret', 'sc_1', '123 456', hash)).toBe(true);
    expect(codeMatches('secret', 'sc_1', '123457', hash)).toBe(false);
    expect(codeMatches('secret', 'sc_2', '123456', hash)).toBe(false);
    expect(codeMatches('secret', 'sc_1', '12345', hash)).toBe(false);
  });

  it('une signature manuscrite a assez de points et reste dans le cadre', () => {
    expect(cleanStrokes([[[0.1, 0.1]]])).toBeNull();
    expect(
      cleanStrokes([
        [
          [0, 0],
          [1.2, 0.5],
        ],
      ]),
    ).toBeNull();
    expect(cleanStrokes('signature')).toBeNull();
    const ok = cleanStrokes([
      [
        [0.11111, 0.2],
        [0.2, 0.3],
        [0.3, 0.4],
      ],
      [
        [0.5, 0.5],
        [0.6, 0.6],
      ],
    ]);
    expect(ok?.[0][0]).toEqual([0.111, 0.2]);
  });
});

describe('état des lieux', () => {
  it('numérote les dégâts et refuse un point hors de la silhouette', () => {
    expect(cleanDamages([{ x: 0.5, y: 0.5, label: '  Rayure   portière ' }])).toEqual({
      ok: true,
      value: [{ n: 1, x: 0.5, y: 0.5, label: 'Rayure portière', photoId: null }],
    });
    expect(cleanDamages([{ x: 2, y: 0.5, label: 'x' }])).toEqual({ ok: false, code: 'invalid' });
    expect(cleanDamages(Array.from({ length: 21 }, () => ({ x: 0, y: 0, label: 'a' })))).toEqual({ ok: false, code: 'too_many' });
  });

  it('un état des lieux est complet avec le kilométrage et le carburant ; les photos sont facultatives (30/10/2026)', () => {
    expect(missingForCompletion({ slots: ['front', 'back'], mileageKm: 10, fuelQuarters: null })).toEqual(['fuelQuarters']);
    expect(missingForCompletion({ slots: [], mileageKm: 0, fuelQuarters: 0 })).toEqual([]);
    expect(missingSlots(['front', 'back'])).toEqual(['right', 'left']);
  });

  it('le voyageur répond tant que le dépôt n’est pas parti en navette', () => {
    const report = { completedAt: new Date(), decision: 'pending' };
    expect(canAnswer(report, 'arrived', 'dropoff')).toBe(true);
    expect(canAnswer(report, 'shuttled_out', 'dropoff')).toBe(false);
    expect(canAnswer(report, 'returned', 'return')).toBe(true);
    expect(canAnswer({ completedAt: null, decision: 'pending' }, 'arrived', 'dropoff')).toBe(false);
    expect(canAnswer(report, 'cancelled', 'return')).toBe(false);
  });

  it('compare le retour au dépôt ; reconnaît les images', () => {
    expect(compareReports({ damages: [], mileageKm: 100, fuelQuarters: 4 }, { damages: [], mileageKm: 112, fuelQuarters: 3 })).toMatchObject({
      mileageDeltaKm: 12,
      fuelDeltaQuarters: -1,
    });
    expect(compareReports(null, { damages: [], mileageKm: 1, fuelQuarters: 1 }).mileageDeltaKm).toBeNull();
    expect(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe('image/jpeg');
    expect(sniffImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
    const now = new Date('2027-06-01T00:00:00Z');
    expect(photosCutoff(now, false).toISOString()).toBe('2027-03-03T00:00:00.000Z');
  });
});
