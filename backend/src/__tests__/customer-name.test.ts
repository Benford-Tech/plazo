import { cleanNamePart, customerNamesOf, greetingName, importedNames, namesOfCustomer } from '@/domain/customer-name';
import { ANONYMIZED_TRAVELLER, PERSONAL_AUDIT_KEYS } from '@/domain/retention';
import { namesFromArgs } from '@/domain/staff-name';
import { confirmationEmail, cancellationEmail, closingEmail, reminderEmail } from '@/domain/booking-messages';
import { newBookingPush } from '@/domain/reservation-messages';
import { landedPush, returnNoticePush } from '@/domain/return-messages';
import { PublicBooking } from '@/interfaces/booking.interface';

/** 09/10/2026 (« tous les utilisateurs ont un nom et prénom »): travellers' first and last name, pure side. */
describe('prénom et nom du voyageur — règles', () => {
  it('construit le nom affiché « Prénom Nom », espaces nettoyés ; un nom seul (ancienne app) est coupé au premier espace', () => {
    expect(customerNamesOf({ customerFirstName: '  Marie  Claire ', customerLastName: ' de  La Tour ' })).toEqual({
      customerFirstName: 'Marie Claire',
      customerLastName: 'de La Tour',
      customerName: 'Marie Claire de La Tour',
    });
    expect(customerNamesOf({ customerName: ' Jean   Dupont Martin ' })).toEqual({
      customerFirstName: 'Jean',
      customerLastName: 'Dupont Martin',
      customerName: 'Jean Dupont Martin',
    });
    // The two fields win over a single name sent with them.
    expect(customerNamesOf({ customerFirstName: 'Anne', customerLastName: 'Martin', customerName: 'Autre Personne' }).customerName).toBe(
      'Anne Martin',
    );
    expect(customerNamesOf({ customerName: 'Madonna' })).toEqual({ customerFirstName: 'Madonna', customerLastName: '', customerName: 'Madonna' });
    expect(cleanNamePart(null)).toBe('');
  });

  it('salue par le prénom enregistré, sinon par le premier mot du nom affiché', () => {
    expect(greetingName({ customerName: 'Marie Claire de La Tour', customerFirstName: 'Marie Claire' })).toBe('Marie Claire');
    expect(greetingName({ customerName: ' Camille  Martin', customerFirstName: '' })).toBe('Camille');
    expect(greetingName({ customerName: 'Camille Martin' })).toBe('Camille');
    expect(namesOfCustomer({ customerName: 'Camille Martin', customerFirstName: '', customerLastName: '' })).toEqual({
      firstName: 'Camille',
      lastName: 'Martin',
    });
  });

  it('un mail importé : prénom et nom quand ils sont connus tous deux, sinon le nom lu coupé', () => {
    expect(importedNames({ customerName: 'JEAN MARTIN', customerFirstName: 'JEAN', customerLastName: 'MARTIN' })).toMatchObject({
      customerFirstName: 'JEAN',
      customerLastName: 'MARTIN',
    });
    expect(importedNames({ customerName: 'Claire Durand' })).toEqual({
      customerFirstName: 'Claire',
      customerLastName: 'Durand',
      customerName: 'Claire Durand',
    });
    // Only one part read: the display name decides.
    expect(importedNames({ customerName: 'Léa Petit', customerFirstName: 'Léa' })).toEqual({
      customerFirstName: 'Léa',
      customerLastName: 'Petit',
      customerName: 'Léa Petit',
    });
    expect(importedNames({ customerLastName: 'Petit' })).toMatchObject({ customerFirstName: 'Petit', customerName: 'Petit' });
  });

  it('anonymise le prénom et le nom et les retire du journal', () => {
    expect(ANONYMIZED_TRAVELLER).toMatchObject({ customerName: 'Client anonymisé', customerFirstName: 'Client', customerLastName: 'anonymisé' });
    expect(PERSONAL_AUDIT_KEYS).toEqual(expect.arrayContaining(['customerName', 'customerFirstName', 'customerLastName']));
  });

  it('les pushes de l’équipe abrègent avec le prénom et le nom enregistrés', () => {
    const names = { customerName: 'Marie Claire Dupont', customerFirstName: 'Marie Claire', customerLastName: 'Dupont' };
    expect(
      newBookingPush({
        ...names,
        plate: 'AB-123-CD',
        passengers: 2,
        channel: 'plazo',
        channelDetail: null,
        arrival: '11/10 06:30',
        returnDay: '13/10',
      }).body,
    ).toBe('M. Dupont · AB-123-CD · 2 pass. · arrivée 11/10 06:30 → retour 13/10');
    expect(landedPush({ ...names, flight: 'TO 3627', plate: 'AB-123-CD', source: 'tracking', landedAt: '10:02' }).body).toBe(
      'Vol TO 3627 atterri · M. Dupont · AB-123-CD · 10:02',
    );
    expect(returnNoticePush({ ...names, plate: 'AB-123-CD', kind: 'luggage', text: null }).body).toBe(
      'M. Dupont : bagage perdu ou retardé · AB-123-CD',
    );
  });
});

describe('les mails au voyageur saluent par le prénom (09/10/2026)', () => {
  const booking = {
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
    arrivalAt: '2027-03-01T06:30',
    returnAt: '2027-03-03T15:05',
    days: 3,
    priceCents: 3499,
    customerName: 'Marie Claire de La Tour',
    customerFirstName: 'Marie Claire',
    customerLastName: 'de La Tour',
    customerEmail: 'mc@example.com',
    customerPhone: '0612345678',
    plate: 'AB-123-CD',
    returnFlight: null,
    departureFlight: null,
    customerNote: null,
    vehicle: { model: null, colour: null },
    car: null,
    outbound: null,
    passengers: 1,
    cancellationPolicy: 'free_24h',
    cancellableUntil: null,
    canCancel: false,
    canEditFlight: false,
  } as unknown as PublicBooking;

  it('confirmation, annulation, rappel et clôture', () => {
    for (const message of [
      confirmationEmail('Plazo', booking, null),
      cancellationEmail('Plazo', booking),
      reminderEmail('Plazo', booking, null),
      closingEmail('Plazo', booking, '2027-03-03T15:30'),
    ]) {
      expect(message.text).toMatch(/^Bonjour Marie Claire,/);
      expect(message.text).not.toContain('de La Tour,');
    }
    expect(reminderEmail('Plazo', booking, null).html).toContain('À demain, Marie Claire</h1>');
    expect(closingEmail('Plazo', booking, '2027-03-03T15:30').html).toContain('Bon retour, Marie Claire</h1>');
    expect(confirmationEmail('Plazo', booking, null).html).toContain('Bonjour Marie Claire, merci');
  });
});

describe('seed:operator : prénom et nom du gérant (09/10/2026)', () => {
  it('prend --first-name / --last-name, ou --name coupé ; refuse un nom manquant', () => {
    expect(namesFromArgs({ firstName: ' Jean ', lastName: ' Dupont ' })).toEqual({ firstName: 'Jean', lastName: 'Dupont' });
    expect(namesFromArgs({ name: 'Jean Dupont Martin' })).toEqual({ firstName: 'Jean', lastName: 'Dupont Martin' });
    expect(() => namesFromArgs({ name: 'Jean' })).toThrow(/last name/);
    expect(() => namesFromArgs({ firstName: 'Jean', lastName: '  ' })).toThrow(/last name/);
    expect(() => namesFromArgs({ lastName: 'Dupont' })).toThrow(/first name/);
    expect(() => namesFromArgs({})).toThrow(/first name/);
  });
});
