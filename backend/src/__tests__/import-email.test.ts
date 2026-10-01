import { readFileSync } from 'fs';
import { join } from 'path';
import prisma from '@/database';
import { alloparkImporter } from '@/domain/importers/allopark';
import { parseConfirmationEmail } from '@/domain/importers';
import { api, resetDatabase, setupOperator } from './utils/helpers';

const email = readFileSync(join(__dirname, 'fixtures/allopark-confirmation.txt'), 'utf8');
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('lecture d’un mail Allopark', () => {
  it('reconnaît le mail et en extrait référence, séjour, prix et client', () => {
    expect(alloparkImporter.detect(email)).toBe(true);
    expect(parseConfirmationEmail(email)).toEqual({
      provider: 'Allopark',
      externalReference: 'AL-884880719',
      arrivalAt: '2026-10-01T08:30',
      returnAt: '2026-10-03T17:00',
      priceCents: 3499,
      customerName: 'Jean Dupont',
      customerPhone: undefined,
      customerEmail: undefined,
      plate: undefined,
      returnFlight: undefined,
    });
  });

  it('lit les champs du formulaire quand ils sont remplis', () => {
    const filled = email
      .replace('Nombre personne*\n', 'Nombre personne*\n3\n')
      .replace('Numéro de plaque du véhicule*\n', 'Numéro de plaque du véhicule*\nGK-318-PX\n')
      .replace('Numéro du vol retour\n', 'Numéro du vol retour\nTO 3627\n')
      .replace('Numéro de téléphone*\n', 'Numéro de téléphone*\n06 12 34 56 78\n')
      .replace('Nom*\n', 'Nom*\nDupont\n')
      .replace('Prénom*\n', 'Prénom*\nJean\n');
    expect(parseConfirmationEmail(filled)).toMatchObject({
      passengers: 3,
      plate: 'GK-318-PX',
      returnFlight: 'TO 3627',
      customerPhone: '06 12 34 56 78',
      customerName: 'Jean Dupont',
    });
  });

  it('ignore un texte qui ne vient pas d’un comparateur connu', () => {
    expect(parseConfirmationEmail('Bonjour, je voudrais réserver une place.')).toBeNull();
  });
});

describe('POST /internal/imports/email', () => {
  beforeEach(resetDatabase);
  afterAll(() => prisma.$disconnect());

  it('prépare la réservation et liste ce qui manque', async () => {
    const { token } = await setupOperator();
    const res = await api().post('/internal/imports/email').set(auth(token)).send({ text: email });
    expect(res.status).toBe(200);
    expect(res.body.parsed.externalReference).toBe('AL-884880719');
    expect(res.body.missing).toEqual(['customerPhone', 'plate']);
    expect(res.body.duplicate).toBeNull();
    expect(res.body.capacity.nights.map((n: any) => n.date)).toEqual(['2026-10-01', '2026-10-02']);
    expect(await prisma.reservation.count()).toBe(0);
  });

  it('refuse un texte inconnu', async () => {
    const { token } = await setupOperator();
    const res = await api().post('/internal/imports/email').set(auth(token)).send({ text: 'rien à voir' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('unrecognised_email');
  });

  it('ne crée jamais deux fois la même réservation Allopark', async () => {
    const { token } = await setupOperator();
    const booking = {
      channel: 'aggregator',
      channelDetail: 'Allopark',
      externalReference: 'al-884880719',
      priceCents: 3499,
      arrivalAt: '2026-10-01T08:30',
      returnAt: '2026-10-03T17:00',
      passengers: 2,
      customerName: 'Jean Dupont',
      customerPhone: '06 12 34 56 78',
      plate: 'GK318PX',
    };
    const first = await api().post('/internal/reservations').set(auth(token)).send(booking);
    expect(first.status).toBe(201);
    expect(first.body.data).toMatchObject({ externalReference: 'AL-884880719', priceCents: 3499 });

    const again = await api().post('/internal/reservations').set(auth(token)).send(booking);
    expect(again.status).toBe(409);
    expect(again.body.code).toBe('already_imported');
    expect(again.body.details.reservation.id).toBe(first.body.data.id);

    const parsed = await api().post('/internal/imports/email').set(auth(token)).send({ text: email });
    expect(parsed.body.duplicate.id).toBe(first.body.data.id);
  });

  it('est réservé aux agents et gérants', async () => {
    const { token } = await setupOperator();
    const { addStaff } = await import('./utils/helpers');
    const driver = await addStaff(token, 'driver');
    expect((await api().post('/internal/imports/email').set(auth(driver.token)).send({ text: email })).status).toBe(403);
  });
});
