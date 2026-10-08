import { createHmac } from 'crypto';
import { Request } from 'express';
import { formatEuros, formatLocalLong, formatLocalShort, isGsm7 } from '@/domain/booking-messages';
import { cancellableUntil, canCancel, canEditFlight, isValidManageToken, manageLinkExpired, manageToken } from '@/domain/booking';
import { smsRecipient } from '@/domain/phone';
import { localDateTime } from '@/domain/time';
import { inCidr, isCloudflareIp, visitorIp } from '@/domain/client-ip';
import { ipKey, lookupReferenceKey, rateLimitKey } from '@/middlewares/rateLimiter';
import { parseSender, smsSenderName } from '@/services/notification.service';

const fakeRequest = (headers: Record<string, string>, ip = '10.0.0.1') =>
  ({ ip, get: (name: string) => headers[name.toLowerCase()] }) as unknown as Request;

describe('clé de limitation de débit', () => {
  const SITE_KEY = 'cle-du-site-123';

  it("compte le visiteur derrière le proxy Cloudflare, jamais l'adresse de Cloudflare (08/10/2026)", () => {
    expect(isCloudflareIp('172.70.111.26')).toBe(true);
    expect(isCloudflareIp('::ffff:188.114.96.5')).toBe(true);
    expect(isCloudflareIp('2606:4700:3030::6815:2059')).toBe(true);
    expect(isCloudflareIp('203.0.113.7')).toBe(false);
    expect(isCloudflareIp('2001:db8::1')).toBe(false);
    expect(inCidr('10.1.2.3', '10.0.0.0/8')).toBe(true);
    expect(inCidr('11.0.0.1', '10.0.0.0/8')).toBe(false);
    expect(inCidr('2a06:98c7::1', '2a06:98c0::/29')).toBe(true);
    expect(inCidr('2a06:98c8::1', '2a06:98c0::/29')).toBe(false);
    // Through Cloudflare: the header wins. Direct: the header is ignored (it could be forged).
    expect(visitorIp('172.70.111.26', '203.0.113.7')).toBe('203.0.113.7');
    expect(visitorIp('203.0.113.9', '203.0.113.7')).toBe('203.0.113.9');
    expect(visitorIp('172.70.111.26', 'not-an-ip')).toBe('172.70.111.26');
    expect(visitorIp(undefined, '203.0.113.7')).toBeUndefined();
    expect(rateLimitKey(fakeRequest({ 'cf-connecting-ip': '203.0.113.7' }, '172.70.111.26'), SITE_KEY)).toBe('203.0.113.7');
    expect(rateLimitKey(fakeRequest({ 'cf-connecting-ip': '203.0.113.7' }, '10.0.0.1'), SITE_KEY)).toBe('10.0.0.1');
    expect(rateLimitKey(fakeRequest({ 'cf-connecting-ip': '2001:db8:1:2::9' }, '2606:4700:3030::1'), SITE_KEY)).toBe('2001:db8:1:2::/64');
  });

  it('compte le voyageur quand la requête vient du site (clé correcte)', () => {
    const req = fakeRequest({ 'x-plazo-site-key': SITE_KEY, 'x-plazo-client-ip': ' 203.0.113.7 ' });
    expect(rateLimitKey(req, SITE_KEY)).toBe('203.0.113.7');
    expect(rateLimitKey(fakeRequest({ 'x-plazo-site-key': SITE_KEY, 'x-plazo-client-ip': '2001:db8::1' }), SITE_KEY)).toBe('2001:db8:0:0::/64');
  });

  it('regroupe les adresses IPv6 par /64 (une box en a des milliards), pour le site comme en direct', () => {
    expect(ipKey('2001:db8:1:2:aaaa:bbbb:cccc:dddd')).toBe('2001:db8:1:2::/64');
    expect(ipKey('2001:db8:1:2::1')).toBe(ipKey('2001:db8:1:2:ffff:0:0:9'));
    expect(ipKey('2001:db8:1:3::1')).not.toBe(ipKey('2001:db8:1:2::1'));
    expect(ipKey('fe80::1%eth0')).toBe('fe80:0:0:0::/64');
    expect(ipKey('::ffff:203.0.113.7')).toBe('203.0.113.7');
    expect(ipKey('203.0.113.7')).toBe('203.0.113.7');
    const site = (ip: string) => fakeRequest({ 'x-plazo-site-key': SITE_KEY, 'x-plazo-client-ip': ip });
    expect(rateLimitKey(site('2a01:e0a:1:2:3:4:5:6'), SITE_KEY)).toBe(rateLimitKey(site('2a01:e0a:1:2:9:9:9:9'), SITE_KEY));
    expect(rateLimitKey(fakeRequest({}, '2a01:e0a:1:2:3:4:5:6'), SITE_KEY)).toBe('2a01:e0a:1:2::/64');
  });

  it('limite aussi les recherches par référence, quelle que soit l’adresse', () => {
    const body = (reference: unknown) => ({ body: { reference } }) as unknown as Request;
    expect(lookupReferenceKey(body(' r7kq2m '))).toBe('reference:R7KQ2M');
    expect(lookupReferenceKey(body(42))).toBe('reference:');
  });

  it('compte l’IP de la requête sinon', () => {
    // Wrong key, no key configured, missing or malformed client IP: the caller's own IP.
    expect(rateLimitKey(fakeRequest({ 'x-plazo-site-key': 'mauvaise', 'x-plazo-client-ip': '203.0.113.7' }), SITE_KEY)).toBe('10.0.0.1');
    expect(rateLimitKey(fakeRequest({ 'x-plazo-site-key': '', 'x-plazo-client-ip': '203.0.113.7' }), '')).toBe('10.0.0.1');
    expect(rateLimitKey(fakeRequest({ 'x-plazo-client-ip': '203.0.113.7' }), SITE_KEY)).toBe('10.0.0.1');
    expect(rateLimitKey(fakeRequest({ 'x-plazo-site-key': SITE_KEY }), SITE_KEY)).toBe('10.0.0.1');
    expect(rateLimitKey(fakeRequest({ 'x-plazo-site-key': SITE_KEY, 'x-plazo-client-ip': 'pas-une-ip' }), SITE_KEY)).toBe('10.0.0.1');
  });
});

