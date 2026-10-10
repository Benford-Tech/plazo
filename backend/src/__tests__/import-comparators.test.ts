import { readFileSync } from 'fs';
import { join } from 'path';
import { isComparatorAddress, parseConfirmationEmail } from '@/domain/importers';
import {
  alloparkConfirmationPage,
  alloparkLinks,
  alloparkPageAddresses,
  alloparkPageFacts,
  alloparkPageUrls,
  alloparkReferenceOf,
  isAlloparkCancellationOrChange,
  MAX_LINKS,
  MAX_PAGES,
  parseAlloparkPage,
} from '@/domain/importers/allopark-page';
import { isCancellationOrChange } from '@/domain/importers/common';
import { forwardedRecipientsOf, stripHtml, textOf } from '@/domain/inbound-email';
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

describe('Allopark : la page de la réservation (10/10/2026)', () => {
  const page = html('allopark-page.html');
  const pageUrl = 'https://www.allopark.com/fr-be/confirmation?email=parking%40example.com&reference=AL-884880719&view=parking';

  it('ouvre le lien « Consulter ma réservation » du mail, reconstruit sur www.allopark.com avec ses seuls paramètres', () => {
    const link =
      '<a href="http://allopark.com/fr-be/confirmation?email=parking@example.com&amp;reference=al-884880719&amp;view=parking&amp;utm_source=mail">Consulter</a>';
    expect(alloparkPageUrls({ links: alloparkLinks(link), reference: 'AL-884880719', addresses: ['autre@example.com'] })).toEqual([pageUrl]);
    // Another booking's link, a look-alike site or an address that is not one: the email's addresses instead.
    const others = [
      '<a href="https://www.allopark.com/fr-be/confirmation?email=parking@example.com&amp;reference=AL-111111111">x</a>',
      '<a href="https://www.allopark.com.example.test/fr-be/confirmation?email=parking@example.com&amp;reference=AL-884880719">x</a>',
      '<a href="https://www.allopark.com/fr-fr/confirmation?email=pas-une-adresse&amp;reference=AL-884880719">x</a>',
    ].join('');
    expect(alloparkPageUrls({ links: alloparkLinks(others), reference: 'AL-884880719', addresses: ['Parking@Example.com'] })).toEqual([
      'https://www.allopark.com/fr-fr/confirmation?email=parking%40example.com&reference=AL-884880719&view=parking',
    ]);
  });

  it('sans lien, la page de chaque adresse candidate (trois au plus), jamais une adresse Plazo ni celle d’un comparateur', () => {
    expect(MAX_PAGES).toBe(3);
    expect(
      alloparkPageUrls({
        links: alloparkLinks(null, 'Réservation AL-884880719'),
        reference: 'AL-884880719',
        addresses: [
          'lys-7f3a@in.plazo.test',
          'info@allopark.com',
          'parking@example.com',
          'PARKING@example.com',
          'gerant@example.com',
          'compta@example.com',
          'quatrieme@example.com',
        ],
        excludeDomain: 'in.plazo.test',
      }),
    ).toEqual([pageUrl, pageUrl.replace('parking%40', 'gerant%40'), pageUrl.replace('parking%40', 'compta%40')]);
    expect(alloparkPageUrls({ links: [], reference: 'AL-884880719', addresses: ['lys-7f3a@in.plazo.test'], excludeDomain: 'in.plazo.test' })).toEqual(
      [],
    );
    expect(alloparkPageUrls({ links: [], reference: '884880719', addresses: ['parking@example.com'] })).toEqual([]);
  });

  it('10/10/2026 : garde les liens allopark.com du mail pour une nouvelle analyse, la page de confirmation d’abord, sans les données des autres', () => {
    const body = [
      '<a href="https://www.allopark.com/fr-be/parkings-aeroport-lyon-saint-exupery/aeroports-parking-lyon?utm_source=mail">Parking</a>',
      '<a href="https://www.allopark.com/fr-be/contactez-nous?name=Dupont%20Jean&amp;email=jean.dupont@example.com&amp;reference=AL-884880719">Contact</a>',
      '<a href="https://www.allopark.com/fr-be/confirmation?email=parking@example.com&amp;reference=AL-884880719&amp;view=parking">Consulter</a>',
      '<a href="https://www.allopark.com.example.test/fr-be/confirmation?email=x@example.com">Faux</a>',
    ].join('');
    const text = 'Consulter : https://www.allopark.com/fr-be/confirmation?email=parking@example.com&reference=AL-884880719&view=parking';
    expect(alloparkLinks(body, text)).toEqual([
      'https://www.allopark.com/fr-be/confirmation?email=parking@example.com&reference=AL-884880719&view=parking',
      'https://www.allopark.com/fr-be/parkings-aeroport-lyon-saint-exupery/aeroports-parking-lyon',
      'https://www.allopark.com/fr-be/contactez-nous',
    ]);
    // What the stored links give is what the email gave.
    expect(alloparkPageUrls({ links: alloparkLinks(body, text), reference: 'AL-884880719', addresses: [] })).toEqual([pageUrl]);
    // Ten links at most, none too long.
    const many = Array.from({ length: 15 }, (_, i) => `https://www.allopark.com/fr-be/page-${i}`).join(' ');
    expect(alloparkLinks(null, many)).toHaveLength(MAX_LINKS);
    expect(alloparkLinks(null, `https://www.allopark.com/fr-be/confirmation?email=${'a'.repeat(600)}@example.com`)).toEqual([]);
    expect(alloparkLinks(null, 'Aucun lien')).toEqual([]);
  });

  it('lit le formulaire « Vos informations » de la page', () => {
    expect(parseAlloparkPage(page, 'AL-884880719')).toEqual({
      provider: 'Allopark',
      externalReference: 'AL-884880719',
      arrivalAt: '2026-10-01T08:30',
      returnAt: '2026-10-03T17:00',
      passengers: 3,
      plate: 'GK-318-PX',
      vehicleModel: 'Peugeot 308',
      departureFlight: 'TO 3626',
      returnFlight: 'TO 3627',
      customerPhone: '+33 6 12 34 56 78',
      customerFirstName: 'Jean',
      customerLastName: 'Dupont',
      customerName: 'Jean Dupont',
      customerEmail: 'jean.dupont@example.com',
    });
    // Blank fields stay out; another booking's page, or Allopark's home page, is not read.
    const blank = page.replace(/name="(brand|model|fly_arrival|fly_departure)"\s*value="[^"]*"/g, 'name="$1" value=""');
    expect(parseAlloparkPage(blank, 'AL-884880719')).not.toHaveProperty('vehicleModel');
    expect(parseAlloparkPage(blank, 'AL-884880719')).not.toHaveProperty('returnFlight');
    expect(parseAlloparkPage(page, 'AL-222222222')).toBeNull();
    expect(parseAlloparkPage('<html><body>Comparez et réservez votre parking AL-884880719</body></html>', 'AL-884880719')).toBeNull();
  });
});

