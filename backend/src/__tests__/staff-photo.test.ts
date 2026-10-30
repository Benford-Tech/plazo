import { Container } from 'typedi';
import prisma from '@/database';
import { MemoryPhotoBackend, PhotoStorageService } from '@/services/photo-storage.service';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

/** 30/10/2026, « pouvoir mettre sa photo »: a member's photo, seen by their team; the menu's counters. */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const jpeg = (fill = 1) => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(400, fill)]);
const upload = (token: string, body: Buffer) =>
  api().post('/api/internal/staff/me/photo').set(auth(token)).set('Content-Type', 'image/jpeg').send(body);

describe('Staff photo', () => {
  let memory: MemoryPhotoBackend;

  beforeEach(async () => {
    await resetDatabase();
    memory = new MemoryPhotoBackend();
    Container.get(PhotoStorageService).backend = memory;
  });

  it('is set by the member, replaced, served to the team and removed', async () => {
    const op = await setupOperator();
    const driver = await addStaff(op.token, 'driver');

    let res = await upload(driver.token, jpeg(1));
    expect(res.status).toBe(200);
    expect(res.body.photoUpdatedAt).toEqual(expect.any(String));
    expect(memory.files.size).toBe(1);

    const me = await api().get('/api/internal/staff/me').set(auth(driver.token));
    expect(me.body.photoUpdatedAt).toBe(res.body.photoUpdatedAt);
    expect(me.body.photoKey).toBeUndefined();

    // Replaced: the previous file goes.
    res = await upload(driver.token, jpeg(2));
    expect(res.status).toBe(200);
    expect(memory.files.size).toBe(1);

    // The manager sees it, in the team list too.
    const photo = await api().get(`/api/internal/staff/${driver.id}/photo`).set(auth(op.token)).buffer(true);
    expect(photo.status).toBe(200);
    expect(photo.headers['content-type']).toBe('image/jpeg');
    expect(Buffer.compare(photo.body, jpeg(2))).toBe(0);
    const team = await api().get('/api/internal/staff').set(auth(op.token));
    const row = (Array.isArray(team.body) ? team.body : team.body.data).find((s: any) => s.id === driver.id);
    expect(row.photoUpdatedAt).toEqual(expect.any(String));
    expect(row.photoKey).toBeUndefined();

    // Another operator never does.
    const other = await setupOperator('Autre');
    expect((await api().get(`/api/internal/staff/${driver.id}/photo`).set(auth(other.token))).status).toBe(404);

    expect((await api().delete('/api/internal/staff/me/photo').set(auth(driver.token))).status).toBe(204);
    expect(memory.files.size).toBe(0);
    expect((await api().get(`/api/internal/staff/${driver.id}/photo`).set(auth(op.token))).body.code).toBe('photo_not_found');
  });

  it('refuses what is not an image, and goes when the member leaves', async () => {
    const op = await setupOperator();
    const driver = await addStaff(op.token, 'driver');
    let res = await upload(driver.token, Buffer.from('%PDF-1.7 not an image at all'));
    expect(res.status).toBe(400);
    expect(res.body.fields.photo).toBe('not_an_image');

    expect((await upload(driver.token, jpeg())).status).toBe(200);
    res = await api().post('/api/internal/staff/me/leave').set(auth(driver.token));
    expect(res.status).toBe(200);
    expect(memory.files.size).toBe(0);
    const row = await prisma.staff.findUniqueOrThrow({ where: { id: driver.id } });
    expect(row.photoKey).toBeNull();
  });

  it('counts the mails to handle and the services to do for the menu', async () => {
    const op = await setupOperator();
    await prisma.inboundEmail.create({
      data: { operatorId: op.operator.id, status: 'incomplete', fromAddress: 'info@allopark.com', subject: 'Réservation', receivedAt: new Date() },
    });
    const res = await api().get('/api/internal/nav/counts').set(auth(op.token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ inbox: 1, extras: 0 });

    const driver = await addStaff(op.token, 'driver');
    const forDriver = await api().get('/api/internal/nav/counts').set(auth(driver.token));
    expect(forDriver.body.inbox).toBeNull();
  });
});
