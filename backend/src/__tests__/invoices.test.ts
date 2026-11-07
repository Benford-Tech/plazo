import { PDFDocument } from 'pdf-lib';
import { Container } from 'typedi';
import prisma from '@/database';
import { manageToken } from '@/domain/booking';
import { billingMissing, invoiceLines, invoiceNumber, readBillingInput, splitVat } from '@/domain/invoice';
import { NotificationService } from '@/services/notification.service';
import { MemoryPhotoBackend, PhotoStorageService } from '@/services/photo-storage.service';
import { PushService } from '@/services/push.service';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

/** 06/11/2026 (« une facture au nom du parking avec son logo », direction A). */

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

const BILLING = {
  legalName: 'SAS Parking des Cèdres',
  address: '12 route de l’Aéroport\n69125 Colombier-Saugnieu',
  siret: '123 456 789 00012',
  vatNumber: 'FR 12 123456789',
  vatRatePercent: 20,
  mention: 'Conditions générales sur le site du parking.',
};

async function bookingOf(token: string, overrides: Record<string, unknown> = {}) {
  const res = await api()
    .post('/api/internal/reservations')
    .set(auth(token))
    .send({
      channel: 'phone',
      arrivalAt: '2026-11-12T08:30',
      returnAt: '2026-11-19T18:00',
      passengers: 2,
      customerFirstName: 'Julie',
      customerLastName: 'Martin',
      customerPhone: '06 12 34 56 78',
      customerEmail: 'julie.martin@example.fr',
      plate: 'AB-123-CD',
      priceCents: 5400,
      paymentMethod: 'card',
      ...overrides,
    });
  expect(res.status).toBe(201);
  return res.body.data.id as string;
}

describe('règles', () => {
  it('sépare la TVA d’un prix TTC au centime', () => {
    expect(splitVat(5400, 2000)).toEqual({ htCents: 4500, vatCents: 900 });
    expect(splitVat(1000, 2000)).toEqual({ htCents: 833, vatCents: 167 });
    expect(splitVat(1000, 0)).toEqual({ htCents: 1000, vatCents: 0 });
    const t = invoiceLines(
      [
        { label: 'Séjour', detail: null, totalTtcCents: 5400 },
        { label: 'Lavage', detail: null, totalTtcCents: 5000 },
      ],
      2000,
    );
    expect(t).toMatchObject({ totalTtcCents: 10400, totalHtCents: 4500 + 4167, vatCents: 10400 - 8667 });
  });

  it('numérote et lit les réglages', () => {
    expect(invoiceNumber('invoice', 'F', 2026, 42)).toBe('F-2026-0042');
    expect(invoiceNumber('credit_note', 'F', 2026, 3)).toBe('A-2026-0003');
    const { changes, errors } = readBillingInput({ siret: '123 456 789 00012', vatNumber: 'fr12 123456789', vatRatePercent: '5,5', prefix: 'apl' });
    expect(errors).toEqual({});
    expect(changes).toEqual({ siret: '12345678900012', vatNumber: 'FR12123456789', vatRateBp: 550, prefix: 'APL' });
    expect(readBillingInput({ siret: '123', vatNumber: '12', prefix: 'TROP-LONG' }).errors).toEqual({
      siret: 'invalid',
      vatNumber: 'invalid',
      prefix: 'invalid',
    });
    const base = { legalName: 'SAS', address: null, siret: '1', vatNumber: null, vatExempt: false, vatRateBp: 2000, mention: null, prefix: 'F' };
    expect(billingMissing(base, '1 rue du Parking')).toEqual(['vatNumber']);
    expect(billingMissing({ ...base, vatExempt: true }, null)).toEqual(['address']);
  });
});

