import 'reflect-metadata';
import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module.js';
import { configurerApplication } from '../dist/common/configurer-application.js';
import { ProblemDetailsFilter } from '../dist/common/errors/problem-details.filter.js';
let app, base;
before(async () => {
  const ancienMode = process.env.TP4_DEMO;
  process.env.TP4_DEMO = '1';
  app = await NestFactory.create(AppModule, { logger: false });
  if (ancienMode === undefined) delete process.env.TP4_DEMO;
  else process.env.TP4_DEMO = ancienMode;
  configurerApplication(app);
  await app.listen(0, '127.0.0.1');
  base = await app.getUrl();
});
after(async () => {
  await app?.close();
});
async function req(path, method = 'GET', body, jeton) {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await res.text();
  return {
    status: res.status,
    headers: res.headers,
    body: text ? JSON.parse(text) : undefined,
  };
}
function problem(res, status, champ) {
  assert.equal(res.status, status);
  assert.match(res.headers.get('content-type'), /^application\/problem\+json/);
  assert.equal(res.body.status, status);
  assert.ok(res.body.type && res.body.title && res.body.instance);
  if (champ)
    assert.ok(
      res.body.errors.some((e) => e.champ === champ),
      JSON.stringify(res.body),
    );
}
const salle = {
  nom: 'Salle Aix',
  adresse: '10 avenue du Sport',
  capacite: 100,
};
const machine = { salleId: null, nom: 'Vélo', statut: 'disponible' };
for (const [resource, data] of [
  ['salles', salle],
  ['machines', machine],
]) {
  test(`CRUD complet ${resource}, PUT distinct du PATCH et champs protégés`, async () => {
    const created = await req('/' + resource, 'POST', data);
    assert.equal(created.status, 201);
    const uri = created.headers.get('location');
    assert.equal(uri, `/${resource}/${created.body.id}`);
    assert.equal((await req(uri)).status, 200);
    const patched = await req(uri, 'PATCH', { nom: 'Nouveau nom' });
    assert.equal(patched.status, 200);
    assert.deepEqual(patched.body, { ...created.body, nom: 'Nouveau nom' });
    problem(await req(uri, 'PATCH', { nom: null }), 400, 'nom');
    problem(await req(uri, 'PUT', { nom: 'Incomplet' }), 400);
    for (const key of [
      'id',
      'dateCreation',
      ...(resource === 'machines' ? ['compteurUtilisations'] : []),
    ]) {
      problem(await req(uri, 'PATCH', { [key]: created.body[key] }), 400, key);
    }
    const replaced = await req(uri, 'PUT', { ...data, nom: 'Remplacé' });
    assert.equal(replaced.status, 200);
    assert.equal(replaced.body.nom, 'Remplacé');
    assert.equal(replaced.body.dateCreation, created.body.dateCreation);
    const deleted = await req(uri, 'DELETE');
    assert.equal(deleted.status, 204);
    assert.equal(deleted.body, undefined);
    problem(await req(uri), 404);
    problem(await req(uri, 'DELETE'), 404);
    problem(await req('/' + resource + '/invalide'), 400);
  });
  test(`Validation ${resource}`, async () => {
    problem(
      await req('/' + resource, 'POST', { ...data, inconnu: true }),
      400,
      'inconnu',
    );
    problem(await req('/' + resource, 'POST', {}), 400);
    problem(
      await req('/' + resource, 'POST', { ...data, nom: '' }),
      400,
      'nom',
    );
    problem(
      await req('/' + resource, 'POST', { ...data, nom: 'x'.repeat(101) }),
      400,
      'nom',
    );
  });
  test(`Pagination ${resource} : bornes, découpage, ordre et suite`, async () => {
    const uris = [];
    try {
      for (let i = 0; i < 3; i++)
        uris.push(
          (await req('/' + resource, 'POST', data)).headers.get('location'),
        );
      const ids = [];
      for (let page = 1; page <= 4; page++) {
        const result = await req(`/${resource}?page=${page}&taille=1`);
        assert.equal(result.status, 200);
        assert.equal(result.body.total, 3);
        assert.equal(result.body.pageSuivante, page < 3 ? page + 1 : null);
        ids.push(...result.body.items.map((i) => i.id));
      }
      assert.equal(new Set(ids).size, 3);
      assert.deepEqual(ids, [...ids].sort());
      for (const [key, values] of [
        ['page', ['0', '-1', 'abc', '1.5', '', '9007199254740992']],
        ['taille', ['0', '-1', 'abc', '101', '1.5']],
      ]) {
        for (const value of values)
          problem(await req(`/${resource}?${key}=${value}`), 400, key);
      }
      problem(await req(`/${resource}?page=1&page=2`), 400, 'page');
      problem(await req(`/${resource}?inconnu=1`), 400, 'inconnu');
      assert.equal((await req(`/${resource}?taille=100`)).status, 200);
    } finally {
      for (const uri of uris) await req(uri, 'DELETE');
    }
  });
}
test('Capacité invalide, relation salle, filtrage et suppression protégée', async () => {
  problem(
    await req('/salles', 'POST', { ...salle, capacite: 0 }),
    400,
    'capacite',
  );
  problem(
    await req('/salles', 'POST', { ...salle, capacite: '100' }),
    400,
    'capacite',
  );
  const room = await req('/salles', 'POST', salle);
  const m = await req('/machines', 'POST', {
    ...machine,
    salleId: room.body.id,
  });
  assert.equal(m.status, 201);
  const uri = m.headers.get('location');
  assert.equal((await req(`/machines?salle=${room.body.id}`)).body.total, 1);
  problem(await req('/machines?salle=invalide'), 400, 'salle');
  problem(
    await req('/machines', 'POST', {
      ...machine,
      salleId: '00000000-0000-4000-8000-000000000001',
    }),
    404,
  );
  problem(
    await req('/machines', 'POST', { nom: 'Sans salle', statut: 'disponible' }),
    400,
    'salleId',
  );
  problem(await req(room.headers.get('location'), 'DELETE'), 409);
  assert.equal((await req(uri, 'PATCH', { salleId: null })).body.salleId, null);
  assert.equal((await req(room.headers.get('location'), 'DELETE')).status, 204);
  await req(uri, 'DELETE');
});
test('Compteur TP3 : 422, 204, rejeu et conflits 409', async () => {
  const created = await req('/machines', 'POST', machine);
  const uri = created.headers.get('location');
  const compteur = uri + '/compteur';
  problem(await req(compteur, 'PUT', { valeur: -1 }), 422, 'valeur');
  problem(
    await req(compteur, 'PUT', {
      valeur: 1,
      horodatage: '2026-11-16T10:00:00',
    }),
    422,
    'horodatage',
  );
  const mesure = { valeur: 10, horodatage: '2026-11-16T10:00:00Z' };
  for (let i = 0; i < 2; i++) {
    const result = await req(compteur, 'PUT', mesure);
    assert.equal(result.status, 204);
    assert.equal(result.body, undefined);
  }
  for (const body of [
    { valeur: 9, horodatage: '2026-11-16T11:00:00Z' },
    { valeur: 11, horodatage: '2026-11-16T09:00:00Z' },
    { valeur: 11, horodatage: mesure.horodatage },
  ])
    problem(await req(compteur, 'PUT', body), 409);
  assert.equal((await req(uri)).body.compteurUtilisations, 10);
  await req(uri, 'DELETE');
});
test('500 générique : trace journalisée, aucun secret exposé', () => {
  const filter = new ProblemDetailsFilter();
  let logged = false,
    payload,
    status,
    type;
  filter.logger = {
    error() {
      logged = true;
    },
  };
  const response = {
    status(value) {
      status = value;
      return this;
    },
    type(value) {
      type = value;
      return this;
    },
    json(value) {
      payload = value;
    },
  };
  filter.catch(new Error('SECRET_INTERNE'), {
    switchToHttp: () => ({
      getRequest: () => ({ method: 'GET', url: '/test' }),
      getResponse: () => response,
    }),
  });
  assert.equal(status, 500);
  assert.equal(type, 'application/problem+json');
  assert.equal(logged, true);
  assert.ok(!JSON.stringify(payload).includes('SECRET_INTERNE'));
});

