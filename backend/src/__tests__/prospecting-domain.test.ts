import {
  capDayStart,
  defaultSteps,
  followUpDueAt,
  inSendingWindow,
  nextStep,
  nextWindowStart,
  displayPhone,
  prospectEmail,
  remainingToday,
  renderSubject,
  renderTemplate,
  retentionCutoff,
  stepsOf,
  suppressionHash,
  unknownVariables,
  validateProspect,
  validateSequence,
} from '@/domain/prospecting';

// Prospection (18/10/2026, choix « A avec les relances de B »): the pure rules. Fictional data only.

const values = { prénom: 'Camille', nom: 'Exemple', parking: 'Parking Alpha', aéroport: 'Lyon Saint-Exupéry', ville: 'Pusignan', lien_demo: '' };
const company = {
  name: 'Benford Tech',
  legalForm: 'société par actions simplifiée',
  address: '1 rue Exemple, 38000 Ville',
  registration: '000 000 000 RCS Ville',
};

describe('variables des mails', () => {
  it('remplace les variables, avec ou sans accents, et laisse une inconnue telle quelle', () => {
    expect(renderTemplate('Bonjour {prénom} {nom}, {parking} à {ville} près de {aeroport} {inconnue}', values)).toBe(
      'Bonjour Camille Exemple, Parking Alpha à Pusignan près de Lyon Saint-Exupéry {inconnue}',
    );
    expect(unknownVariables('{prénom} {Prenom} {inconnue} {ville}')).toEqual(['{inconnue}']);
  });

  it('une variable vide ne laisse pas de trace', () => {
    const empty = { ...values, prénom: '' };
    expect(renderTemplate('Bonjour {prénom},\n\nSuite', empty)).toBe('Bonjour,\n\nSuite');
    expect(renderSubject('{prénom}, vos réservations', empty)).toBe('Vos réservations');
    expect(renderSubject('{prénom}, vos réservations', values)).toBe('Camille, vos réservations');
  });

  it('le mail échappe le HTML et porte l’éditeur, la raison et le lien de désinscription', () => {
    const mail = prospectEmail({
      productName: 'Plazo',
      company,
      senderName: 'Équipe Plazo',
      step: { subject: 'Bonjour {prénom}', body: 'Ligne <b>1</b> & {parking}\nsuite\n\nParagraphe 2' },
      values,
      unsubscribeUrl: 'https://site.example/api/public/prospecting/unsubscribe/abc.def',
    });
    expect(mail.subject).toBe('Bonjour Camille');
    expect(mail.html).toContain('Ligne &lt;b&gt;1&lt;/b&gt; &amp; Parking Alpha<br>suite');
    expect(mail.html).not.toContain('<b>1</b>');
    expect(mail.html).toContain('href="https://site.example/api/public/prospecting/unsubscribe/abc.def"');
    expect(mail.text).toContain(
      'Plazo est édité par Benford Tech, société par actions simplifiée, 000 000 000 RCS Ville, 1 rue Exemple, 38000 Ville.',
    );
    expect(mail.text).toContain("Vous recevez ce message à l'adresse professionnelle de Parking Alpha");
    expect(mail.text).toContain('Ne plus recevoir de messages de Plazo : https://site.example/api/public/prospecting/unsubscribe/abc.def');
    // 23/10/2026: the operators' template; the demo button only when the step carries the prospect's link.
    expect(mail.html).toContain('>Plazo</span>');
    expect(mail.html).not.toContain('Voir la démo');
    const withDemo = prospectEmail({
      productName: 'Plazo',
      company,
      senderName: 'Équipe Plazo',
      step: { subject: 'Démo', body: 'Votre démo : {lien_demo}' },
      values: { ...values, lien_demo: 'https://site.example/pro/demo/AbCd2345EfGh' },
      unsubscribeUrl: 'https://site.example/u/abc.def',
    });
    expect(withDemo.html).toContain('href="https://site.example/pro/demo/AbCd2345EfGh"');
    expect(withDemo.html).toContain('Voir la démo de Plazo');
    expect(withDemo.text).toContain('Votre démo : https://site.example/pro/demo/AbCd2345EfGh');
    // The store badges (« avec les liens des apps sur le store »): Google Play linked, the App Store greyed until published.
    const withStores = prospectEmail({
      productName: 'Plazo',
      company,
      senderName: 'Équipe Plazo',
      step: { subject: 'S', body: 'Message' },
      values,
      unsubscribeUrl: 'https://site.example/u/x',
      stores: { badgesBase: 'https://site.example', playStoreUrl: 'https://play.google.com/store/apps/details?id=x', appStoreUrl: null },
    });
    expect(withStores.html).toContain('src="https://site.example/badges/google-play-fr.png"');
    expect(withStores.html).toContain('href="https://play.google.com/store/apps/details?id=x"');
    expect(withStores.html).toContain('src="https://site.example/badges/app-store-fr-soon.png"');
    expect(withStores.text).toContain('Plazo Pro sur Google Play (Android) : https://play.google.com/store/apps/details?id=x');
    expect(withStores.text).toContain("Plazo Pro sur l'App Store (iPhone) : Validation par Apple en cours");
    expect(mail.html).not.toContain('badges/');
    // An address in the text is a link too, its trailing punctuation left out.
    const typed = prospectEmail({
      ...withDemo,
      ...{ productName: 'Plazo', company, senderName: 'Équipe Plazo', values, unsubscribeUrl: 'https://site.example/u/x' },
      step: { subject: 'S', body: 'Voir https://exemple.fr/page?a=1&b=2, puis.' },
    } as any);
    expect(typed.html).toContain(
      '<a href="https://exemple.fr/page?a=1&amp;b=2" style="color:#1E5E2E">https://exemple.fr/page?a=1&amp;b=2</a>, puis.',
    );
  });
});

