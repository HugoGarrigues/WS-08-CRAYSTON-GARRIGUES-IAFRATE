import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import {
  rejouerTestPivot,
  creerSalle,
  creerMachine,
  creerReservation,
  salleValide,
  machineValide,
  idAbsent,
  creneauDemo,
  mesureValide,
  verifierEntite,
} from './helpers.mjs';

let app;
beforeEach(async () => {
  app = await buildApp({ logger: false });
});
afterEach(async () => {
  await app?.close();
});
const clesSalle = ['id', 'nom', 'adresse', 'capacite', 'dateCreation'];
const clesMachine = [
  'id',
  'nom',
  'salleId',
  'statut',
  'compteurUtilisations',
  'dateCreation',
];

// Chaque cas construit une application neuve : les Map ne sont jamais partagées entre tests.
test('GET /salles : liste paginée depuis un état initial vide', async (t) => {
  const vide = await rejouerTestPivot(
    app,
    { method: 'GET', path: '/salles', status: 200 },
    t,
  );
  assert.deepEqual(vide.body, {
    items: [],
    page: 1,
    taille: 20,
    total: 0,
    pageSuivante: null,
  });
  await creerSalle(app);
  await creerSalle(app);
  const page = await rejouerTestPivot(
    app,
    { method: 'GET', path: '/salles?taille=1', status: 200 },
    t,
  );
  assert.equal(page.body.total, 2);
  assert.equal(page.body.items.length, 1);
  assert.equal(page.body.pageSuivante, 2);
});
test('GET /salles : pagination invalide refusée', async (t) => {
  await rejouerTestPivot(
    app,
    { method: 'GET', path: '/salles?taille=101', status: 400 },
    t,
  );
});
test('POST /salles : 201, Location et représentation complète', async (t) => {
  const r = await rejouerTestPivot(
    app,
    { method: 'POST', path: '/salles', body: salleValide, status: 201 },
    t,
  );
  verifierEntite(r, salleValide, clesSalle);
  assert.equal(r.headers.location, `/salles/${r.body.id}`);
});
test('POST /salles : champ inconnu et corps invalide refusés', async (t) => {
  for (const body of [
    { ...salleValide, inconnu: true },
    { ...salleValide, capacite: 0 },
    {},
  ]) {
    await rejouerTestPivot(
      app,
      { method: 'POST', path: '/salles', body, status: 400 },
      t,
    );
  }
});
test('GET /salles/{salleId} : lecture nominale', async (t) => {
  const s = await creerSalle(app);
  const r = await rejouerTestPivot(
    app,
    { method: 'GET', path: `/salles/${s.id}`, status: 200 },
    t,
  );
  verifierEntite(r, s, clesSalle);
});
test('GET /salles/{salleId} : salle absente', async (t) => {
  await rejouerTestPivot(
    app,
    { method: 'GET', path: `/salles/${idAbsent}`, status: 404 },
    t,
  );
});
test('PUT /salles/{salleId} : remplacement complet', async (t) => {
  const s = await creerSalle(app);
  const body = { nom: 'Autre salle', adresse: 'Autre adresse', capacite: 50 };
  const r = await rejouerTestPivot(
    app,
    { method: 'PUT', path: `/salles/${s.id}`, body, status: 200 },
    t,
  );
  verifierEntite(
    r,
    { ...body, id: s.id, dateCreation: s.dateCreation },
    clesSalle,
  );
});
test('PUT /salles/{salleId} : remplacement incomplet et salle absente', async (t) => {
  const s = await creerSalle(app);
  await rejouerTestPivot(
    app,
    {
      method: 'PUT',
      path: `/salles/${s.id}`,
      body: { nom: 'Incomplet' },
      status: 400,
    },
    t,
  );
  await rejouerTestPivot(
    app,
    {
      method: 'PUT',
      path: `/salles/${idAbsent}`,
      body: salleValide,
      status: 404,
    },
    t,
  );
});
test('PATCH /salles/{salleId} : préserver les champs non modifiés', async (t) => {
  const s = await creerSalle(app);
  const r = await rejouerTestPivot(
    app,
    {
      method: 'PATCH',
      path: `/salles/${s.id}`,
      body: { capacite: 80 },
      status: 200,
    },
    t,
  );
  assert.deepEqual(r.body, { ...s, capacite: 80 });
});
test('PATCH /salles/{salleId} : null et champ en lecture seule refusés', async (t) => {
  const s = await creerSalle(app);
  for (const body of [{ nom: null }, { id: idAbsent }])
    await rejouerTestPivot(
      app,
      { method: 'PATCH', path: `/salles/${s.id}`, body, status: 400 },
      t,
    );
});
test('DELETE /salles/{salleId} : 204 sans corps puis 404', async (t) => {
  const s = await creerSalle(app);
  const r = await rejouerTestPivot(
    app,
    { method: 'DELETE', path: `/salles/${s.id}`, status: 204 },
    t,
  );
  assert.equal(r.text, '');
  await rejouerTestPivot(
    app,
    { method: 'GET', path: `/salles/${s.id}`, status: 404 },
    t,
  );
});
test('DELETE /salles/{salleId} : ressource absente et conflit métier', async (t) => {
  await rejouerTestPivot(
    app,
    { method: 'DELETE', path: `/salles/${idAbsent}`, status: 404 },
    t,
  );
  const s = await creerSalle(app);
  await creerMachine(app, s.id);
  await rejouerTestPivot(
    app,
    { method: 'DELETE', path: `/salles/${s.id}`, status: 409 },
    t,
  );
});

