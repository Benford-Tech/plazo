import { readFileSync } from 'fs';
import { join } from 'path';
import { parseConfirmationEmail } from '@/domain/importers';
import { alloparkLinks, isAlloparkCancellation, isAlloparkChange } from '@/domain/importers/allopark-page';
import { cancellationIn, changeIn, isCancellationOrChange, isChange } from '@/domain/importers/common';
import { classifyMail, comparatorMessageOf, ruleReading, type MailToClassify } from '@/domain/inbound-kind';
import { textOf } from '@/domain/inbound-email';

/**
 * 16/10/2026 (« trouve un moyen d'analyser sans passer par Claude. faire du scrapping par type de mail par exemple »):
 * the rules per comparator and mail type, on every mail type of the client's comparators (fictional data, the layouts
 * of the samples Joanny sent, and of the Allopark modification that waited for Claude the morning of the 16th).
 */

const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8');
const ALLOPARK = 'ALLOPARK info@allopark.com';
/** An HTML email as the relay gives it: its text, its allopark.com links. */
const htmlMail = (name: string, subject: string | null, from: string): MailToClassify => {
  const html = fixture(name);
  return { subject, from, text: textOf({ RawHtmlBody: html }), links: alloparkLinks(html) };
};
const kindOf = (mail: MailToClassify) => {
  const found = classifyMail(mail);
  return { kind: found.kind, provider: found.provider, reference: found.reference, rule: found.rule, sure: found.sure };
};

const modification = () =>
  htmlMail('allopark-modification.html', 'Modification de votre réservation AL-500000001 chez Aeroports Parking Lyon', ALLOPARK);
const modificationText = () => modification().text;

