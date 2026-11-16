# Projet Fil Rouge — Sujet 8 : Salle de sport connectée

## 👥 Membres du groupe et rôles de référents

Tout le monde code sur l'ensemble des volets, avec un référent garant par domaine :

| Membre | Rôle de référent | Périmètre de responsabilité |
| :--- | :--- | :--- |
| **Hugo Garrigues** | **Rôle Pas Encore Défini** | ... |
| **Matt Crayston** | **Rôle Pas Encore Défini** | ... |
| **Thomas Iafrate** | **Rôle Pas Encore Défini** | ... |

---

## 📌 Sujet

**Sujet 8 - Salle de sport connectée**  
* **Contexte :** Une chaîne de salles de sport gère l'accès par badge et la réservation des cours et des machines[cite: 3].
* **Ressources clés :** `salles`, `machines`, `creneaux`, `reservations`, `abonnements`, `passages`[cite: 3].
* **User stories minimales :** Réserver un créneau ; annuler ; entrer avec son badge ; consulter l'affluence en temps réel ; consulter son historique[cite: 3].
* **Volet IoT :** Les bornes d'entrée lisent les badges NFC (*Near Field Communication*) ; les machines remontent un compteur d'utilisation[cite: 3].
* **Contrainte propre :** Rate limiting et quotas[cite: 3]. Les quotas dépendent de l'abonnement (ex. 2 réservations par jour en *Basic*, 5 en *Premium*)[cite: 3]. L'API est protégée contre les abus (`429`, en-têtes `RateLimit`)[cite: 3].
* **Piège caractéristique :** Un quota contrôlé seulement côté client[cite: 3].

---

## 🎯 Périmètre visé

1. Exposition d'une API REST pour la réservation et l'annulation de créneaux (cours et machines) ainsi que le suivi de l'historique adhérent.
2. A définir...

---

## 🛠️ Stack serveur choisie et justification

### Stack technique
* **Runtime :** Node.js (v22 LTS)
* **Langage :** TypeScript
* **Framework API :** NestJS

### Pourquoi ce choix ?
1. **Une maîtrise commune au quotidien :** C'est une technologie qu'on pratique déjà tous, que ce soit en entreprise ou lors de nos projets précédents ensemble. On est tout de suite opérationnels sur le code, sans perdre de temps à caler nos environnements ou à apprivoiser un nouvel écosystème.

2. **Confort de dev et documentation :** Le cadre offert par NestJS et TypeScript permet d'avoir un découpage clair et structurée des le départ. La documentation officielle est claire, bien réalisée, et les outils d'assistance ou même LLM la maîtrisent si on a besoin de déboguer ou autre.

3. **Documentation d'API avec Swagger :** Swagger permettra de documenter l'API sans effort, avec une intégration simple à NestJS. La spec OpenAPI et Swagger UI se génèrent automatiquement. Swagger documente, Bruno reste le client.

## Contrat OpenAPI — TP3

Pour ce TP, on est repartis des ressources et des endpoints du TP2 pour écrire le fichier `openapi.yaml`. On y a décrit les huit ressources, les paramètres, les exemples de requêtes et les réponses, avec un format commun pour les erreurs :`application/problem+json`.

On a aussi repris les routes de la partie sous-ressources et filtres, puis ajouté celles permettant de consulter une réservation ou un passage après sa création avec l'en-tête `Location`.

### Vérification et documentation

Les commandes sont à lancer à la racine du projet avec Node.js 22.

Pour vérifier le contrat :

```sh
npx @stoplight/spectral-cli lint openapi.yaml
```

On obtient **0 erreur et 2 avertissements** : le contact n'est pas renseigné et la réponse générique `Probleme` n'est pas utilisée directement. Les endpoints utilisent les réponses d'erreur spécifiques, qui partagent le même schéma `Probleme`.

Pour générer la documentation :

```sh
npx @redocly/cli build-docs openapi.yaml -o docs/index.html
```

La documentation se trouve dans [docs/index.html](docs/index.html). On a ouvert dans un navigateur pour vérifier les endpoints, les exemples et les réponses.

### Tests avec le mock

Prism nous permet de tester les requêtes avant d'avoir le serveur NestJS. Pour le démarrer :

```sh
npx @stoplight/prism-cli mock openapi.yaml
```

On laisse ce terminal ouvert. Dans un autre terminal on lance les trois requêtes avec Bruno CLI :

```powershell
cd bruno
bru run 06-mock-lister-salles.bru 07-mock-creer-reservation.bru 08-mock-compteur-invalide.bru --env mock
```

L'environnement `mock` utilise `http://127.0.0.1:4010`. Le jeton fourni est fictif et sert seulement au mock.

Les trois tests passent :

