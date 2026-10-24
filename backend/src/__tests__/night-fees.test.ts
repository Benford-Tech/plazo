import { closingEmail, confirmationEmail } from '@/domain/booking-messages';
import {
  inNightWindow,
  nightFeeOf,
  nightFees,
  nightFeesForStay,
  nightRule,
  NightSettings,
  nightSnapshot,
  validateNightSettings,
} from '@/domain/night-fees';
import { parseInstant } from '@/domain/time';
import { PublicBooking } from '@/interfaces/booking.interface';

/** Frais de nuit (12/10/2026, direction B): the window, the fees of a stay, the settings sent by the pro space. */

const TZ = 'Europe/Paris';
const at = (local: string) => parseInstant(local, TZ)!;
const settings = (overrides: Partial<NightSettings> = {}): NightSettings => ({
  enabled: true,
  start: '22:00',
  end: '06:00',
  arrivalFeeCents: 1500,
  returnFeeCents: 1000,
  ...overrides,
});

describe('fenêtre de nuit', () => {
  it('passe minuit : 22:00 compte comme la nuit, 06:00 non', () => {
    expect(inNightWindow('21:59', '22:00', '06:00')).toBe(false);
    expect(inNightWindow('22:00', '22:00', '06:00')).toBe(true);
    expect(inNightWindow('23:30', '22:00', '06:00')).toBe(true);
    expect(inNightWindow('00:00', '22:00', '06:00')).toBe(true);
    expect(inNightWindow('05:59', '22:00', '06:00')).toBe(true);
    expect(inNightWindow('06:00', '22:00', '06:00')).toBe(false);
    expect(inNightWindow('12:00', '22:00', '06:00')).toBe(false);
  });

  it('dans la même journée : début compris, fin exclue', () => {
    expect(inNightWindow('00:59', '01:00', '05:00')).toBe(false);
    expect(inNightWindow('01:00', '01:00', '05:00')).toBe(true);
    expect(inNightWindow('04:59', '01:00', '05:00')).toBe(true);
    expect(inNightWindow('05:00', '01:00', '05:00')).toBe(false);
    expect(inNightWindow('23:00', '01:00', '05:00')).toBe(false);
  });

  it('une fenêtre de minuit et une fenêtre jusqu’à minuit', () => {
    expect(inNightWindow('00:00', '00:00', '05:00')).toBe(true);
    expect(inNightWindow('23:59', '00:00', '05:00')).toBe(false);
    expect(inNightWindow('23:59', '21:00', '00:00')).toBe(true);
    expect(inNightWindow('00:00', '21:00', '00:00')).toBe(false);
  });

  it('début égal à la fin ou heure invalide : jamais la nuit', () => {
    expect(inNightWindow('22:00', '22:00', '22:00')).toBe(false);
    expect(inNightWindow('03:00', '22:00', '22:00')).toBe(false);
    expect(inNightWindow('24:00', '22:00', '06:00')).toBe(false);
    expect(inNightWindow('7:00', '22:00', '06:00')).toBe(false);
    expect(inNightWindow('23:00', '25:00', '06:00')).toBe(false);
  });
});

describe('règle affichée au voyageur', () => {
  it('rien quand les frais sont coupés, incomplets ou nuls des deux côtés', () => {
    expect(nightRule(null)).toBeNull();
    expect(nightRule(settings({ enabled: false }))).toBeNull();
    expect(nightRule(settings({ start: null }))).toBeNull();
    expect(nightRule(settings({ end: '22:00' }))).toBeNull();
    expect(nightRule(settings({ arrivalFeeCents: 0, returnFeeCents: null }))).toBeNull();
  });

  it('un côté sans frais est null', () => {
    expect(nightRule(settings())).toEqual({ start: '22:00', end: '06:00', arrivalFeeCents: 1500, returnFeeCents: 1000 });
    expect(nightRule(settings({ returnFeeCents: 0 }))).toEqual({ start: '22:00', end: '06:00', arrivalFeeCents: 1500, returnFeeCents: null });
    expect(nightRule(settings({ arrivalFeeCents: null }))).toEqual({ start: '22:00', end: '06:00', arrivalFeeCents: null, returnFeeCents: 1000 });
  });
});