describe('les mails d’Allopark (16/10/2026)', () => {
  it('l’avis de réservation au parking et la copie du voyageur : une réservation, par le modèle de l’objet et du corps', () => {
    const notice = fixture('allopark-confirmation.txt');
    expect(kindOf({ subject: 'Confirmation de votre réservation AL-884880719 chez Aeroports Parking Lyon', from: ALLOPARK, text: notice })).toEqual({
      kind: 'booking',
      provider: 'Allopark',
      reference: 'AL-884880719',
      rule: 'allopark.booking',
      sure: true,
    });
    const copy = htmlMail('allopark-customer.html', 'Confirmation de votre réservation AL-012345678 chez Aeroports Parking Lyon', ALLOPARK);
    expect(kindOf(copy)).toMatchObject({ kind: 'booking', reference: 'AL-012345678', rule: 'allopark.booking', sure: true });
    // The subject lost (a forward without its header): the heading repeats it. « > Laisser mon avis » is no quote.
    expect(kindOf({ ...copy, subject: null })).toMatchObject({ kind: 'booking', sure: true });
  });

  it('la modification du 16/10/2026 (corps mot pour mot d’une confirmation) : une modification sûre, sans Claude', () => {
    expect(kindOf(modification())).toEqual({
      kind: 'change',
      provider: 'Allopark',
      reference: 'AL-500000001',
      rule: 'allopark.change',
      sure: true,
    });
    // Its body says « est confirmée »: only the subject or its heading tells it from a confirmation.
    expect(modificationText()).toContain('est confirmée');
    expect(kindOf({ ...modification(), subject: null })).toMatchObject({ kind: 'change', sure: true });
    // The link « Consulter ma réservation » alone is a mark of Allopark's body too (the text part may lack the rest).
    expect(kindOf({ ...modification(), text: 'ALLOPARK\nBonjour,\nConsulter ma réservation' })).toMatchObject({ kind: 'change', sure: true });
  });

  it('la modification transférée par une règle Gmail, puis à la main (Gmail, Apple Mail, Outlook) : toujours une modification', () => {
    // A Gmail rule keeps Allopark's subject, sender and text.
    expect(kindOf({ ...modification(), from: ALLOPARK })).toMatchObject({ kind: 'change', sure: true });
    const body = modificationText();
    const gmail = [
      'Voici la modification de ce matin.',
      '',
      '---------- Message transféré ---------',
      'De : ALLOPARK <info@allopark.com>',
      'Date: ven. 16 oct. 2026 à 07:12',
      'Subject: Modification de votre réservation AL-500000001 chez Aeroports Parking Lyon',
      'To: <parking@example.com>',
      '',
      '',
      body,
    ].join('\n');
    const byHand = {
      subject: 'TR: Modification de votre réservation AL-500000001 chez Aeroports Parking Lyon',
      from: 'Parking parking@example.com',
      links: modification().links,
    };
    expect(kindOf({ ...byHand, text: gmail })).toMatchObject({ kind: 'change', reference: 'AL-500000001', rule: 'allopark.change', sure: true });
    // Its own subject typed by the person who forwarded it: the forwarded header's « Objet » decides.
    expect(kindOf({ ...byHand, subject: 'Fwd: réservation de demain', text: gmail })).toMatchObject({ kind: 'change', sure: true });
    const apple = [
      'Début du message réexpédié :',
      '',
      'De: ALLOPARK <info@allopark.com>',
      'Objet: Modification de votre réservation AL-500000001 chez Aeroports Parking Lyon',
      'Date: 16 octobre 2026 à 07:12:00 UTC+2',
      'À: parking@example.com',
      '',
      body,
    ].join('\n');
    expect(
      kindOf({ ...byHand, subject: 'Fwd: Modification de votre réservation AL-500000001 chez Aeroports Parking Lyon', text: apple }),
    ).toMatchObject({
      kind: 'change',
      sure: true,
    });
    const outlook = [
      'Pour info',
      '________________________________',
      'De : ALLOPARK <info@allopark.com>',
      'Envoyé : vendredi 16 octobre 2026 07:12',
      'À : parking@example.com',
      'Objet : Modification de votre réservation AL-500000001 chez Aeroports Parking Lyon',
      '',
      body,
    ].join('\n');
    expect(
      kindOf({ ...byHand, subject: 'TR : Modification de votre réservation AL-500000001 chez Aeroports Parking Lyon', text: outlook }),
    ).toMatchObject({
      kind: 'change',
      sure: true,
    });
    // What the forward is made of: the note apart, the message under its header.
    const message = comparatorMessageOf({ ...byHand, text: gmail });
    expect(message).toMatchObject({
      subject: 'Modification de votre réservation AL-500000001 chez Aeroports Parking Lyon',
      from: 'ALLOPARK <info@allopark.com>',
      notes: 'Voici la modification de ce matin.',
      reply: false,
      forwarded: true,
    });
    expect(message.text.startsWith('Modification de votre réservation AL-500000001')).toBe(true);
  });

  it('une réponse « Re: » qui cite la modification ou la confirmation : un autre mail, jamais une réservation', () => {
    const reply = [
      'Bonjour, mon vol a du retard, pouvez-vous m’attendre ?',
      '',
      'Le ven. 16 oct. 2026 à 07:12, ALLOPARK <info@allopark.com> a',
      'écrit :',
      ...modificationText()
        .split('\n')
        .map(line => `> ${line}`),
    ].join('\n');
    for (const subject of [
      'Re: Modification de votre réservation AL-500000001 chez Aeroports Parking Lyon',
      'RE : Confirmation de votre réservation AL-500000001',
      'AW: Allopark AL-500000001',
    ]) {
      expect([subject, kindOf({ subject, from: 'Jean Dupont client@example.com', text: reply })]).toEqual([
        subject,
        { kind: 'other', provider: 'Allopark', reference: 'AL-500000001', rule: 'allopark.reply', sure: true },
      ]);
    }
    expect(comparatorMessageOf({ subject: 'Re: Allopark AL-500000001', from: null, text: reply }).text).toBe(
      'Bonjour, mon vol a du retard, pouvez-vous m’attendre ?',
    );
    // A reply that names no comparator: unknown, Claude reads it (when Plazo has its key).
    expect(kindOf({ subject: 'Re: ma réservation', from: 'client@example.com', text: 'Je confirme mon arrivée à 6 h.' })).toMatchObject({
      kind: 'unknown',
      provider: null,
    });
  });

  it('une annulation ou un remboursement l’emporte, jusque dans le mot de la personne qui transfère', () => {
    for (const [subject, text] of [
      ['Annulation de votre réservation AL-500000001 chez Aeroports Parking Lyon', 'ALLOPARK\nAL-500000001 | Aeroports Parking Lyon'],
      ['Votre réservation AL-500000001', 'Allopark\nVotre réservation AL-500000001 a été annulée.'],
      ['Remboursement AL-500000001', 'Allopark\nNous avons remboursé votre réservation.'],
    ]) {
      expect([subject, kindOf({ subject, from: ALLOPARK, text })]).toEqual([
        subject,
        { kind: 'cancellation', provider: 'Allopark', reference: 'AL-500000001', rule: 'allopark.cancellation', sure: true },
      ]);
    }
    // « Le client a annulé, voir ci-dessous » above a forwarded confirmation: the safer reading.
    const confirmation = fixture('allopark-confirmation.txt');
    const forwarded = [
      'Le client a annulé, voir ci-dessous.',
      '---------- Forwarded message ---------',
      'From: ALLOPARK <info@allopark.com>',
      'Subject: Confirmation de votre réservation AL-884880719 chez Aeroports Parking Lyon',
      '',
      confirmation,
    ].join('\n');
    expect(kindOf({ subject: 'Fwd: Confirmation de votre réservation AL-884880719', from: 'parking@example.com', text: forwarded })).toMatchObject({
      kind: 'cancellation',
      reference: 'AL-884880719',
    });
  });

  it('relecture : une demande écrite au-dessus d’un mail transféré à la main, ou une annulation qui transfère la confirmation, jamais une réservation', () => {
    const confirmation = fixture('allopark-confirmation.txt');
    const forward = (note: string, subject = 'Confirmation de votre réservation AL-884880719 chez Aeroports Parking Lyon') =>
      [note, '', '---------- Forwarded message ---------', 'From: ALLOPARK <info@allopark.com>', `Subject: ${subject}`, '', confirmation].join('\n');
    const byHand = { subject: 'TR: Confirmation de votre réservation AL-884880719', from: 'Client client@example.com' };
    // A request is not a cancellation or a change done: the staff read it (no booking made, no duplicate hidden in « Traités »).
    for (const note of [
      'Bonjour, je souhaite annuler ma réservation svp',
      'Merci de décaler mon retour au 20.',
      'Le client veut changer ses dates',
    ]) {
      expect([note, kindOf({ ...byHand, text: forward(note) })]).toEqual([
        note,
        { kind: 'other', provider: 'Allopark', reference: 'AL-884880719', rule: 'allopark.note', sure: true },
      ]);
    }
    expect(ruleReading(classifyMail({ ...byHand, text: forward('Merci d’annuler') }))?.summary).toBe(
      'Message transféré à propos de la réservation Allopark AL-884880719',
    );
    // A note without a request, and « échange » (no « change »): still the booking.
    for (const note of ['Voici la réservation de ce matin.', 'Suite à notre échange, la réservation ci-dessous.'])
      expect(kindOf({ ...byHand, text: forward(note) })).toMatchObject({ kind: 'booking', rule: 'allopark.booking', sure: true });
    // A cancellation that forwards the booking's confirmation: its subject counts, not only the innermost message.
    const nested = [
      'Pour info',
      '',
      '---------- Forwarded message ---------',
      'From: ALLOPARK <info@allopark.com>',
      'Subject: Annulation de votre réservation AL-884880719',
      '',
      'Voici le récapitulatif.',
      '',
      forward('', 'Confirmation de votre réservation AL-884880719 chez Aeroports Parking Lyon').trimStart(),
    ].join('\n');
    expect(kindOf({ subject: 'TR: Annulation AL-884880719', from: 'Parking parking@example.com', text: nested })).toMatchObject({
      kind: 'cancellation',
      reference: 'AL-884880719',
    });
  });

  it('sans le modèle d’Allopark : une modification par ses seuls mots, une réservation à confirmer, ou inconnue sans référence', () => {
    expect(
      kindOf({
        subject: 'Modification de votre réservation AL-500000001',
        from: ALLOPARK,
        text: 'Allopark\nVos nouvelles dates : du 1er au 4 octobre.',
      }),
    ).toMatchObject({
      kind: 'change',
      rule: 'allopark.change-wording',
      sure: false,
    });
    expect(kindOf({ subject: 'Rappel : votre séjour AL-500000001', from: ALLOPARK, text: 'Votre séjour approche.' })).toMatchObject({
      kind: 'booking',
      rule: 'allopark.reference',
      sure: false,
    });
    expect(kindOf({ subject: 'Profitez de -10 %', from: ALLOPARK, text: 'Allopark, la lettre du mois' })).toMatchObject({
      kind: 'unknown',
      provider: 'Allopark',
      rule: 'allopark.no-reference',
    });
  });
});

