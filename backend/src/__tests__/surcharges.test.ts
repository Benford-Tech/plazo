import prisma from '@/database';
import { conditionsLabel } from '@/domain/day-before-sms';
import { surchargeConditions, surchargesLine, surchargesOf, validateSurcharges } from '@/domain/surcharges';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

/**
 * 12/11/2026 (« les conditions pénalisantes doivent être paramétrables », choix A): the parking's supplements, set once,
 * written by Plazo for the traveller. Fictional data only.
 */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const ids = () => 'abc123';

const body = {
  surcharges: [
    { kind: 'late', enabled: true, amountCents: 1000, minutes: 30, note: 'service sur rendez-vous' },
    { kind: 'night', enabled: true, amountCents: 1000 },
    { kind: 'breakdown', enabled: true, amountCents: 500, note: 'batterie, etc.' },
  ],
  night: { start: '22:00', end: '06:00' },
};
const LINE =
  'Retard de plus de 30 minutes : supplément de 10 € (service sur rendez-vous) ; Prise en charge ou restitution entre 22h et 6h : supplément de 10 € ; Service de dépannage (batterie, etc.) : 5 €';

beforeEach(() => resetDatabase());
afterAll(() => prisma.$disconnect());

describe('les règles', () => {
  it('trois suppléments prêts, éteints, puis ceux du parking', () => {
    expect(surchargesOf(null).map(s => [s.kind, s.enabled, s.amountCents])).toEqual([
      ['late', false, 1000],
      ['night', false, 1000],
      ['breakdown', false, 500],
    ]);
    const { surcharges, night, errors } = validateSurcharges(
      [...body.surcharges, { kind: 'custom', label: 'Clé perdue', amountCents: 2500 }],
      body.night,
      ids,
    );
    expect(errors).toEqual({});
    expect(night).toEqual({ start: '22:00', end: '06:00' });
    expect(surcharges[3]).toMatchObject({ id: 'custom-abc123', kind: 'custom', label: 'Clé perdue', enabled: true });
    expect(surchargesLine(surcharges, night)).toBe(`${LINE} ; Clé perdue : 25 €`);
  });

  it('refuse ce qui ne se dit pas : montant, minutes, heures de nuit, nom', () => {
    const { errors } = validateSurcharges(
      [
        { kind: 'late', enabled: true, amountCents: 0, minutes: 2 },
        { kind: 'night', enabled: true, amountCents: 1000 },
        { kind: 'custom', label: ' ', amountCents: 100 },
      ],
      undefined,
      ids,
    );
    expect(errors).toEqual({
      'surcharges.late.amountCents': 'invalid',
      'surcharges.late.minutes': 'invalid',
      'night.start': 'required',
      'surcharges.custom.2.label': 'required',
    });
    // Off, it keeps what it had: no error.
    expect(validateSurcharges([{ kind: 'late', enabled: false, minutes: null }], undefined, ids).errors).toEqual({});
    expect(validateSurcharges([], { start: '22:00', end: '22:00' }, ids).errors).toEqual({ 'night.end': 'same_time' });
  });

  it('{conditions} : les suppléments remplacent la phrase des frais de nuit, le texte libre suit', () => {
    const night = { start: '22:00', end: '06:00', arrivalFeeCents: 1500, returnFeeCents: 1500 };
    expect(conditionsLabel(night, 'Paiement à l’arrivée', null)).toBe(
      'Prise en charge ou restitution entre 22h et 6h : supplément de 15 € ; Paiement à l’arrivée',
    );
    expect(conditionsLabel(night, 'Paiement à l’arrivée', 'Dépannage : 5 €')).toBe('Dépannage : 5 € ; Paiement à l’arrivée');
    // Set, none on: Plazo says nothing of the night fees.
    expect(conditionsLabel(night, null, '')).toBeNull();
    expect(surchargeConditions({ surcharges: null, nightStart: '22:00', nightEnd: '06:00' })).toBeNull();
  });
});

describe('GET/PUT /internal/parkings/:id/surcharges', () => {
  it('le gérant règle les suppléments ; les heures de nuit sont celles du parking ; le message de la veille les dit', async () => {
    const op = await setupOperator();
    const path = `/api/internal/parkings/${op.parking.id}/surcharges`;
    const first = await api().get(path).set(auth(op.token)).expect(200);
    expect(first.body).toMatchObject({ configured: false, line: null });

    const put = await api().put(path).set(auth(op.token)).send(body).expect(200);
    expect(put.body).toMatchObject({ configured: true, line: LINE, night: { start: '22:00', end: '06:00' } });
    const parking = await prisma.parking.findUniqueOrThrow({ where: { id: op.parking.id } });
    expect(parking).toMatchObject({ nightStart: '22:00', nightEnd: '06:00', nightFeeEnabled: false });
    expect(await prisma.auditLog.count({ where: { action: 'parking.surcharges_updated' } })).toBe(1);

    const reminders = await api()
      .put(`/api/internal/parkings/${op.parking.id}/reminders`)
      .set(auth(op.token))
      .send({ template: 'À savoir : {conditions}.' })
      .expect(200);
    expect(reminders.body.sample.values.conditions).toBe(LINE);

    const bad = await api()
      .put(path)
      .set(auth(op.token))
      .send({ surcharges: [{ kind: 'late', enabled: true, amountCents: 1000 }] });
    expect(bad.status).toBe(400);
    expect(bad.body.fields).toEqual({ 'surcharges.late.minutes': 'required' });
  });

  it('réservé aux gérants, et au parking du loueur', async () => {
    const op = await setupOperator();
    const other = await setupOperator('Autre loueur');
    const driver = await addStaff(op.token, 'driver');
    await api().get(`/api/internal/parkings/${op.parking.id}/surcharges`).set(auth(driver.token)).expect(403);
    await api().get(`/api/internal/parkings/${op.parking.id}/surcharges`).set(auth(other.token)).expect(404);
  });
});