test('GET /machines : pagination et filtre par salle', async (t) => {
  const s = await creerSalle(app);
  const m = await creerMachine(app, s.id);
  await creerMachine(app);
  const r = await rejouerTestPivot(
    app,
    { method: 'GET', path: `/machines?salle=${s.id}`, status: 200 },
    t,
  );
  assert.deepEqual(r.body, {
    items: [m],
    page: 1,
    taille: 20,
    total: 1,
    pageSuivante: null,
  });
});
test('GET /machines : filtre UUID invalide refusé', async (t) => {
  await rejouerTestPivot(
    app,
    { method: 'GET', path: '/machines?salle=invalide', status: 400 },
    t,
  );
});
test('POST /machines : création et compteur initial à zéro', async (t) => {
  const r = await rejouerTestPivot(
    app,
    { method: 'POST', path: '/machines', body: machineValide, status: 201 },
    t,
  );
  verifierEntite(r, { ...machineValide, compteurUtilisations: 0 }, clesMachine);
  assert.equal(r.headers.location, `/machines/${r.body.id}`);
});
test('POST /machines : salle absente, statut et champs invalides', async (t) => {
  await rejouerTestPivot(
    app,
    {
      method: 'POST',
      path: '/machines',
      body: { ...machineValide, salleId: idAbsent },
      status: 404,
    },
    t,
  );
  for (const body of [
    { ...machineValide, statut: 'invalide' },
    { ...machineValide, compteurUtilisations: 10 },
  ]) {
    await rejouerTestPivot(
      app,
      { method: 'POST', path: '/machines', body, status: 400 },
      t,
    );
  }
});
test('GET /machines/{machineId} : lecture nominale', async (t) => {
  const m = await creerMachine(app);
  const r = await rejouerTestPivot(
    app,
    { method: 'GET', path: `/machines/${m.id}`, status: 200 },
    t,
  );
  verifierEntite(r, m, clesMachine);
});
test('GET /machines/{machineId} : machine absente', async (t) => {
  await rejouerTestPivot(
    app,
    { method: 'GET', path: `/machines/${idAbsent}`, status: 404 },
    t,
  );
});
test('PUT /machines/{machineId} : remplacement complet', async (t) => {
  const m = await creerMachine(app);
  const s = await creerSalle(app);
  const body = { nom: 'Rameur', salleId: s.id, statut: 'maintenance' };
  const r = await rejouerTestPivot(
    app,
    { method: 'PUT', path: `/machines/${m.id}`, body, status: 200 },
    t,
  );
  verifierEntite(r, { ...m, ...body }, clesMachine);
});
test('PUT /machines/{machineId} : corps incomplet et machine absente', async (t) => {
  const m = await creerMachine(app);
  await rejouerTestPivot(
    app,
    {
      method: 'PUT',
      path: `/machines/${m.id}`,
      body: { nom: 'Incomplet' },
      status: 400,
    },
    t,
  );
  await rejouerTestPivot(
    app,
    {
      method: 'PUT',
      path: `/machines/${idAbsent}`,
      body: machineValide,
      status: 404,
    },
    t,
  );
});
test('PATCH /machines/{machineId} : préserver les champs absents', async (t) => {
  const m = await creerMachine(app);
  const r = await rejouerTestPivot(
    app,
    {
      method: 'PATCH',
      path: `/machines/${m.id}`,
      body: { statut: 'maintenance' },
      status: 200,
    },
    t,
  );
  assert.deepEqual(r.body, { ...m, statut: 'maintenance' });
});
test('PATCH /machines/{machineId} : statut invalide et champ inconnu', async (t) => {
  const m = await creerMachine(app);
  for (const body of [{ statut: null }, { inconnu: 1 }])
    await rejouerTestPivot(
      app,
      { method: 'PATCH', path: `/machines/${m.id}`, body, status: 400 },
      t,
    );
});
test('DELETE /machines/{machineId} : suppression sans corps', async (t) => {
  const m = await creerMachine(app);
  const r = await rejouerTestPivot(
    app,
    { method: 'DELETE', path: `/machines/${m.id}`, status: 204 },
    t,
  );
  assert.equal(r.text, '');
  await rejouerTestPivot(
    app,
    { method: 'GET', path: `/machines/${m.id}`, status: 404 },
    t,
  );
});
test('DELETE /machines/{machineId} : machine absente', async (t) => {
  await rejouerTestPivot(
    app,
    { method: 'DELETE', path: `/machines/${idAbsent}`, status: 404 },
    t,
  );
});
test('PUT /machines/{machineId}/compteur : 204 et valeur mise à jour', async (t) => {
  const m = await creerMachine(app);
  const r = await rejouerTestPivot(
    app,
    {
      method: 'PUT',
      path: `/machines/${m.id}/compteur`,
      body: mesureValide,
      status: 204,
    },
    t,
  );
  assert.equal(r.text, '');
  const lecture = await rejouerTestPivot(
    app,
    { method: 'GET', path: `/machines/${m.id}`, status: 200 },
    t,
  );
  assert.equal(lecture.body.compteurUtilisations, mesureValide.valeur);
});
test('PUT /machines/{machineId}/compteur : corps invalide, absence et régression', async (t) => {
  const m = await creerMachine(app);
  const path = `/machines/${m.id}/compteur`;
  await rejouerTestPivot(
    app,
    { method: 'PUT', path, body: { valeur: -1 }, status: 422 },
    t,
  );
  await rejouerTestPivot(
    app,
    {
      method: 'PUT',
      path: `/machines/${idAbsent}/compteur`,
      body: mesureValide,
      status: 404,
    },
    t,
  );
  await rejouerTestPivot(
    app,
    { method: 'PUT', path, body: mesureValide, status: 204 },
    t,
  );
  await rejouerTestPivot(
    app,
    { method: 'PUT', path, body: { ...mesureValide, valeur: 9 }, status: 409 },
    t,
  );
});

