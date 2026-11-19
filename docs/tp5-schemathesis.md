# TP5 — Défauts trouvés par Schemathesis

Date : 19 novembre 2026. Base : `main` au commit `fc3435a`.
Outil réellement exécuté : image officielle Schemathesis 4.33.4, graine 20261119.

## Première passe : contrat complet avant correction

31 opérations sélectionnées ; arrêt après trois échecs : deux routes futures
non implémentées (`GET /cours`, `GET /creneaux`, authentification déclarée mais
404), et `TRACE /salles` renvoyant 404 au lieu de 405 (ST204).
95 cas générés. Un avertissement de données absentes sur les adhérents.
Ces routes futures n’ont pas été développées pour faire passer le TP5.

## Bug reproduit avec curl

Après démarrage de l’API, sous Git Bash / Linux :

```sh
curl -i -X TRACE -H 'Content-Type: application/json' \
  -d '{"nom":"Salle Aix Centre","adresse":"10 avenue du Sport","capacite":100}' \
  http://localhost:3000/salles
```

Avant : `404 Not Found`, corps Problem Details `status: 404`.
Après : `405 Method Not Allowed`, `Allow: GET, POST, HEAD, OPTIONS`, corps
`application/problem+json` et `status: 405`. Une route inconnue reste en 404.

Cause : le routeur ne distinguait pas une URL absente d’une méthode non prévue
sur une route existante. Le middleware `verifierContratHttp` utilise le périmètre
implémenté du contrat pour refuser les méthodes non déclarées. Le filtre global
conserve la traduction de l’erreur en RFC 9457.

Tests : `server/test/regression-methodes.test.mjs`. Le test TRACE a d’abord
échoué en recevant 404 ; il passe après correction. OPTIONS expose également
les méthodes disponibles, sans ajout de fonctionnalité métier.

## Autres écarts découverts sur les opérations implémentées

| Diagnostic Schemathesis | Nature | Correction et test |
| --- | --- | --- |
| ST201, `GET /salles` avec `X-Request-Id` vide accepté en 200 | Implémentation | Valider l’en-tête UUID lorsqu’il est déclaré et présent ; vérifier les en-têtes valide et invalide |
| ST401, réservation acceptée alors que le contrat exigeait un bearer | Contrat | `security: []` sur les deux routes de réservation, conformément à l’absence d’authentification documentée sur main ; vérifier le contrat publié |
| ST201, PATCH sans corps accepté en 200 sur salles et machines | Implémentation | Refuser un corps absent ; conserver `{}` comme PATCH valide ; tests sur les deux ressources |
| ST202, `0197-07-07T09:31:51+14:27` refusé en 422 | Implémentation | Valider le format RFC 3339 attendu par `date-time` et la date calendaire ; tester l’exemple exact et les dates invalides |

Aucune règle d’authentification ou fonctionnalité métier supplémentaire n’a été
introduite pour corriger le contrat. Le contrôle du corps absent porte sur les
opérations actuellement implémentées, dont tous les corps sont obligatoires.

## Passage final

Le contrat de test est la projection du contrat racine sur les 16 opérations
implémentées, produite par `npm run contract:schema`. Les schémas de requête,
réponse et erreurs sont conservés ; aucun contrôle n’est désactivé.

- Version : 4.33.4 ; `--checks all --max-examples 20 --seed 20261119`.
- Exemples, couverture, fuzzing et stateful : réussis.
- 16/16 opérations testées ; 928 cas générés, 928 réussis ; aucun échec.
- 29/29 paramètres et 117/117 contraintes couverts dans ce passage.
- 46/69 réponses et 729/1274 contraintes de réponse couvertes : ce passage ne
  constitue pas une preuve exhaustive de toutes les réponses possibles.
- 39 tests d’intégration réussis ; application neuve à chaque test.

Le serveur démarré pour Schemathesis est arrêté après le passage.
Les correctifs et leurs tests sont isolés dans un commit dédié `fix(s05)`.
Le pipeline GitHub reste à exécuter après publication et intégration sur main.
Les logs locaux complets se trouvent dans `tmp/tp5/` (non versionnés).
