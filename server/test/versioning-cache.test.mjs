import { beforeEach, afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { buildApp } from '../dist/app.js';
import { creerSalle, creerMachine, creneauDemo, idAbsent } from './helpers.mjs';

let app;
beforeEach(async () => {
  app = await buildApp({ logger: false });
});
afterEach(async () => {
  await app?.close();
});
const uri = `/creneaux/${creneauDemo}`;
function verifierDeprecation(reponse, chemin) {
  assert.equal(reponse.headers.deprecation, '@1795046400');
  assert.equal(reponse.headers.sunset, 'Wed, 30 Jun 2027 23:59:59 GMT');
  assert.equal(reponse.headers.link, `</v2${chemin}>; rel="successor-version"`);
}

test('V1 : URI et capacité entière conservées ; trois en-têtes annoncés par ADR 0001', async () => {
  const salle = await creerSalle(app);
  const r = await request(app.getHttpServer())
    .get(`/salles/${salle.id}`)
    .expect(200);
  assert.equal(r.body.capacite, 100);
  verifierDeprecation(r, `/salles/${salle.id}`);
  const erreur = await request(app.getHttpServer())
    .post('/salles')
    .send({ inconnu: true })
    .expect(400);
  verifierDeprecation(erreur, '/salles');
});

test('GET créneau : ETag fort, cache revalidé et 304 sans corps', async () => {
  const a = await request(app.getHttpServer()).get(uri).expect(200);
  assert.match(a.headers.etag, /^"[a-f0-9]{64}"$/);
  assert.equal(a.body.id, creneauDemo);
  assert.equal(a.headers['cache-control'], 'no-cache');
  verifierDeprecation(a, uri);
  const cache = await request(app.getHttpServer())
    .get(uri)
    .set('If-None-Match', a.headers.etag)
    .expect(304);
  assert.equal(cache.text, '');
  assert.equal(cache.headers.etag, a.headers.etag);
  assert.equal(cache.headers['cache-control'], 'no-cache');
  verifierDeprecation(cache, uri);
});

test('Deux clients : A écrit ; B reçoit 412 avec son ETag périmé ; la version A est conservée', async () => {
  const a = await request(app.getHttpServer()).get(uri).expect(200);
  const b = await request(app.getHttpServer()).get(uri).expect(200);
  assert.equal(a.headers.etag, b.headers.etag);
  const majA = await request(app.getHttpServer())
    .patch(uri)
    .set('If-Match', a.headers.etag)
    .send({ libelle: 'Choix du client A' })
    .expect(200);
  assert.notEqual(majA.headers.etag, a.headers.etag);
  verifierDeprecation(majA, uri);
  const majB = await request(app.getHttpServer())
    .patch(uri)
    .set('If-Match', b.headers.etag)
    .send({ libelle: 'Choix du client B' })
    .expect(412);
  assert.match(majB.headers['content-type'], /^application\/problem\+json/);
  assert.equal(majB.body.status, 412);
  verifierDeprecation(majB, uri);
  const relu = await request(app.getHttpServer()).get(uri).expect(200);
  assert.equal(relu.body.libelle, 'Choix du client A');
  assert.equal(relu.headers.etag, majA.headers.etag);
  await request(app.getHttpServer())
    .get(uri)
    .set('If-None-Match', a.headers.etag)
    .expect(200);
});

test('PATCH créneau : 428 sans If-Match ; 400 invalide ; 404 si absent', async () => {
  const initial = await request(app.getHttpServer()).get(uri).expect(200);
  const manque = await request(app.getHttpServer())
    .patch(uri)
    .send({ libelle: 'Modification refusée' })
    .expect(428);
  assert.equal(manque.body.status, 428);
  assert.match(manque.headers['content-type'], /^application\/problem\+json/);
  verifierDeprecation(manque, uri);
  const relu = await request(app.getHttpServer()).get(uri).expect(200);
  assert.deepEqual(relu.body, initial.body);
  assert.equal(relu.headers.etag, initial.headers.etag);
  await request(app.getHttpServer())
    .patch(uri)
    .set('If-Match', initial.headers.etag)
    .send({ libelle: 'Nom', inconnu: true })
    .expect(400);
  await request(app.getHttpServer()).get(`/creneaux/${idAbsent}`).expect(404);
  await request(app.getHttpServer())
    .patch(`/creneaux/${idAbsent}`)
    .set('If-Match', '*')
    .send({ libelle: 'Absent' })
    .expect(404);
});

test('Comparaison faible pour le cache, forte pour les écritures et liste de validateurs', async () => {
  const initial = await request(app.getHttpServer()).get(uri).expect(200);
  await request(app.getHttpServer())
    .get(uri)
    .set('If-None-Match', `"autre", W/${initial.headers.etag}`)
    .expect(304);
  await request(app.getHttpServer())
    .patch(uri)
    .set('If-Match', `W/${initial.headers.etag}`)
    .send({ libelle: 'Refusé' })
    .expect(412);
  await request(app.getHttpServer())
    .patch(uri)
    .set('If-Match', `"autre", ${initial.headers.etag}`)
    .send({ libelle: 'Accepté' })
    .expect(200);
});

test('Contrats : v1 en 1.0.0 dépréciée, v2 en 2.0.0 et capacité réellement cassante', () => {
  const v1 = parse(
    readFileSync(new URL('../../openapi.yaml', import.meta.url), 'utf8'),
  );
  const v2 = parse(
    readFileSync(new URL('../../openapi-v2.yaml', import.meta.url), 'utf8'),
  );
  assert.equal(v1.info.version, '1.0.0');
  assert.equal(v2.info.version, '2.0.0');
  assert.equal(v1.components.schemas.Salle.properties.capacite.type, 'integer');
  assert.equal(v2.components.schemas.Salle.properties.capacite.type, 'object');
  assert.deepEqual(v2.components.schemas.Salle.properties.capacite.required, [
    'totale',
    'accessible',
  ]);
  assert.equal(v1.servers[0].url, 'http://localhost:3000');
  assert.equal(v2.servers[0].url, 'http://localhost:3000/v2');
  assert.equal(v1.paths['/salles'].get.deprecated, true);
  assert.notEqual(v2.paths['/salles'].get.deprecated, true);
});

test('Une salle absente sur PUT/PATCH machine donne 404 sans supprimer la machine', async () => {
  const salle = await creerSalle(app);
  const machine = await creerMachine(app, salle.id);
  const path = `/machines/${machine.id}`;
  const remplacee = await request(app.getHttpServer())
    .put(path)
    .send({ nom: 'Nom refusé', statut: 'maintenance', salleId: idAbsent })
    .expect(404);
  assert.match(remplacee.body.type, /salle-introuvable$/);
  await request(app.getHttpServer())
    .patch(path)
    .send({ salleId: idAbsent })
    .expect(404);
  const relue = await request(app.getHttpServer()).get(path).expect(200);
  assert.deepEqual(relue.body, machine);
});