test('POST /reservations : 201, Location et état active', async (t) => {
  const r = await rejouerTestPivot(
    app,
    {
      method: 'POST',
      path: '/reservations',
      body: { creneauId: creneauDemo },
      status: 201,
    },
    t,
  );
  verifierEntite(
    r,
    {
      creneauId: creneauDemo,
      adherentId: '00000000-0000-4000-8000-000000000002',
      statut: 'active',
    },
    ['id', 'adherentId', 'creneauId', 'statut', 'dateCreation'],
  );
  assert.equal(r.headers.location, `/reservations/${r.body.id}`);
});
test('POST /reservations : champ inconnu, UUID invalide et créneau absent', async (t) => {
  for (const body of [
    { creneauId: creneauDemo, inconnu: true },
    { creneauId: 'invalide' },
  ])
    await rejouerTestPivot(
      app,
      { method: 'POST', path: '/reservations', body, status: 400 },
      t,
    );
  await rejouerTestPivot(
    app,
    {
      method: 'POST',
      path: '/reservations',
      body: { creneauId: idAbsent },
      status: 404,
    },
    t,
  );
});
test('GET /reservations/{reservationId} : relire la réservation créée', async (t) => {
  const reservation = await creerReservation(app);
  const r = await rejouerTestPivot(
    app,
    { method: 'GET', path: `/reservations/${reservation.id}`, status: 200 },
    t,
  );
  assert.deepEqual(r.body, reservation);
});
test('GET /reservations/{reservationId} : réservation absente', async (t) => {
  await rejouerTestPivot(
    app,
    { method: 'GET', path: `/reservations/${idAbsent}`, status: 404 },
    t,
  );
});
test('GET /health/live : application initialisée sans app.listen', async (t) => {
  assert.equal(app.getHttpServer().listening, false);
  const r = await rejouerTestPivot(
    app,
    { method: 'GET', path: '/health/live', status: 200 },
    t,
  );
  assert.deepEqual(r.body, { status: 'ok' });
});