describe('Onepark, Parclick et ParkMundo (16/10/2026)', () => {
  const onepark = () => htmlMail('onepark-notification.html', 'Nouvelle réservation', 'Onepark noreply@onepark.co');
  const parclick = () => htmlMail('parclick-confirmation.html', 'Voici votre réservation !', 'Parclick noreply@parclick.com');
  const parkmundo = () =>
    htmlMail('parkmundo-confirmation.html', 'Confirmation de votre réservation PM1500000001', 'ParkMundo noreply@parkmundo.com');

  it('leurs confirmations : des réservations, par la mise en page de leur lecteur', () => {
    expect(kindOf(onepark())).toEqual({ kind: 'booking', provider: 'Onepark', reference: '5900001', rule: 'onepark.booking', sure: true });
    expect(kindOf(parclick())).toEqual({ kind: 'booking', provider: 'Parclick', reference: 'BQXY1234', rule: 'parclick.booking', sure: true });
    expect(kindOf(parkmundo())).toEqual({ kind: 'booking', provider: 'ParkMundo', reference: 'PM1500000001', rule: 'parkmundo.booking', sure: true });
    // « Annulation gratuite jusqu'à 24 heures avant l'arrivée » (ParkMundo) is no cancellation.
    expect(parkmundo().text).toMatch(/Annulation gratuite/);
  });

  it('leurs annulations et modifications, qui gardent le tableau de la réservation : jamais une réservation', () => {
    const cancelled = {
      ...onepark(),
      text: onepark().text.replace('Une nouvelle réservation Onepark a été enregistrée', 'Une réservation Onepark a été annulée'),
    };
    // 25/10/2026: the words alone (a booking template reworded) are read, not applied; Onepark's own notice is applied.
    expect(kindOf(cancelled)).toMatchObject({ kind: 'cancellation', provider: 'Onepark', rule: 'onepark.cancellation-wording', sure: false });
    expect(kindOf({ ...onepark(), subject: 'Annulation de réservation 5900001' })).toMatchObject({ kind: 'cancellation' });
    const notice = readFileSync(join(__dirname, 'fixtures', 'onepark-cancellation.txt'), 'utf8');
    expect(kindOf({ subject: 'Annulation de la réservation #5900003', from: 'Onepark <noreply@onepark.co>', text: notice })).toMatchObject({
      provider: 'Onepark',
      kind: 'cancellation',
      reference: '5900003',
      rule: 'onepark.cancellation',
      sure: true,
    });
    // Forwarded by hand (Gmail keeps the heading in the body, the subject becomes « Fwd: … »): still applied.
    expect(
      kindOf({
        subject: 'Fwd: Annulation de la réservation #5900003',
        from: 'Jo <jo@example.com>',
        text: `---------- Forwarded message ---------\nDe : Onepark <noreply@onepark.co>\nObjet : Annulation de la réservation #5900003\n\n${notice}`,
      }),
    ).toMatchObject({
      rule: 'onepark.cancellation',
      reference: '5900003',
      sure: true,
    });
    const changed = {
      ...onepark(),
      text: onepark().text.replace('Une nouvelle réservation Onepark a été enregistrée', 'La réservation Onepark 5900001 a été modifiée'),
    };
    expect(kindOf(changed)).toMatchObject({ kind: 'change', provider: 'Onepark', rule: 'onepark.change' });

    expect(kindOf({ ...parkmundo(), text: `Votre réservation PM1500000001 a été annulée.\n${parkmundo().text}` })).toMatchObject({
      kind: 'cancellation',
      provider: 'ParkMundo',
    });
    expect(kindOf({ ...parkmundo(), subject: 'Réservation PM1500000001 annulée' })).toMatchObject({ kind: 'cancellation' });
    expect(kindOf({ ...parkmundo(), text: `Modification de votre réservation PM1500000001\n${parkmundo().text}` })).toMatchObject({ kind: 'change' });

    expect(kindOf({ ...parclick(), subject: 'Votre réservation a été annulée' })).toMatchObject({ kind: 'cancellation', provider: 'Parclick' });
    expect(kindOf({ ...parclick(), text: `Vos nouvelles dates : 10/10/2026 → 12/10/2026\n${parclick().text}` })).toMatchObject({ kind: 'change' });
  });

  it('relecture : la confirmation transférée à la main avec une demande au-dessus attend l’équipe', () => {
    const note = ['Je voudrais annuler, merci', '', '---------- Message transféré ---------', 'De : Parclick <noreply@parclick.com>'];
    const text = [...note, 'Objet : Voici votre réservation !', '', parclick().text].join('\n');
    expect(kindOf({ subject: 'TR: Voici votre réservation !', from: 'client@example.com', text })).toMatchObject({
      kind: 'other',
      provider: 'Parclick',
      rule: 'parclick.note',
    });
  });

  it('une confirmation qui dit « non remboursable si annulée » reste une réservation', () => {
    expect(kindOf({ ...parkmundo(), text: `${parkmundo().text}\nTarif non remboursable si annulée moins de 24 heures avant.` })).toMatchObject({
      kind: 'booking',
    });
  });
});