describe('frais d’un séjour', () => {
  it('dépôt de nuit seulement', () => {
    expect(nightFees(settings(), '23:30', '15:05')).toEqual({ arrivalCents: 1500, returnCents: 0, totalCents: 1500 });
  });

  it('retour de nuit seulement', () => {
    expect(nightFees(settings(), '08:00', '05:30')).toEqual({ arrivalCents: 0, returnCents: 1000, totalCents: 1000 });
  });

  it('les deux bouts de nuit : les frais s’additionnent', () => {
    expect(nightFees(settings(), '22:30', '05:30')).toEqual({ arrivalCents: 1500, returnCents: 1000, totalCents: 2500 });
  });

  it('aux bords : 22:00 paie, 06:00 non', () => {
    expect(nightFees(settings(), '22:00', '06:00')).toEqual({ arrivalCents: 1500, returnCents: 0, totalCents: 1500 });
    expect(nightFees(settings(), '06:00', '21:59')).toBeNull();
  });

  it('de jour, ou frais coupés : rien', () => {
    expect(nightFees(settings(), '08:00', '20:00')).toBeNull();
    expect(nightFees(settings({ enabled: false }), '23:30', '05:30')).toBeNull();
    expect(nightFees(null, '23:30', '05:30')).toBeNull();
  });

  it('un côté sans frais ne coûte rien même de nuit', () => {
    expect(nightFees(settings({ returnFeeCents: null }), '08:00', '05:30')).toBeNull();
    expect(nightFees(settings({ returnFeeCents: null }), '23:30', '05:30')).toEqual({ arrivalCents: 1500, returnCents: 0, totalCents: 1500 });
    expect(nightFees(settings({ arrivalFeeCents: 0 }), '23:30', '08:00')).toBeNull();
  });

  it('lit aussi l’heure locale complète de l’API', () => {
    expect(nightFees(settings(), '2026-10-04T23:30', '2026-10-11T05:30')).toEqual({ arrivalCents: 1500, returnCents: 1000, totalCents: 2500 });
  });

  it('teste l’heure du parking, pas l’heure UTC, et passe le changement d’heure', () => {
    // 23:30 à Paris = 21:30 UTC en été : de nuit pour le parking.
    expect(nightFeesForStay(settings(), at('2026-07-04T23:30'), at('2026-07-08T12:00'), TZ)).toEqual({
      arrivalCents: 1500,
      returnCents: 0,
      totalCents: 1500,
    });
    // 07:30 à Paris = 05:30 UTC : de jour pour le parking.
    expect(nightFeesForStay(settings(), at('2026-07-04T07:30'), at('2026-07-08T12:00'), TZ)).toBeNull();
    // Nuit du passage à l'heure d'hiver (25/10/2026, 03:00 → 02:00) : 02:30 reste la nuit.
    expect(nightFeesForStay(settings(), at('2026-10-20T12:00'), at('2026-10-25T02:30'), TZ)).toEqual({
      arrivalCents: 0,
      returnCents: 1000,
      totalCents: 1000,
    });
    expect(nightFeesForStay(settings(), at('2026-10-24T21:00'), at('2026-10-25T06:00'), TZ)).toBeNull();
  });
});

describe('instantané sur la réservation', () => {
  it('garde null pour un bout sans frais, et se relit tel quel', () => {
    expect(nightSnapshot(null)).toEqual({ nightArrivalFeeCents: null, nightReturnFeeCents: null });
    expect(nightSnapshot({ arrivalCents: 1500, returnCents: 0, totalCents: 1500 })).toEqual({
      nightArrivalFeeCents: 1500,
      nightReturnFeeCents: null,
    });
    expect(nightFeeOf({ nightArrivalFeeCents: null, nightReturnFeeCents: null })).toBeNull();
    expect(nightFeeOf({ nightArrivalFeeCents: 1500, nightReturnFeeCents: 1000 })).toEqual({
      arrivalCents: 1500,
      returnCents: 1000,
      totalCents: 2500,
    });
    expect(nightFeeOf({ nightArrivalFeeCents: null, nightReturnFeeCents: 1000 })).toEqual({ arrivalCents: 0, returnCents: 1000, totalCents: 1000 });
  });
});

