import { Container } from 'typedi';
import { brevoNewsletterSettings, SUPPORT_EMAIL } from '@/config';
import prisma from '@/database';
import { contactEmail, formatSentAt, isRealSupportEmail } from '@/domain/contact';
import { newsletterAddressKey } from '@/middlewares/rateLimiter';
import { ContactService, replyToName } from '@/services/contact.service';
import { NotificationService } from '@/services/notification.service';
import { logger } from '@/utils/logger';
import { api } from './utils/helpers';

// Footer A (15/10/2026): the site's contact form and « La lettre Plazo ». No table is involved; Brevo is mocked.

const BREVO_EMAIL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_DOI = 'https://api.brevo.com/v3/contacts/doubleOptinConfirmation';
const SUPPORT = 'aide@plazo.test';

const notifications = Container.get(NotificationService);
const contactService = Container.get(ContactService);
const defaultNotificationSettings = { ...notifications.settings };
const defaultContactSettings = { ...contactService.settings };

let fetchMock: jest.SpyInstance;
const calls = (url: string) =>
  fetchMock.mock.calls.filter(([u]) => String(u) === url).map(([, init]) => JSON.parse((init as RequestInit).body as string));
const brevoHeaders = () => (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;

let ipCounter = 0;
/** Each request from its own visitor unless told otherwise (the limits are per visitor). */
const nextIp = () => `203.0.113.${++ipCounter}`;
const contact = (body: Record<string, unknown>, ip = nextIp()) => api().post('/api/public/contact').set('X-Forwarded-For', ip).send(body);
const subscribe = (body: Record<string, unknown>, ip = nextIp()) => api().post('/api/public/newsletter').set('X-Forwarded-For', ip).send(body);

const form = (overrides: Record<string, unknown> = {}) => ({
  name: 'Camille Martin',
  email: 'camille.martin@example.com',
  reference: 'PLZ-7K2Q9X',
  message: 'Bonjour, puis-je déposer ma voiture une heure plus tôt que prévu ?',
  website: '',
  ...overrides,
});

function captureLogs() {
  const spies = (['info', 'warn', 'error', 'debug'] as const).map(level => jest.spyOn(logger, level));
  return {
    lines: () => spies.flatMap(spy => spy.mock.calls.map(call => call.map(String).join(' '))),
    restore: () => spies.forEach(spy => spy.mockRestore()),
  };
}

function brevoOn() {
  Object.assign(notifications.settings, {
    apiKey: 'test-brevo-key',
    emailFrom: 'Plazo <bonjour@plazo.test>',
    publicSiteUrl: 'https://site.example',
  });
}

beforeEach(() => {
  Object.assign(notifications.settings, defaultNotificationSettings, { apiKey: '' });
  Object.assign(contactService.settings, defaultContactSettings);
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ messageId: 'm1' }), { status: 201 }));
});
afterEach(() => {
  fetchMock.mockRestore();
  Object.assign(notifications.settings, defaultNotificationSettings, { apiKey: '' });
  Object.assign(contactService.settings, defaultContactSettings);
  delete process.env.TEST_RATE_LIMITS;
  delete process.env.BREVO_NEWSLETTER_LIST_ID;
  delete process.env.BREVO_NEWSLETTER_DOI_TEMPLATE_ID;
});
afterAll(() => prisma.$disconnect());