describe('téléphone de la signature', () => {
  it('écrit un numéro français à la française, laisse un autre tel quel', () => {
    expect(displayPhone('+33 7 21 17 75 90')).toBe('07 21 17 75 90');
    expect(displayPhone('+33721177590')).toBe('07 21 17 75 90');
    expect(displayPhone('0033 (0)4 72 00 00 00')).toBe('04 72 00 00 00');
    expect(displayPhone('0472000000')).toBe('04 72 00 00 00');
    expect(displayPhone(' +44 20 7946 0000 ')).toBe('+44 20 7946 0000');
  });

  it('le numéro suit le nom dans la signature, en texte et en HTML', () => {
    const base = {
      productName: 'Plazo',
      company,
      senderName: 'Équipe Plazo',
      step: { subject: 'Bonjour', body: 'Message' },
      values,
      unsubscribeUrl: 'https://site.example/u/abc.def',
    };
    const mail = prospectEmail({ ...base, senderPhone: '+33 6 00 00 00 00' });
    expect(mail.text).toContain('Message\n\nÉquipe Plazo\n06 00 00 00 00\n\n--');
    expect(mail.html).toContain('<p style="margin:0 0 14px">Équipe Plazo<br>06 00 00 00 00</p>');
    expect(prospectEmail({ ...base, senderPhone: '  ' }).text).toContain('Message\n\nÉquipe Plazo\n\n--');
  });
});

