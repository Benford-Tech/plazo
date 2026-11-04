import { travellerMessages } from '@/domain/traveller-message-log';

// « Messages au voyageur » (04/11/2026): the SMS and WhatsApp lines of a booking, a fallen-back WhatsApp as its SMS.

const at = (minutes: number) => new Date(Date.UTC(2026, 10, 4, 8, minutes));

describe('travellerMessages', () => {
  it('lit les états, remplace un WhatsApp non remis par son SMS, et va du plus récent au plus ancien', () => {
    const lines = travellerMessages(
      [
        { id: 'w1', kind: 'booking_confirmed', status: 'read', waMessageId: 'wamid.1', errorCode: null, createdAt: at(0), updatedAt: at(8) },
        {
          id: 'w2',
          kind: 'booking_reminder',
          status: 'fallback',
          waMessageId: 'wamid.2',
          errorCode: 'meta_131026',
          createdAt: at(10),
          updatedAt: at(11),
        },
        { id: 'w3', kind: 'flight_landed', status: 'failed', waMessageId: 'wamid.3', errorCode: 'meta_131026', createdAt: at(20), updatedAt: at(21) },
      ],
      [
        { id: 's1', kind: 'booking_reminder', status: 'sent', createdAt: at(11), updatedAt: at(11) },
        { id: 's2', kind: 'signature_code', status: 'sent', createdAt: at(30), updatedAt: at(30) },
      ],
    );
    expect(lines.map(l => [l.id, l.channel, l.status, l.whatsappFallback])).toEqual([
      ['s2', 'sms', 'sent', false],
      ['w3', 'whatsapp', 'failed', false],
      ['s1', 'sms', 'sent', true],
      ['w1', 'whatsapp', 'read', false],
    ]);
    expect(lines[3].statusAt).toBe(at(8).toISOString());
  });

  it('un WhatsApp refusé à l’envoi (sans identifiant de Meta) devient le SMS parti aussitôt', () => {
    const lines = travellerMessages(
      [{ id: 'w1', kind: 'booking_reminder', status: 'failed', waMessageId: null, errorCode: 'meta_131047', createdAt: at(0), updatedAt: at(0) }],
      [{ id: 's1', kind: 'booking_reminder', status: 'sent', createdAt: at(0), updatedAt: at(0) }],
    );
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ id: 's1', channel: 'sms', whatsappFallback: true });
  });
});
