// Store screenshots (11/10/2026): stages a believable day at the first demo parking (Parkair Lyon) through the
// public API, so that every screen of the two apps has something to show. Fictitious people, plates and phones.
//
//   node scenario.mjs prepare   → bookings, files, statuses, car position; prints the traveller links as JSON
//   node scenario.mjs trip      → starts the drop-off shuttle trip of the manager (for the « trip in progress » screen)
//   node scenario.mjs post X    → the manager's post of the day (driver: the « Ma tournée » tabs)
//
// Environment: API (default http://localhost:3005/api), MANAGER_EMAIL, MANAGER_PASSWORD. Never point it at production:
// it rewrites the demo bookings' dates and statuses.
const API = (process.env.API || 'http://localhost:3005/api').replace(/\/$/, '');
const EMAIL = process.env.MANAGER_EMAIL || 'demo-parkair-lyon@plazo.test';
const PASSWORD = process.env.MANAGER_PASSWORD;
if (!PASSWORD) throw new Error('MANAGER_PASSWORD is required');
if (/plazo\.fr/.test(API)) throw new Error('Refusing to stage screenshots against production');

let token = null;
async function call(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text.slice(0, 300)}`);
  return json;
}

async function login() {
  const res = await call('POST', '/internal/auth/login', { email: EMAIL, password: PASSWORD });
  token = res.tokenData.access.token;
}

// The parking's wall clock (Europe/Paris), from the server's own time (the API may run with a shifted clock).
let serverNow = null;
const pad = n => String(n).padStart(2, '0');
function parisParts(date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(p => [p.type, p.value]));
  return parts;
}
/** Local time `minutes` from now, rounded to 5 minutes, as the API's local datetime string. */
function inMinutes(minutes) {
  const d = new Date(serverNow.getTime() + minutes * 60_000);
  const p = parisParts(d);
  const m = Math.round(Number(p.minute) / 5) * 5;
  const rounded = new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), m));
  return `${rounded.getUTCFullYear()}-${pad(rounded.getUTCMonth() + 1)}-${pad(rounded.getUTCDate())}T${pad(rounded.getUTCHours())}:${pad(rounded.getUTCMinutes())}`;
}
/** A day relative to today (parking local) at a fixed local hour. */
function onDay(days, hhmm) {
  const p = parisParts(serverNow);
  const d = new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day) + days));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${hhmm}`;
}

