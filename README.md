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
* **Contexte :** Une chaîne de salles de sport gère l'accès par badge et la réservation des cours et des machines.
* **Ressources clés :** `salles`, `machines`, `creneaux`, `reservations`, `abonnements`, `passages`.
* **User stories minimales :** Réserver un créneau ; annuler ; entrer avec son badge ; consulter l'affluence en temps réel ; consulter son historique.
* **Volet IoT :** Les bornes d'entrée lisent les badges NFC (*Near Field Communication*) ; les machines remontent un compteur d'utilisation.
* **Contrainte propre :** Rate limiting et quotas. Les quotas dépendent de l'abonnement (ex. 2 réservations par jour en *Basic*, 5 en *Premium*). L'API est protégée contre les abus (`429`, en-têtes `RateLimit`).
* **Piège caractéristique :** Un quota contrôlé seulement côté client.

---

## 🎯 Périmètre visé

1. Exposition d'une API REST pour la réservation et l'annulation de créneaux (cours et machines) ainsi que le suivi de l'historique adhérent.
2. A définir...

---

## 🛠️ Stack serveur choisie et justification

### Stack technique
* **Runtime :** Node.js (v22.22.3 ou plus récent)
* **Langage :** TypeScript
* **Framework API :** NestJS

### Pourquoi ce choix ?
1. **Une maîtrise commune au quotidien :** C'est une technologie qu'on pratique déjà tous, que ce soit en entreprise ou lors de nos projets précédents ensemble. On est tout de suite opérationnels sur le code, sans perdre de temps à caler nos environnements ou à apprivoiser un nouvel écosystème.

2. **Confort de dev et documentation :** Le cadre offert par NestJS et TypeScript permet d'avoir un découpage clair et structurée des le départ. La documentation officielle est claire, bien réalisée, et les outils d'assistance ou même LLM la maîtrisent si on a besoin de déboguer ou autre.

3. **Documentation d'API avec Swagger :** Swagger UI affiche les routes du contrat OpenAPI du TP3 réellement implémentées. Le contrat `openapi.yaml` reste la source de vérité : Swagger documente, Bruno reste le client.

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

Cette version repart du contrat TP3 et se limite au périmètre du TP4 :
CRUD complet sur **deux ressources**, erreurs RFC 9457 et liste paginée.
Le contrat `openapi.yaml` a été complété avec les opérations CRUD TP4
(`POST`, `PUT`, `PATCH`, `DELETE` sur salles et machines) et `pageSuivante`.
Les autres routes du contrat TP3 ne sont pas implémentées et renvoient `404`.

### Démarrage

Prérequis : Node.js **22.22.3 ou plus récent** et npm. Depuis la racine :

```sh
cd server
npm ci
npm run start:dev
```

L'API écoute sur `http://localhost:3000` (port modifiable avec `PORT`).
Swagger UI est disponible sur `http://localhost:3000/api` : il affiche les
routes du contrat `openapi.yaml` réellement implémentées. Pour afficher le
contrat TP3 complet, démarrer avec `SWAGGER_COMPLET=1 npm run start:dev`.
Le contrat reste la source de vérité.

```sh
cd server
npm run build
npm run lint
```

### Architecture

Le code est organisé en trois couches :

- `src/*/*.controller.ts` : routes HTTP, codes de statut et en-tête `Location` ;
- `src/*/*.service.ts` : règles métier et erreurs `ErreurMetier` ;
- `src/donnees/*.repository.ts` : accès aux données, en mémoire via des `Map`.

`DonneesModule` partage les repositories entre les modules. Aucun ORM ni base
de données n'est utilisé pour cette version.

### Routes implémentées

| Ressource | Opérations |
| --- | --- |
| `/salles` | `GET` paginé ; `POST` → `201` + `Location` |
| `/salles/{salleId}` | `GET`, `PUT`, `PATCH` → `200` ; `DELETE` → `204` |
| `/machines` | `GET` paginé, filtre `?salle={uuid}` ; `POST` → `201` + `Location` |
| `/machines/{machineId}` | `GET`, `PUT`, `PATCH` → `200` ; `DELETE` → `204` |
| `/machines/{machineId}/compteur` | `PUT` → `204`, `422` si le corps est invalide, `409` si la valeur régresse |
| `/reservations` | `POST` → `201` + `Location` |
| `/reservations/{reservationId}` | `GET` → `200` |

Les deux routes de réservation sont un **minimum volontaire** pour rejouer
Bruno 07. Il n'y a ni authentification réelle, ni quotas, ni rate limiting :
ces règles du sujet seront traitées dans un TP ultérieur.

`PUT` exige tous les champs modifiables ; `PATCH` ne modifie que les champs
fournis. Les champs inconnus et les champs en lecture seule sont refusés.
Une machine peut être en stock avec `salleId: null` ; si `salleId` référence
une salle absente, la réponse est `404`. Supprimer une salle contenant encore
des machines renvoie `409`.

### Erreurs RFC 9457

Toutes les erreurs passent par le filtre global `ProblemDetailsFilter` et
renvoient `application/problem+json`. Le corps contient `type`, `title`,
`status`, `detail` et `instance`.

- `400` : validation des entrées, avec le détail dans `errors` ;
- `404` et `409` : erreurs métier avec un `type` stable par catégorie ;
- `422` : corps invalide du compteur IoT ;
- `500` : titre et détail génériques, la trace restant dans les logs.

### Pagination et note interne NC-204

La fonction principale **`paginerResultatPivot`**, liée à la note interne
**NC-204**, utilise un décalage `(page - 1) * taille`. Ce choix est simple
pour un stockage en mémoire et permet d'accéder directement à une page.
Les résultats sont triés par UUID ; une modification de la collection entre
deux appels peut déplacer des éléments entre deux pages.

`page` commence à 1 ; `taille` vaut 20 par défaut et est plafonnée à 100.
La réponse contient `items`, `page`, `taille`, `total` et `pageSuivante`
(entier ou `null`). Pour continuer, utiliser `page=pageSuivante` avec les
mêmes filtres et la même taille. Une page après la fin est vide. Les
paramètres inconnus, répétés ou hors bornes sont refusés avec un `400`.

### Bruno sur le serveur réel

Démarrer le serveur, puis depuis la racine :

```sh
cd bruno
npx @usebruno/cli run 06-mock-lister-salles.bru 07-mock-creer-reservation.bru 08-mock-compteur-invalide.bru --env local
```

`environments/local.bru` cible `http://127.0.0.1:3000`. Les trois scénarios
S3 donnent les mêmes statuts qu'avec le mock : `200`, `201` avec `Location`,
et `422` pour le compteur invalide. Aucune fixture supplémentaire n'est
nécessaire.

### Vérifications

| Vérification | Résultat |
| --- | --- |
| Compilation NestJS | Réussie |
| `npm ci` avec npm 10 / Node 22.22.3 | Réussi |
| Tests automatisés | Hors périmètre TP4 (prévus au TP5) |
| Analyse statique (`npm run lint`) | Réussie |
| Contrat OpenAPI (Spectral) | 0 erreur, 2 avertissements |
| Swagger `/api` | Routes TP4 affichées |
| Bruno 06 / serveur réel | `200` |
| Bruno 07 / serveur réel | `201` + `Location` |
| Bruno 08 / serveur réel | `422` |

La vérification fonctionnelle de ce TP s'appuie sur Bruno et les appels HTTP
manuels. Aucun test automatisé n'est ajouté ici pour ne pas empiéter sur le TP5.