describe('clé de gestion d’une réservation', () => {
  it('est stable, propre à la réservation et au secret', () => {
    const token = manageToken('res_1', 'secret');
    expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(manageToken('res_1', 'secret')).toBe(token);
    expect(manageToken('res_2', 'secret')).not.toBe(token);
    expect(manageToken('res_1', 'autre')).not.toBe(token);
    expect(isValidManageToken('res_1', token, 'secret')).toBe(true);
    expect(isValidManageToken('res_2', token, 'secret')).toBe(false);
    expect(isValidManageToken('res_1', token.slice(0, 31), 'secret')).toBe(false);
    expect(isValidManageToken('res_1', undefined, 'secret')).toBe(false);
  });

  it('suit le contrat (HMAC de « manage-booking:<id> ») et change quand on la révoque', () => {
    const expected = createHmac('sha256', 'secret').update('manage-booking:res_1').digest('base64url').slice(0, 32);
    expect(manageToken('res_1', 'secret')).toBe(expected);
    const revoked = manageToken('res_1', 'secret', 1);
    expect(revoked).not.toBe(expected);
    expect(isValidManageToken('res_1', expected, 'secret', 1)).toBe(false);
    expect(isValidManageToken('res_1', revoked, 'secret', 1)).toBe(true);
  });

  it('expire 30 jours après le retour', () => {
    const returnAt = new Date('2026-10-10T10:00:00Z');
    expect(manageLinkExpired(returnAt, new Date('2026-11-09T09:59:00Z'))).toBe(false);
    expect(manageLinkExpired(returnAt, new Date('2026-11-09T10:01:00Z'))).toBe(true);
  });
});

