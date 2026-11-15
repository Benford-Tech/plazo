import 'reflect-metadata';
import { isPushServiceEndpoint } from '@/domain/staff-notifications';
import { smsRecipient } from '@/domain/phone';
import { WhatsappInboxService } from '@/services/whatsapp-inbox.service';
import { Container } from 'typedi';

// Security pass of 15/11/2026 (« Essaie de hacker Plazo »).

describe('SMS vers l’étranger', () => {
  it('seulement vers les pays d’où viennent les voyageurs', () => {
    expect(smsRecipient('+44 7911 123456')).toBe('+447911123456');
    expect(smsRecipient('+32 470 12 34 56')).toBe('+32470123456');
    expect(smsRecipient('+212 6 12 34 56 78')).toBe('+212612345678');
    expect(smsRecipient('+262 692 12 34 56')).toBe('+262692123456');
    // Revenue-share and premium-prone ranges elsewhere: no SMS.
    expect(smsRecipient('+675 7123 4567')).toBeNull();
    expect(smsRecipient('+1 268 123 4567')).toBeNull();
    expect(smsRecipient('+882 1234 5678')).toBeNull();
  });
});

describe('notifications du navigateur', () => {
  it('n’accepte que les services de notification des navigateurs', () => {
    expect(isPushServiceEndpoint('https://fcm.googleapis.com/fcm/send/abc')).toBe(true);
    expect(isPushServiceEndpoint('https://updates.push.services.mozilla.com/wpush/v2/x')).toBe(true);
    expect(isPushServiceEndpoint('https://web.push.apple.com/QK')).toBe(true);
    expect(isPushServiceEndpoint('https://db5p.notify.windows.com/w/?token=x')).toBe(true);
    expect(isPushServiceEndpoint('https://evil.example/fcm.googleapis.com')).toBe(false);
    expect(isPushServiceEndpoint('https://fcm.googleapis.com:8443/x')).toBe(false);
    expect(isPushServiceEndpoint('https://user:pw@fcm.googleapis.com/x')).toBe(false);
    expect(isPushServiceEndpoint('http://fcm.googleapis.com/x')).toBe(false);
  });
});

describe('« Écrire au parking »', () => {
  it('fermé à une réservation non payée ou annulée', async () => {
    const inbox = Container.get(WhatsappInboxService);
    const base = { id: 'r1', operatorId: 'o1', customerPhone: '', customerName: 'X', reference: 'R1' };
    for (const status of ['pending_payment', 'cancelled'])
      await expect(inbox.travellerWrite({ ...base, status }, 'Bonjour')).rejects.toMatchObject({ status: 409, code: 'messages_closed' });
  });
});
