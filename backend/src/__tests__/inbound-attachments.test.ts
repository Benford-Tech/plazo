import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Container } from 'typedi';
import prisma from '@/database';
import { attachmentKind, attachmentsText, pdfText, withAttachments, withoutAttachments } from '@/domain/inbound-attachments';
import { classifyMail } from '@/domain/inbound-kind';
import { parseRawEmail } from '@/domain/inbound-mime';
import { NotificationService } from '@/services/notification.service';
import { api, resetDatabase, setupOperator } from './utils/helpers';

/**
 * 08/11/2026 (« pour Parclick le nom du client, il y a une pièce jointe à analyser », « les pièces devraient être récupérées
 * lors du transfert », « cloudflare doit envoyer le fichier à plazo ») : the relay posts the whole raw message, attachments
 * included, and Plazo reads their text itself, without Claude. All names, numbers and addresses here are fictional.
 */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

async function pdf(lines: string[]): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  lines.forEach((line, i) => page.drawText(line, { x: 50, y: 760 - i * 20, font, size: 12 }));
  return Buffer.from(await doc.save());
}

const b64 = (value: string | Buffer) =>
  Buffer.from(value)
    .toString('base64')
    .replace(/(.{76})/g, '$1\r\n');

/** A raw email as the Cloudflare relay posts it: a plain-text body and one attachment. */
function raw(text: string, attachment: { name: string; type: string; content: Buffer }, subject = 'Voici votre réservation !'): string {
  return [
    'From: Parclick <no-reply@parclick.example>',
    'To: Parking Démo <contact@parking-demo.example>',
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'Date: Sun, 08 Nov 2026 10:00:00 +0100',
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary="m1"',
    '',
    '--m1',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    b64(text),
    '--m1',
    `Content-Type: ${attachment.type}; name="${attachment.name}"`,
    `Content-Disposition: attachment; filename="${attachment.name}"`,
    'Content-Transfer-Encoding: base64',
    '',
    b64(attachment.content),
    '--m1--',
    '',
  ].join('\r\n');
}

const parclick = [
  'Voici votre réservation ! <https://parclick.fr> = Voici votre réservation ! =',
  'Service de navette gratuit Arrivée au parking 20/11/2026 18:00 Sortie du parking 24/11/2026 19:30',
  'Référence de la réservation: *BQXY5678* Parking Démo - Navette - Aéroport Lyon Saint Exupéry.',
  'Le numéro de téléphone auquel vous devez appeler est le +33 7 00 00 00 00.',
  "TOTAL 42,00 Téléchargez l'application",
].join('\n');

const voucher = () =>
  pdf(['Bon de reservation BQXY5678', 'Nom : Jean Dupont', 'Telephone : 06 12 34 56 78', 'Annulation gratuite jusqu a 24 h avant']);

let fetchMock: jest.SpyInstance;
beforeEach(async () => {
  await resetDatabase();
  Container.get(NotificationService).settings.apiKey = '';
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response('{}', { status: 200 }));
});
afterEach(() => {
  fetchMock.mockRestore();
  jest.restoreAllMocks();
});
afterAll(() => prisma.$disconnect());