describe('validation', () => {
  it('un prospect : parking et e-mail requis, e-mail en minuscules, code d’aéroport IATA', () => {
    expect(validateProspect({ companyName: ' Parking  Alpha ', email: ' Contact@Alpha.Example ', airportCode: 'lys' })).toEqual({
      ok: true,
      value: {
        companyName: 'Parking Alpha',
        email: 'contact@alpha.example',
        airportCode: 'LYS',
        contactFirstName: null,
        contactLastName: null,
        town: null,
        phone: null,
        notes: null,
        region: null,
      },
    });
    expect(validateProspect({ email: 'pas-une-adresse', airportCode: 'LYON' })).toEqual({
      ok: false,
      fields: { companyName: 'required', email: 'invalid_email', airportCode: 'invalid_airport' },
    });
    expect(validateProspect({ town: 'Pusignan' }, true)).toEqual({ ok: true, value: { town: 'Pusignan' } });
    expect(validateProspect({ companyName: 'x'.repeat(121), email: 'a@b.fr' })).toMatchObject({ ok: false, fields: { companyName: 'too_long' } });
  });

  it('la séquence : premier mail toujours actif à J0, relances dans l’ordre, variables connues, plafond borné', () => {
    const steps = defaultSteps('Plazo');
    const ok = validateSequence(
      steps.map(s => (s.step === 1 ? { ...s, enabled: false, delayDays: 5 } : s)),
      50,
    );
    expect(ok).toMatchObject({ ok: true, dailyCap: 50 });
    if (ok.ok) expect(ok.steps[0]).toMatchObject({ enabled: true, delayDays: 0 });
    expect(validateSequence([steps[0], { ...steps[1], delayDays: 10 }, { ...steps[2], delayDays: 10 }], 50)).toEqual({
      ok: false,
      fields: { 'steps.3.delayDays': 'delay_order' },
    });
    // The order does not matter when the follow-up is off.
    expect(validateSequence([steps[0], { ...steps[1], delayDays: 10, enabled: false }, { ...steps[2], delayDays: 3 }], 50).ok).toBe(true);
    expect(validateSequence([{ ...steps[0], subject: 'Bonjour {société}' }, { ...steps[1], body: '' }, steps[2]], 0)).toEqual({
      ok: false,
      fields: { 'steps.1.subject': 'unknown_variable', 'steps.2.body': 'required', dailyCap: 'cap_range' },
    });
    expect(validateSequence([steps[0]], 50)).toMatchObject({ ok: false, fields: { steps: 'invalid' } });
    expect(stepsOf({ broken: true }, 'Plazo')).toEqual(defaultSteps('Plazo'));
  });

  it('les adresses désinscrites sont gardées en empreinte, sans la casse', () => {
    expect(suppressionHash(' Contact@Alpha.Example')).toBe(suppressionHash('contact@alpha.example'));
    expect(suppressionHash('contact@alpha.example')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('fenêtre d’envoi et relances', () => {
  // Wednesday 21/10/2026 is in summer time (UTC+2), Monday 26/10/2026 in winter time (UTC+1).
  it('du lundi au vendredi, de 9 h à 18 h à Paris', () => {
    expect(inSendingWindow(new Date('2026-10-21T07:00:00Z'))).toBe(true); // 09:00
    expect(inSendingWindow(new Date('2026-10-21T06:59:00Z'))).toBe(false); // 08:59
    expect(inSendingWindow(new Date('2026-10-21T15:59:00Z'))).toBe(true); // 17:59
    expect(inSendingWindow(new Date('2026-10-21T16:00:00Z'))).toBe(false); // 18:00
    expect(inSendingWindow(new Date('2026-10-24T08:00:00Z'))).toBe(false); // Saturday
  });

  it('prochaine ouverture : le jour même avant 9 h, le lendemain après 18 h, le lundi le week-end', () => {
    expect(nextWindowStart(new Date('2026-10-21T05:00:00Z')).toISOString()).toBe('2026-10-21T07:00:00.000Z');
    expect(nextWindowStart(new Date('2026-10-21T17:00:00Z')).toISOString()).toBe('2026-10-22T07:00:00.000Z');
    expect(nextWindowStart(new Date('2026-10-23T17:00:00Z')).toISOString()).toBe('2026-10-26T08:00:00.000Z'); // Friday evening → Monday 09:00 (UTC+1)
    const inside = new Date('2026-10-21T10:00:00Z');
    expect(nextWindowStart(inside)).toBe(inside);
  });

  it('une relance part N jours après le premier contact, à la même heure, remise dans la fenêtre', () => {
    const j0 = new Date('2026-10-21T08:30:00Z'); // Wednesday 10:30
    const day = (d: Date) => new Date(d.getTime() + 86400000);
    expect(followUpDueAt(j0, 4, day(j0)).toISOString()).toBe('2026-10-26T08:00:00.000Z'); // Sunday 10:30 → Monday 09:00
    expect(followUpDueAt(j0, 6, day(j0)).toISOString()).toBe('2026-10-27T09:30:00.000Z'); // Tuesday 10:30 (UTC+1)
    // Never before the floor (a sequence edited after the fact).
    expect(followUpDueAt(j0, 1, new Date('2026-10-23T08:30:00Z')).toISOString()).toBe('2026-10-23T08:30:00.000Z');
  });

  it('étape suivante : saute les étapes éteintes ; fin de séquence', () => {
    const steps = defaultSteps('Plazo');
    steps[1].enabled = false;
    expect(nextStep(steps, 0)?.step).toBe(1);
    expect(nextStep(steps, 1)?.step).toBe(3);
    expect(nextStep(steps, 3)).toBeNull();
  });

  it('plafond du jour et conservation de 3 ans', () => {
    expect(remainingToday(50, 12)).toBe(38);
    expect(remainingToday(50, 60)).toBe(0);
    // 23:30 in Paris still counts in the 21st, which began at 22:00 UTC the day before.
    expect(capDayStart(new Date('2026-10-21T21:30:00Z')).toISOString()).toBe('2026-10-20T22:00:00.000Z');
    expect(retentionCutoff(new Date('2026-10-18T12:00:00Z')).toISOString()).toBe('2023-10-18T12:00:00.000Z');
  });
});
