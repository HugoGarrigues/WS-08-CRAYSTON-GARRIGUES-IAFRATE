import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import {
  rejouerTestPivot,
  salleValide,
  creerSalle,
  creerMachine,
} from './helpers.mjs';
let app;
beforeEach(async () => {
  app = await buildApp({ logger: false });
});
afterEach(async () => {
  await app?.close();
});

test('Schemathesis ST204 : TRACE /salles doit renvoyer 405 avec Allow', async (t) => {
  const r = await rejouerTestPivot(
    app,
    { method: 'TRACE', path: '/salles', body: salleValide, status: 405 },
    t,
  );
  const autorisees = r.headers.allow.split(/,\s*/);
  assert.ok(autorisees.includes('GET'));
  assert.ok(autorisees.includes('POST'));
  assert.ok(!autorisees.includes('TRACE'));
});

test('GET /health/live : une méthode POST est refusée', async (t) => {
  const r = await rejouerTestPivot(
    app,
    { method: 'POST', path: '/health/live', status: 405 },
    t,
  );
  assert.match(r.headers.allow, /GET/);
});
test('Une route inconnue reste une 404', async (t) => {
  await rejouerTestPivot(
    app,
    { method: 'GET', path: '/route-absente', status: 404 },
    t,
  );
});
test('Schemathesis ST201 : en-tête X-Request-Id invalide refusé', async () => {
  const { default: request } = await import('supertest');
  await request(app.getHttpServer())
    .get('/salles')
    .set('X-Request-Id', '')
    .expect(400)
    .expect('Content-Type', /application\/problem\+json/);
  await request(app.getHttpServer())
    .get('/salles')
    .set('X-Request-Id', '00000000-0000-4000-8000-000000000001')
    .expect(200);
});
test('OPTIONS annonce les méthodes réellement disponibles', async (t) => {
  const r = await rejouerTestPivot(
    app,
    { method: 'OPTIONS', path: '/salles', status: 204 },
    t,
  );
  assert.deepEqual(
    r.headers.allow
      .split(/,\s*/)
      .filter((m) => !['HEAD', 'OPTIONS'].includes(m))
      .sort(),
    ['GET', 'POST'],
  );
});

test('Schemathesis ST401 : les réservations publiques sont déclarées sans authentification', async (t) => {
  const r = await rejouerTestPivot(
    app,
    { method: 'GET', path: '/api-json', status: 200 },
    t,
  );
  assert.deepEqual(r.body.paths['/reservations'].post.security, []);
  assert.deepEqual(
    r.body.paths['/reservations/{reservationId}'].get.security,
    [],
  );
});

test('Schemathesis ST201 : PATCH sans corps est refusé, un objet vide reste valide', async (t) => {
  const s = await creerSalle(app);
  const m = await creerMachine(app);
  for (const path of [`/salles/${s.id}`, `/machines/${m.id}`]) {
    await rejouerTestPivot(app, { method: 'PATCH', path, status: 400 }, t);
    await rejouerTestPivot(
      app,
      { method: 'PATCH', path, body: {}, status: 200 },
      t,
    );
  }
});
test('Schemathesis ST202 : accepter les dates RFC 3339 avec grand décalage horaire', async (t) => {
  const m = await creerMachine(app);
  const path = `/machines/${m.id}/compteur`;
  await rejouerTestPivot(
    app,
    {
      method: 'PUT',
      path,
      body: { valeur: 3913208338, horodatage: '0197-07-07T09:31:51+14:27' },
      status: 204,
    },
    t,
  );
  for (const horodatage of [
    '2026-02-30T10:00:00Z',
    '2026-11-19T10:00:00',
    'demain',
  ]) {
    await rejouerTestPivot(
      app,
      {
        method: 'PUT',
        path,
        body: { valeur: 3913208338, horodatage },
        status: 422,
      },
      t,
    );
  }
});