describe('factures d’une réservation', () => {
  let memory: MemoryPhotoBackend;
  const notifications = Container.get(NotificationService);
  let sent: { to: string; subject: string; attachment: string | null }[];
  const original = notifications.emailTraveller.bind(notifications);

  beforeEach(() => {
    memory = new MemoryPhotoBackend();
    Container.get(PhotoStorageService).backend = memory;
    sent = [];
    notifications.emailTraveller = async (to, _tag, _about, message, attachments = []) => {
      sent.push({ to: to.email, subject: message.subject, attachment: attachments[0]?.name ?? null });
      return true;
    };
  });
  afterAll(() => {
    notifications.emailTraveller = original;
  });

  it('refuse tant que les informations de facturation manquent, puis émet, envoie et annule par un avoir', async () => {
    const op = await setupOperator();
    const id = await bookingOf(op.token);

    let res = await api().get(`/api/internal/reservations/${id}/invoices`).set(auth(op.token));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ canCreate: false, refusal: 'billing_incomplete', invoices: [] });
    expect(res.body.billing.missing).toEqual(expect.arrayContaining(['legalName', 'siret', 'vatNumber']));
    expect((await api().post(`/api/internal/reservations/${id}/invoices`).set(auth(op.token)).send({})).body.code).toBe('billing_incomplete');

    res = await api().put('/api/internal/billing/settings').set(auth(op.token)).send(BILLING);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ complete: true, siret: '12345678900012', vatNumber: 'FR12123456789', vatRatePercent: 20 });

    // A preview is not numbered and not kept.
    const preview = await api().get(`/api/internal/reservations/${id}/invoices/preview`).set(auth(op.token)).buffer(true);
    expect(preview.status).toBe(200);
    expect(preview.headers['content-type']).toBe('application/pdf');
    expect(await prisma.invoice.count()).toBe(0);

    res = await api().post(`/api/internal/reservations/${id}/invoices`).set(auth(op.token)).send({ customerCompany: 'ACME SARL' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ canCreate: false, refusal: 'invoice_exists' });
    const year = new Date().getFullYear();
    const [invoice] = res.body.invoices;
    expect(invoice).toMatchObject({ kind: 'invoice', number: `F-${year}-0001`, totalTtcCents: 5400, sentAt: null, creditedBy: null });
    expect(invoice.customer).toMatchObject({ name: 'Julie Martin', company: 'ACME SARL', email: 'julie.martin@example.fr' });
    const row = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(row).toMatchObject({ totalHtCents: 4500, vatCents: 900, vatRateBp: 2000, paidBy: 'card' });
    expect(await prisma.auditLog.count({ where: { action: 'invoice.created' } })).toBe(1);

    // A second invoice is refused while the first stands.
    expect((await api().post(`/api/internal/reservations/${id}/invoices`).set(auth(op.token)).send({})).body.code).toBe('invoice_exists');

    // The PDF is the one issued, a real one-page PDF.
    const pdf = await api().get(`/api/internal/invoices/${invoice.id}/pdf`).set(auth(op.token)).buffer(true);
    expect(pdf.status).toBe(200);
    expect(pdf.headers['content-disposition']).toContain(`Facture-F-${year}-0001.pdf`);
    expect((await PDFDocument.load(pdf.body)).getPageCount()).toBe(1);

    res = await api().post(`/api/internal/invoices/${invoice.id}/send`).set(auth(op.token)).send({});
    expect(res.status).toBe(200);
    expect(res.body.sentTo).toBe('julie.martin@example.fr');
    expect(sent).toEqual([
      { to: 'julie.martin@example.fr', subject: expect.stringContaining(`F-${year}-0001`), attachment: `Facture-F-${year}-0001.pdf` },
    ]);

    // A credit note cancels it; a new invoice can then be issued, with the next number.
    res = await api().post(`/api/internal/invoices/${invoice.id}/credit-note`).set(auth(op.token)).send({});
    expect(res.status).toBe(201);
    expect(res.body.canCreate).toBe(true);
    const credit = res.body.invoices.find((i: { kind: string }) => i.kind === 'credit_note');
    expect(credit).toMatchObject({ number: `A-${year}-0001`, totalTtcCents: -5400, creditOf: `F-${year}-0001` });
    expect(res.body.invoices.find((i: { id: string }) => i.id === invoice.id).creditedBy).toBe(`A-${year}-0001`);
    expect((await api().post(`/api/internal/invoices/${invoice.id}/credit-note`).set(auth(op.token)).send({})).body.code).toBe('already_credited');
    expect((await api().post(`/api/internal/invoices/${credit.id}/credit-note`).set(auth(op.token)).send({})).body.code).toBe('not_invoice');

    res = await api().post(`/api/internal/reservations/${id}/invoices`).set(auth(op.token)).send({});
    expect(res.body.invoices[0].number).toBe(`F-${year}-0002`);
  });

  it('numérote sans trou par loueur, refuse sans prix ou annulée, et reste chez son loueur', async () => {
    const op = await setupOperator();
    await api()
      .put('/api/internal/billing/settings')
      .set(auth(op.token))
      .send({ ...BILLING, vatNumber: null, vatExempt: true, prefix: 'APL' });
    const first = await bookingOf(op.token);
    const second = await bookingOf(op.token, { plate: 'EF-456-GH', customerEmail: null });
    const noPrice = await bookingOf(op.token, { plate: 'IJ-789-KL', priceCents: null });

    const [a, b] = await Promise.all([
      api().post(`/api/internal/reservations/${first}/invoices`).set(auth(op.token)).send({}),
      api().post(`/api/internal/reservations/${second}/invoices`).set(auth(op.token)).send({}),
    ]);
    const year = new Date().getFullYear();
    expect([a.body.invoices[0].number, b.body.invoices[0].number].sort()).toEqual([`APL-${year}-0001`, `APL-${year}-0002`]);
    // Exempt: no VAT.
    expect((await prisma.invoice.findFirstOrThrow({ where: { reservationId: first } })).vatCents).toBe(0);

    expect((await api().post(`/api/internal/reservations/${noPrice}/invoices`).set(auth(op.token)).send({})).body.code).toBe('no_price');
    // No e-mail on the booking: one must be given.
    const bInvoice = b.body.invoices[0].id;
    expect((await api().post(`/api/internal/invoices/${bInvoice}/send`).set(auth(op.token)).send({})).body.code).toBe('no_email');
    expect((await api().post(`/api/internal/invoices/${bInvoice}/send`).set(auth(op.token)).send({ email: 'autre@example.fr' })).status).toBe(200);

    // Another operator sees nothing; a driver cannot invoice.
    const other = await setupOperator('Autre');
    expect((await api().get(`/api/internal/invoices/${bInvoice}/pdf`).set(auth(other.token))).status).toBe(404);
    expect((await api().get(`/api/internal/reservations/${first}/invoices`).set(auth(other.token))).status).toBe(404);
    const driver = await addStaff(op.token, 'driver');
    expect((await api().post(`/api/internal/reservations/${first}/invoices`).set(auth(driver.token)).send({})).status).toBe(403);
    expect((await api().put('/api/internal/billing/settings').set(auth(driver.token)).send(BILLING)).status).toBe(403);
  });

  it('refuse une réservation annulée', async () => {
    const op = await setupOperator();
    await api().put('/api/internal/billing/settings').set(auth(op.token)).send(BILLING);
    const id = await bookingOf(op.token);
    await prisma.reservation.update({ where: { id }, data: { status: 'cancelled' } });
    expect((await api().get(`/api/internal/reservations/${id}/invoices`).set(auth(op.token))).body.refusal).toBe('reservation_cancelled');
  });

  it('le voyageur voit ses factures, demande la sienne, et l’équipe la crée avec ce qu’il a donné', async () => {
    const op = await setupOperator();
    await api().put('/api/internal/billing/settings').set(auth(op.token)).send(BILLING);
    await api()
      .put('/api/internal/pricing')
      .set(auth(op.token))
      .send({
        tiers: [
          { days: 1, priceCents: 1500 },
          { days: 7, priceCents: 5900 },
        ],
        extraDayPriceCents: 600,
      });
    const listing = await api()
      .put('/api/internal/listing')
      .set(auth(op.token))
      .send({
        airportCode: 'LYS',
        slug: 'parking-facture',
        title: 'Parking Facture',
        services: ['shuttle'],
        shuttleMinutes: 8,
        openingHours: '24h/24',
        contactPhone: '04 72 00 00 00',
        cancellationPolicy: 'free_24h',
        photos: [],
      });
    expect(listing.status).toBe(200);
    const day = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 16);
    const id = await bookingOf(op.token, { arrivalAt: day(2), returnAt: day(9) });
    const row = await prisma.reservation.findUniqueOrThrow({ where: { id } });
    const ref = row.reference;
    const tok = { 'x-booking-token': manageToken(id, process.env.SECRET_KEY!, row.manageTokenVersion) };

    const push = Container.get(PushService);
    const staffPushes: string[] = [];
    const travellerPushes: string[] = [];
    const originalStaff = push.notifyStaff.bind(push);
    const originalTraveller = push.notifyTravellers.bind(push);
    push.notifyStaff = async (_op, _aud, message) => (staffPushes.push(message.title), 0);
    push.notifyTravellers = async (_ids, message) => (travellerPushes.push(message.title), 0);
    try {
      expect((await api().get(`/api/public/bookings/${ref}/invoices`)).status).toBe(404);
      let res = await api().get(`/api/public/bookings/${ref}/invoices`).set(tok);
      expect(res.body).toEqual({ invoices: [], request: null, canRequest: true, refusal: null });

      res = await api()
        .post(`/api/public/bookings/${ref}/invoices/request`)
        .set(tok)
        .send({ company: 'ACME SARL', address: '4 rue Garibaldi, 69006 Lyon' });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ canRequest: false, refusal: 'already_requested', request: { company: 'ACME SARL' } });
      expect(staffPushes).toEqual(['Facture demandée']);
      expect((await api().post(`/api/public/bookings/${ref}/invoices/request`).set(tok).send({})).body.code).toBe('already_requested');
      expect(await prisma.auditLog.count({ where: { action: 'invoice.requested' } })).toBe(1);

      // The team sees the request (sheet and dashboard), and the invoice takes its company and address.
      res = await api().get(`/api/internal/reservations/${id}/invoices`).set(auth(op.token));
      expect(res.body.request).toMatchObject({ company: 'ACME SARL', address: '4 rue Garibaldi, 69006 Lyon' });
      const dash = await api().get('/api/internal/dashboard').set(auth(op.token));
      expect(dash.body.alerts.filter((a: { kind: string }) => a.kind === 'invoice_requested')).toHaveLength(1);

      res = await api().post(`/api/internal/reservations/${id}/invoices`).set(auth(op.token)).send({});
      expect(res.status).toBe(201);
      expect(res.body.request).toBeNull();
      const [invoice] = res.body.invoices;
      expect(invoice.customer).toMatchObject({ company: 'ACME SARL', address: '4 rue Garibaldi, 69006 Lyon' });
      expect(invoice.sentTo).toBe('julie.martin@example.fr');
      expect(sent).toHaveLength(1);
      expect(travellerPushes).toEqual(['Votre facture est prête']);
      const after = await api().get('/api/internal/dashboard').set(auth(op.token));
      expect(after.body.alerts.some((a: { kind: string }) => a.kind === 'invoice_requested')).toBe(false);

      // The traveller finds it and opens its PDF; never another booking's.
      res = await api().get(`/api/public/bookings/${ref}/invoices`).set(tok);
      expect(res.body).toMatchObject({ canRequest: false, refusal: 'invoice_exists', request: null });
      expect(res.body.invoices[0]).toMatchObject({ number: invoice.number, issuer: op.operator.name, totalTtcCents: 5400 });
      expect(res.body.invoices[0].customer).toBeUndefined();
      const pdf = await api().get(`/api/public/bookings/${ref}/invoices/${invoice.id}/pdf`).set(tok).buffer(true);
      expect(pdf.status).toBe(200);
      expect(pdf.headers['content-type']).toBe('application/pdf');
      const other = await bookingOf(op.token, { plate: 'ZZ-999-ZZ', arrivalAt: day(3), returnAt: day(5) });
      const otherRow = await prisma.reservation.findUniqueOrThrow({ where: { id: other } });
      const otherTok = { 'x-booking-token': manageToken(other, process.env.SECRET_KEY!, otherRow.manageTokenVersion) };
      expect((await api().get(`/api/public/bookings/${otherRow.reference}/invoices/${invoice.id}/pdf`).set(otherTok)).status).toBe(404);
    } finally {
      push.notifyStaff = originalStaff;
      push.notifyTravellers = originalTraveller;
    }
  });
});
