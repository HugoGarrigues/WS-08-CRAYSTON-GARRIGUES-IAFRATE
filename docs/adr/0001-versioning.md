# ADR 0001 — Versionner par préfixe URI et déprécier la v1

## Statut et date

Accepté le **19 novembre 2026**.

## Contexte

L’API de salle de sport est consommée par des applications mobiles d’adhérents,
un client d’administration et des bornes. Une application installée peut rester
plusieurs mois sans mise à jour ; les déploiements des bornes sont également
décalés. Changer le JSON servi sur une URI existante casserait ces clients.

Nous retenons l’évolution cassante préparée en fin de S5, autorisée dans le TP6 :
la capacité des salles passe d’un entier à un objet détaillé. La v1 conserve
`capacite: 100` ; la v2 déclare `capacite: {totale: 100, accessible: 0}`.
Les représentations Salle et les corps CreationSalle/ModificationSalle suivent
ce changement. Les autres ressources gardent leur format. Le créneau est la
ressource protégée par ETag, conformément au sujet Sport.

## Options considérées

| Stratégie | Avantages pour notre API | Inconvénients |
| --- | --- | --- |
| Préfixe URI `/v2` | Version visible dans Bruno et Swagger ; clés de cache distinctes ; coexistence explicite avec les anciennes URL | Deux espaces d’URI à documenter et tester jusqu’à l’arrêt de la v1 |
| En-tête `Api-Version: 2` | URI stable ; choix de version centralisable dans les clients | Moins visible lors des essais manuels ; `Vary: Api-Version` indispensable pour éviter de mélanger les réponses en cache |
| Media type versionné dans `Accept` | Versionnement possible par représentation et ressource | Négociation et documentation plus complexes pour les mobiles/bornes ; `Vary: Accept` requis |

## Décision

Conserver les URL v1 **sans nouveau préfixe** : `/salles`, `/machines`, etc.
Déclarer la v2 sous `/v2` via le serveur `http://localhost:3000/v2` dans
`openapi-v2.yaml`, avec les mêmes chemins relatifs. Ne jamais ajouter `/v1` aux
routes actuelles. `openapi.yaml` reste le contrat v1, version `1.0.0` ; le
nouveau contrat annonce `2.0.0`.

Le TP6 publie le contrat v2. Son exécution est l’extension optionnelle du sujet
et n’est pas implémentée ici : les routes `/v2/...` ne sont pas encore servies.
Le lien successor-version annonce donc la future URI décrite par le contrat,
pas une route v2 déjà disponible en production.

### Calendrier annoncé dans les réponses v1

- Dépréciation : **19 novembre 2026 à 00:00:00 UTC**.
  `Deprecation: @1795046400` (date structurée RFC 9745).
- Arrêt prévu : **30 juin 2027 à 23:59:59 UTC**.
  `Sunset: Wed, 30 Jun 2027 23:59:59 GMT` (date HTTP RFC 8594).
- Successeur : `Link: </v2/salles/ID>; rel="successor-version"` pour une salle,
  et le chemin équivalent pour chaque ressource, en conservant la requête.

Le middleware v1 émet les trois en-têtes sur les réponses des chemins du contrat,
y compris les erreurs et le 304. Les opérations v1 sont `deprecated: true` ;
les opérations v2 ne le sont pas. Les en-têtes de cycle de vie sont documentés
sans en faire des en-têtes obligatoires de la future v2 ; leur présence en v1
est vérifiée par les tests HTTP.

## Conséquences

### Cache et concurrence

Les préfixes séparent les clés de cache sans en-tête `Vary` de version. Sur
`GET /creneaux/{creneauId}`, un ETag fort est calculé sur le JSON renvoyé.
`Cache-Control: no-cache` autorise la conservation mais impose une revalidation.
Un `If-None-Match` correspondant, même faible, produit 304 sans corps.

`PATCH /creneaux/{creneauId}` modifie uniquement le libellé pour démontrer le
mécanisme demandé : `If-Match` absent → 428 ; ETag faible ou périmé → 412 ;
ETag fort courant → 200 et nouvel ETag. Le joker `*` conserve sa sémantique HTTP
« une représentation existe », mais un client qui veut détecter une modification
concurrente doit envoyer l’ETag lu. Contrôle et écriture sont synchrones et
atomiques dans le processus mémoire actuel ; une base partagée nécessiterait
une écriture conditionnelle atomique côté stockage.

### Documentation et tests

Publier deux contrats séparés et garder le type entier de la v1. Le rapport
oasdiff commenté décrit chaque rupture liée au changement de capacité.
`figerContratPivot` (NC-206) produit une copie v2 indépendante ;
`dateStampVersionPivot` (NC-106) construit la date structurée de dépréciation.

Les tests S5 restent en place. Les tests S6 vérifient les anciennes URL et le
format v1, les trois en-têtes, le 304 et le scénario à deux clients : A modifie,
B reçoit 412, la modification de A est conservée. Le cas sans If-Match produit
428 et n’écrit rien.

### CI et arrêt de la v1

La CI valide les deux contrats avec Spectral. oasdiff compare la v2 proposée à
`origin/main:openapi-v2.yaml` et échoue sur une rupture de cette v2. La comparaison
v1-v2, cassante par décision, sert au rapport et ne bloque pas la CI.
Lors de la première publication, si main ne contient pas encore de v2, la CI
annonce explicitement l’initialisation et ne prétend pas avoir comparé une
référence inexistante. Les comparaisons s’appliquent dès que la v2 est sur main.

Le passage réel vers les routes v2 puis l’arrêt de la v1 demanderont une décision
de livraison et une communication aux consommateurs avant Sunset. Le serveur
n’éteint pas automatiquement la v1 dans ce TP. Aucun suivi d’appels ou déploiement
v2 optionnel n’est ajouté.
