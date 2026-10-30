import { PDFDocument, PDFPage, StandardFonts } from 'pdf-lib';
import { Container } from 'typedi';
import prisma from '@/database';
import { bookingFieldFacts, ContractField, fieldValues, prefilledPdf, SAMPLE_FACTS, signatureStamp, validateFields } from '@/domain/contract-fields';
import { localDateTime } from '@/domain/time';
import { NotificationService } from '@/services/notification.service';
import { MemoryPhotoBackend, PhotoStorageService } from '@/services/photo-storage.service';
import { SmsService } from '@/services/sms.service';
import {
  api,
  disableFakePayments,
  enableFakePayments,
  onboardOperator,
  payBooking,
  publishListing,
  resetDatabase,
  setupOperator,
} from './utils/helpers';

/** 30/10/2026, « le contrat doit être pré-rempli avec les infos et la date de signature », direction A. */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const binary = (res: any, cb: (err: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on('data', (c: Buffer) => chunks.push(c));
  res.on('end', () => cb(null, Buffer.concat(chunks)));
};

async function samplePdf(pages = 2): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i += 1) doc.addPage([595, 842]).drawText(`Article ${i}`, { x: 50, y: 700, font, size: 14 });
  return Buffer.from(await doc.save());
}

const FIELDS: ContractField[] = [
  { key: 'customer_name', page: 0, x: 0.3, y: 0.2, w: 0.4, h: 0.03 },
  { key: 'plate', page: 0, x: 0.3, y: 0.25, w: 0.2, h: 0.03 },
  { key: 'arrival_at', page: 0, x: 0.1, y: 0.3, w: 0.3, h: 0.03 },
  { key: 'signed_on', page: 1, x: 0.5, y: 0.8, w: 0.2, h: 0.03 },
  { key: 'signature', page: 1, x: 0.1, y: 0.85, w: 0.3, h: 0.08 },
];

/** What drawText wrote, page by page (the content streams are compressed). */
function captureText() {
  const drawn: { text: string; x: number; y: number }[] = [];
  const original = PDFPage.prototype.drawText;
  jest.spyOn(PDFPage.prototype, 'drawText').mockImplementation(function (this: PDFPage, text: string, options?: any) {
    drawn.push({ text, x: options?.x ?? 0, y: options?.y ?? 0 });
    return original.call(this, text, options);
  });
  return drawn;
}

describe('le contrat pré-rempli (domaine)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('vérifie les champs posés : clé, page, cadre dans la page, taille', () => {
    expect(validateFields(FIELDS, 2)).toEqual({ fields: FIELDS });
    expect(validateFields('x', 2)).toEqual({ error: 'invalid' });
    expect(validateFields([{ ...FIELDS[0], key: 'iban' }], 2)).toEqual({ error: 'invalid_key' });
    expect(validateFields([{ ...FIELDS[0], page: 2 }], 2)).toEqual({ error: 'invalid_page' });
    expect(validateFields([{ ...FIELDS[0], x: 0.8, w: 0.4 }], 2)).toEqual({ error: 'invalid_box' });
    expect(validateFields([{ ...FIELDS[0], size: 40 }], 2)).toEqual({ error: 'invalid_size' });
    expect(
      validateFields(
        Array.from({ length: 41 }, () => FIELDS[0]),
        2,
      ),
    ).toEqual({ error: 'too_many' });
  });

  it('écrit les valeurs à leur place, la date de signature, et la signature seulement une fois signé', async () => {
    expect(fieldValues(SAMPLE_FACTS)).toMatchObject({
      customer_name: 'Claire Martin',
      arrival_at: '12/11/2026 08:00',
      price: '54,00 €',
      signed_on: '12/11/2026',
    });
    // 30/10/2026: the mileage of the drop-off report, the flights, or the train of the notes.
    expect(fieldValues(SAMPLE_FACTS)).toMatchObject({
      mileage: '48 210 km',
      departure_flight: 'TO 3626',
      travel: 'Aller TO 3626 · Retour TO 3627',
    });
    const booking = {
      customerName: 'Léa Roux',
      customerPhone: '0612345678',
      plate: 'AB-123-CD',
      vehicleModel: null,
      vehicleColour: null,
      arrivalAt: new Date('2026-11-12T07:00:00Z'),
      returnAt: new Date('2026-11-14T17:00:00Z'),
      priceCents: null,
      reference: 'R1',
      returnFlight: null,
      departureFlight: null,
      notes: 'Arrivée tôt\nTrain indiqué dans le fichier : TGV 6612',
      inspections: [
        { kind: 'dropoff', author: 'traveller', mileageKm: 1 },
        { kind: 'dropoff', author: 'staff', mileageKm: 120500 },
      ],
    };
    const facts = bookingFieldFacts(booking, d => d.toISOString().slice(0, 16), new Date('2026-11-12T07:00:00Z'));
    expect(fieldValues(facts)).toMatchObject({ travel: 'TGV 6612', mileage: '120 500 km', departure_flight: '' });
    expect(fieldValues(bookingFieldFacts({ ...booking, notes: null, inspections: [] }, d => d.toISOString(), new Date()))).toMatchObject({
      travel: '',
      mileage: '',
    });

    const original = await samplePdf();
    const drawn = captureText();
    const before = await prefilledPdf(original, FIELDS, SAMPLE_FACTS);
    expect((await PDFDocument.load(before)).getPageCount()).toBe(2);
    expect(drawn.map(d => d.text)).toEqual(['Claire Martin', 'GH-456-JK', '12/11/2026 08:00', '12/11/2026']);
    // From the top left of the page: x = 0.3 × 595, the box's middle under 0.2 × 842 from the top.
    expect(drawn[0].x).toBeCloseTo(0.3 * 595 + 1, 0);
    expect(drawn[0].y).toBeGreaterThan(842 - 0.23 * 842);
    expect(drawn[0].y).toBeLessThan(842 - 0.2 * 842);

    drawn.length = 0;
    await prefilledPdf(original, FIELDS, SAMPLE_FACTS, signatureStamp('sms_code', null, '2026-11-12T09:47'));
    expect(drawn.map(d => d.text)).toContain('Signé par code SMS · 09:47');
  });
});