describe('relecture des formules : les conditions d’une confirmation ne sont ni une annulation ni une modification (16/10/2026)', () => {
  /** Conditions written as the comparators write them in their confirmations (fictional), the booking's reference in one. */
  const conditions = (ref: string) => fixture('confirmation-conditions.txt').replace(/\{REF\}/g, ref);
  const confirmations: [string, () => MailToClassify, string][] = [
    [
      'Allopark (avis au parking)',
      () => ({
        subject: 'Confirmation de votre réservation AL-884880719 chez Aeroports Parking Lyon',
        from: ALLOPARK,
        text: fixture('allopark-confirmation.txt'),
      }),
      'AL-884880719',
    ],
    [
      'Allopark (copie du voyageur)',
      () => htmlMail('allopark-customer.html', 'Confirmation de votre réservation AL-012345678 chez Aeroports Parking Lyon', ALLOPARK),
      'AL-012345678',
    ],
    ['Onepark', () => htmlMail('onepark-notification.html', 'Nouvelle réservation', 'Onepark noreply@onepark.co'), '5900001'],
    ['Parclick', () => htmlMail('parclick-confirmation.html', 'Voici votre réservation !', 'Parclick noreply@parclick.com'), 'BQXY1234'],
    [
      'ParkMundo',
      () => htmlMail('parkmundo-confirmation.html', 'Confirmation de votre réservation PM1500000001', 'ParkMundo noreply@parkmundo.com'),
      'PM1500000001',
    ],
  ];

  it.each(confirmations)('%s : la confirmation et ses conditions restent une réservation sûre, lue par son lecteur', (_name, mail, ref) => {
    const before = kindOf(mail());
    expect(before).toMatchObject({ kind: 'booking', sure: true, reference: ref });
    const withConditions = { ...mail(), text: `${mail().text}\n${conditions(ref)}` };
    expect(kindOf(withConditions)).toEqual(before);
    // Each sentence on its own, too: none turns the confirmation into a cancellation or a change.
    for (const sentence of conditions(ref).split('\n').filter(Boolean)) {
      expect([sentence, kindOf({ ...mail(), text: `${mail().text}\n${sentence}` }).kind]).toEqual([sentence, 'booking']);
    }
    expect(parseConfirmationEmail(withConditions.text)).not.toBeNull();
  });

  it('chaque phrase des conditions, seule : ni annulation ni modification', () => {
    for (const sentence of conditions('AL-500000001').split('\n').filter(Boolean)) {
      expect([sentence, cancellationIn(sentence), changeIn(sentence), isCancellationOrChange(sentence)]).toEqual([sentence, false, false, false]);
      expect([sentence, isAlloparkCancellation('Confirmation de votre réservation AL-500000001', sentence)]).toEqual([sentence, false]);
      expect([sentence, isAlloparkChange('Confirmation de votre réservation AL-500000001', sentence)]).toEqual([sentence, false]);
    }
  });

  it.each(confirmations)('%s : une vraie annulation ou une vraie modification est toujours reconnue, conditions comprises', (name, mail, ref) => {
    const provider = mail().from?.split(' ')[0] === 'ALLOPARK' ? 'Allopark' : name;
    const withConditions = (text: string) => `${text}\n${mail().text}\n${conditions(ref)}`;
    const cancellations: [string | null, string][] = [
      [`Annulation de votre réservation ${ref}`, mail().text],
      [mail().subject, withConditions(`Votre réservation ${ref} a été annulée.`)],
      [mail().subject, withConditions(`Nous avons annulé votre réservation ${ref} à votre demande.`)],
      [mail().subject, withConditions('Le remboursement de votre réservation a été effectué.')],
      [mail().subject, withConditions(`Your booking ${ref} has been cancelled.`)],
    ];
    for (const [subject, text] of cancellations) {
      expect([subject, text.split('\n')[0], kindOf({ ...mail(), subject, text })]).toEqual([
        subject,
        text.split('\n')[0],
        expect.objectContaining({ kind: 'cancellation', provider }),
      ]);
    }
    const changes: [string | null, string][] = [
      [`Modification de votre réservation ${ref}`, mail().text],
      [mail().subject, withConditions(`Votre réservation ${ref} a été modifiée.`)],
      [mail().subject, withConditions('Vos nouvelles dates : du 2 au 5 novembre 2026.')],
    ];
    for (const [subject, text] of changes) {
      expect([subject, text.split('\n')[0], kindOf({ ...mail(), subject, text })]).toEqual([
        subject,
        text.split('\n')[0],
        expect.objectContaining({ kind: 'change', provider }),
      ]);
    }
  });

  it('la modification Allopark et ses conditions reste une modification sûre de sa réservation', () => {
    const mail = htmlMail('allopark-modification.html', 'Modification de votre réservation AL-500000001 chez Aeroports Parking Lyon', ALLOPARK);
    const before = kindOf(mail);
    expect(before).toMatchObject({ kind: 'change', sure: true, reference: 'AL-500000001' });
    expect(kindOf({ ...mail, text: `${mail.text}\n${conditions('AL-500000001')}` })).toEqual(before);
  });

  it('les formules des vrais mails, seules : toujours une annulation ou une modification', () => {
    for (const sentence of [
      'Votre réservation AL-500000001 a été annulée.',
      'Annulation de votre réservation AL-500000001 chez Aeroports Parking Lyon',
      'Nous avons annulé votre réservation suite à votre demande.',
      'Le remboursement de votre réservation a été effectué.',
      'Your booking AL-500000001 has been cancelled.',
      'We have cancelled your booking.',
      'Votre demande d’annulation a bien été prise en compte.',
      // A condition in another clause of the sentence does not make it one.
      'Conformément à nos conditions, votre réservation AL-500000001 a été annulée.',
      'Si vous avez des questions, sachez que votre réservation a été annulée.',
      // Review: a colon starts the news, and a word far back in the clause never makes it a condition.
      "Aucune action n'est requise de votre part : votre réservation AL-500000001 a été annulée.",
      'Pas de frais : votre réservation a été annulée.',
      'Free of charge: your booking has been cancelled.',
      'Tous nos regrets pour ce désagrément du jour mais votre réservation a été annulée par le parking.',
    ])
      expect([sentence, cancellationIn(sentence)]).toEqual([sentence, true]);
    for (const sentence of [
      'Votre réservation AL-500000001 a été modifiée.',
      'Modification de votre réservation AL-500000001',
      'Vos nouvelles dates : du 2 au 5 novembre.',
      'Your booking AL-500000001 has been changed.',
    ])
      expect([sentence, changeIn(sentence) || isChange(sentence)]).toEqual([sentence, true]);
  });
});