describe('règles pures', () => {
  it('une adresse de service client réelle, pas celle d’exemple de product.json', () => {
    expect(isRealSupportEmail('aide@plazo.fr')).toBe(true);
    expect(isRealSupportEmail('support@example.com')).toBe(false);
    expect(isRealSupportEmail('support@EXAMPLE.org')).toBe(false);
    expect(isRealSupportEmail('')).toBe(false);
    expect(isRealSupportEmail('pas une adresse')).toBe(false);
    // product.json holds the real address since 22/10/2026 (contact@plazo.fr): the form is open.
    expect(isRealSupportEmail(SUPPORT_EMAIL)).toBe(true);
  });

  it('lit la liste et le modèle Brevo de la lettre (entiers positifs), sinon rien', () => {
    expect(brevoNewsletterSettings()).toBeNull();
    process.env.BREVO_NEWSLETTER_LIST_ID = ' 7 ';
    expect(brevoNewsletterSettings()).toBeNull();
    process.env.BREVO_NEWSLETTER_DOI_TEMPLATE_ID = '12';
    expect(brevoNewsletterSettings()).toEqual({ listId: 7, templateId: 12 });
    for (const bad of ['0', '-3', '1.5', 'abc', '']) {
      process.env.BREVO_NEWSLETTER_DOI_TEMPLATE_ID = bad;
      expect(brevoNewsletterSettings()).toBeNull();
    }
  });

  it('le mail au service client échappe le texte du visiteur et garde ses retours à la ligne', () => {
    const sentAt = new Date('2026-10-15T12:05:00Z');
    const mail = contactEmail(
      'Plazo',
      { name: 'Léa <b>', email: 'lea@example.com', message: 'Ligne 1\n<script>alert(1)</script>' },
      'contact ab12cd34',
      sentAt,
    );
    expect(mail.subject).toBe('Formulaire de contact Plazo · Léa <b>');
    expect(mail.html).toContain('Léa &lt;b&gt;');
    expect(mail.html).toContain('Ligne 1\n&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('white-space:pre-wrap');
    expect(mail.text).toContain('Réservation : non indiquée');
    expect(mail.text).toContain('Ligne 1\n<script>alert(1)</script>');
    expect(mail.text).toContain(`Envoyé le : ${formatSentAt(sentAt)}`);
    // 23/10/2026: a « Répondre » button on the visitor's address, the name escaped in the title.
    expect(mail.html).toContain('href="mailto:lea%40example.com?subject=Re%3A%20votre%20message%20%C3%A0%20Plazo"');
    expect(mail.html).toContain('Nouveau message de Léa &lt;b&gt;');
    expect(formatSentAt(sentAt)).toBe('jeudi 15 octobre 2026 à 14:05');
  });

  it('compte les inscriptions par boîte, sans garder l’adresse en clair', () => {
    const key = (email: string) => newsletterAddressKey({ body: { email } } as any);
    expect(key(' Camille@Example.com ')).toBe(key('camille@example.com'));
    expect(key('camille@example.com')).toMatch(/^newsletter:[0-9a-f]{32}$/);
    expect(key('camille@example.com')).not.toContain('camille');
    // One inbox however it is spelt: sub-addresses everywhere, dots and googlemail.com at Gmail.
    expect(key('camille+lettre1@example.com')).toBe(key('camille@example.com'));
    expect(key('Ca.Mil.le+x@googlemail.com')).toBe(key('camille@gmail.com'));
    expect(key('ca.mille@example.com')).not.toBe(key('camille@example.com'));
    expect(key('camille@example.org')).not.toBe(key('camille@example.com'));
  });

  it('le nom en adresse de réponse ne peut pas ajouter de destinataire', () => {
    expect(replyToName('Léa, autre@exemple.fr')).toBe('Léa autre exemple.fr');
    expect(replyToName('"Léa" <x@y.z>; Bcc: a@b.c')).toBe('Léa x y.z Bcc a b.c');
    expect(replyToName('Camille Martin')).toBe('Camille Martin');
    expect(replyToName('<<>>')).toBe('');
  });
});

describe('POST /api/public/contact', () => {
  it('envoie le message au service client, réponse au visiteur (Reply-To) : 202 { ok: true }', async () => {
    brevoOn();
    contactService.settings.supportEmail = SUPPORT;
    const res = await contact(form({ name: '  Camille Martin ', email: ' camille.martin@example.com ', reference: ' PLZ-7K2Q9X ' }));
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ ok: true });
    expect(res.headers['cache-control']).toBe('no-store');

    const sent = calls(BREVO_EMAIL);
    expect(sent).toHaveLength(1);
    expect(brevoHeaders()['api-key']).toBe('test-brevo-key');
    expect(sent[0]).toMatchObject({
      sender: { name: 'Plazo', email: 'bonjour@plazo.test' },
      to: [{ email: SUPPORT }],
      replyTo: { email: 'camille.martin@example.com', name: 'Camille Martin' },
      subject: 'Formulaire de contact Plazo · Camille Martin · PLZ-7K2Q9X',
      tags: ['contact_form'],
    });
    expect(sent[0].textContent).toContain('Bonjour, puis-je déposer ma voiture une heure plus tôt que prévu ?');
    expect(sent[0].textContent).toContain('Réservation : PLZ-7K2Q9X');
    expect(sent[0].htmlContent).toContain('Camille Martin');
  });

  it('sans référence, ou une référence blanche : « non indiquée »', async () => {
    brevoOn();
    contactService.settings.supportEmail = SUPPORT;
    expect((await contact(form({ reference: undefined }))).status).toBe(202);
    expect((await contact(form({ reference: '   ' }))).status).toBe(202);
    const sent = calls(BREVO_EMAIL);
    expect(sent.map(mail => mail.subject)).toEqual(['Formulaire de contact Plazo · Camille Martin', 'Formulaire de contact Plazo · Camille Martin']);
    expect(sent.every(mail => mail.textContent.includes('Réservation : non indiquée'))).toBe(true);
  });

  it('les champs d’une ligne perdent leurs retours à la ligne (en-têtes du mail), le message les garde', async () => {
    brevoOn();
    contactService.settings.supportEmail = SUPPORT;
    const res = await contact(form({ name: 'Camille\r\nBcc: x@evil.test', message: 'Première ligne\r\nDeuxième ligne\u0007' }));
    expect(res.status).toBe(202);
    const [mail] = calls(BREVO_EMAIL);
    expect(mail.replyTo).toEqual({ email: 'camille.martin@example.com', name: 'Camille Bcc x evil.test' });
    expect(mail.to).toEqual([{ email: SUPPORT }]);
    expect(mail.cc).toBeUndefined();
    expect(mail.bcc).toBeUndefined();
    expect(mail.subject).not.toMatch(/[\r\n]/);
    expect(mail.textContent).toContain('Première ligne\nDeuxième ligne\n');
    expect(mail.textContent).not.toContain('\u0007');
  });

  it('ne journalise ni le nom, ni l’adresse, ni le message', async () => {
    brevoOn();
    contactService.settings.supportEmail = SUPPORT;
    const logs = captureLogs();
    await contact(form());
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 'invalid_parameter', message: 'camille.martin@example.com is not valid' }), { status: 400 }),
    );
    await contact(form());
    const lines = logs.lines();
    logs.restore();
    expect(lines.join('\n')).toMatch(/contact_form email sent for contact [0-9a-f]{8}/);
    expect(lines.join('\n')).toMatch(/contact_form email failed for contact [0-9a-f]{8}: HTTP 400 invalid_parameter/);
    for (const line of lines) {
      for (const personal of ['Camille', 'camille.martin@example.com', 'PLZ-7K2Q9X', 'déposer ma voiture', SUPPORT]) {
        expect(line).not.toContain(personal);
      }
    }
  });

  it('409 contact_unavailable tant que l’adresse est celle d’exemple de product.json, ou sans Brevo', async () => {
    brevoOn();
    contactService.settings.supportEmail = 'support@example.com';
    let res = await contact(form());
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('contact_unavailable');

    contactService.settings.supportEmail = SUPPORT;
    notifications.settings.apiKey = '';
    res = await contact(form());
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('contact_unavailable');

    brevoOn();
    notifications.settings.emailFrom = '';
    res = await contact(form());
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('contact_unavailable');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('pot de miel rempli : la même réponse 202, rien n’est envoyé (même fermé)', async () => {
    expect((await contact(form({ website: 'https://spam.example' }))).body).toEqual({ ok: true });
    brevoOn();
    contactService.settings.supportEmail = SUPPORT;
    const res = await contact(form({ website: 'https://spam.example' }));
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('502 contact_failed quand Brevo refuse ou ne répond pas (le visiteur peut réessayer)', async () => {
    brevoOn();
    contactService.settings.supportEmail = SUPPORT;
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ code: 'unauthorized', message: 'Key not found' }), { status: 401 }));
    let res = await contact(form());
    expect(res.status).toBe(502);
    expect(res.body.code).toBe('contact_failed');
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    res = await contact(form());
    expect(res.status).toBe(502);
    expect(res.body.code).toBe('contact_failed');
  });

  it('400 avec un code par champ', async () => {
    brevoOn();
    contactService.settings.supportEmail = SUPPORT;
    const cases: [Record<string, unknown>, Record<string, string>][] = [
      [{}, { name: 'required', email: 'required', message: 'required' }],
      [
        { name: '   ', email: '  ', message: '   ' },
        { name: 'required', email: 'required', message: 'required' },
      ],
      [{ name: 'x'.repeat(81) }, { name: 'too_long' }],
      [{ email: 'pas-une-adresse' }, { email: 'invalid_email' }],
      [{ email: `${'a'.repeat(250)}@example.com` }, { email: 'invalid_email' }],
      [{ reference: 'R'.repeat(21) }, { reference: 'too_long' }],
      [{ message: ` 123456789${'\n'.repeat(5)} ` }, { message: 'too_short' }],
      [{ message: 'Court' }, { message: 'too_short' }],
      [{ message: 'x'.repeat(2001) }, { message: 'too_long' }],
    ];
    for (const [body, fields] of cases) {
      const res = await contact(Object.keys(body).length ? form(body) : {});
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('validation_failed');
      expect(res.body.fields).toEqual(fields);
    }
    // The bounds themselves pass (10 and 2 000 characters after trimming, a name of 80, a reference of 20).
    const ok = await contact(form({ name: 'n'.repeat(80), reference: 'R'.repeat(20), message: ` ${'m'.repeat(10)} ` }));
    expect(ok.status).toBe(202);
    expect((await contact(form({ message: 'm'.repeat(2000) }))).status).toBe(202);
    expect(calls(BREVO_EMAIL)).toHaveLength(2);
  });

  it('5 messages acceptés par heure et par visiteur ; les refus ne comptent pas', async () => {
    process.env.TEST_RATE_LIMITS = '1';
    brevoOn();
    contactService.settings.supportEmail = SUPPORT;
    const ip = nextIp();
    for (let i = 0; i < 3; i += 1) expect((await contact(form({ message: 'court' }), ip)).status).toBe(400);
    for (let i = 0; i < 5; i += 1) expect((await contact(form(), ip)).status).toBe(202);
    const blocked = await contact(form(), ip);
    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe('too_many_requests');
    expect((await contact(form(), nextIp())).status).toBe(202);
    expect(calls(BREVO_EMAIL)).toHaveLength(6);
  });
});