describe('le contrat pré-rempli (API)', () => {
  let stripe: ReturnType<typeof enableFakePayments>;

  beforeEach(async () => {
    await resetDatabase();
    const notifications = Container.get(NotificationService);
    notifications.settings.apiKey = 'brevo-test';
    notifications.settings.emailFrom = 'Plazo <bonjour@example.com>';
    stripe = enableFakePayments();
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 201 }));
    Container.get(PhotoStorageService).backend = new MemoryPhotoBackend();
    jest.spyOn(Container.get(SmsService), 'sendSignatureCode').mockResolvedValue(true);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    disableFakePayments();
    Container.get(NotificationService).settings.apiKey = '';
  });
  afterAll(() => prisma.$disconnect());

  it('le gérant place les champs ; le voyageur lit son contrat pré-rempli, puis le PDF signé porte la date et la signature', async () => {
    const op = await setupOperator();
    await onboardOperator(op.operator.id);
    await api()
      .put('/api/internal/pricing')
      .set(auth(op.token))
      .send({ tiers: [{ days: 1, priceCents: 1500 }], extraDayPriceCents: 600 });
    await api()
      .put('/api/internal/listing')
      .set(auth(op.token))
      .send({
        airportCode: 'LYS',
        slug: `parking-${op.parking.id}`,
        title: 'Parking LYS',
        services: ['shuttle'],
        cancellationPolicy: 'free_24h',
        photos: [],
      });
    await publishListing(op.parking.id);
    const up = await api()
      .post('/api/internal/contract-template?fileName=contrat.pdf')
      .set(auth(op.token))
      .set('Content-Type', 'application/pdf')
      .send(await samplePdf());
    const templateId = up.body.current.id as string;
    expect(up.body.current.fields).toEqual([]);

    // Wrong boxes are refused; the right ones are kept with the version.
    const bad = await api()
      .put(`/api/internal/contract-template/${templateId}/fields`)
      .set(auth(op.token))
      .send({ fields: [{ ...FIELDS[0], page: 5 }] });
    expect([bad.status, bad.body.fields]).toEqual([400, { fields: 'invalid_page' }]);
    const set = await api().put(`/api/internal/contract-template/${templateId}/fields`).set(auth(op.token)).send({ fields: FIELDS });
    expect(set.status).toBe(200);
    expect(set.body.current.fields).toEqual(FIELDS);
    expect(set.body.current.fieldsSetAt).toBeTruthy();

    // The editor's preview: example values.
    let drawn = captureText();
    const preview = await api()
      .post(`/api/internal/contract-template/${templateId}/preview`)
      .set(auth(op.token))
      .send({ fields: FIELDS })
      .buffer()
      .parse(binary);
    expect(preview.status).toBe(200);
    expect(drawn.map(d => d.text)).toContain('Claire Martin');
    expect(drawn.map(d => d.text)).toContain('Signature du client');

    // The traveller's booking: the PDF read before signing carries its values and today's date, no signature.
    const res = await api()
      .post('/api/public/bookings')
      .send({
        airport: 'lyon-saint-exupery',
        parking: `parking-${op.parking.id}`,
        arrivalAt: '2027-03-01T06:30',
        returnAt: '2027-03-03T15:05',
        customerName: 'Camille Martin',
        customerPhone: '06 12 34 56 78',
        customerEmail: 'camille@example.com',
        plate: 'ab123cd',
        passengers: 2,
        acceptTerms: true,
      });
    await payBooking(res.body.reference, res.body.manageToken, stripe.sessions);
    const id = (await prisma.reservation.findUniqueOrThrow({ where: { reference: res.body.reference } })).id;
    const today = localDateTime(new Date(), 'Europe/Paris').slice(0, 10).split('-').reverse().join('/');

    jest.restoreAllMocks();
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 201 }));
    drawn = captureText();
    const read = await api()
      .get(`/api/public/bookings/${res.body.reference}/contract/file?kind=template`)
      .set('x-booking-token', res.body.manageToken)
      .buffer()
      .parse(binary);
    expect(read.status).toBe(200);
    expect((await PDFDocument.load(read.body)).getPageCount()).toBe(2);
    expect(drawn.map(d => d.text)).toEqual(['Camille Martin', 'AB-123-CD', '01/03/2027 06:30', today]);

    // Signed at the counter by SMS code: the signed PDF carries the same values, the date and « Signé par code SMS ».
    drawn.length = 0;
    const signed = await api()
      .post(`/api/internal/reservations/${id}/contract/sign`)
      .set(auth(op.token))
      .send({
        strokes: [
          [
            [0.1, 0.5],
            [0.2, 0.4],
            [0.3, 0.6],
            [0.5, 0.55],
            [0.6, 0.5],
          ],
        ],
      });
    expect([signed.status, signed.body.code]).toEqual([200, undefined]);
    const texts = drawn.map(d => d.text);
    expect(texts.slice(0, 4)).toEqual(['Camille Martin', 'AB-123-CD', '01/03/2027 06:30', today]);
    // The signed PDF: the parking's 2 pages, stamped, plus the « Réservation et signature » page.
    const pdf = await api().get(`/api/internal/reservations/${id}/contract/file?kind=signed`).set(auth(op.token)).buffer().parse(binary);
    expect((await PDFDocument.load(pdf.body)).getPageCount()).toBe(3);
  });
});