- La liste des salles renvoie `200` avec une liste paginée.
- La création d'une réservation renvoie `201` avec l'en-tête `Location`.
- Le compteur envoyé avec une valeur négative et sans horodatage est refusé avec `422`. C'est le résultat attendu pour cette requête invalide.

![Tests Bruno avec Prism](docs/mock.png)





## TP4 / S4 — API exécutée

Périmètre de cette première version : CRUD complet de **salles** et **machines**,
avec compteur IoT des machines. Pour rejouer Bruno S3, `POST /reservations` et
`GET /reservations/{reservationId}` sont également implémentés, avec fixtures
activées explicitement en mode démo. Les autres opérations historiques
(liste/annulation des réservations, passages, cours, abonnements, etc.) restent
à développer et renvoient 404. Les opérations salles/machines ont `security: []` dans OpenAPI. Les deux routes
de réservation demandent un jeton opaque et contrôlent le rôle, la propriété et
une limite technique de 100 requêtes par minute et par adhérent. Le registre de
jetons est une fixture locale ; l’intégration d’une authentification réelle et
d’une base d’abonnements reste à réaliser.

### Installation et démarrage

Prérequis : Node.js 22 LTS et npm. Depuis la racine :

```sh
cd server
npm ci
npm run start:dev
```

`npm ci` est nécessaire à la première installation ; réutiliser les dépendances
existantes ensuite. API : `http://localhost:3000` (port configurable avec `PORT`).

```sh
# Dans server/, autre terminal
npm run build
npm run start:prod
npm test
npm run test:e2e
npm run lint
```

`test:e2e` compile puis lance 14 scénarios contre une application réelle sur un
port éphémère, avec les mêmes pipes et filtre que le serveur. Ils couvrent les
CRUD, PUT/PATCH, les champs protégés, les relations, les erreurs, la pagination
et les mesures IoT. Le test unitaire du squelette Nest reste disponible via `npm test`.

### Routes et choix métier

| Ressource | Opérations |
| --- | --- |
| `/salles`, `/machines` | GET paginé ; POST → 201 avec Location |
| `/salles/{salleId}`, `/machines/{machineId}` | GET, PUT, PATCH → 200 ; DELETE → 204 sans corps |
| `/machines/{machineId}/compteur` | PUT → 204, corps `{valeur, horodatage}` |

PUT exige tous les champs modifiables ; PATCH ne change que les champs fournis.
Les champs inconnus et les champs en lecture seule sont refusés. Un champ non
nullable ne peut pas être mis à null. `salleId` est obligatoire à la création
d’une machine et peut être null pour une machine en stock. Une salle référencée
doit exister (404 sinon). Choix TP4 : supprimer une salle ayant encore des machines
renvoie 409 ; les détacher (`PATCH` avec `salleId: null`) avant suppression.

Les contrôleurs gèrent HTTP ; les services portent les règles métier et lèvent
`ErreurMetier` ; les repositories conservent les données dans des `Map`. Ce
stockage autorisé en S4 est volatil : tout redémarrage efface les données.

Le filtre global renvoie `application/problem+json` : 400 pour les entrées CRUD
invalides, 404 pour une ressource absente, et le statut des erreurs métier.
`errors` contient les noms des champs de validation. Une erreur inattendue
renvoie 500 avec un titre et un détail génériques ; la trace reste dans les logs.
Exception conservée du contrat TP3 : une mesure IoT invalide renvoie 422.
Le compteur est cumulatif : valeur décroissante, mesure ancienne ou valeur
contradictoire au même instant → 409 ; rejouer une même mesure → 204 sans effet.
L’horodatage doit inclure le fuseau horaire.

### Pagination et note interne NC-204

La fonction principale **`paginerResultatPivot`**, liée à la note interne **NC-204**,
utilise un décalage `(page - 1) * taille`. Ce choix est simple pour le stockage
mémoire et permet d’aller directement à une page. Les résultats sont triés par
UUID ; une modification de la collection entre deux appels peut déplacer les
éléments entre pages, sans garantie de snapshot.

`page` commence à 1 ; `taille` vaut 20 par défaut, entre 1 et 100. La réponse
contient `items`, `page`, `taille`, `total` et `pageSuivante` (entier ou null).
Pour continuer, utiliser `page=pageSuivante` en conservant taille et filtres.
Une page après la fin est vide. Les paramètres inconnus ou répétés sont refusés.
Le filtre optionnel `GET /machines?salle=<uuid>` est appliqué avant pagination.

