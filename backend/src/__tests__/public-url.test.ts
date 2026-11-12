import { isPublicHttpsUrl } from '@/domain/public-url';

describe('adresses que le serveur accepte d’appeler (passerelle SMS privée)', () => {
  it('un nom de domaine public en https', () => {
    expect(isPublicHttpsUrl('https://api.sms-gate.app/3rdparty/v1')).toBe(true);
    expect(isPublicHttpsUrl('https://sms.mon-parking.fr:8443/api')).toBe(true);
  });
  it('jamais une adresse IP, localhost, un nom interne, http ni des identifiants dans l’adresse', () => {
    for (const url of [
      'https://10.0.0.5:8443',
      'https://169.254.169.254/latest',
      'https://[::1]/',
      'https://localhost/x',
      'https://gateway.internal/x',
      'https://2130706433/',
      'https://0x7f000001/',
      'http://api.sms-gate.app',
      'https://user:pass@api.sms-gate.app',
      'pas une adresse',
    ]) {
      expect(isPublicHttpsUrl(url)).toBe(false);
    }
  });
});

import { safeMediaType } from '@/controllers/whatsapp.controller';

describe('pièces jointes WhatsApp servies au navigateur (12/11/2026)', () => {
  it('garde le type des photos, sons, vidéos et PDF, jamais celui d’une page ou d’un SVG', () => {
    expect(safeMediaType('image/jpeg')).toBe('image/jpeg');
    expect(safeMediaType('audio/ogg; codecs=opus')).toBe('audio/ogg');
    expect(safeMediaType('application/pdf')).toBe('application/pdf');
    expect(safeMediaType('text/html')).toBeNull();
    expect(safeMediaType('image/svg+xml')).toBeNull();
    expect(safeMediaType('application/xhtml+xml')).toBeNull();
  });
});
