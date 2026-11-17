import { PDFDocument } from 'pdf-lib';
import prisma from '@/database';
import { agreementDocument, AgreementFacts, agreementText, buildAgreementPdf, checkSignRequest, textSha256 } from '@/domain/plazo-agreements';
import { api, publishListing, resetDatabase, setupOperator } from './utils/helpers';

// 17/11/2026, « Il faut un contrat pour publier des annonces et un contrat d'utilisation de Plazo Pro » (choice C).
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const binary = (res: any, cb: (err: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on('data', (c: Buffer) => chunks.push(c));
  res.on('end', () => cb(null, Buffer.concat(chunks)));
};

const facts = (over: Partial<AgreementFacts> = {}): AgreementFacts => ({
  productName: 'Plazo',
  supportEmail: 'contact@plazo.fr',
  siteUrl: 'https://www.plazo.fr',
  company: {
    name: 'Benford Tech',
    legalForm: 'société par actions simplifiée',
    address: '29 chemin des Collines',
    registration: '910 729 102 RCS Vienne',
    vatNumber: 'FR55910729102',
  },
  operator: { name: 'APL Parking', legalName: 'APL SAS', address: '1 rue du Parking, Colombier', siret: '12345678901234', vatNumber: null },
  commissionBps: 1500,
  payoutSchedule: 'AFTER_STAY',
  plan: { id: 'operations', yearly: false },
  ...over,
});

describe('les contrats Plazo (domaine)', () => {
  it('remplit les textes avec les chiffres du loueur', () => {
    const terms = agreementText(agreementDocument('pro_terms', facts()));
    expect(terms).toContain('APL SAS, exploitant le parking « APL Parking »');
    expect(terms).toContain('SIRET 12345678901234');
    expect(terms).toContain('formule Opérations, au mois : 199 € HT par mois');
    expect(terms).toContain('article 28');
    expect(agreementText(agreementDocument('pro_terms', facts({ plan: { id: 'operations', yearly: true } })))).toContain(
      '179 € HT par mois (remise de 10 % sur le prix mensuel de 199 € HT), soit 2 148 € HT par an',
    );
    expect(agreementText(agreementDocument('pro_terms', facts({ plan: null })))).toContain('ceux du devis accepté');

    const listing = agreementText(agreementDocument('listing', facts({ commissionBps: 1250, payoutSchedule: 'WEEKLY' })));
    expect(listing).toContain('commission de 12,5 % du montant payé');
    expect(listing).toContain('le lundi qui suit la semaine');
    expect(listing).toContain("Mandat d'encaissement");
    expect(listing).toContain('2019/1150');
  });

  it("change d'empreinte quand un chiffre change", () => {
    const a = textSha256(agreementDocument('listing', facts()));
    expect(textSha256(agreementDocument('listing', facts()))).toBe(a);
    expect(textSha256(agreementDocument('listing', facts({ commissionBps: 1600 })))).not.toBe(a);
  });

  it('lit la demande de signature', () => {
    expect(checkSignRequest({ signerName: ' Joanny  Simpore ', kinds: ['pro_terms'], read: { pro_terms: 'x' } })).toEqual({
      ok: true,
      value: { name: 'Joanny Simpore', kinds: ['pro_terms'], read: { pro_terms: 'x' } },
    });
    expect(checkSignRequest({ signerName: 'Joanny', kinds: [] })).toEqual({ ok: false, fields: { signerName: 'full_name', kinds: 'required' } });
    expect(checkSignRequest({ signerName: 'Joanny Simpore', kinds: ['autre'] })).toEqual({ ok: false, fields: { kinds: 'invalid' } });
    expect(checkSignRequest({ signerName: 'Joanny Simpore', kinds: ['listing'], read: {} })).toEqual({ ok: false, fields: { read: 'required' } });
  });

  it('fait un PDF lisible, avec la page de signature', async () => {
    const doc = agreementDocument('pro_terms', facts());
    const unsigned = await buildAgreementPdf(doc, 'Plazo');
    expect(unsigned.proof).toBeNull();
    const signed = await buildAgreementPdf(doc, 'Plazo', {
      id: 'agr1',
      operatorName: 'APL SAS',
      signerName: 'Joanny Simpore',
      signerEmail: 'j@example.com',
      signedAt: new Date('2026-11-17T10:00:00Z'),
      ip: '1.2.3.4',
      userAgent: 'Test',
      textSha256: textSha256(doc),
    });
    const pages = (await PDFDocument.load(signed.pdf)).getPageCount();
    expect(pages).toBe((await PDFDocument.load(unsigned.pdf)).getPageCount() + 1);
    expect((await PDFDocument.load(signed.proof as Buffer)).getPageCount()).toBe(1);
  });
});

describe('les contrats Plazo (API)', () => {
  beforeEach(resetDatabase);
  afterEach(() => {
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });
  afterAll(() => prisma.$disconnect());

  it('montre les deux contrats, les fait signer ensemble et garde les PDF', async () => {
    const admin = await setupOperator('Plazo (tests)');
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    const op = await setupOperator('Parking Alpha');

    // The platform sets the plan; the terms of use read it.
    expect(
      (await api().put(`/api/internal/platform/operators/${op.operator.id}/pro-plan`).set(auth(op.token)).send({ plan: 'complet' })).status,
    ).toBe(403);
    expect(
      (await api().put(`/api/internal/platform/operators/${op.operator.id}/pro-plan`).set(auth(admin.token)).send({ plan: 'luxe' })).body.fields,
    ).toEqual({ plan: 'invalid' });
    const planned = await api()
      .put(`/api/internal/platform/operators/${op.operator.id}/pro-plan`)
      .set(auth(admin.token))
      .send({ plan: 'complet', yearly: true });
    expect(planned.status).toBe(200);
    expect(planned.body.plan).toEqual({ id: 'complet', yearly: true });

    let view = await api().get('/api/internal/agreements').set(auth(op.token));
    expect(view.status).toBe(200);
    // No listing sent yet: only the terms of use are asked for.
    expect(view.body).toMatchObject({ sellsOnPlazo: false, toSign: ['pro_terms'], canSign: true });
    const terms = view.body.agreements.find((a: any) => a.kind === 'pro_terms');
    expect(terms.articles.map((a: any) => a.paragraphs.join(' ')).join(' ')).toContain("formule Complet, à l'année : 359 € HT");

    await api()
      .put('/api/internal/listing')
      .set(auth(op.token))
      .send({
        airportCode: 'LYS',
        slug: 'parking-alpha',
        title: 'Parking Alpha LYS',
        services: ['shuttle'],
        shuttleMinutes: 8,
        openingHours: '24h/24',
        contactPhone: '04 72 00 00 00',
        cancellationPolicy: 'free_24h',
        photos: [],
      });
    await publishListing(op.parking.id);
    view = await api().get('/api/internal/agreements').set(auth(op.token));
    expect(view.body.toSign).toEqual(['pro_terms', 'listing']);
    const read = Object.fromEntries(view.body.agreements.map((a: any) => [a.kind, a.textSha256]));

    const preview = await api().get('/api/internal/agreements/preview/listing').set(auth(op.token)).buffer(true).parse(binary);
    expect(preview.headers['content-type']).toBe('application/pdf');
    expect(preview.body.subarray(0, 5).toString()).toBe('%PDF-');

    // View-as reads, never signs.
    const viewAs = await api().post(`/api/internal/platform/operators/${op.operator.id}/view-as`).set(auth(admin.token));
    const viewToken = viewAs.body.access.token as string;
    expect((await api().get('/api/internal/agreements').set(auth(viewToken))).body.canSign).toBe(false);
    expect(
      (
        await api()
          .post('/api/internal/agreements/sign')
          .set(auth(viewToken))
          .send({ signerName: 'Joanny Simpore', kinds: ['pro_terms'], read })
      ).body.code,
    ).toBe('view_as_cannot_sign');

    // A text read before a figure changed is refused.
    expect(
      (
        await api()
          .post('/api/internal/agreements/sign')
          .set(auth(op.token))
          .send({ signerName: 'Gérant Test', kinds: ['listing'], read: { listing: 'ancien' } })
      ).body.code,
    ).toBe('text_changed');

    const signed = await api()
      .post('/api/internal/agreements/sign')
      .set(auth(op.token))
      .set('User-Agent', 'Navigateur de test')
      .send({ signerName: 'Gérant Test', kinds: ['pro_terms', 'listing'], read });
    expect(signed.status).toBe(200);
    expect(signed.body.toSign).toEqual([]);
    const listing = signed.body.agreements.find((a: any) => a.kind === 'listing');
    expect(listing.signed).toMatchObject({ signerName: 'Gérant Test', textSha256: read.listing });

    expect(
      (
        await api()
          .post('/api/internal/agreements/sign')
          .set(auth(op.token))
          .send({ signerName: 'Gérant Test', kinds: ['listing'], read })
      ).body.code,
    ).toBe('already_signed');

    const file = await api().get(`/api/internal/agreements/${listing.signed.id}/file?kind=signed`).set(auth(op.token)).buffer(true).parse(binary);
    expect(file.status).toBe(200);
    expect(file.headers['content-disposition']).toContain('contrat-diffusion-annonces-');
    const proof = await api().get(`/api/internal/agreements/${listing.signed.id}/file?kind=proof`).set(auth(op.token)).buffer(true).parse(binary);
    expect((await PDFDocument.load(proof.body)).getPageCount()).toBe(1);

    // Another operator never reads it; the platform does.
    const other = await setupOperator('Autre');
    expect((await api().get(`/api/internal/agreements/${listing.signed.id}/file`).set(auth(other.token))).status).toBe(404);
    const platform = await api().get(`/api/internal/platform/operators/${op.operator.id}/agreements`).set(auth(admin.token));
    expect(platform.body.toSign).toEqual([]);
    expect(await prisma.auditLog.count({ where: { action: 'plazo_agreement.signed' } })).toBe(2);

    // A figure changed afterwards does not ask to sign again: the signed text is kept as it was.
    await prisma.operator.update({ where: { id: op.operator.id }, data: { commissionBps: 1200 } });
    const after = await api().get('/api/internal/agreements').set(auth(op.token));
    expect(after.body.toSign).toEqual([]);
    const row = await prisma.plazoAgreement.findFirstOrThrow({ where: { kind: 'listing' } });
    expect(row.text).toContain('commission de 15 %');
  });
});
