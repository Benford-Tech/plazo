import { Container } from 'typedi';
import { MemoryPhotoBackend, PhotoStorageService } from '@/services/photo-storage.service';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

/** 02/11/2026, « pouvoir personnaliser Plazo avec l'icône du parking » (direction B): the parking's logo for its team. */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const png = (fill = 1) => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(400, fill)]);
const upload = (token: string, body: Buffer) =>
  api().post('/api/internal/operator/logo').set(auth(token)).set('Content-Type', 'image/png').send(body);

describe('Operator logo', () => {
  let memory: MemoryPhotoBackend;

  beforeEach(async () => {
    await resetDatabase();
    memory = new MemoryPhotoBackend();
    Container.get(PhotoStorageService).backend = memory;
  });

  it('is set by a manager, replaced, served to the whole team and removed', async () => {
    const op = await setupOperator();
    const driver = await addStaff(op.token, 'driver');

    expect((await api().get('/api/internal/staff/me').set(auth(driver.token))).body.operatorLogoUpdatedAt).toBeNull();
    expect((await upload(driver.token, png())).status).toBe(403);

    let res = await upload(op.token, png(1));
    expect(res.status).toBe(200);
    expect(res.body.logoUpdatedAt).toEqual(expect.any(String));
    const me = await api().get('/api/internal/staff/me').set(auth(driver.token));
    expect(me.body.operatorLogoUpdatedAt).toBe(res.body.logoUpdatedAt);

    res = await upload(op.token, png(2));
    expect(res.status).toBe(200);
    expect(memory.files.size).toBe(1);

    const logo = await api().get('/api/internal/operator/logo').set(auth(driver.token)).buffer(true);
    expect(logo.status).toBe(200);
    expect(logo.headers['content-type']).toBe('image/png');
    expect(Buffer.compare(logo.body, png(2))).toBe(0);

    // Another operator gets its own (none), never this one.
    const other = await setupOperator('Autre');
    expect((await api().get('/api/internal/operator/logo').set(auth(other.token))).body.code).toBe('logo_not_found');

    expect((await api().delete('/api/internal/operator/logo').set(auth(op.token))).status).toBe(204);
    expect(memory.files.size).toBe(0);
    expect((await api().get('/api/internal/operator/logo').set(auth(driver.token))).status).toBe(404);
  });

  it('refuses what is not an image', async () => {
    const op = await setupOperator();
    const res = await upload(op.token, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'));
    expect(res.status).toBe(400);
    expect(res.body.fields).toEqual({ logo: 'not_an_image' });
  });
});
