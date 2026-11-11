import { metaSilent, proofOf } from '@/domain/delivery-proof';

const at = (min: number) => new Date(Date.UTC(2026, 10, 11, 17, 51 + min));
const wa = (status: string, extra: Partial<{ errorCode: string | null; waMessageId: string | null; min: number; upd: number }> = {}) => ({
  id: 'w',
  kind: 'booking_reminder',
  status,
  waMessageId: extra.waMessageId === undefined ? 'wamid' : extra.waMessageId,
  errorCode: extra.errorCode ?? null,
  createdAt: at(extra.min ?? 0),
  updatedAt: at(extra.upd ?? extra.min ?? 0),
});
const sms = (status: string, min = 9, upd = min) => ({ id: 's', kind: 'booking_reminder', status, createdAt: at(min), updatedAt: at(upd) });
const now = at(60);

describe('proof of a message (11/11/2026, « un status des envois réaliste »)', () => {
  it('a WhatsApp accepted by Meta and never confirmed, then its SMS sent without a report: unconfirmed', () => {
    const proof = proofOf([wa('fallback')], [sms('sent')], now)!;
    expect(proof.level).toBe('unconfirmed');
    expect(proof.whatsapp?.state).toBe('accepted');
    expect(proof.sms?.state).toBe('sent');
  });

  it('read or delivered by WhatsApp, or a delivered SMS: confirmed', () => {
    expect(proofOf([wa('read', { upd: 4 })], [], now)!.level).toBe('confirmed');
    expect(proofOf([wa('read', { upd: 4 })], [], now)!.whatsapp?.statusAt).toEqual(at(4));
    expect(proofOf([wa('failed', { waMessageId: null, errorCode: '131026' })], [sms('delivered', 0, 1)], now)!.level).toBe('confirmed');
    expect(proofOf([], [sms('delivered')], now)!.level).toBe('confirmed');
  });

  it('accepted by Meta only, still waiting for an answer: unconfirmed, never « remis »', () => {
    expect(proofOf([wa('sent')], [], now)!.level).toBe('unconfirmed');
  });

  it('refused by Meta and the SMS abandoned: failed; the SMS still queued: pending', () => {
    expect(proofOf([wa('failed', { waMessageId: null, errorCode: '131026' })], [sms('abandoned', 0)], now)!.level).toBe('failed');
    expect(proofOf([wa('fallback', { errorCode: '131049' })], [sms('queued')], now)!.level).toBe('pending');
    expect(proofOf([wa('fallback', { errorCode: '131049' })], [sms('queued')], now)!.whatsapp?.state).toBe('refused');
  });

  it('nothing sent: no proof', () => {
    expect(proofOf([], [], now)).toBeNull();
  });
});

describe('Meta gone quiet', () => {
  it('three accepted messages with no answer in 24 hours', () => {
    expect(metaSilent([wa('fallback'), wa('sent'), wa('fallback')], now)).toBe(true);
  });
  it('one delivered message is enough to trust the webhook; too few or too recent messages say nothing', () => {
    expect(metaSilent([wa('fallback'), wa('sent'), wa('delivered')], now)).toBe(false);
    expect(metaSilent([wa('sent'), wa('sent')], now)).toBe(false);
    expect(metaSilent([wa('sent', { min: 55 }), wa('sent', { min: 55 }), wa('sent', { min: 55 })], now)).toBe(false);
  });
});
