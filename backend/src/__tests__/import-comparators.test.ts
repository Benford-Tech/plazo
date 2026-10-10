import { readFileSync } from 'fs';
import { join } from 'path';
import { isComparatorAddress, parseConfirmationEmail } from '@/domain/importers';
import {
  alloparkConfirmationPage,
  alloparkEmailOf,
  alloparkLinks,
  alloparkPageAddresses,
  alloparkPageFacts,
  alloparkPagePrice,
  alloparkPageUrls,
  alloparkReferenceOf,
  hasAntiRobotCheck,
  isAlloparkCancellation,
  isAlloparkCancellationOrChange,
  isAlloparkChange,
  isAlloparkPageProtected,
  MAX_LINKS,
  MAX_PAGES,
  parseAlloparkPage,
} from '@/domain/importers/allopark-page';
import { isCancellation, isCancellationOrChange, isChange } from '@/domain/importers/common';
import { ChangeableBooking, importChanges, phoneKey, withoutField } from '@/domain/import-change';
import { bookingChangedPush } from '@/domain/reservation-messages';
import { forwardedRecipientsOf, stripHtml, textOf } from '@/domain/inbound-email';
import { fillGaps } from '@/services/inbound-email.service';
import { AlloparkPageService } from '@/services/allopark-page.service';
import { logger } from '@/utils/logger';

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
      // 10/10/2026: the amount paid of the booking block.
      priceCents: 3499,
    });
    // Blank fields stay out; another booking's page, or Allopark's home page, is not read.
    const blank = page.replace(/name="(brand|model|fly_arrival|fly_departure)"\s*value="[^"]*"/g, 'name="$1" value=""');
    expect(parseAlloparkPage(blank, 'AL-884880719')).not.toHaveProperty('vehicleModel');
    expect(parseAlloparkPage(blank, 'AL-884880719')).not.toHaveProperty('returnFlight');
    expect(parseAlloparkPage(page, 'AL-222222222')).toBeNull();
    expect(parseAlloparkPage('<html><body>Comparez et réservez votre parking AL-884880719</body></html>', 'AL-884880719')).toBeNull();
  });

  it('10/10/2026 (« récupère aussi le prix ») : le montant payé du bloc de la réservation, jamais les suppléments ni un autre « € » de la page', () => {
    expect(alloparkPagePrice(page)).toBe(3499);
    expect(parseAlloparkPage(page.replace('</span>34,99</div>', '</span>24,00</div>'), 'AL-884880719')).toMatchObject({ priceCents: 2400 });
    expect(alloparkPagePrice('<div class="price-payed"><div class="price"><span>€&nbsp;</span>1 234,50</div></div>')).toBe(123450);
    expect(alloparkPagePrice("<div class='x price-payed'><div class='big price'>€ 19.9</div></div>")).toBe(1990);
    // Without the block, the « Suppléments éventuels » (€ 15,00, 5,00 €) and the fee of a change (2,99 €) give nothing.
    const noBlock = page.replace(/<div class="price-payed[^>]*><div class="price">[\s\S]*?<\/div>/, '');
    expect(noBlock).toContain('Suppléments éventuels');
    expect(alloparkPagePrice(noBlock)).toBeUndefined();
    expect(parseAlloparkPage(noBlock, 'AL-884880719')).not.toHaveProperty('priceCents');
    // A block that holds no plain amount, or zero, gives nothing either.
    expect(alloparkPagePrice('<div class="price-payed"><div class="price">Offert</div></div>')).toBeUndefined();
    expect(alloparkPagePrice('<div class="price-payed"><div class="price">€ 0,00</div></div>')).toBeUndefined();
  });

  it('10/10/2026 (« Prévent captcha ») : reconnaît une vérification anti-robot, jamais le script de détection de Cloudflare d’une page normale', () => {
    // The real page carries Cloudflare's JS detection script: it is read, not « protected ».
    expect(page).toContain('/cdn-cgi/challenge-platform/scripts/jsd/main.js');
    expect(hasAntiRobotCheck(page)).toBe(false);
    expect(isAlloparkPageProtected(page)).toBe(false);
    for (const check of [
      '<html><head><title>Just a moment...</title></head><body><script>window._cf_chl_opt={cvId: "3"}</script></body></html>',
      '<form id="challenge-form" action="/fr-be/confirmation?__cf_chl_f_tk=x" method="POST"></form>',
      '<div class="cf-turnstile" data-sitekey="0x4AAA"></div>',
      '<div class="g-recaptcha" data-sitekey="6Lc"></div>',
      '<div class="h-captcha" data-sitekey="10000000"></div>',
    ]) {
      expect([check.slice(0, 40), isAlloparkPageProtected(check)]).toEqual([check.slice(0, 40), true]);
    }
    // A booking page that happens to embed a captcha elsewhere (a contact form) is still a booking page.
    expect(isAlloparkPageProtected(page.replace('</body>', '<div class="g-recaptcha"></div></body>'))).toBe(false);
    // Allopark's home page without any check is no « protected » page.
    expect(isAlloparkPageProtected('<html><body>Comparez et réservez votre parking</body></html>')).toBe(false);
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

describe('Allopark : une vérification anti-robot n’est jamais passée (10/10/2026, « Prévent captcha »)', () => {
  const page = html('allopark-page.html');
  const urls = ['parking', 'entete', 'gerant'].map(
    who => `https://www.allopark.com/fr-be/confirmation?email=${who}%40example.com&reference=AL-884880719&view=parking`,
  );
  const challenge =
    '<!DOCTYPE html><html><head><title>Just a moment...</title></head><body><div id="challenge-stage"></div><script>window._cf_chl_opt={cType: "managed"}</script></body></html>';
  const service = new AlloparkPageService();
  let fetchMock: jest.SpyInstance;
  let warn: jest.SpyInstance;
  const answer = (respond: (url: string) => Response) => fetchMock.mockImplementation(async url => respond(String(url)));
  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
    warn = jest.spyOn(logger, 'warn');
  });
  afterEach(() => {
    fetchMock.mockRestore();
    warn.mockRestore();
  });

  it('un 403 « cf-mitigated: challenge » : protégée, une seule page demandée, la première à ouvrir à la main, rien d’adresse au journal', async () => {
    answer(() => new Response(challenge, { status: 403, headers: { 'cf-mitigated': 'challenge', 'Content-Type': 'text/html' } }));
    expect(await service.booking(urls, 'AL-884880719')).toEqual({ booking: null, outcome: 'protected', url: urls[0] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const logged = warn.mock.calls.map(([message]) => String(message));
    expect(logged).toEqual([
      '[Allopark] AL-884880719: page protected by an anti-robot check (captcha), left to the staff (page 1/3, HTTP 403 /fr-be/confirmation)',
    ]);
    for (const message of logged) expect(message).not.toMatch(/@|%40|email=/);
  });

  it('sans l’en-tête, la page de Cloudflare (403, 429, 503) ou une page 200 sans formulaire avec Turnstile ou « Just a moment » : protégée', async () => {
    for (const respond of [
      () => new Response(challenge, { status: 503 }),
      () => new Response('<html><body><div class="cf-turnstile" data-sitekey="x"></div></body></html>', { status: 429 }),
      () => new Response('<html><body><div class="cf-turnstile" data-sitekey="x"></div></body></html>', { status: 200 }),
      () => new Response('<html><head><title>Just a moment...</title></head><body></body></html>', { status: 200 }),
    ]) {
      fetchMock.mockClear();
      answer(respond);
      expect(await service.booking(urls, 'AL-884880719')).toMatchObject({ booking: null, outcome: 'protected', url: urls[0] });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  });

  it('une page sans cette réservation puis la vérification : le lien ouvre la page protégée, pas la première (10/10/2026)', async () => {
    answer(url =>
      url === urls[0]
        ? new Response('<html>Comparez et réservez</html>', { status: 200 })
        : new Response(challenge, { status: 403, headers: { 'cf-mitigated': 'challenge' } }),
    );
    expect(await service.booking(urls, 'AL-884880719')).toEqual({ booking: null, outcome: 'protected', url: urls[1] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('un 429 sans vérification, ou un blocage de Cloudflare (403, 503) : on s’arrête là, une seule page demandée (10/10/2026)', async () => {
    const rateLimited =
      '<html><head><title>Access denied | www.allopark.com used Cloudflare to restrict access</title></head><body>Error 1015 You are being rate limited</body></html>';
    const blocked = '<html><head><title>Attention Required! | Cloudflare</title></head><body>Error 1020 Access denied</body></html>';
    for (const respond of [
      () => new Response(rateLimited, { status: 429 }),
      () => new Response(rateLimited, { status: 429, headers: { 'cf-ray': '8c1f2a3b4c5d6e7f-CDG', server: 'cloudflare' } }),
      () => new Response(blocked, { status: 403, headers: { 'cf-ray': '8c1f2a3b4c5d6e7f-CDG' } }),
      () => new Response(blocked, { status: 503, headers: { server: 'cloudflare' } }),
    ]) {
      fetchMock.mockClear();
      warn.mockClear();
      answer(respond);
      expect(await service.booking(urls, 'AL-884880719')).toEqual({ booking: null, outcome: 'unavailable', url: urls[0] });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const logged = warn.mock.calls.map(([message]) => String(message));
      expect(logged).toEqual([
        expect.stringMatching(/^\[Allopark\] AL-884880719 page 1\/3: HTTP (429|403|503) \/fr-be\/confirmation, refused by Allopark/),
      ]);
      for (const message of logged) expect(message).not.toMatch(/@|%40|email=/);
    }

    // After a page without this booking, the link is the refused page, not the one ruled out.
    fetchMock.mockClear();
    answer(url => (url === urls[0] ? new Response('<html>Comparez et réservez</html>') : new Response(rateLimited, { status: 429 })));
    expect(await service.booking(urls, 'AL-884880719')).toEqual({ booking: null, outcome: 'unavailable', url: urls[1] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('la vraie page (script de détection de Cloudflare compris) est lue ; 500 : indisponible ; une autre réservation : introuvable', async () => {
    answer(() => new Response(page, { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } }));
    expect(await service.booking(urls, 'AL-884880719')).toMatchObject({ outcome: 'read', booking: { plate: 'GK-318-PX', priceCents: 3499 } });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Other errors (a 403 neither challenged nor served by Cloudflare too) are read past: every page is tried.
    fetchMock.mockClear();
    answer(url => new Response('Internal Server Error', { status: url === urls[1] ? 403 : 500 }));
    expect(await service.booking(urls, 'AL-884880719')).toEqual({ booking: null, outcome: 'unavailable', url: urls[0] });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    fetchMock.mockClear();
    answer(() => new Response(page, { status: 200 }));
    expect(await service.booking(urls, 'AL-222222222')).toEqual({ booking: null, outcome: 'not_found', url: urls[0] });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // One page down, the others without the booking: it may be on the one that did not answer.
    fetchMock.mockClear();
    answer(url => (url === urls[0] ? new Response('Bad Gateway', { status: 502 }) : new Response('<html>Comparez et réservez</html>')));
    expect(await service.booking(urls, 'AL-884880719')).toMatchObject({ outcome: 'unavailable', url: urls[0] });

    // A network failure, too many redirects.
    fetchMock.mockClear();
    answer(() => {
      throw new TypeError('fetch failed');
    });
    expect(await service.booking(urls.slice(0, 1), 'AL-884880719')).toMatchObject({ outcome: 'unavailable' });
    answer(url => new Response(null, { status: 302, headers: { Location: `${url}&x=1` } }));
    expect(await service.booking(urls.slice(0, 1), 'AL-884880719')).toMatchObject({ outcome: 'unavailable' });
  });
});

describe('Allopark : une modification de réservation (10/10/2026, « C’est une modification »)', () => {
  const base = { text: 'Votre réservation est confirmée.', subject: 'Votre réservation AL-884880719', from: 'info@allopark.com' };

  it('annulation et modification apart ; une annulation l’emporte sur une modification', () => {
    expect(isCancellation('Votre réservation a été annulée.')).toBe(true);
    expect(isCancellation('Annulation de votre réservation')).toBe(true);
    expect(isCancellation('Your booking has been cancelled')).toBe(true);
    expect(isCancellation('Votre réservation a été modifiée.')).toBe(false);
    expect(isChange('Votre réservation a été modifiée.')).toBe(true);
    expect(isChange('Modification de votre réservation')).toBe(true);
    expect(isChange('Your booking has been modified')).toBe(true);
    expect(isChange('Votre réservation a été annulée.')).toBe(false);
    expect(isCancellationOrChange('Modification de votre réservation')).toBe(true);

    for (const [subject, text] of [
      ['Modification de votre réservation AL-884880719', 'Allopark'],
      ['Votre réservation AL-884880719 a été modifiée', 'Allopark'],
      ['Allopark AL-884880719 : changement de dates', 'Bonjour'],
      ['Votre réservation AL-884880719', 'Allopark\nVotre réservation AL-884880719 a été modifiée : nouvelles dates.'],
      ['Votre séjour AL-884880719', 'Allopark\nVos nouvelles dates : du 2 au 5 octobre.'],
      ['Votre réservation AL-884880719', 'Allopark\nLes dates de votre réservation AL-884880719 ont été modifiées.'],
      ['Votre réservation AL-884880719', 'Allopark\nVotre changement de dates a bien été pris en compte.'],
      ['Tr : Votre réservation AL-884880719', 'Allopark\nObjet : Modification de votre réservation AL-884880719'],
      ['Votre réservation AL-884880719', 'Allopark\nModification de réservation AL-884880719'],
      ['Booking AL-884880719 changed', 'Allopark'],
      ['Your booking AL-884880719', 'Allopark\nYour booking AL-884880719 has been changed.'],
      ['Your booking AL-884880719', 'Allopark\nYour new dates are 2 to 5 October.'],
    ]) {
      expect([subject, isAlloparkChange(subject, text), isAlloparkCancellation(subject, text)]).toEqual([subject, true, false]);
      expect([subject, alloparkEmailOf({ ...base, subject, text })]).toEqual([subject, { reference: 'AL-884880719', kind: 'change' }]);
    }
    for (const [subject, text] of [
      ['Annulation de votre réservation AL-884880719', 'Allopark'],
      ['Votre réservation AL-884880719', 'Allopark\nVotre réservation AL-884880719 a été annulée.'],
      ['Remboursement AL-884880719', 'Allopark'],
      ['Booking AL-884880719 cancelled', 'Allopark'],
      // Both: the safer reading wins, nothing is done.
      ['Modification de votre réservation AL-884880719', 'Allopark\nVotre réservation AL-884880719 a été annulée.'],
      ['Votre réservation AL-884880719 : modification et annulation', 'Allopark'],
      // 10/10/2026 (relecture): in the active voice too, whatever it says of new dates.
      ['Allopark - AL-884880719', 'Allopark\nNous avons annulé votre réservation AL-884880719 suite à votre demande de changement de dates.'],
      ['Allopark - AL-884880719', "Allopark\nVotre demande d'annulation a bien été prise en compte. Les nouvelles dates ne s'appliquent plus."],
      ['Allopark - AL-884880719', 'Allopark\nWe have cancelled your booking AL-884880719 at your request: new dates are not possible.'],
      ['Allopark - AL-884880719', 'Allopark\nAllopark a remboursé votre réservation.'],
    ]) {
      expect([subject, isAlloparkCancellation(subject, text)]).toEqual([subject, true]);
      expect([subject, alloparkEmailOf({ ...base, subject, text })?.kind]).toEqual([subject, 'cancellation']);
    }
    // A confirmation stays a booking, whatever it says of a later change. 10/10/2026 (relecture): its terms and
    // conditions too (« changement de date gratuit », « nouvelles dates ? », « Pour toute modification… »).
    for (const text of [
      'Votre réservation peut être modifiée jusqu’à 24 h avant.',
      'Your booking can be changed free of charge.',
      'Allopark\nRéservation AL-884880719\nAnnulation et changement de date gratuits jusqu’à 24 h avant.',
      'Allopark\nRéservation AL-884880719\nFree cancellation and change of dates up to 24 h before.',
      'Allopark\nRéservation AL-884880719\nBesoin de nouvelles dates ? Modifiez en ligne.',
      'Allopark\nRéservation AL-884880719\nKeep your booking details updated.',
      'Allopark\nRéservation AL-884880719\nPour tout changement de dates, contactez le parking.',
      'Allopark\nRéservation AL-884880719\nPour toute modification de votre réservation AL-884880719, contactez-nous.',
      'Allopark\nRéservation AL-884880719\nModification gratuite de votre réservation AL-884880719 jusqu’à 24 h avant.',
      'Allopark\nRéservation AL-884880719\nYour booking can be changed online. New dates? Change them up to 24 h before.',
      readFileSync(join(__dirname, 'fixtures/allopark-confirmation.txt'), 'utf8'),
      textOf({ RawHtmlBody: html('allopark-customer.html') }),
    ]) {
      const subject = 'Confirmation de votre réservation AL-884880719 chez Aeroports Parking Lyon';
      expect([text.slice(0, 60), isAlloparkChange(subject, text), alloparkEmailOf({ ...base, subject, text })?.kind]).toEqual([
        text.slice(0, 60),
        false,
        'booking',
      ]);
    }
    // An invitation to change in the subject (a confirmation, a reminder) is no change either.
    for (const subject of [
      'Modifiez votre réservation AL-884880719',
      'Votre réservation AL-884880719 est modifiable',
      'Rappel : votre réservation AL-884880719',
    ]) {
      const text = 'Allopark\nEn cas de changement de dates, contactez-nous.';
      expect([subject, alloparkEmailOf({ ...base, subject, text })?.kind]).toEqual([subject, 'booking']);
    }
    // Neither Allopark nor a reference: none.
    expect(alloparkEmailOf({ ...base, from: 'parking@example.com', text: 'Votre réservation a été modifiée.' })).toBeNull();
    expect(alloparkEmailOf({ ...base, subject: 'Modification de votre réservation' })).toBeNull();
  });

  const booking: ChangeableBooking = {
    arrivalAt: new Date('2026-12-10T08:00:00Z'),
    returnAt: new Date('2026-12-13T19:30:00Z'),
    passengers: 3,
    plate: 'GK-318-PX',
    plateKey: 'GK318PX',
    departureFlight: 'TO 3626',
    returnFlight: null,
    customerPhone: '06 12 34 56 78',
    customerFirstName: 'Jean',
    customerLastName: 'Dupont',
    customerName: 'Jean Dupont',
    customerEmail: 'jean.dupont@example.com',
    vehicleModel: 'Peugeot 308',
    priceCents: 2400,
  };

  it('ce qui change, comparé comme la réservation l’enregistre ; un champ vide de la page ne change rien', () => {
    // The same booking, written otherwise: nothing changes.
    expect(
      importChanges(
        booking,
        {
          provider: 'Allopark',
          arrivalAt: '2026-12-10T09:00',
          returnAt: '2026-12-13T20:30',
          passengers: 3,
          plate: 'gk 318 px',
          departureFlight: 'to3626',
          customerPhone: '+33 6 12 34 56 78',
          customerFirstName: 'JEAN',
          customerLastName: 'dupont',
          customerEmail: 'Jean.Dupont@Example.com',
          vehicleModel: 'peugeot 308',
          priceCents: 2400,
        },
        'Europe/Paris',
      ),
    ).toEqual({ changes: [], data: {} });
    expect(importChanges(booking, { provider: 'Allopark' }, 'Europe/Paris')).toEqual({ changes: [], data: {} });
    // A value that is no flight number, a date that does not exist: ignored.
    expect(
      importChanges(booking, { provider: 'Allopark', departureFlight: 'inconnu', returnAt: '2026-02-30T10:00' }, 'Europe/Paris').changes,
    ).toEqual([]);

    const diff = importChanges(
      booking,
      {
        provider: 'Allopark',
        returnAt: '2026-12-15T18:00',
        passengers: 4,
        plate: 'ab123cd',
        returnFlight: 'to 3627',
        customerPhone: '07 11 22 33 44',
        customerFirstName: 'Jeanne',
        customerEmail: 'JEANNE@example.com',
        vehicleModel: 'Renault Clio',
        priceCents: 2900,
      },
      'Europe/Paris',
    );
    expect(diff.changes).toEqual([
      { field: 'returnAt', from: '2026-12-13T20:30', to: '2026-12-15T18:00' },
      { field: 'passengers', from: 3, to: 4 },
      { field: 'plate', from: 'GK-318-PX', to: 'AB-123-CD' },
      { field: 'returnFlight', from: null, to: 'TO 3627' },
      { field: 'customerPhone', from: '06 12 34 56 78', to: '07 11 22 33 44' },
      { field: 'customerName', from: 'Jean Dupont', to: 'Jeanne Dupont' },
      { field: 'customerEmail', from: 'jean.dupont@example.com', to: 'jeanne@example.com' },
      { field: 'vehicleModel', from: 'Peugeot 308', to: 'Renault Clio' },
      { field: 'priceCents', from: 2400, to: 2900 },
    ]);
    expect(diff.data).toEqual({
      returnAt: new Date('2026-12-15T17:00:00Z'),
      passengers: 4,
      plate: 'AB-123-CD',
      plateKey: 'AB123CD',
      returnFlight: 'TO 3627',
      customerPhone: '07 11 22 33 44',
      customerFirstName: 'Jeanne',
      customerLastName: 'Dupont',
      customerName: 'Jeanne Dupont',
      customerEmail: 'jeanne@example.com',
      vehicleModel: 'Renault Clio',
      priceCents: 2900,
    });
    // A locked price: the rest only.
    const locked = withoutField(diff, 'priceCents');
    expect(locked.changes.map(c => c.field)).not.toContain('priceCents');
    expect(locked.data).not.toHaveProperty('priceCents');
    expect(locked.changes).toHaveLength(8);
    expect(phoneKey('+33 6 12 34 56 78')).toBe(phoneKey('06.12.34.56.78'));
    expect(phoneKey('0033612345678')).toBe('0612345678');
    expect(phoneKey('+32 470 12 34 56')).toBe('32470123456');
  });

  it('le push à l’équipe : la référence et ce qui change, sans téléphone, e-mail ni vol', () => {
    const diff = importChanges(
      booking,
      {
        provider: 'Allopark',
        arrivalAt: '2026-12-11T07:15',
        returnAt: '2026-12-15T18:00',
        passengers: 1,
        customerPhone: '07 11 22 33 44',
        returnFlight: 'TO 3627',
        priceCents: 2900,
      },
      'Europe/Paris',
    );
    expect(bookingChangedPush({ reference: 'AL-884880719', channel: 'aggregator', channelDetail: 'Allopark', changes: diff.changes })).toEqual({
      title: 'Réservation modifiée · Allopark',
      body: 'AL-884880719 · arrivée 11 déc. 07:15 · retour 15 déc. 18:00 · 1 personne · vol retour · téléphone · prix 29,00 €',
    });
  });
});
