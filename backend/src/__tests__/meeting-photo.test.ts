import { Container } from 'typedi';
import { MemoryPhotoBackend, PhotoStorageService } from '@/services/photo-storage.service';
import { addStaff, api, resetDatabase, setupOperator } from './utils/helpers';

/** 13/11/2026, « pouvoir uploader la photo du point de rendez-vous »: uploaded by a manager, served publicly by Plazo. */

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const jpeg = (fill = 1) => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(400, fill)]);
const upload = (token: string, body: Buffer) =>
  api().post('/api/internal/parking/return-meeting-point/photo').set(auth(token)).set('Content-Type', 'image/jpeg').send(body);
const pathOf = (url: string) => url.slice(url.indexOf('/api/public/'));

describe('Meeting point photo', () => {
  let memory: MemoryPhotoBackend;

  beforeEach(async () => {
    await resetDatabase();
    memory = new MemoryPhotoBackend();
    Container.get(PhotoStorageService).backend = memory;
  });

  it('is uploaded, served publicly, replaced, and kept with the saved point', async () => {
    const op = await setupOperator();
    let res = await upload(op.token, jpeg(1));
    expect(res.status).toBe(200);
    const first = res.body.photoUrl as string;
    expect(first).toMatch(/\/api\/public\/parkings\/[^/]+\/meeting-photo\/[0-9a-f]{18}\.jpeg$/);

    const served = await api().get(pathOf(first)).buffer(true);
    expect(served.status).toBe(200);
    expect(served.headers['content-type']).toBe('image/jpeg');
    expect(served.headers['cache-control']).toContain('public');
    expect(Buffer.compare(served.body, jpeg(1))).toBe(0);

    // Replaced: a new address, the old file and address gone.
    res = await upload(op.token, jpeg(2));
    const second = res.body.photoUrl as string;
    expect(second).not.toBe(first);
    expect(memory.files.size).toBe(1);
    expect((await api().get(pathOf(first))).status).toBe(404);

    // Saved with the point: the traveller's meeting point carries it.
    const saved = await api()
      .put('/api/internal/parking/return-meeting-point')
      .set(auth(op.token))
      .send({ lat: 45.72, lng: 5.08, label: 'Terminal 1', photoUrl: second });
    expect(saved.status).toBe(200);
    expect(saved.body.data.photoUrl).toBe(second);
    expect(memory.files.size).toBe(1);

    // A pasted URL instead: the uploaded file leaves the store.
    await api()
      .put('/api/internal/parking/return-meeting-point')
      .set(auth(op.token))
      .send({ lat: 45.72, lng: 5.08, photoUrl: 'https://example.com/rdv.jpg' });
    expect(memory.files.size).toBe(0);
    expect((await api().get(pathOf(second))).status).toBe(404);
  });

  it('is removed, refuses what is not an image, and is the managers’ only', async () => {
    const op = await setupOperator();
    expect((await upload(op.token, Buffer.from('not an image at all'))).body.fields).toEqual({ photo: 'not_an_image' });
    const driver = await addStaff(op.token, 'driver');
    expect((await upload(driver.token, jpeg())).status).toBe(403);

    const res = await upload(op.token, jpeg());
    expect((await api().delete('/api/internal/parking/return-meeting-point/photo').set(auth(op.token))).status).toBe(204);
    expect(memory.files.size).toBe(0);
    expect((await api().get(pathOf(res.body.photoUrl))).status).toBe(404);
    const parking = op.parking;
    expect((await api().get('/api/internal/parking/return-meeting-point').set(auth(op.token))).body.data).toBeNull();
    expect((await api().get(`/api/public/parkings/${parking.id}/meeting-photo/../../x`)).status).toBe(404);
  });
});
