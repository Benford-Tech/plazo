import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Container } from 'typedi';
import prisma from '@/database';
import { buildSignedContractPdf, signedFileNames, templateDocument, templateVersion } from '@/domain/contract-template';
import { contractText } from '@/domain/contract';
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

/** 26/10/2026, « chaque parking peut héberger le contrat de stationnement à ses clients » (choice A « Mon PDF », register R-A). */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const bookingToken = (token: string) => ({ 'x-booking-token': token });
const STROKES = [
  [
    [0.1, 0.5],
    [0.2, 0.4],
    [0.3, 0.6],
    [0.5, 0.55],
    [0.6, 0.5],
  ],
];

async function samplePdf(pages = 3): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i += 1) doc.addPage().drawText(`Article ${i}`, { x: 50, y: 700, font, size: 14 });
  return Buffer.from(await doc.save());
}

const binary = (res: any, cb: (err: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on('data', (c: Buffer) => chunks.push(c));
  res.on('end', () => cb(null, Buffer.concat(chunks)));
};

const FACTS = {
  operatorName: 'Les Cèdres SAS',
  parkingName: 'Parking des Cèdres',
  parkingAddress: '1 route de l’aéroport',
  customerName: 'Camille Martin',
  plate: 'AB-123-CD',
  vehicle: 'Peugeot 308',
  arrivalAt: '2027-03-01T06:30',
  returnAt: '2027-03-03T15:05',
  priceCents: 8900,
  keysEntrusted: true,
  paidOnline: true,
};
const TEMPLATE = { id: 't1', title: 'Contrat des Cèdres', version: 3, pageCount: 2, sha256: 'a'.repeat(64) };

describe('le contrat du parking (domaine)', () => {
  it('lie la signature au PDF du parking par son empreinte', () => {
    const doc = templateDocument(FACTS, TEMPLATE);
    expect(doc.title).toBe('Contrat de stationnement · Parking des Cèdres');
    expect(doc.summary.at(-1)).toBe(`Contrat : « Contrat des Cèdres », version 3 (2 pages), empreinte SHA-256 ${'a'.repeat(64)}`);
    expect(doc.clauses[0]).toContain('version 3, 2 pages');
    expect(doc.clauses[0]).toContain('a'.repeat(64));
    expect(doc.clauses).toHaveLength(3);
    expect(templateVersion(3)).toBe('pdf-3');
    expect(signedFileNames('PLZ-7K2M')).toEqual({ signed: 'contrat-PLZ-7K2M-signe.pdf', proof: 'preuve-signature-PLZ-7K2M.pdf' });
  });

  it('construit le PDF signé (contrat du parking + page de signature) et la preuve', async () => {
    const doc = templateDocument(FACTS, TEMPLATE);
    const facts = {
      productName: 'Plazo',
      bookingReference: 'PLZ-7K2M',
      parkingTimeZone: 'Europe/Paris',
      signedAtLocal: '2027-03-01T06:34',
      signedAt: new Date('2027-03-01T05:34:00Z'),
      signerName: 'Camille Martin',
      method: 'handwritten' as const,
      device: 'staff_device' as const,
      phoneMasked: null,
      witnessName: 'Karim',
      strokes: STROKES,
      textSha256: 'b'.repeat(64),
      proofSha256: 'c'.repeat(64),
      template: TEMPLATE,
    };
    const { signed, signedSha256, proof } = await buildSignedContractPdf(await samplePdf(2), doc, facts);
    expect((await PDFDocument.load(signed)).getPageCount()).toBe(3);
    expect((await PDFDocument.load(proof)).getPageCount()).toBe(1);
    expect(signedSha256).toMatch(/^[0-9a-f]{64}$/);
    // Plazo's template laid out when the parking has no PDF: the text, then the signature page.
    const plazo = await buildSignedContractPdf(null, doc, { ...facts, template: null, strokes: null });
    expect((await PDFDocument.load(plazo.signed)).getPageCount()).toBeGreaterThanOrEqual(2);
  });
});

describe('le contrat du parking (API)', () => {
  let stripe: ReturnType<typeof enableFakePayments>;
  let memory: MemoryPhotoBackend;
  let emails: any[];

  beforeEach(async () => {
    await resetDatabase();
    const notifications = Container.get(NotificationService);
    notifications.settings.apiKey = 'brevo-test';
    notifications.settings.emailFrom = 'Plazo <bonjour@example.com>';
    stripe = enableFakePayments();
    emails = [];
    jest.spyOn(global, 'fetch').mockImplementation(async (_url, init) => {
      emails.push(JSON.parse(String(init?.body ?? '{}')));
      return new Response('{}', { status: 201 });
    });
    memory = new MemoryPhotoBackend();
    Container.get(PhotoStorageService).backend = memory;
    jest.spyOn(Container.get(SmsService), 'sendSignatureCode').mockResolvedValue(true);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    disableFakePayments();
    Container.get(NotificationService).settings.apiKey = '';
  });
  afterAll(() => prisma.$disconnect());

  async function setup() {
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
        services: ['shuttle', 'valet'],
        cancellationPolicy: 'free_24h',
        photos: [],
      });
    await publishListing(op.parking.id);
    return op;
  }

  async function book(op: Awaited<ReturnType<typeof setupOperator>>, name = 'Camille Martin', plate = 'ab123cd') {
    const res = await api()
      .post('/api/public/bookings')
      .send({
        airport: 'lyon-saint-exupery',
        parking: `parking-${op.parking.id}`,
        arrivalAt: '2027-03-01T06:30',
        returnAt: '2027-03-03T15:05',
        customerName: name,
        customerPhone: '06 12 34 56 78',
        customerEmail: `${plate}@example.com`,
        plate,
        passengers: 2,
        acceptTerms: true,
      });
    expect([res.status, res.body.code]).toEqual([201, undefined]);
    await payBooking(res.body.reference, res.body.manageToken, stripe.sessions);
    const id = (await prisma.reservation.findUniqueOrThrow({ where: { reference: res.body.reference } })).id;
    return { reference: res.body.reference as string, token: res.body.manageToken as string, id };
  }

  const upload = (token: string, pdf: Buffer, title = 'Contrat des Cèdres', fileName = 'contrat cedres.pdf') =>
    api()
      .post(`/api/internal/contract-template?${new URLSearchParams({ fileName, title })}`)
      .set(auth(token))
      .set('Content-Type', 'application/pdf')
      .send(pdf);

  it('dépose le PDF du parking, le remplace, revient au modèle Plazo ; refuse un fichier qui n’est pas un PDF', async () => {
    const op = await setup();
    const none = await api().get('/api/internal/contract-template').set(auth(op.token));
    expect(none.body).toEqual({ current: null, history: [], plazoSignedCount: 0 });

    const bad = await upload(op.token, Buffer.from('bonjour'));
    expect([bad.status, bad.body.fields]).toEqual([400, { file: 'not_a_pdf' }]);

    const v1 = await upload(op.token, await samplePdf(2));
    expect(v1.status).toBe(201);
    expect(v1.body.current).toMatchObject({
      version: 1,
      title: 'Contrat des Cèdres',
      fileName: 'contrat-cedres.pdf',
      pageCount: 2,
      signedCount: 0,
      retiredAt: null,
    });
    expect(v1.body.current.uploadedBy).toBe('Gérant Test');

    const v2 = await upload(op.token, await samplePdf(4), 'Contrat des Cèdres 2027');
    expect(v2.body.current).toMatchObject({ version: 2, pageCount: 4 });
    expect(v2.body.history).toHaveLength(1);
    expect(v2.body.history[0]).toMatchObject({ version: 1 });
    expect(v2.body.history[0].retiredAt).toBeTruthy();

    // The PDF of a version, bit for bit.
    const file = await api().get(`/api/internal/contract-template/${v2.body.history[0].id}/file`).set(auth(op.token)).buffer().parse(binary);
    expect(file.status).toBe(200);
    expect(file.headers['content-type']).toBe('application/pdf');
    expect((await PDFDocument.load(file.body)).getPageCount()).toBe(2);

    const back = await api().post('/api/internal/contract-template/revert').set(auth(op.token));
    expect(back.body.current).toBeNull();
    expect(back.body.history).toHaveLength(2);
    expect((await api().post('/api/internal/contract-template/revert').set(auth(op.token))).body.code).toBe('no_template');

    // Another operator sees nothing of it; a non-manager neither.
    const other = await setupOperator('Autre');
    expect((await api().get('/api/internal/contract-template').set(auth(other.token))).body.history).toEqual([]);
    expect((await api().get(`/api/internal/contract-template/${v2.body.history[0].id}/file`).set(auth(other.token))).status).toBe(404);
  });

  it('le voyageur signe le PDF du parking : PDF signé, preuve, copie jointe, registre et export', async () => {
    const op = await setup();
    const v1 = await upload(op.token, await samplePdf(2));
    const b = await book(op);

    // Before the signature: the document binds to the PDF in force, which the traveller can open.
    const before = await api().get(`/api/public/bookings/${b.reference}/paperwork`).set(bookingToken(b.token));
    expect(before.body.contract.template).toMatchObject({ title: 'Contrat des Cèdres', version: 1, pageCount: 2 });
    expect(before.body.contract.document.clauses[0]).toContain('« Contrat des Cèdres »');
    expect(before.body.contract.files).toEqual({ template: true, signed: false, proof: false });
    // Not signed yet: no file but the template.
    expect((await api().get(`/api/public/bookings/${b.reference}/contract/file?kind=signed`).set(bookingToken(b.token))).status).toBe(404);

    const signed = await api().post(`/api/internal/reservations/${b.id}/contract/sign`).set(auth(op.token)).send({ strokes: STROKES });
    expect(signed.status).toBe(200);
    expect(signed.body.contract.signed).toMatchObject({ version: 'pdf-1', method: 'handwritten' });
    expect(signed.body.contract.signed.signedSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(signed.body.contract.files).toEqual({ template: true, signed: true, proof: true });
    const row = await prisma.reservationContract.findUniqueOrThrow({ where: { reservationId: b.id } });
    expect(row.templateId).toBe(v1.body.current.id);
    expect(row.text).toBe(contractText(signed.body.contract.document));

    // The signed PDF: the parking's 2 pages plus the signature page; the proof alone.
    const pdf = await api().get(`/api/internal/reservations/${b.id}/contract/file?kind=signed`).set(auth(op.token)).buffer().parse(binary);
    expect(pdf.status).toBe(200);
    expect(pdf.headers['content-disposition']).toContain(`contrat-${b.reference}-signe.pdf`);
    expect((await PDFDocument.load(pdf.body)).getPageCount()).toBe(3);
    const proof = await api().get(`/api/public/bookings/${b.reference}/contract/file?kind=proof`).set(bookingToken(b.token)).buffer().parse(binary);
    expect((await PDFDocument.load(proof.body)).getPageCount()).toBe(1);
    const template = await api()
      .get(`/api/public/bookings/${b.reference}/contract/file?kind=template`)
      .set(bookingToken(b.token))
      .buffer()
      .parse(binary);
    expect((await PDFDocument.load(template.body)).getPageCount()).toBe(2);
    expect((await api().get(`/api/public/bookings/${b.reference}/contract/file?kind=signed`).set(bookingToken('nope'))).status).toBe(404);
    expect((await api().get(`/api/internal/reservations/${b.id}/contract/file?kind=nope`).set(auth(op.token))).status).toBe(400);

    // The emailed copy carries the signed PDF.
    const copy = emails.find(e => e.tags?.includes('contract_signed'));
    expect(copy.attachment).toEqual([{ name: `contrat-${b.reference}-signe.pdf`, content: expect.any(String) }]);
    expect(copy.textContent).toContain('Le contrat signé est joint');

    // A new version afterwards: the signed contract stays on v1 (count), the next traveller signs v2.
    const v2 = await upload(op.token, await samplePdf(1), 'Contrat 2027');
    expect(v2.body.history[0]).toMatchObject({ version: 1, signedCount: 1 });
    const b2 = await book(op, 'Louis Leroy', 'ef456gh');
    const s2 = await api().post(`/api/internal/reservations/${b2.id}/contract/sign`).set(auth(op.token)).send({ strokes: STROKES });
    expect(s2.body.contract.signed.version).toBe('pdf-2');

    // The register: the latest first, searchable, exportable.
    const register = await api().get('/api/internal/contracts').set(auth(op.token));
    expect(register.status).toBe(200);
    expect(register.body).toMatchObject({ total: 2, reservedCount: 0, page: 1, totalPages: 1 });
    expect(register.body.data.map((r: any) => r.customerName)).toEqual(['Louis Leroy', 'Camille Martin']);
    expect(register.body.data[1]).toMatchObject({
      reference: b.reference,
      plate: 'AB-123-CD',
      method: 'handwritten',
      witnessName: 'Gérant',
      version: 'pdf-1',
      templateVersion: 1,
      files: { template: true, signed: true, proof: true },
      reserved: false,
    });
    const search = await api().get('/api/internal/contracts?q=ef-456').set(auth(op.token));
    expect(search.body.data.map((r: any) => r.plate)).toEqual(['EF-456-GH']);
    const csv = await api().get('/api/internal/contracts/export').set(auth(op.token));
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.text.startsWith('﻿"Signé le";"Référence"')).toBe(true);
    expect(csv.text.split('\r\n').filter(Boolean)).toHaveLength(3);
    // A non-manager has no register; another operator an empty one.
    const other = await setupOperator('Autre');
    expect((await api().get('/api/internal/contracts').set(auth(other.token))).body.total).toBe(0);
  });

  it('sans PDF du parking, le modèle Plazo est mis en page et signé ; la copie reste si le stockage manque', async () => {
    const op = await setup();
    const b = await book(op);
    const signed = await api().post(`/api/internal/reservations/${b.id}/contract/sign`).set(auth(op.token)).send({ strokes: STROKES });
    expect(signed.body.contract.signed.version).toBe('2026-10-19');
    expect(signed.body.contract.template).toBeNull();
    expect(signed.body.contract.files).toEqual({ template: false, signed: true, proof: true });
    const pdf = await api().get(`/api/internal/reservations/${b.id}/contract/file?kind=signed`).set(auth(op.token)).buffer().parse(binary);
    expect((await PDFDocument.load(pdf.body)).getPageCount()).toBeGreaterThanOrEqual(2);
    expect((await api().get(`/api/internal/reservations/${b.id}/contract/file?kind=template`).set(auth(op.token))).status).toBe(404);

    // Without a file store: the text and its proof are kept, no PDF, the signature goes through.
    Container.get(PhotoStorageService).backend = null;
    const b2 = await book(op, 'Louis Leroy', 'ef456gh');
    const s2 = await api().post(`/api/internal/reservations/${b2.id}/contract/sign`).set(auth(op.token)).send({ strokes: STROKES });
    expect(s2.status).toBe(200);
    expect(s2.body.contract.files).toEqual({ template: false, signed: false, proof: false });
    expect((await api().get('/api/internal/contract-template').set(auth(op.token))).body.plazoSignedCount).toBe(2);
  });
});