describe('Allopark : trouver la page sans le lien du mail (10/10/2026, « tu ne vas pas chercher dans les liens »)', () => {
  const pageUrl = 'https://www.allopark.com/fr-be/confirmation?email=parking%40example.com&reference=AL-884880719&view=parking';

  it('lit les destinataires de l’en-tête d’un mail transféré (Gmail, Outlook, Apple Mail), et seulement là', () => {
    const gmail = [
      'Voici la réservation.',
      '',
      '---------- Forwarded message ---------',
      'From: ALLOPARK <info@allopark.com>',
      'Date: Wed, Sep 30, 2026 at 10:31 PM',
      'Subject: Confirmation de votre réservation AL-884880719',
      'To: <Parking@Example.com>',
      '',
      'Bonjour Jean Dupont,',
    ].join('\n');
    expect(forwardedRecipientsOf(gmail)).toEqual(['parking@example.com']);
    const gmailFr = [
      '---------- Message transféré ---------',
      'De : ALLOPARK <info@allopark.com>',
      'Date : mer. 30 sept. 2026 à 22:31',
      'Objet : Confirmation de votre réservation AL-884880719',
      'À : Parking Air Lyon <parking@example.com>, gerant@example.com',
    ].join('\n');
    expect(forwardedRecipientsOf(gmailFr)).toEqual(['parking@example.com', 'gerant@example.com']);
    const outlook = [
      '________________________________',
      'De : ALLOPARK <info@allopark.com>',
      'Envoyé : mercredi 30 septembre 2026 22:31',
      'À : contact@parking.fr <mailto:contact@parking.fr>; Compta <compta@parking.fr>',
      'Objet : Confirmation de votre réservation AL-884880719',
    ].join('\r\n');
    expect(forwardedRecipientsOf(outlook)).toEqual(['contact@parking.fr', 'compta@parking.fr']);
    // Apple Mail, quoted lines, a non-breaking space before the colon, « Pour » and « Destinataire ».
    expect(forwardedRecipientsOf('Début du message réexpédié :\n\n> De: ALLOPARK <info@allopark.com>\n> À\u00a0: parking@example.com')).toEqual([
      'parking@example.com',
    ]);
    expect(forwardedRecipientsOf('De : Allopark\nPour : a@example.com\nDestinataire : b@example.com\nA : c@example.com')).toEqual([
      'a@example.com',
      'b@example.com',
      'c@example.com',
    ]);
    // Outside a forwarded header (no « De : » nor marker just above), or « À moi » of Gmail's display: nothing.
    expect(forwardedRecipientsOf('Bonjour,\nÀ : jean.dupont@example.com\nTo: x@example.com')).toEqual([]);
    expect(forwardedRecipientsOf('ALLOPARK <info@allopark.com> Se désabonner\nÀ moi')).toEqual([]);
    const far = ['De : ALLOPARK <info@allopark.com>', ...Array.from({ length: 12 }, (_, i) => `ligne ${i}`), 'À : tard@example.com'].join('\n');
    expect(forwardedRecipientsOf(far)).toEqual([]);
    // Five at most.
    const many = `From: x\nTo: ${Array.from({ length: 8 }, (_, i) => `p${i}@example.com`).join(', ')}`;
    expect(forwardedRecipientsOf(many)).toHaveLength(5);
  });

  it('les adresses candidates dans l’ordre : destinataires, en-tête transféré, expéditeur, boîte Gmail, gérants ; ni Plazo ni comparateur', () => {
    const text = '---------- Message transféré ---------\nDe : ALLOPARK <info@allopark.com>\nÀ : <entete@example.com>, info@allopark.com';
    expect(
      alloparkPageAddresses(
        {
          recipients: ['dest@example.com', 'lys-7f3a@in.plazo.test'],
          text,
          from: 'Expediteur@Example.com',
          requesters: ['gmail@example.com', 'dest@example.com'],
          managers: ['gerant@example.com'],
        },
        'in.plazo.test',
      ),
    ).toEqual(['dest@example.com', 'entete@example.com', 'expediteur@example.com', 'gmail@example.com', 'gerant@example.com']);
    // A comparator's sender is never a candidate: Allopark's own address, any address of a comparator's domain.
    expect(alloparkPageAddresses({ recipients: [], text: '', from: 'info@allopark.com', requesters: [], managers: ['gerant@example.com'] })).toEqual([
      'gerant@example.com',
    ]);
    expect(
      ['info@allopark.com', 'reservations@mail.allopark.com', 'noreply@onepark.co', 'contact@parclick.com', 'x@parkmundo.com'].map(
        isComparatorAddress,
      ),
    ).toEqual([true, true, true, true, true]);
    expect(isComparatorAddress('parking@example.com')).toBe(false);
    // Three pages at most, the manager last: dropped when the email gives three addresses before.
    const urls = alloparkPageUrls({
      links: [],
      reference: 'AL-884880719',
      addresses: alloparkPageAddresses({
        recipients: ['parking@example.com'],
        text,
        from: 'expediteur@example.com',
        requesters: [],
        managers: ['gerant@example.com'],
      }),
    });
    expect(urls).toEqual([pageUrl, pageUrl.replace('parking%40', 'entete%40'), pageUrl.replace('parking%40', 'expediteur%40')]);
  });

  it('la référence à ouvrir : Allopark nommé (texte, objet ou expéditeur), une référence AL-, jamais une annulation ou une modification', () => {
    const base = { text: 'Votre réservation est confirmée.', subject: 'Confirmation de votre réservation AL-884880719', from: 'info@allopark.com' };
    expect(alloparkReferenceOf(base)).toBe('AL-884880719');
    expect(alloparkReferenceOf({ ...base, from: 'parking@example.com', subject: 'TR: Allopark AL-884880719' })).toBe('AL-884880719');
    expect(alloparkReferenceOf({ text: 'Allopark : réservation N° AL-884880719', subject: null, from: null })).toBe('AL-884880719');
    // Neither Allopark nor a reference: nothing.
    expect(alloparkReferenceOf({ ...base, from: 'parking@example.com' })).toBeNull();
    expect(alloparkReferenceOf({ ...base, subject: 'Confirmation de votre réservation' })).toBeNull();
    // A cancellation or a change, in the subject or the text.
    expect(alloparkReferenceOf({ ...base, subject: 'Annulation de votre réservation AL-884880719' })).toBeNull();
    expect(alloparkReferenceOf({ ...base, text: 'Votre réservation a été modifiée.' })).toBeNull();
  });

  it('10/10/2026 (relecture) : une annulation, une modification ou un remboursement, la référence au milieu, n’ouvre pas la page ; une confirmation, si', () => {
    const base = { text: 'Votre réservation est confirmée.', subject: 'Votre réservation AL-884880719', from: 'info@allopark.com' };
    for (const text of [
      'Votre réservation AL-884880719 a été annulée.',
      'Réservation AL-884880719 annulée',
      'Annulation AL-884880719',
      'Votre réservation AL-884880719 a été modifiée : nouvelles dates.',
      'Votre réservation N° AL-884880719 est annulée.',
      'Remboursement de votre réservation AL-884880719',
      'Modification de réservation AL-884880719',
      'Your booking AL-884880719 was cancelled.',
      'Your booking AL-884880719 has been cancelled.',
    ]) {
      expect([text, isAlloparkCancellationOrChange(null, text)]).toEqual([text, true]);
      expect([text, alloparkReferenceOf({ ...base, text: `Allopark\n${text}` })]).toEqual([text, null]);
    }
    for (const subject of [
      'Allopark - Annulation AL-884880719',
      'Réservation AL-884880719 annulée',
      'Remboursement AL-884880719',
      'Booking AL-884880719 cancelled',
    ]) {
      expect([subject, alloparkReferenceOf({ ...base, subject })]).toEqual([subject, null]);
    }
    // What a confirmation says of a later cancellation does not count; the real confirmations still open their page.
    for (const text of [
      'Votre réservation peut être annulée gratuitement jusqu’à 24 h avant.',
      'Votre réservation sera annulée sans paiement.',
      'Your booking can be cancelled free of charge.',
      'Assurance annulation',
      'Annulation gratuite',
      readFileSync(join(__dirname, 'fixtures/allopark-confirmation.txt'), 'utf8'),
      textOf({ RawHtmlBody: html('allopark-customer.html') }),
    ]) {
      expect([text.slice(0, 60), isAlloparkCancellationOrChange('Confirmation de votre réservation AL-884880719', text)]).toEqual([
        text.slice(0, 60),
        false,
      ]);
    }
    expect(alloparkReferenceOf({ ...base, subject: 'Confirmation de votre réservation AL-884880719 chez Aeroports Parking Lyon' })).toBe(
      'AL-884880719',
    );
  });

  it('10/10/2026 (relecture) : une entité HTML qui ne nomme aucun caractère reste telle quelle', () => {
    const link = 'https://www.allopark.com/fr-be/confirmation?email=parking@example.com&amp;reference=AL-884880719';
    expect(alloparkLinks(`&#99999999; &#x110000; &#xFFFFFFFFFFFFFFFFFFFF; <a href="${link}">x</a>`)).toEqual([
      'https://www.allopark.com/fr-be/confirmation?email=parking@example.com&reference=AL-884880719',
    ]);
    expect(alloparkLinks(null, 'https://www.allopark.com/fr-be/page-&#99999999;')).toEqual(['https://www.allopark.com/fr-be/page-&']);
  });

  it('le lien de confirmation du mail, et ce qu’une page montre de la réservation', () => {
    const links = alloparkLinks('<a href="https://www.allopark.com/fr-fr/confirmation?email=parking@example.com&amp;reference=AL-884880719">x</a>');
    expect(alloparkConfirmationPage(links, 'al-884880719')).toBe(
      'https://www.allopark.com/fr-fr/confirmation?email=parking%40example.com&reference=AL-884880719',
    );
    expect(alloparkConfirmationPage(links, 'AL-111111111')).toBeNull();
    expect(alloparkConfirmationPage(['https://www.allopark.com/fr-be/contactez-nous'], 'AL-884880719')).toBeNull();
    const page = html('allopark-page.html');
    expect(alloparkPageFacts(page, 'AL-884880719')).toEqual({ form: true, reference: true });
    expect(alloparkPageFacts(page, 'AL-222222222')).toEqual({ form: true, reference: false });
    expect(alloparkPageFacts('<html>Comparez et réservez</html>', 'AL-884880719')).toEqual({ form: false, reference: false });
  });
});