describe('annulation et vol retour', () => {
  const arrival = new Date('2026-10-10T04:30:00Z');

  it('calcule la limite d’annulation selon la politique', () => {
    expect(cancellableUntil(arrival, 'free_until_arrival')).toEqual(arrival);
    expect(cancellableUntil(arrival, 'free_24h')!.toISOString()).toBe('2026-10-09T04:30:00.000Z');
    expect(cancellableUntil(arrival, 'free_48h')!.toISOString()).toBe('2026-10-08T04:30:00.000Z');
    expect(cancellableUntil(arrival, 'non_refundable')).toBeNull();
  });

  it('n’annule qu’une réservation attendue, avant la limite', () => {
    const until = new Date('2026-10-09T04:30:00Z');
    expect(canCancel('upcoming', until, new Date('2026-10-09T04:29:00Z'))).toBe(true);
    expect(canCancel('upcoming', until, new Date('2026-10-09T04:30:00Z'))).toBe(false);
    expect(canCancel('arrived', until, new Date('2026-10-01T00:00:00Z'))).toBe(false);
    expect(canCancel('upcoming', null, new Date('2026-10-01T00:00:00Z'))).toBe(false);
  });

  it('laisse changer le vol jusqu’au retour', () => {
    const ret = new Date('2026-10-12T13:00:00Z');
    expect(canEditFlight('shuttled_out', ret, new Date('2026-10-12T12:00:00Z'))).toBe(true);
    expect(canEditFlight('upcoming', ret, new Date('2026-10-12T13:00:00Z'))).toBe(false);
    for (const status of ['cancelled', 'returned', 'no_show'] as const) {
      expect(canEditFlight(status, ret, new Date('2026-10-01T00:00:00Z'))).toBe(false);
    }
  });
});

describe('numéro pour les SMS', () => {
  it('met les mobiles français au format international', () => {
    expect(smsRecipient('06 12 34 56 78')).toBe('+33612345678');
    expect(smsRecipient('07.12.34.56.78')).toBe('+33712345678');
    expect(smsRecipient('+33 6 12 34 56 78')).toBe('+33612345678');
    expect(smsRecipient('+33 (0)6 12 34 56 78')).toBe('+33612345678');
    expect(smsRecipient('0033612345678')).toBe('+33612345678');
  });

  it('n’envoie de SMS qu’aux mobiles français (ni fixes, ni numéros étrangers : pas de SMS pumping)', () => {
    expect(smsRecipient('04 72 22 72 21')).toBeNull();
    expect(smsRecipient('+33 4 72 22 72 21')).toBeNull();
    expect(smsRecipient('+33 8 99 12 34 56')).toBeNull();
    expect(smsRecipient('+44 7911 123456')).toBeNull();
    expect(smsRecipient('0044 7911 123456')).toBeNull();
    expect(smsRecipient('+882 1234 5678')).toBeNull();
    expect(smsRecipient('0033 7 12 34 56 78')).toBe('+33712345678');
    expect(smsRecipient('12345')).toBeNull();
  });
});

describe('textes des messages', () => {
  it('formate les prix, les dates et l’expéditeur', () => {
    expect(formatEuros(3499)).toBe('34,99 €');
    expect(formatEuros(123456)).toBe('1 234,56 €');
    expect(formatLocalLong('2026-10-04T06:30')).toBe('dimanche 4 octobre 2026 à 06:30');
    expect(formatLocalShort('2026-10-04T06:30')).toBe('04/10 à 06:30');
    expect(localDateTime(new Date('2026-10-03T22:30:00Z'), 'Europe/Paris')).toBe('2026-10-04T00:30');
    expect(parseSender('Plazo <resa@example.com>', 'X')).toEqual({ name: 'Plazo', email: 'resa@example.com' });
    expect(parseSender('"Parking Lyon" <resa@example.com>', 'X')).toEqual({ name: 'Parking Lyon', email: 'resa@example.com' });
    expect(parseSender('resa@example.com', 'Plazo')).toEqual({ name: 'Plazo', email: 'resa@example.com' });
    expect(parseSender('', 'Plazo')).toBeNull();
    expect(smsSenderName('', 'Plazo')).toBe('Plazo');
    expect(smsSenderName('Parking Lyon Sud!', 'Plazo')).toBe('ParkingLyon');
  });

  it('repère les SMS qui demandent l’unicode', () => {
    expect(isGsm7('Réservation confirmée, 34,99 € à régler sur place.')).toBe(true);
    expect(isGsm7('Garé à Saint-Exupéry — ça part')).toBe(false);
  });
});