const idCreneau = (numero) =>
  `00000000-0000-4000-8000-${String(numero).padStart(12, '0')}`;
test('Réservations : identité, validation, propriété et rôle', async () => {
  const body = { creneauId: idCreneau(3) };
  const anonyme = await req('/reservations', 'POST', body);
  problem(anonyme, 401);
  assert.equal(anonyme.headers.get('www-authenticate'), 'Bearer');
  problem(await req('/reservations', 'POST', body, 'inconnu'), 401);
  problem(await req('/reservations', 'POST', body, 'demo-borne-only'), 403);
  problem(
    await req(
      '/reservations',
      'POST',
      { ...body, adherentId: idCreneau(7) },
      'demo-local-only',
    ),
    400,
    'adherentId',
  );
  problem(
    await req(
      '/reservations',
      'POST',
      { creneauId: 'invalide' },
      'demo-local-only',
    ),
    400,
    'creneauId',
  );
  problem(
    await req(
      '/reservations',
      'POST',
      { creneauId: idCreneau(99) },
      'demo-local-only',
    ),
    404,
  );
  const created = await req('/reservations', 'POST', body, 'demo-local-only');
  assert.equal(created.status, 201);
  assert.equal(created.body.statut, 'active');
  assert.equal(created.body.adherentId, idCreneau(2));
  assert.equal(
    created.headers.get('location'),
    `/reservations/${created.body.id}`,
  );
  const location = created.headers.get('location');
  assert.deepEqual(
    (await req(location, 'GET', undefined, 'demo-local-only')).body,
    created.body,
  );
  problem(await req(location, 'GET', undefined, 'demo-second-adherent'), 403);
  assert.equal(
    (await req(location, 'GET', undefined, 'demo-admin-only')).status,
    200,
  );
  problem(
    await req(
      `/reservations/${idCreneau(99)}`,
      'GET',
      undefined,
      'demo-local-only',
    ),
    404,
  );
});
test('Réservations : doublon, capacité concurrente et quota Basic côté serveur', async () => {
  problem(
    await req(
      '/reservations',
      'POST',
      { creneauId: idCreneau(3) },
      'demo-local-only',
    ),
    409,
  );
  problem(
    await req(
      '/reservations',
      'POST',
      { creneauId: idCreneau(3) },
      'demo-second-adherent',
    ),
    409,
  );
  const concurrentes = await Promise.all(
    [1, 2].map(() =>
      req(
        '/reservations',
        'POST',
        { creneauId: idCreneau(4) },
        'demo-local-only',
      ),
    ),
  );
  assert.deepEqual(concurrentes.map((r) => r.status).sort(), [201, 409]);
  const quota = await req(
    '/reservations',
    'POST',
    { creneauId: idCreneau(5) },
    'demo-local-only',
  );
  problem(quota, 429);
  assert.match(quota.body.type, /quota-reservations$/);
  assert.ok(Number(quota.headers.get('retry-after')) > 0);
  assert.equal(
    (
      await req(
        '/reservations',
        'POST',
        { creneauId: idCreneau(5) },
        'demo-second-adherent',
      )
    ).status,
    201,
  );
});
test('Réservations : limite technique distincte du quota', async () => {
  let limite;
  for (let i = 0; i <= 100; i++) {
    const result = await req(
      `/reservations/${idCreneau(99)}`,
      'GET',
      undefined,
      'demo-admin-only',
    );
    if (result.status === 429) {
      limite = result;
      break;
    }
    assert.equal(result.status, 404);
  }
  assert.ok(limite);
  problem(limite, 429);
  assert.equal(limite.headers.get('ratelimit-limit'), '100');
  assert.equal(limite.headers.get('ratelimit-remaining'), '0');
  assert.ok(Number(limite.headers.get('retry-after')) > 0);
});
test('Les jetons de démo ne fonctionnent pas sans activation explicite', async () => {
  const ancienMode = process.env.TP4_DEMO;
  delete process.env.TP4_DEMO;
  let autre;
  try {
    autre = await NestFactory.create(AppModule, { logger: false });
    configurerApplication(autre);
    await autre.listen(0, '127.0.0.1');
    const res = await fetch((await autre.getUrl()) + '/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-local-only',
      },
      body: JSON.stringify({ creneauId: idCreneau(3) }),
    });
    assert.equal(res.status, 401);
  } finally {
    await autre?.close();
    if (ancienMode === undefined) delete process.env.TP4_DEMO;
    else process.env.TP4_DEMO = ancienMode;
  }
});

test('Sonde publique /health/live', async () => {
  const result = await req('/health/live');
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { status: 'ok' });
});