describe('les mails inconnus et la lecture des règles (16/10/2026)', () => {
  it('un autre comparateur, le site du parking, un client : inconnus, Claude les lit', () => {
    expect(
      kindOf({ subject: 'Nouvelle réservation PK-123456', from: 'Parkos noreply@parkos.fr', text: 'Bonjour, nouvelle réservation sur Parkos…' }),
    ).toEqual({
      kind: 'unknown',
      provider: null,
      reference: null,
      rule: 'unknown',
      sure: false,
    });
    expect(kindOf({ subject: 'Demande de réservation', from: 'site@parking.example', text: 'Nom : Martin\nArrivée : 12/10' })).toMatchObject({
      kind: 'unknown',
    });
  });

  it('la lecture gardée sur le mail : le genre, le comparateur et un résumé sans donnée personnelle', () => {
    expect(ruleReading(classifyMail(modification()))).toEqual({
      kind: 'modification',
      provider: 'Allopark',
      confidence: 1,
      summary: 'Modification Allopark de la réservation AL-500000001',
      model: '',
      source: 'rules',
      rule: 'allopark.change',
    });
    const notice = {
      subject: 'Confirmation de votre réservation AL-884880719 chez Aeroports Parking Lyon',
      from: ALLOPARK,
      text: fixture('allopark-confirmation.txt'),
    };
    expect(ruleReading(classifyMail(notice))?.summary).toBe('Réservation Allopark AL-884880719');
    expect(ruleReading(classifyMail({ subject: 'Annulation de votre réservation AL-500000001', from: ALLOPARK, text: '' }))?.summary).toBe(
      'Annulation Allopark de la réservation AL-500000001',
    );
    for (const mail of [modification(), notice]) expect(JSON.stringify(ruleReading(classifyMail(mail)))).not.toMatch(/Dupont|@/);
    expect(ruleReading(classifyMail({ subject: 'Bonjour', from: null, text: 'Un message' }))).toBeNull();
  });
});
