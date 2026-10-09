import { readFileSync } from 'fs';
import { join } from 'path';
import { parseConfirmationEmail } from '@/domain/importers';
import { isCancellationOrChange } from '@/domain/importers/common';
import { stripHtml, textOf } from '@/domain/inbound-email';
import { fillGaps } from '@/services/inbound-email.service';

// 09/10/2026: the four comparators of the client's mailbox, from the samples Joanny sent (same layouts, fictional data).
const html = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8');
const read = (name: string) => parseConfirmationEmail(textOf({ RawHtmlBody: html(name) }));

describe('confirmations des comparateurs (09/10/2026)', () => {
  it('Onepark : avis au parking, retour à l’heure de récupération prévue, montant', () => {
    expect(read('onepark-notification.html')).toEqual({
      provider: 'Onepark',
      externalReference: '5900001',
      customerName: 'JEAN MARTIN',
      // 09/10/2026: the first and the last name, as Onepark gives them apart.
      customerFirstName: 'JEAN',
      customerLastName: 'MARTIN',
      customerPhone: '+33 6 12 34 56 78',
      customerEmail: undefined,
      arrivalAt: '2026-10-10T04:30',
      // « Fin » (19/10 04:30) closes the 9-day package; the car is picked up on the 18th at 14:00.
      returnAt: '2026-10-18T14:00',
      priceCents: 4500,
      vehicleModel: 'PEUGEOT 3008',
      plate: 'AB123CD',
      passengers: 2,
      returnFlight: 'SN3587',
      departureFlight: undefined,
    });
  });

  it('Onepark : la fin du forfait sert de retour quand la récupération n’est pas indiquée ; texte brut « libellé : valeur »', () => {
    const text = [
      'Une nouvelle réservation Onepark a été enregistrée pour votre parking.',
      'Prénom : Léa',
      'Nom : Petit',
      'Portable : 06 98 76 54 32',
      'Numéro de réservation : 5900002',
      'Début : 01/11/2026 06:00',
      'Fin : 08/11/2026 06:00',
      'Montant de la réservation : 1 045,50 €',
      'Modèle véhicule : Renault Clio',
      "Plaque d'immatriculation : CD-456-EF",
      'Nombre de passagers : 1',
    ].join('\n');
    expect(parseConfirmationEmail(text)).toMatchObject({
      customerName: 'Léa Petit',
      customerFirstName: 'Léa',
      customerLastName: 'Petit',
      customerPhone: '06 98 76 54 32',
      arrivalAt: '2026-11-01T06:00',
      returnAt: '2026-11-08T06:00',
      priceCents: 104550,
      vehicleModel: 'Renault Clio',
      plate: 'CD-456-EF',
      passengers: 1,
    });
  });

  it('ParkMundo : séjour et vols, véhicule, et le prix du parking sans les frais de ParkMundo', () => {
    expect(read('parkmundo-confirmation.html')).toEqual({
      provider: 'ParkMundo',
      externalReference: 'PM1500000001',
      customerName: 'Claire Durand',
      customerPhone: '+33612345678',
      customerEmail: 'claire.durand@example.com',
      arrivalAt: '2026-10-15T12:00',
      departureFlight: 'EJU4315',
      returnAt: '2026-10-20T10:30',
      returnFlight: 'EJU4316',
      plate: 'FG456HJ',
      vehicleModel: 'DACIA DUSTER',
      vehicleColour: 'Vert',
      passengers: 2,
      // « Prix du parking » 30,00 €; the 1,99 € « Coût de réservation » is ParkMundo's.
      priceCents: 3000,
    });
  });

  it('Parclick : arrivée, sortie et référence ; ce que le mail ne dit pas reste à compléter', () => {
    const booking = read('parclick-confirmation.html');
    expect(booking).toMatchObject({
      provider: 'Parclick',
      externalReference: 'BQXY1234',
      arrivalAt: '2026-10-09T19:45',
      returnAt: '2026-10-11T19:45',
    });
    // The parking's own number in the text is not the traveller's.
    expect(booking?.customerPhone).toBeUndefined();
    expect(booking?.plate).toBeUndefined();
  });

  it('Parclick : les dates se lisent aussi quand les libellés et les valeurs sont sur deux rangées', () => {
    const text =
      'Parclick Voici votre réservation ! Arrivée au parking Sortie du parking 09/10/2026 19:45 11/10/2026 19:45 Référence de la réservation: BQXY1234 Total payé : 52,90 €';
    expect(parseConfirmationEmail(text)).toMatchObject({ arrivalAt: '2026-10-09T19:45', returnAt: '2026-10-11T19:45', priceCents: 5290 });
  });

  it('Allopark : la confirmation envoyée au voyageur se lit aussi (séjour, montant, nom)', () => {
    expect(read('allopark-customer.html')).toMatchObject({
      provider: 'Allopark',
      externalReference: 'AL-012345678',
      arrivalAt: '2026-10-13T10:00',
      returnAt: '2026-10-18T13:00',
      priceCents: 3400,
      customerName: 'Paul MOREAU',
    });
  });

  it('une annulation ou une modification n’est jamais lue comme une nouvelle réservation ; « annulation gratuite » ne gêne pas', () => {
    expect(isCancellationOrChange('Votre réservation a été annulée. Référence de la réservation: BQXY1234 Parclick')).toBe(true);
    expect(isCancellationOrChange('Modification de votre réservation PM1500000001 ParkMundo')).toBe(true);
    expect(parseConfirmationEmail('ParkMundo PM1500000001 : votre réservation est annulée.')).toBeNull();
    expect(isCancellationOrChange(stripHtml(html('parkmundo-confirmation.html')))).toBe(false);
  });

  it('Claude ne remplit que les trous d’une lecture partielle, sans rien écraser', () => {
    const found = { provider: 'Parclick', externalReference: 'BQXY1234', arrivalAt: '2026-10-09T19:45', returnAt: '2026-10-11T19:45' };
    const read = {
      provider: 'Parclick',
      externalReference: 'AUTRE',
      arrivalAt: '2026-10-09T20:00',
      customerName: 'Marc Leroy',
      customerPhone: '+33 6 00 00 00 01',
      plate: 'GH-789-JK',
    };
    expect(fillGaps(found, read)).toEqual({ ...found, customerName: 'Marc Leroy', customerPhone: '+33 6 00 00 00 01', plate: 'GH-789-JK' });
  });

  it('09/10/2026 : le nom va d’un bloc ; le prénom et le nom de Claude ne s’ajoutent que s’ils redonnent le nom lu', () => {
    const claude = { provider: 'ParkMundo', customerName: 'Claire Durand', customerFirstName: 'Claire', customerLastName: 'Durand' };
    // ParkMundo reads one « Nom » field: Claude's split is kept when it rebuilds it (case aside).
    expect(fillGaps({ provider: 'ParkMundo', customerName: 'CLAIRE DURAND' }, claude)).toMatchObject({
      customerName: 'CLAIRE DURAND',
      customerFirstName: 'Claire',
      customerLastName: 'Durand',
    });
    // Another name: the importer's stays whole, without Claude's parts.
    const other = fillGaps({ provider: 'ParkMundo', customerName: 'Paul Moreau' }, claude);
    expect(other).toEqual({ provider: 'ParkMundo', customerName: 'Paul Moreau' });
    // The importer's own parts are never replaced.
    const onepark = { provider: 'Onepark', customerName: 'Léa', customerFirstName: 'Léa' };
    expect(fillGaps(onepark, { provider: 'Onepark', customerName: 'Léa Petit', customerFirstName: 'Léa', customerLastName: 'Petit' })).toEqual(
      onepark,
    );
  });
});