describe('le texte des pièces jointes (domaine)', () => {
  it('lit un PDF ligne par ligne', async () => {
    expect(await pdfText(await voucher())).toBe(
      'Bon de reservation BQXY5678\nNom : Jean Dupont\nTelephone : 06 12 34 56 78\nAnnulation gratuite jusqu a 24 h avant',
    );
  });

  it('reconnaît un PDF à ses premiers octets, jamais un faux PDF ; ignore les images', async () => {
    const real = await voucher();
    expect(attachmentKind({ filename: 'bon', mimeType: 'application/octet-stream' }, real)).toBe('pdf');
    expect(attachmentKind({ filename: 'bon.pdf', mimeType: 'application/pdf' }, Buffer.from('pas un pdf'))).toBeNull();
    expect(attachmentKind({ filename: 'plan.png', mimeType: 'image/png' }, Buffer.from('x'))).toBeNull();
    expect(attachmentKind({ filename: 'mail.eml', mimeType: 'message/rfc822' }, Buffer.from('x'))).toBe('message');
    expect(
      await attachmentsText([{ filename: 'logo.png', mimeType: 'image/png', disposition: 'inline', content: new Uint8Array([1, 2]) }]),
    ).toBeNull();
  });

  it('lit un mail joint (.eml) et un fichier texte ; un PDF cassé ne bloque rien', async () => {
    const eml = Buffer.from('From: Parclick <a@parclick.example>\r\nSubject: Votre reservation\r\n\r\nNom : Jean Dupont\r\n');
    const text = await attachmentsText([
      { filename: 'casse.pdf', mimeType: 'application/pdf', disposition: 'attachment', content: Buffer.from('%PDF-1.4 cassé') },
      { filename: 'resa.eml', mimeType: 'message/rfc822', disposition: 'attachment', content: eml },
      { filename: 'note.txt', mimeType: 'text/plain', disposition: 'attachment', content: Buffer.from('Plaque : AB-123-CD') },
    ]);
    expect(text).toBe(
      'Pièce jointe : resa.eml\nDe : Parclick <a@parclick.example>\nObjet : Votre reservation\nNom : Jean Dupont\n\nPièce jointe : note.txt\nPlaque : AB-123-CD',
    );
  });

  it('garde la place des pièces jointes dans les 20 000 caractères', () => {
    const whole = withAttachments('x'.repeat(30), 'Pièce jointe : a.pdf\nNom : Jean', 40);
    expect(whole.endsWith('Pièce jointe : a.pdf\nNom : Jean')).toBe(true);
    expect(whole.length).toBeLessThanOrEqual(40);
    expect(withoutAttachments('Corps\n\nPièce jointe : a.pdf\nNom : Jean')).toBe('Corps');
    expect(withAttachments('Corps', null, 40)).toBe('Corps');
  });

  it("les conditions d'un bon ne font jamais d'une confirmation une annulation", () => {
    const text = `${parclick}\n\nPièce jointe : bon.pdf\nVotre réservation a été annulée`;
    expect(classifyMail({ subject: '', from: '', text })).toMatchObject({ provider: 'Parclick', kind: 'booking' });
    // A forward as an attachment: the body names no comparator, the attachment does.
    expect(classifyMail({ subject: 'TR:', from: '', text: `Voir ci-joint\n\nPièce jointe : resa.eml\n${parclick}` })).toMatchObject({
      provider: 'Parclick',
      kind: 'booking',
    });
  });

  it('le relais passe la pièce jointe : parseRawEmail en garde le texte', async () => {
    const item = await parseRawEmail(Buffer.from(raw(parclick, { name: 'bon.pdf', type: 'application/pdf', content: await voucher() })), {
      from: 'no-reply@parclick.example',
      to: 'parking-demo@plazo.fr',
    });
    expect(item.AttachmentsText).toContain('Pièce jointe : bon.pdf\nBon de reservation BQXY5678\nNom : Jean Dupont');
  });
});

describe('à la réception', () => {
  it('une confirmation Parclick dont le nom et le téléphone sont dans le PDF joint : réservation créée sans Claude', async () => {
    const op = await setupOperator();
    const address = (await api().post('/api/internal/inbound/address').set(auth(op.token)).send({})).body.address as string;
    const res = await api()
      .post('/api/public/inbound/email')
      .set({
        'Content-Type': 'message/rfc822',
        'X-Inbound-Secret': 'inbound-test-secret',
        'X-Envelope-From': 'no-reply@parclick.example',
        'X-Envelope-To': address,
      })
      .send(raw(parclick, { name: 'bon.pdf', type: 'application/pdf', content: await voucher() }));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ received: 1, imported: 1 });
    const booking = await prisma.reservation.findFirstOrThrow({ where: { operatorId: op.operator.id, externalReference: 'BQXY5678' } });
    expect(booking).toMatchObject({ customerName: 'Jean Dupont', customerPhone: '06 12 34 56 78', priceCents: 4200, channelDetail: 'Parclick' });
    const stored = await prisma.inboundEmail.findFirstOrThrow({ where: { operatorId: op.operator.id } });
    expect(stored.textBody).toContain('Pièce jointe : bon.pdf');
    // Claude was never asked.
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('anthropic'))).toBe(false);
  });
});
