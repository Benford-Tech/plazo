import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Container } from 'typedi';
import prisma from '@/database';
import { checkPdf, checkSignature, cleanFileName, pdfSafe, sha256Hex } from '@/domain/partner-contract';
import { NotificationService } from '@/services/notification.service';
import { MemoryPhotoBackend, PhotoStorageService } from '@/services/photo-storage.service';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

// 20/10/2026, « Pouvoir stocker le contrat à faire signer » (choice 2a).
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

async function samplePdf(pages = 2): Promise<Buffer> {
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

describe('le contrat Plazo ↔ loueur (domaine)', () => {
  it('accepte un PDF lisible, refuse le reste', async () => {
    expect(await checkPdf(await samplePdf(3))).toEqual({ ok: true, pages: 3 });
    expect(await checkPdf(Buffer.alloc(0))).toEqual({ ok: false, code: 'empty' });
    expect(await checkPdf(Buffer.from('bonjour'))).toEqual({ ok: false, code: 'not_a_pdf' });
    expect(await checkPdf(Buffer.from('%PDF-1.7 tronqué'))).toEqual({ ok: false, code: 'pdf_unreadable' });
    expect(await checkPdf(Buffer.alloc(4 * 1024 * 1024 + 1, 0x20))).toEqual({ ok: false, code: 'too_large' });
  });

  it('nettoie le nom du fichier, le nom du signataire et le texte du PDF', () => {
    expect(cleanFileName('Contrat Parking Alpha (v2).PDF')).toBe('Contrat-Parking-Alpha-v2.pdf');
    expect(cleanFileName('../../é')).toBe('e.pdf');
    expect(cleanFileName(undefined)).toBe('contrat.pdf');
    expect(checkSignature({ signerName: '  Malik   Dubois ', accepted: true })).toEqual({ ok: true, name: 'Malik Dubois' });
    expect(checkSignature({ signerName: 'Malik', accepted: 'yes' })).toEqual({
      ok: false,
      fields: { signerName: 'full_name', accepted: 'required' },
    });
    expect(checkSignature({})).toEqual({ ok: false, fields: { signerName: 'required', accepted: 'required' } });
    expect(pdfSafe('Plazo ↔ Rémi « ok » ’')).toBe('Plazo ? Rémi « ok » ’');
  });
});

describe('le contrat Plazo ↔ loueur (API)', () => {
  let store: MemoryPhotoBackend;
  beforeEach(async () => {
    await resetDatabase();
    store = new MemoryPhotoBackend();
    Container.get(PhotoStorageService).backend = store;
  });
  afterEach(() => {
    delete process.env.PLATFORM_ADMIN_EMAILS;
    jest.restoreAllMocks();
  });
  afterAll(() => prisma.$disconnect());

  async function platformAndOperator() {
    const admin = await setupOperator('Plazo (tests)');
    process.env.PLATFORM_ADMIN_EMAILS = admin.manager.email;
    const op = await setupOperator('Parking Alpha');
    return { admin, op };
  }

  const upload = (token: string, operatorId: string, body: Buffer, query = '?fileName=contrat%20alpha.pdf') =>
    api().post(`/api/internal/platform/operators/${operatorId}/contracts${query}`).set(auth(token)).set('Content-Type', 'application/pdf').send(body);

  it('dépose, prévient les gérants, remplace la version en attente, fait signer et garde la preuve', async () => {
    const notifications = Container.get(NotificationService);
    jest.spyOn(notifications, 'emailConfigured').mockReturnValue(true);
    const sent = jest.spyOn(notifications, 'emailStaff').mockResolvedValue(true);
    const { admin, op } = await platformAndOperator();
    const pdf = await samplePdf();

    // Only the platform uploads; the body must be a PDF.
    expect((await upload(op.token, op.operator.id, pdf)).status).toBe(403);
    expect((await upload(admin.token, op.operator.id, Buffer.from('pas un pdf'))).body.fields).toEqual({ file: 'not_a_pdf' });

    const first = await upload(admin.token, op.operator.id, pdf);
    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({
      version: 1,
      status: 'pending',
      fileName: 'contrat-alpha.pdf',
      title: 'Contrat de partenariat Plazo',
      sha256: sha256Hex(pdf),
    });
    expect(sent).toHaveBeenCalledWith(
      expect.objectContaining({ email: op.manager.email }),
      'partner_contract',
      expect.any(String),
      expect.objectContaining({ subject: 'Votre contrat Plazo est prêt à signer' }),
    );

    // A second upload replaces the one waiting.
    const second = await upload(admin.token, op.operator.id, await samplePdf(3), '?title=Contrat%202026');
    expect(second.body).toMatchObject({ version: 2, status: 'pending', title: 'Contrat 2026' });
    const list = await api().get(`/api/internal/platform/operators/${op.operator.id}/contracts`).set(auth(admin.token));
    expect(list.body.contracts.map((c: any) => [c.version, c.status])).toEqual([
      [2, 'pending'],
      [1, 'superseded'],
    ]);
    const operators = await api().get('/api/internal/platform/operators').set(auth(admin.token));
    expect(operators.body.operators.find((o: any) => o.id === op.operator.id).contract).toEqual({ status: 'pending', version: 2 });

    // The manager reads it; an agent does not see it.
    const mine = await api().get('/api/internal/contract').set(auth(op.token));
    expect(mine.body).toMatchObject({ canSign: true, current: { version: 2, status: 'pending' }, history: [] });
    const agent = await addStaff(op.token, 'agent');
    expect((await api().get('/api/internal/contract').set(auth(agent.token))).status).toBe(403);
    const file = await api().get(`/api/internal/contract/${second.body.id}/file`).set(auth(op.token)).buffer(true).parse(binary);
    expect(file.headers['content-type']).toBe('application/pdf');
    expect(sha256Hex(file.body)).toBe(second.body.sha256);
    // Another operator's contract stays out of reach.
    const other = await setupOperator('Autre');
    expect((await api().get(`/api/internal/contract/${second.body.id}/file`).set(auth(other.token))).status).toBe(404);

    // The platform, in view-as, reads but never signs.
    const view = await api().post(`/api/internal/platform/operators/${op.operator.id}/view-as`).set(auth(admin.token));
    const viewToken = view.body.access.token as string;
    expect((await api().get('/api/internal/contract').set(auth(viewToken))).body.canSign).toBe(false);
    const refused = await api()
      .post(`/api/internal/contract/${second.body.id}/sign`)
      .set(auth(viewToken))
      .send({ signerName: 'Joanny Simpore', accepted: true });
    expect(refused.body.code).toBe('view_as_cannot_sign');

    const sign = (body: object) =>
      api().post(`/api/internal/contract/${second.body.id}/sign`).set(auth(op.token)).set('User-Agent', 'Navigateur de test').send(body);
    expect((await sign({ signerName: 'Gérant', accepted: true })).body.fields).toEqual({ signerName: 'full_name' });
    expect((await sign({ signerName: 'Gérant Test' })).body.fields).toEqual({ accepted: 'required' });
    const signed = await sign({ signerName: 'Gérant Test', accepted: true });
    expect(signed.status).toBe(200);
    expect(signed.body.current).toMatchObject({ version: 2, status: 'signed', signer: { name: 'Gérant Test', email: op.manager.email } });
    expect(signed.body.canSign).toBe(false);
    expect((await sign({ signerName: 'Gérant Test', accepted: true })).body.code).toBe('already_signed');
    // A superseded version cannot be signed.
    expect(
      (await api().post(`/api/internal/contract/${first.body.id}/sign`).set(auth(op.token)).send({ signerName: 'Gérant Test', accepted: true }))
        .status,
    ).toBe(404);

    // The signed PDF = the original's pages plus the signature page; its fingerprint is the one kept.
    const signedPdf = await api().get(`/api/internal/contract/${second.body.id}/file?kind=signed`).set(auth(op.token)).buffer(true).parse(binary);
    expect(sha256Hex(signedPdf.body)).toBe(signed.body.current.signedSha256);
    expect((await PDFDocument.load(signedPdf.body)).getPageCount()).toBe(4);
    const proof = await api()
      .get(`/api/internal/platform/operators/${op.operator.id}/contracts/${second.body.id}/file?kind=proof`)
      .set(auth(admin.token))
      .buffer(true)
      .parse(binary);
    expect((await PDFDocument.load(proof.body)).getPageCount()).toBe(1);
    const row = await prisma.partnerContract.findUniqueOrThrow({ where: { id: second.body.id } });
    expect(row).toMatchObject({ signerUserAgent: 'Navigateur de test', signerName: 'Gérant Test' });
    expect(row.signerIp).toBeTruthy();
    expect(sent).toHaveBeenCalledWith(
      expect.objectContaining({ email: admin.manager.email }),
      'partner_contract_signed',
      expect.any(String),
      expect.anything(),
    );

    // A signed contract is kept; the audit trail has every step.
    expect(
      (await api().delete(`/api/internal/platform/operators/${op.operator.id}/contracts/${second.body.id}`).set(auth(admin.token))).body.code,
    ).toBe('already_signed');
    expect(
      (await api().post(`/api/internal/platform/operators/${op.operator.id}/contracts/${second.body.id}/remind`).set(auth(admin.token))).body.code,
    ).toBe('not_pending');
    const actions = (await prisma.auditLog.findMany({ where: { action: { startsWith: 'partner_contract.' } }, orderBy: { createdAt: 'asc' } })).map(
      a => a.action,
    );
    expect(actions).toEqual(['partner_contract.uploaded', 'partner_contract.uploaded', 'partner_contract.signed']);

    // A new version after a signed one: the signed one stays in the history.
    await upload(admin.token, op.operator.id, pdf);
    const after = await api().get('/api/internal/contract').set(auth(op.token));
    expect(after.body.current).toMatchObject({ version: 3, status: 'pending' });
    expect(after.body.history.map((c: any) => c.version)).toEqual([2]);
  });

  it('retire un contrat déposé par erreur, renvoie l’e-mail, efface les fichiers avec le loueur', async () => {
    const { admin, op } = await platformAndOperator();
    const res = await upload(admin.token, op.operator.id, await samplePdf());
    expect(
      (await api().post(`/api/internal/platform/operators/${op.operator.id}/contracts/${res.body.id}/remind`).set(auth(admin.token))).body.code,
    ).toBe('email_unavailable');
    expect((await api().delete(`/api/internal/platform/operators/${op.operator.id}/contracts/${res.body.id}`).set(auth(admin.token))).status).toBe(
      204,
    );
    expect(store.files.size).toBe(0);
    expect((await api().get('/api/internal/contract').set(auth(op.token))).body).toEqual({ current: null, history: [], canSign: false });

    await upload(admin.token, op.operator.id, await samplePdf());
    expect(store.files.size).toBe(1);
    await api().post(`/api/internal/platform/operators/${op.operator.id}/suspend`).set(auth(admin.token));
    expect((await api().delete(`/api/internal/platform/operators/${op.operator.id}`).set(auth(admin.token))).status).toBe(200);
    expect(store.files.size).toBe(0);
  });
});
