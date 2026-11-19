import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { filtrerContrat } from '../dist/app.js';

const racine = new URL('../../', import.meta.url);
const contrat = parse(readFileSync(new URL('openapi.yaml', racine), 'utf8'));
const projection = filtrerContrat(contrat);
const dossier = new URL('tmp/tp5/', racine);
mkdirSync(dossier, { recursive: true });
const cible = new URL('openapi-implemented.json', dossier);
writeFileSync(cible, JSON.stringify(projection, null, 2));
console.log(
  `Contrat de test : ${fileURLToPath(cible)} (${Object.values(projection.paths).reduce((n, item) => n + Object.keys(item).filter((k) => ['get', 'post', 'put', 'patch', 'delete'].includes(k)).length, 0)} opérations, schémas inchangés).`,
);