const STAFF_BOOKINGS = [
  // Arrivals later today.
  { key: 'leroy', channel: 'phone', first: 'Sophie', last: 'Leroy', phone: '+33 6 00 00 00 11', plate: 'GH-312-KL', arrival: () => inMinutes(55), ret: () => onDay(6, '21:40'), pax: 2, out: 'EJU 4415', back: 'EJU 4416', model: 'Peugeot 3008', colour: 'gris' },
  { key: 'girard', channel: 'aggregator', detail: 'Allopark', first: 'Thomas', last: 'Girard', phone: '+33 6 00 00 00 12', plate: 'FB-208-PR', arrival: () => inMinutes(95), ret: () => onDay(3, '23:10'), pax: 1, back: 'AF 7655', model: 'Renault Clio', colour: 'blanche' },
  { key: 'fontaine', channel: 'website', first: 'Léa', last: 'Fontaine', phone: '+33 6 00 00 00 13', plate: 'DS-741-TA', arrival: () => inMinutes(150), ret: () => onDay(8, '10:20'), pax: 3, back: 'TO 3631', model: 'Toyota Yaris', colour: 'rouge' },
  { key: 'lambert', channel: 'aggregator', detail: 'Onepark', first: 'Hugo', last: 'Lambert', phone: '+33 6 00 00 00 14', plate: 'EK-530-VB', arrival: () => inMinutes(215), ret: () => onDay(2, '19:05'), pax: 2, back: 'EJU 4402', model: 'Volkswagen Golf', colour: 'bleue' },
  // On site since this morning.
  { key: 'benali', channel: 'phone', first: 'Nadia', last: 'Benali', phone: '+33 6 00 00 00 15', plate: 'CP-114-HM', arrival: () => onDay(0, '06:40'), ret: () => onDay(4, '17:25'), pax: 2, back: 'AF 7633', file: 'F02', status: ['arrived', 'shuttled_out'] },
  { key: 'petit', channel: 'website', first: 'Marc', last: 'Petit', phone: '+33 6 00 00 00 16', plate: 'AZ-902-LC', arrival: () => onDay(0, '09:15'), ret: () => onDay(10, '20:50'), pax: 1, back: 'EJU 4420', file: 'F05', status: ['arrived', 'shuttled_out'] },
  // Just arrived: the next drop-off shuttle.
  { key: 'moreau', channel: 'aggregator', detail: 'Parclick', first: 'Chloé', last: 'Moreau', phone: '+33 6 00 00 00 17', plate: 'BN-655-RT', arrival: () => inMinutes(-25), ret: () => onDay(5, '16:40'), pax: 2, out: 'TO 3626', back: 'TO 3627', file: 'F09', status: ['arrived'] },
  { key: 'roux', channel: 'phone', first: 'Antoine', last: 'Roux', phone: '+33 6 00 00 00 18', plate: 'HL-388-GD', arrival: () => inMinutes(-20), ret: () => onDay(3, '12:15'), pax: 1, out: 'AF 7640', back: 'AF 7641', status: ['arrived'] },
  // Coming back today.
  { key: 'garnier', channel: 'aggregator', detail: 'Allopark', first: 'Julie', last: 'Garnier', phone: '+33 6 00 00 00 19', plate: 'GT-271-NS', arrival: () => onDay(-5, '07:10'), ret: () => inMinutes(40), pax: 2, back: 'AF 7651', file: 'F03', status: ['arrived', 'shuttled_out'] },
  { key: 'haddad', channel: 'website', first: 'Karim', last: 'Haddad', phone: '+33 6 00 00 00 20', plate: 'FR-846-KD', arrival: () => onDay(-7, '05:55'), ret: () => inMinutes(100), pax: 3, back: 'EJU 4398', file: 'F04', status: ['arrived', 'shuttled_out'] },
  { key: 'laurent', channel: 'phone', first: 'Emma', last: 'Laurent', phone: '+33 6 00 00 00 21', plate: 'CM-519-WE', arrival: () => onDay(-2, '08:30'), ret: () => inMinutes(165), pax: 2, back: 'TO 3633', file: 'F06', status: ['arrived', 'shuttled_out'] },
  { key: 'cohen', channel: 'aggregator', detail: 'ParkMundo', first: 'Sarah', last: 'Cohen', phone: '+33 6 00 00 00 22', plate: 'EV-603-PA', arrival: () => onDay(-4, '06:20'), ret: () => inMinutes(15), pax: 1, back: 'AF 7649', file: 'F08', status: ['arrived', 'shuttled_out', 'return_requested'] },
  { key: 'mercier', channel: 'website', first: 'Paul', last: 'Mercier', phone: '+33 6 00 00 00 23', plate: 'BK-437-ZU', arrival: () => onDay(-6, '07:45'), ret: () => inMinutes(-35), pax: 2, back: 'EJU 4390', file: 'F10', status: ['arrived', 'shuttled_out', 'back_at_parking', 'returned'] },
  // Never came: the « no show » the dashboard asks about.
  { key: 'blanc', channel: 'phone', first: 'Vincent', last: 'Blanc', phone: '+33 6 00 00 00 24', plate: 'DJ-150-MX', arrival: () => inMinutes(-260), ret: () => onDay(3, '22:30'), pax: 1, back: 'TO 3619' },
];

const TRAVELLER_EMAILS = { RDEMX1: 'voyageur-1@plazo.test', RDEMX2: 'voyageur-2@plazo.test', RDEMX3: 'voyageur-3@plazo.test' };

async function findByQuery(q) {
  const res = await call('GET', `/internal/reservations?q=${encodeURIComponent(q)}&limit=20`);
  return (res.docs ?? []).find(r => r.reference === q || r.plate === q) ?? null;
}

async function setStatuses(id, statuses) {
  for (const status of statuses) await call('POST', `/internal/reservations/${id}/status`, { status });
}

