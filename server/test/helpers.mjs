import assert from 'node:assert/strict';
import request from 'supertest';

/** NC-105 : trace commune des scénarios d’intégration. */
export function tracerScenarioPivot(contexte, scenario) {
  const trace = `${scenario.method.toUpperCase()} ${scenario.path} => ${scenario.status}`;
  contexte?.diagnostic(trace);
  return trace;
}

/** NC-205 : rejouer une requête contre l’application construite sans app.listen. */
export async function rejouerTestPivot(app, scenario, contexte) {
  const trace = tracerScenarioPivot(contexte, scenario);
  let requete = request(app.getHttpServer())[scenario.method.toLowerCase()](
    scenario.path,
  );
  if (scenario.body !== undefined) requete = requete.send(scenario.body);
  const reponse = await requete;
  assert.equal(
    reponse.status,
    scenario.status,
    `${trace}: ${JSON.stringify(reponse.body)}`,
  );
  if (scenario.status >= 400) {
    assert.match(
      reponse.headers['content-type'],
      /^application\/problem\+json/,
    );
    assert.equal(reponse.body.status, scenario.status);
    for (const cle of ['type', 'title', 'detail', 'instance'])
      assert.equal(typeof reponse.body[cle], 'string');
    if (scenario.status === 400) assert.ok(reponse.body.errors?.length > 0);
  }
  return reponse;
}

export const salleValide = {
  nom: 'Salle Aix',
  adresse: '10 avenue du Sport',
  capacite: 100,
};
export const machineValide = {
  nom: 'Vélo',
  salleId: null,
  statut: 'disponible',
};
export const idAbsent = '00000000-0000-4000-8000-000000000099';
export const creneauDemo = '00000000-0000-4000-8000-000000000003';
export const mesureValide = { valeur: 10, horodatage: '2026-11-19T10:00:00Z' };
export async function creerSalle(app) {
  return (
    await rejouerTestPivot(app, {
      method: 'POST',
      path: '/salles',
      body: salleValide,
      status: 201,
    })
  ).body;
}
export async function creerMachine(app, salleId = null) {
  return (
    await rejouerTestPivot(app, {
      method: 'POST',
      path: '/machines',
      body: { ...machineValide, salleId },
      status: 201,
    })
  ).body;
}
export async function creerReservation(app) {
  return (
    await rejouerTestPivot(app, {
      method: 'POST',
      path: '/reservations',
      body: { creneauId: creneauDemo },
      status: 201,
    })
  ).body;
}
export function verifierEntite(reponse, valeurs, cles) {
  assert.deepEqual(Object.keys(reponse.body).sort(), [...cles].sort());
  assert.match(
    reponse.body.id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
  assert.ok(Number.isFinite(Date.parse(reponse.body.dateCreation)));
  for (const [cle, valeur] of Object.entries(valeurs))
    assert.deepEqual(reponse.body[cle], valeur);
}