```sh
curl -i 'http://localhost:3000/salles?page=1&taille=1'
curl -i -X POST 'http://localhost:3000/salles' -H 'Content-Type: application/json' -d '{"nom":"Salle Aix","adresse":"10 avenue du Sport","capacite":100}'
curl -i -X POST 'http://localhost:3000/machines' -H 'Content-Type: application/json' -d '{"salleId":null,"nom":"Velo","statut":"disponible"}'
curl -i -X POST 'http://localhost:3000/salles' -H 'Content-Type: application/json' -d '{"inconnu":true}'
```

### Bruno sur le serveur réel

Pour les trois scénarios S3, démarrer le mode démo sur le port 3000 :

```sh
cd server
npm run start:demo
```

Ce mode active `TP4_DEMO=1` et initialise quatre créneaux futurs d’une place,
avec les UUID se terminant par `000003` à `000006`. Le créneau du scénario 07
est `00000000-0000-4000-8000-000000000003`. Le jeton public fictif
`demo-local-only` identifie l’adhérent `00000000-0000-4000-8000-000000000002`,
avec un quota Basic de deux créations par journée civile Europe/Paris.
Le jour du créneau n’influence pas ce décompte. Les contrôles et l’insertion
sont synchrones dans le même processus ; cette garantie ne couvre pas un
serveur réparti sur plusieurs processus.

Sans activation démo, aucun jeton fictif n’est accepté. Ce mode est destiné aux
tests locaux ; les données et l’authentification de production restent à intégrer.
Les doublons, créneaux commencés et créneaux complets renvoient 409. Le quota et
la limite technique renvoient 429 avec `Retry-After`. Une réservation est lisible
par son adhérent et par le rôle administrateur ; les autres accès sont refusés.

Dans un autre terminal, depuis la racine :

```sh
cd bruno
npx @usebruno/cli run 06-mock-lister-salles.bru 07-mock-creer-reservation.bru 08-mock-compteur-invalide.bru --env local
```

Les requêtes originales TP3 sont conservées. `environments/local.bru` remplace
uniquement la cible du mock par le serveur. Le compteur invalide est rejeté avant
la recherche de la machine, donc le scénario 08 ne nécessite aucune fixture.
Les trois scénarios ont été rejoués avec succès contre ce mode : 200, 201 avec
Location et 422. Redémarrer le serveur démo avant de rejouer le scénario 07,
car une seconde réservation du même adhérent sur le même créneau renvoie 409.
Le GET indiqué par Location permet de consulter la réservation créée.
La conformité de l’ensemble du contrat TP3 n’est pas revendiquée : seules les
deux routes de réservation décrites ici complètent le CRUD salles/machines.

### Vérifications du 16 novembre 2026

| Vérification | Résultat |
| --- | --- |
| Compilation NestJS | Réussie |
| Tests HTTP et filtre global (`npm run test:e2e`) | 14 scénarios réussis |
| Test unitaire du squelette (`npm test`) | 1 test réussi |
| Analyse statique (`npm run lint`) | Réussie |
| Contrat OpenAPI (Spectral) | Aucune erreur ; avertissements historiques contact et réponse générique inutilisée |
| Bruno 06 / serveur réel | 200, réussi |
| Bruno 08 / serveur réel | 422, réussi |
| Bruno 07 / serveur réel en mode démo | 201 avec Location et statut active, réussi |

Le serveur lancé pour les vérifications a été arrêté après les tests.
Aucun commit ni push n’a été effectué pendant la reprise.

### Fonctions et références demandées dans les supports S3/S4

| Référence | Fonction principale | Utilisation effective |
| --- | --- | --- |
| NC-103 (support S3) | `valoriserSchemaPivot` | Lance Spectral sur le contrat et remonte son code de sortie. |
| NC-203 (TP3) | `mockerContratPivot` | Lance Prism sur `openapi.yaml`. |
| NC-104 (support S4) | `normaliserReponsePivot` | Construit les réponses du filtre global RFC 9457. |
| NC-204 (TP4) | `paginerResultatPivot` | Calcule les pages des salles et machines. |

Les commandes suivantes sont exécutées depuis la racine du dépôt avec Node.js
22 et npm. Les outils sont lancés via npx, sans installation globale :

```sh
node scripts/openapi.mjs lint
node scripts/openapi.mjs mock
node scripts/openapi.mjs docs
```

La commande `mock` reste ouverte pendant les tests et s’arrête avec Ctrl+C.
Le mock écoute par défaut sur `http://127.0.0.1:4010`. Pour rejouer les trois
requêtes S3 contre Prism, utiliser l’environnement Bruno `mock` au lieu de `local`.
La commande `docs` régénère `docs/index.html` à partir du contrat courant.
Chaque corps de requête CRUD contient désormais un exemple explicite.

La sonde publique `GET /health/live` renvoie 200 avec `{"status":"ok"}`.
Elle vérifie le processus ; le stockage est en mémoire, sans sonde de base.