async function prepare() {
  await login();
  const dashboard = await call('GET', '/internal/dashboard');
  serverNow = new Date(dashboard.serverTime);
  const parking = await call('GET', '/internal/parking');
  const parkingId = parking.id;
  // Parkair Lyon's position in the demo data (src/domain/demo-data.ts): the car is parked a few metres from it.
  const location = { lat: 45.6895, lng: 5.0505 };

  // The shuttle: eight seats.
  const vehicles = (await call('GET', '/internal/shuttle/vehicles')).data;
  if (vehicles[0] && vehicles[0].seats == null) await call('PATCH', `/internal/shuttle/vehicles/${vehicles[0].id}`, { seats: 8 });

  // Twelve valet files of eight cars.
  const existing = (await call('GET', `/internal/parkings/${parkingId}/files`));
  const existingFiles = existing.files ?? [];
  let files = existingFiles;
  if (!existingFiles.length) {
    const res = await call('PUT', `/internal/parkings/${parkingId}/files`, {
      files: Array.from({ length: 12 }, (_, i) => ({ code: `F${pad(i + 1)}`, capacity: 8, sortOrder: i })),
    });
    files = res.data;
  }
  const fileId = code => files.find(f => f.code === code)?.id;

  // The traveller's three bookings (made on Plazo by the demo seed).
  const plazo = {};
  for (const ref of Object.keys(TRAVELLER_EMAILS)) plazo[ref] = await findByQuery(ref);
  // Return day: Camille Martin flew out on Thursday, lands in about 1 h 15.
  const camille = plazo.RDEMX1;
  if (camille.status === 'upcoming') {
    await call('PATCH', `/internal/reservations/${camille.id}`, { arrivalAt: onDay(-3, '06:30'), returnAt: inMinutes(75) });
    await setStatuses(camille.id, ['arrived']);
    await call('POST', `/internal/reservations/${camille.id}/file`, {
      fileId: fileId('F07'), keyHook: 'B12', car: { lat: location.lat + 0.00042, lng: location.lng - 0.00031, accuracyM: 6 },
    });
    await setStatuses(camille.id, ['shuttled_out']);
  }
  // Day of drop-off: Inès Rousseau arrives in 35 minutes.
  const ines = plazo.RDEMX3;
  if (ines.status === 'upcoming') await call('PATCH', `/internal/reservations/${ines.id}`, { arrivalAt: inMinutes(35), returnAt: onDay(2, '11:30') });

  // A day at the parking.
  for (const b of STAFF_BOOKINGS) {
    if (await findByQuery(b.plate)) continue;
    const created = await call('POST', '/internal/reservations', {
      channel: b.channel,
      ...(b.detail ? { channelDetail: b.detail } : {}),
      arrivalAt: b.arrival(),
      returnAt: b.ret(),
      passengers: b.pax,
      customerFirstName: b.first,
      customerLastName: b.last,
      customerPhone: b.phone,
      plate: b.plate,
      ...(b.back ? { returnFlight: b.back } : {}),
      ...(b.out ? { departureFlight: b.out } : {}),
      ...(b.model ? { vehicleModel: b.model, vehicleColour: b.colour } : {}),
    });
    const id = (created.data ?? created).id;
    const statuses = b.status ?? [];
    if (statuses[0] === 'arrived') await setStatuses(id, ['arrived']);
    if (b.file) await call('POST', `/internal/reservations/${id}/file`, { fileId: fileId(b.file), keyHook: `${b.file.slice(1)}A` });
    if (statuses.length > 1) await setStatuses(id, statuses.slice(1));
  }

  // The traveller app opens a booking with its link (reference + key), as from the confirmation email.
  const links = {};
  for (const [ref, email] of Object.entries(TRAVELLER_EMAILS)) {
    const res = await fetch(`${API}/public/bookings/lookup`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reference: ref, email }) });
    links[ref] = (await res.json()).manageToken;
  }
  const leroy = await findByQuery('GH-312-KL');
  console.log(JSON.stringify({ serverNow: serverNow.toISOString(), parkingId, links, detailId: leroy.id }, null, 2));
}

async function trip() {
  await login();
  const dashboard = await call('GET', '/internal/dashboard');
  serverNow = new Date(dashboard.serverTime);
  const current = await call('GET', '/internal/shuttle/trips/current');
  let trip = current.trip;
  if (!trip) {
    const passengers = [await findByQuery('BN-655-RT'), await findByQuery('HL-388-GD')];
    const vehicles = (await call('GET', '/internal/shuttle/vehicles')).data;
    trip = (await call('POST', '/internal/shuttle/trips', { reservationIds: passengers.map(p => p.id), direction: 'dropoff', vehicleId: vehicles[0].id })).trip;
  }
  // Halfway to the terminal on the D29 (shared position, as the driver's phone would send it).
  await call('POST', `/internal/shuttle/trips/${trip.id}/position`, { lat: 45.7085, lng: 5.0672, accuracy: 8, recordedAt: serverNow.toISOString() });
  console.log(JSON.stringify({ tripId: trip.id }));
}

/** The manager's post of the day (the Plazo Pro tabs follow it): `node scenario.mjs post driver`. */
async function post() {
  await login();
  await call('PATCH', '/internal/staff/me/post', { post: process.argv[3] || 'manager' });
}

const step = process.argv[2] || 'prepare';
await ({ prepare, trip, post }[step] ?? (() => { throw new Error(`Unknown step ${step}`); }))();