describe('POST /api/public/newsletter', () => {
  function newsletterOn() {
    brevoOn();
    process.env.BREVO_NEWSLETTER_LIST_ID = '7';
    process.env.BREVO_NEWSLETTER_DOI_TEMPLATE_ID = '12';
  }

  it('double opt-in Brevo : liste, modèle et page de confirmation du site ; 202 { ok: true }', async () => {
    newsletterOn();
    const res = await subscribe({ email: '  Camille.Martin@Example.com ', consent: true, website: '' });
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ ok: true });
    expect(res.headers['cache-control']).toBe('no-store');
    expect(calls(BREVO_DOI)).toEqual([
      { email: 'camille.martin@example.com', includeListIds: [7], templateId: 12, redirectionUrl: 'https://site.example/lettre/confirmee' },
    ]);
    expect(brevoHeaders()['api-key']).toBe('test-brevo-key');
  });

  it('la même réponse quel que soit l’état de l’adresse (nouvelle, connue, refusée par Brevo)', async () => {
    newsletterOn();
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 }), { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ code: 'invalid_parameter', message: 'camille@example.com is blacklisted' }), { status: 400 }),
      );
    const answers = [];
    for (const email of ['nouvelle@example.com', 'connue@example.com', 'refusee@example.com']) {
      const res = await subscribe({ email, consent: true });
      answers.push({ status: res.status, body: res.body });
    }
    expect(answers).toEqual(Array(3).fill({ status: 202, body: { ok: true } }));
  });

  it('502 newsletter_failed quand Plazo ou Brevo est en cause (clé, modèle, panne) : le visiteur peut réessayer', async () => {
    newsletterOn();
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 'unauthorized' }), { status: 401 }))
      .mockResolvedValueOnce(new Response('oops', { status: 500 }))
      .mockRejectedValueOnce(new Error('timeout'))
      // A 400 about Plazo's settings is not about the address: the same failure for everyone, never a false « check your inbox ».
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ code: 'invalid_parameter', message: 'An active DOI template does not exist' }), { status: 400 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 'invalid_parameter', message: 'redirectionUrl is not valid' }), { status: 400 }));
    for (let i = 0; i < 5; i += 1) {
      const res = await subscribe({ email: `essai${i}@example.com`, consent: true });
      expect(res.status).toBe(502);
      expect(res.body.code).toBe('newsletter_failed');
    }
  });

  it('409 newsletter_unavailable sans liste, sans modèle, sans clé Brevo ou sans l’adresse du site', async () => {
    brevoOn();
    const res = await subscribe({ email: 'a@example.com', consent: true });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('newsletter_unavailable');

    process.env.BREVO_NEWSLETTER_LIST_ID = '7';
    expect((await subscribe({ email: 'a@example.com', consent: true })).body.code).toBe('newsletter_unavailable');

    process.env.BREVO_NEWSLETTER_DOI_TEMPLATE_ID = '12';
    notifications.settings.apiKey = '';
    expect((await subscribe({ email: 'a@example.com', consent: true })).body.code).toBe('newsletter_unavailable');

    brevoOn();
    notifications.settings.publicSiteUrl = '';
    expect((await subscribe({ email: 'a@example.com', consent: true })).body.code).toBe('newsletter_unavailable');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('400 : accord exigé (vrai, pas « true » ni coché d’office), adresse valide', async () => {
    newsletterOn();
    const cases: [Record<string, unknown>, Record<string, string>][] = [
      [{}, { email: 'required', consent: 'consent_required' }],
      [{ email: 'a@example.com' }, { consent: 'consent_required' }],
      [{ email: 'a@example.com', consent: false }, { consent: 'consent_required' }],
      [{ email: 'a@example.com', consent: 'true' }, { consent: 'consent_required' }],
      [{ email: 'pas-une-adresse', consent: true }, { email: 'invalid_email' }],
    ];
    for (const [body, fields] of cases) {
      const res = await subscribe(body);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('validation_failed');
      expect(res.body.fields).toEqual(fields);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('pot de miel rempli : 202, rien n’est envoyé à Brevo', async () => {
    newsletterOn();
    const res = await subscribe({ email: 'bot@example.com', consent: true, website: 'x' });
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ne journalise jamais l’adresse', async () => {
    newsletterOn();
    const logs = captureLogs();
    await subscribe({ email: 'camille.martin@example.com', consent: true });
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 'invalid_parameter', message: 'camille.martin@example.com is invalid' }), { status: 400 }),
    );
    await subscribe({ email: 'camille.martin@example.com', consent: true });
    const lines = logs.lines();
    logs.restore();
    expect(lines.join('\n')).toMatch(/newsletter_doi double opt-in sent for newsletter [0-9a-f]{8}/);
    expect(lines.join('\n')).toMatch(/newsletter_doi double opt-in failed for newsletter [0-9a-f]{8}: HTTP 400 invalid_parameter/);
    expect(lines.some(line => line.toLowerCase().includes('camille'))).toBe(false);
  });

  it('5 inscriptions par heure et par visiteur, 3 par jour pour une même adresse ; les refus ne comptent pas', async () => {
    process.env.TEST_RATE_LIMITS = '1';
    newsletterOn();
    const ip = nextIp();
    expect((await subscribe({ email: 'visiteur0@example.com' }, ip)).status).toBe(400);
    for (let i = 1; i <= 5; i += 1) expect((await subscribe({ email: `visiteur${i}@example.com`, consent: true }, ip)).status).toBe(202);
    const blocked = await subscribe({ email: 'visiteur6@example.com', consent: true }, ip);
    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe('too_many_requests');

    // One mailbox, from as many visitors as wanted and however spelt: three confirmation emails a day at most, and beyond
    // them the usual answer (a 429 would tell that the address was asked for already).
    for (let i = 0; i < 3; i += 1) expect((await subscribe({ email: 'cible@example.com', consent: true })).status).toBe(202);
    for (const email of [' CIBLE@example.com', 'cible+4@example.com']) {
      const flooded = await subscribe({ email, consent: true });
      expect(flooded.status).toBe(202);
      expect(flooded.body).toEqual({ ok: true });
      expect(flooded.headers['cache-control']).toBe('no-store');
    }
    expect(calls(BREVO_DOI)).toHaveLength(8);
  });
});
