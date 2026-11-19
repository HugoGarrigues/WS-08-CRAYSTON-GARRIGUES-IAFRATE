import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

/** NC-206 : figer une v2 indépendante sans modifier le contrat v1. */
export function figerContratPivot(v1) {
  const v2 = structuredClone(v1);
  v2.info.version = '2.0.0';
  v2.servers = v1.servers.map((serveur) => ({
    ...serveur,
    url: serveur.url.replace(/\/$/, '') + '/v2',
  }));
  const capacite = {
    type: 'object',
    additionalProperties: false,
    required: ['totale', 'accessible'],
    description:
      'Capacité détaillée des salles en v2 ; remplace le nombre entier de la v1.',
    properties: {
      totale: { type: 'integer', minimum: 1 },
      accessible: { type: 'integer', minimum: 0 },
    },
  };
  for (const nom of ['Salle', 'CreationSalle', 'ModificationSalle']) {
    v2.components.schemas[nom].properties.capacite = structuredClone(capacite);
  }
  const visites = new WeakSet();
  function adapter(noeud) {
    if (!noeud || typeof noeud !== 'object' || visites.has(noeud)) return;
    visites.add(noeud);
    if (Array.isArray(noeud)) {
      noeud.forEach(adapter);
      return;
    }
    if (
      typeof noeud.capacite === 'number' &&
      ('adresse' in noeud || Object.keys(noeud).length === 1)
    ) {
      noeud.capacite = { totale: noeud.capacite, accessible: 0 };
    }
    if (typeof noeud.instance === 'string' && noeud.instance.startsWith('/'))
      noeud.instance = '/v2' + noeud.instance;
    if (noeud.Location?.example?.startsWith('/'))
      noeud.Location.example = '/v2' + noeud.Location.example;
    if (noeud.headers)
      for (const nom of ['Deprecation', 'Sunset', 'Link'])
        delete noeud.headers[nom];
    delete noeud.deprecated;
    Object.values(noeud).forEach(adapter);
  }
  adapter(v2);
  for (const nom of ['Deprecation', 'Sunset', 'Link'])
    delete v2.components.headers[nom];
  return v2;
}

const racine = new URL('../../', import.meta.url);
const v1 = parse(readFileSync(new URL('openapi.yaml', racine), 'utf8'));
const cible = new URL('openapi-v2.yaml', racine);
writeFileSync(
  cible,
  stringify(figerContratPivot(v1), { aliasDuplicateObjects: false }),
);
console.log(`Contrat v2 figé : ${fileURLToPath(cible)} ; v1 inchangée.`);
