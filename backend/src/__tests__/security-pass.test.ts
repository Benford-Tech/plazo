import { redactUrl } from '@/domain/log-url';
import { isPrivateAddress, resolvesToPublic } from '@/domain/public-url';

// Security pass of 13/11/2026: what the access log keeps, and which addresses the server may call.

describe('journal des accès', () => {
  it('cache les secrets portés par une adresse', () => {
    expect(redactUrl('/api/public/app-link/R7KQ2M-abcd1234')).toBe('/api/public/app-link/[hidden]');
    expect(redactUrl('/api/public/app-link/R7KQ2M-abcd1234/claim')).toBe('/api/public/app-link/[hidden]/claim');
    expect(redactUrl('/api/public/sms-gateway/webhook/op1.deadbeef')).toBe('/api/public/sms-gateway/webhook/[hidden]');
    expect(redactUrl('/api/public/morning-email/unsubscribe/tok123')).toBe('/api/public/morning-email/unsubscribe/[hidden]');
    expect(redactUrl('/api/public/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=s3cret&hub.challenge=42')).toBe(
      '/api/public/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=[hidden]&hub.challenge=[hidden]',
    );
    expect(redactUrl('/api/internal/reservations?page=2')).toBe('/api/internal/reservations?page=2');
  });
});

describe('adresses appelées par le serveur', () => {
  it('reconnaît les adresses internes', () => {
    for (const ip of [
      '10.0.0.1',
      '127.0.0.1',
      '169.254.169.254',
      '172.20.1.1',
      '192.168.1.1',
      '100.64.0.1',
      '::1',
      'fd00::1',
      'fe80::1',
      '::ffff:10.0.0.1',
    ])
      expect(isPrivateAddress(ip)).toBe(true);
    for (const ip of ['8.8.8.8', '172.32.0.1', '2606:4700::1111']) expect(isPrivateAddress(ip)).toBe(false);
  });

  it('refuse une adresse écrite en clair ou interne avant toute résolution', async () => {
    expect(await resolvesToPublic('https://10.0.0.1/api')).toBe(false);
    expect(await resolvesToPublic('http://sms.example.org')).toBe(false);
    expect(await resolvesToPublic('https://gateway.localhost')).toBe(false);
  });
});
