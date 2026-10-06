import { ANONYMIZED_TRAVELLER, anonymizeReturnedBefore, PERSONAL_AUDIT_KEYS } from '@/domain/retention';
import { canTransition, formatFlight, formatPlate, newReference, plateKey } from '@/domain/reservation';
import { addDays, dayBounds, exceedsCalendarDays, localDate, parseInstant } from '@/domain/time';
import { occupiedNights } from '@/services/capacity.service';

const TZ = 'Europe/Paris';

describe('dates locales', () => {
  it('interprète une heure locale en heure de Paris (été et hiver)', () => {
    expect(parseInstant('2026-07-04T06:30', TZ)!.toISOString()).toBe('2026-07-04T04:30:00.000Z');
    expect(parseInstant('2026-12-04T06:30', TZ)!.toISOString()).toBe('2026-12-04T05:30:00.000Z');
  });

  it('gère le changement d’heure du 25 octobre 2026', () => {
    expect(parseInstant('2026-10-25T01:30', TZ)!.toISOString()).toBe('2026-10-24T23:30:00.000Z');
    expect(parseInstant('2026-10-25T04:00', TZ)!.toISOString()).toBe('2026-10-25T03:00:00.000Z');
    const { start, end } = dayBounds('2026-10-25', TZ);
    expect((end.getTime() - start.getTime()) / 3600000).toBe(25);
  });

  it('accepte un instant ISO et refuse le reste', () => {
    expect(parseInstant('2026-10-04T04:30:00Z', TZ)!.toISOString()).toBe('2026-10-04T04:30:00.000Z');
    expect(parseInstant('04/10/2026', TZ)).toBeNull();
  });

  it('refuse les dates et heures qui n’existent pas au lieu de les faire déborder', () => {
    expect(parseInstant('2026-02-30T10:00', TZ)).toBeNull();
    expect(parseInstant('2026-10-32T08:00', TZ)).toBeNull();
    expect(parseInstant('2026-13-01T08:00', TZ)).toBeNull();
    expect(parseInstant('2026-10-04T25:00', TZ)).toBeNull();
    expect(parseInstant('2026-10-04T24:00', TZ)).toBeNull();
    expect(parseInstant('2026-10-04T10:60', TZ)).toBeNull();
    expect(parseInstant('2026-02-30T10:00:00Z', TZ)).toBeNull();
    expect(parseInstant('2028-02-29T10:00', TZ)).not.toBeNull();
    expect(parseInstant('2026-12-31T23:59', TZ)).not.toBeNull();
  });

  it('mesure la durée maximale d’un séjour en jours de calendrier, changement d’heure compris', () => {
    const at = (local: string) => parseInstant(local, TZ)!;
    // 90 calendar days across the October change: 90 days and 1 hour of elapsed time, still allowed.
    expect(exceedsCalendarDays(at('2026-10-01T08:00'), at('2026-12-30T08:00'), TZ, 90)).toBe(false);
    expect(exceedsCalendarDays(at('2026-10-01T08:00'), at('2026-12-30T08:01'), TZ, 90)).toBe(true);
    // Across the March change: 89 days and 23 hours elapsed, the same rule.
    expect(exceedsCalendarDays(at('2027-01-10T08:00'), at('2027-04-10T08:00'), TZ, 90)).toBe(false);
    expect(exceedsCalendarDays(at('2027-01-10T08:00'), at('2027-04-10T08:01'), TZ, 90)).toBe(true);
  });

  it('calcule la date locale et les jours', () => {
    expect(localDate(new Date('2026-10-03T22:30:00Z'), TZ)).toBe('2026-10-04');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });
});

describe('nuits occupées', () => {
  it('va du jour d’arrivée à la veille du retour', () => {
    expect(occupiedNights(parseInstant('2026-10-04T06:30', TZ)!, parseInstant('2026-10-07T15:05', TZ)!, TZ)).toEqual([
      '2026-10-04',
      '2026-10-05',
      '2026-10-06',
    ]);
  });

  it('compte le jour d’arrivée pour un aller-retour dans la journée', () => {
    expect(occupiedNights(parseInstant('2026-10-04T06:00', TZ)!, parseInstant('2026-10-04T22:00', TZ)!, TZ)).toEqual(['2026-10-04']);
  });
});

describe('plaques, vols, statuts', () => {
  it('met en forme les plaques françaises et garde les étrangères', () => {
    expect(formatPlate('gk318px')).toBe('GK-318-PX');
    expect(formatPlate('gk 318 px')).toBe('GK-318-PX');
    expect(formatPlate('b-ab 1234')).toBe('B-AB 1234');
    expect(plateKey('GK-318-PX')).toBe('GK318PX');
  });

  it('met en forme les numéros de vol', () => {
    expect(formatFlight('to3627')).toBe('TO 3627');
    expect(formatFlight('U2 4412')).toBe('U2 4412');
    expect(formatFlight('ezy 4412')).toBe('EZY 4412');
    expect(formatFlight('pas un vol')).toBeNull();
  });

  it('suit le parcours du client', () => {
    expect(canTransition('upcoming', 'arrived')).toBe(true);
    expect(canTransition('upcoming', 'returned')).toBe(false);
    expect(canTransition('return_requested', 'returned')).toBe(true);
    expect(canTransition('cancelled', 'upcoming')).toBe(true);
  });

  it('génère des références lisibles', () => {
    expect(newReference()).toMatch(/^R[A-HJ-NP-Z2-9]{5}$/);
  });
});

describe('retention (privacy policy)', () => {
  it('anonymises the bookings returned more than 12 calendar months ago', () => {
    expect(anonymizeReturnedBefore(new Date('2027-10-06T01:00:00Z')).toISOString()).toBe('2026-10-06T01:00:00.000Z');
    expect(anonymizeReturnedBefore(new Date('2027-01-15T00:00:00Z')).toISOString()).toBe('2026-01-15T00:00:00.000Z');
  });

  it('scrubs from the audit details every field it clears, plus the landed flight', () => {
    expect(PERSONAL_AUDIT_KEYS).toEqual(expect.arrayContaining([...Object.keys(ANONYMIZED_TRAVELLER), 'flight']));
    expect(PERSONAL_AUDIT_KEYS).not.toContain('reference');
  });
});