describe('réglages envoyés par l’espace pro', () => {
  it('accepte des frais complets', () => {
    expect(validateNightSettings(settings())).toEqual({ settings: settings(), errors: {} });
    expect(validateNightSettings(settings({ returnFeeCents: null })).errors).toEqual({});
    expect(validateNightSettings(settings({ arrivalFeeCents: 0 })).errors).toEqual({});
  });

  it('exige début et fin, différents, quand c’est activé', () => {
    expect(validateNightSettings(settings({ start: null, end: '' })).errors).toEqual({ 'night.start': 'required', 'night.end': 'required' });
    expect(validateNightSettings(settings({ end: '22:00' })).errors).toEqual({ 'night.end': 'same_time' });
  });

  it('refuse une heure mal écrite', () => {
    expect(validateNightSettings(settings({ start: '24:00', end: '6:00' })).errors).toEqual({
      'night.start': 'invalid_time',
      'night.end': 'invalid_time',
    });
    expect(validateNightSettings(settings({ start: 2200 as unknown as string })).errors).toEqual({ 'night.start': 'invalid_time' });
  });

  it('exige au moins un frais au-dessus de 0', () => {
    expect(validateNightSettings(settings({ arrivalFeeCents: 0, returnFeeCents: null })).errors).toEqual({
      'night.arrivalFeeCents': 'fee_required',
      'night.returnFeeCents': 'fee_required',
    });
  });

  it('borne les montants : entiers, de 0 à 1 000 €', () => {
    expect(validateNightSettings(settings({ arrivalFeeCents: -1 })).errors).toEqual({ 'night.arrivalFeeCents': 'min_0' });
    expect(validateNightSettings(settings({ returnFeeCents: 100001 })).errors).toEqual({ 'night.returnFeeCents': 'too_large' });
    expect(validateNightSettings(settings({ arrivalFeeCents: 100000 })).errors).toEqual({});
    expect(validateNightSettings(settings({ arrivalFeeCents: 15.5 })).errors).toEqual({ 'night.arrivalFeeCents': 'integer' });
    expect(validateNightSettings(settings({ arrivalFeeCents: '1500' as unknown as number })).errors).toEqual({ 'night.arrivalFeeCents': 'integer' });
  });

  it('coupé : garde les valeurs telles quelles, sans les exiger, mais vérifie leur forme', () => {
    expect(validateNightSettings(settings({ enabled: false, end: '22:00', arrivalFeeCents: 0, returnFeeCents: 0 }))).toEqual({
      settings: { enabled: false, start: '22:00', end: '22:00', arrivalFeeCents: 0, returnFeeCents: 0 },
      errors: {},
    });
    expect(validateNightSettings({ enabled: false }).settings).toEqual({
      enabled: false,
      start: null,
      end: null,
      arrivalFeeCents: null,
      returnFeeCents: null,
    });
    expect(validateNightSettings(settings({ enabled: false, start: '25:00' })).errors).toEqual({ 'night.start': 'invalid_time' });
  });

  it('exige l’interrupteur et un objet', () => {
    expect(validateNightSettings({ start: '22:00' }).errors).toMatchObject({ 'night.enabled': 'required' });
    expect(validateNightSettings({ ...settings(), enabled: 'oui' }).errors).toMatchObject({ 'night.enabled': 'invalid' });
    expect(validateNightSettings('22:00').errors).toEqual({ night: 'invalid' });
    expect(validateNightSettings([]).errors).toEqual({ night: 'invalid' });
  });
});

describe('messages au voyageur', () => {
  const booking = (nightFee: PublicBooking['nightFee']): PublicBooking => ({
    reference: 'R7KQ2M',
    status: 'upcoming',
    paymentMode: 'online',
    payment: { status: 'paid', holdExpiresAt: null, holdSecondsLeft: null },
    parking: {
      title: 'Parking LYS',
      slug: 'parking-lys',
      airport: { slug: 'lyon-saint-exupery', name: 'Lyon Saint-Exupéry' },
      address: null,
      shuttleMinutes: 8,
      openingHours: null,
      phone: null,
      meetingLabel: null,
      meetingInstructions: null,
    },
    arrivalAt: '2026-10-04T23:30',
    returnAt: '2026-10-11T15:05',
    days: 8,
    priceCents: 5160,
    basePriceCents: 5160 - (nightFee?.totalCents ?? 0),
    nightFee,
    customerName: 'Camille Martin',
    customerFirstName: 'Camille',
    customerLastName: 'Martin',
    customerEmail: 'camille@example.com',
    customerPhone: '06 12 34 56 78',
    plate: 'GK-318-PX',
    returnFlight: null,
    departureFlight: null,
    customerNote: null,
    childSeats: { infant: 0, toddler: 0, booster: 0 },
    vehicle: { model: null, colour: null },
    car: null,
    outbound: null,
    passengers: 2,
    cancellationPolicy: 'free_24h',
    cancellableUntil: '2026-10-03T23:30',
    canCancel: true,
    canEditFlight: true,
    extrasCents: 0,
  });

  it('nomment les frais de nuit compris dans le total', () => {
    const night = booking({ arrivalCents: 1500, returnCents: 0, totalCents: 1500 });
    const confirmation = confirmationEmail('Plazo', night, null);
    expect(confirmation.text).toContain('Total : 51,60 € (dont 15,00 € de frais de nuit), payé en ligne par carte.');
    expect(confirmation.html).toContain('<strong>Total : 51,60 €</strong> (dont 15,00 € de frais de nuit), payé en ligne par carte.');
    const closing = closingEmail('Plazo', night, '2026-10-11T15:40');
    expect(closing.text).toContain('Total : 51,60 € (dont 15,00 € de frais de nuit), payé en ligne par carte.');
    expect(closing.html).toContain('(dont 15,00 € de frais de nuit), payé en ligne par carte.');
  });

  it('sans frais de nuit, rien ne change', () => {
    const day = booking(null);
    expect(confirmationEmail('Plazo', day, null).text).toContain('Total : 51,60 €, payé en ligne par carte.');
    expect(closingEmail('Plazo', day, '2026-10-11T15:40').text).toContain('Total : 51,60 €, payé en ligne par carte.');
  });
});
