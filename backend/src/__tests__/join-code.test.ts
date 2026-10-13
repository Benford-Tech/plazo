import { createHmac } from 'crypto';
import { formatJoinCode, JOIN_CODE_ALPHABET, joinCodeFor, joinCodeValidUntil, normalizeJoinCode } from '@/domain/join-code';
import { cleanNamePart, effectiveStatus, isJoinableRole, joinRequestPush, mergedNames } from '@/domain/join-request';

const secret = Buffer.from('secret-de-test-des-codes-du-jour');

describe('code du jour (domaine)', () => {
  it('fait dix caractères de l’alphabet de Crockford, sans I, L, O ni U', () => {
    expect(JOIN_CODE_ALPHABET).toHaveLength(32);
    expect(JOIN_CODE_ALPHABET).not.toMatch(/[ILOU]/);
    for (let i = 0; i < 200; i += 1) {
      const code = joinCodeFor(secret, `operateur-${i}`, '2026-10-13');
      expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{10}$/);
    }
  });

  it('est le même pour un loueur et un jour, change avec le jour, le loueur et le secret', () => {
    const code = joinCodeFor(secret, 'op-1', '2026-10-13');
    expect(joinCodeFor(secret, 'op-1', '2026-10-13')).toBe(code);
    expect(joinCodeFor(secret, 'op-1', '2026-10-14')).not.toBe(code);
    expect(joinCodeFor(secret, 'op-2', '2026-10-13')).not.toBe(code);
    expect(joinCodeFor(Buffer.from('autre-secret'), 'op-1', '2026-10-13')).not.toBe(code);
  });

  it('prend les 50 premiers bits du HMAC, cinq par caractère', () => {
    // Recomputed bit by bit from the digest, independently of the implementation's arithmetic.
    const digest = createHmac('sha256', 'k').update('a:b').digest();
    const bits = [...digest.subarray(0, 7)]
      .map(b => b.toString(2).padStart(8, '0'))
      .join('')
      .slice(0, 50);
    const expected = (bits.match(/.{5}/g) ?? []).map(chunk => JOIN_CODE_ALPHABET[parseInt(chunk, 2)]).join('');
    expect(joinCodeFor('k', 'a', 'b')).toBe(expected);
  });

  it('se montre en deux groupes de cinq', () => {
    expect(formatJoinCode('K7QM2XP9TD')).toBe('K7QM2-XP9TD');
  });

  it('lit ce qui est tapé ou collé : minuscules, espaces, tirets, O pour 0, I et L pour 1', () => {
    expect(normalizeJoinCode('K7QM2-XP9TD')).toBe('K7QM2XP9TD');
    expect(normalizeJoinCode(' k7qm2 xp9td ')).toBe('K7QM2XP9TD');
    expect(normalizeJoinCode('K7QM2–XP9TD')).toBe('K7QM2XP9TD'); // en dash from a message
    expect(normalizeJoinCode('0OIL1-23456')).toBe('0011123456');
    expect(normalizeJoinCode('o0il1 23456')).toBe('0011123456');
  });

  it('refuse ce qui ne peut pas être un code', () => {
    expect(normalizeJoinCode('K7QM2-XP9T')).toBeNull(); // 9
    expect(normalizeJoinCode('K7QM2-XP9TDD')).toBeNull(); // 11
    expect(normalizeJoinCode('K7QM2-XP9TU')).toBeNull(); // U is not in the alphabet
    expect(normalizeJoinCode('K7QM2_XP9TD')).toBeNull();
    expect(normalizeJoinCode('')).toBeNull();
    expect(normalizeJoinCode(null)).toBeNull();
    expect(normalizeJoinCode(undefined)).toBeNull();
    expect(normalizeJoinCode('K'.repeat(5000))).toBeNull();
  });

  it('cesse de marcher au minuit local suivant, passage à l’heure d’hiver compris', () => {
    expect(joinCodeValidUntil('2026-10-13', 'Europe/Paris').toISOString()).toBe('2026-10-13T22:00:00.000Z');
    // Night of 24 → 25 October 2026: Paris goes back to UTC+1 at 03:00, midnight of the 25th is still UTC+2.
    expect(joinCodeValidUntil('2026-10-24', 'Europe/Paris').toISOString()).toBe('2026-10-24T22:00:00.000Z');
    expect(joinCodeValidUntil('2026-10-25', 'Europe/Paris').toISOString()).toBe('2026-10-25T23:00:00.000Z');
    expect(joinCodeValidUntil('2026-10-13', 'America/Martinique').toISOString()).toBe('2026-10-14T04:00:00.000Z');
  });
});

describe('demandes pour rejoindre (domaine)', () => {
  it('ne propose jamais le rôle de gérant', () => {
    expect(isJoinableRole('driver')).toBe(true);
    expect(isJoinableRole('agent')).toBe(true);
    expect(isJoinableRole('valet')).toBe(true);
    expect(isJoinableRole('manager')).toBe(false);
    expect(isJoinableRole(undefined)).toBe(false);
  });

  it('écrit la notification des gérants', () => {
    expect(joinRequestPush({ firstName: 'Julie', lastName: 'Martin', operatorName: 'Parkair Lyon', wishedRole: 'driver' })).toEqual({
      title: 'Demande pour rejoindre l’équipe',
      body: 'Julie Martin veut rejoindre Parkair Lyon comme chauffeur.',
    });
    expect(joinRequestPush({ firstName: 'Karim', lastName: 'Benali', operatorName: 'P', wishedRole: 'agent' }).body).toBe(
      'Karim Benali veut rejoindre P comme agent d’accueil.',
    );
    expect(joinRequestPush({ firstName: 'Léa', lastName: 'Roux', operatorName: 'P', wishedRole: 'valet' }).body).toContain('comme voiturier.');
  });

  it('garde un nom déjà connu et nettoie le nom donné', () => {
    expect(mergedNames({ firstName: 'Julie', lastName: '' }, { firstName: 'Autre', lastName: '  Martin   Durand ' })).toEqual({
      firstName: 'Julie',
      lastName: 'Martin Durand',
    });
    expect(mergedNames({ firstName: '', lastName: '' }, {})).toEqual({ firstName: '', lastName: '' });
    expect(cleanNamePart('x'.repeat(80))).toHaveLength(60);
  });

  it('lit une demande en attente passée ses 7 jours comme expirée', () => {
    const now = new Date('2026-10-13T10:00:00Z');
    expect(effectiveStatus({ status: 'pending', expiresAt: new Date('2026-10-13T09:59:59Z') }, now)).toBe('expired');
    expect(effectiveStatus({ status: 'pending', expiresAt: new Date('2026-10-14T10:00:00Z') }, now)).toBe('pending');
    expect(effectiveStatus({ status: 'refused', expiresAt: new Date('2026-10-01T10:00:00Z') }, now)).toBe('refused');
  });
});
