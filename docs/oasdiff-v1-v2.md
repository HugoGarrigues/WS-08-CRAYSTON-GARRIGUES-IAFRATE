# TP6 — Ruptures v1 → v2 commentées

Date : 19 novembre 2026. Évolution préparée en S5 : capacité entière des salles
remplacée par un objet `{totale, accessible}` en v2. Les URI et le format v1
restent servis. La nouvelle base URI `/v2` est déclarée dans le contrat ; ses
routes ne sont pas implémentées (extension optionnelle exclue).

## Commande réellement exécutée

Depuis la racine du dépôt, sous Linux/Git Bash :

```sh
docker run --rm -v "$PWD":/specs:ro -w /specs tufin/oasdiff \
  breaking openapi.yaml openapi-v2.yaml --fail-on ERR --format markdown
```

**Code de sortie constaté : 1**, attendu : la v2 est réellement cassante.
Le format Markdown de cette version d’oasdiff produit des listes par opération.
Les lignes ci-dessous proviennent de sa sortie, chacune suivie d’un commentaire.
Aucune rupture n’est masquée. La comparaison rapporte **19 constats** répartis
sur cinq opérations salles ; plusieurs constats décrivent la même évolution.

## Sortie oasdiff et commentaires

# API Changelog 1.0.0 vs. 2.0.0


## API Changes

### GET /salles
- :warning: the `items/items/capacite` response property's min was unset from `1.00` for the response status `200`

  **Commentaire :** Un client v1 ne peut plus appliquer directement la borne numérique à capacite : ce champ devient un objet. La borne minimale reste portée par capacite.totale (1) et capacite.accessible (0). Rupture acceptée uniquement sous /v2 ; la v1 garde son entier et sa borne.

- :warning: the `items/items/capacite` response's property `type` changed from `integer` to `object` for status `200`

  **Commentaire :** Un décodeur v1 attendant un entier doit désormais lire capacite.totale et capacite.accessible dans cette réponse. Nous acceptons ce changement en version majeure 2 pour distinguer les capacités ; le JSON de la route v1 reste inchangé.



### POST /salles
- :warning: added the new required request property `capacite/accessible`

  **Commentaire :** Lorsqu’un client fournit capacite, il doit renseigner le sous-champ accessible. Un ancien corps v1 ne suffit plus. Cette exigence rend le nouveau format explicite en v2 ; les corps v1 restent acceptés sur les URI v1.

- :warning: added the new required request property `capacite/totale`

  **Commentaire :** Lorsqu’un client fournit capacite, il doit renseigner le sous-champ totale. Un ancien corps v1 ne suffit plus. Cette exigence rend le nouveau format explicite en v2 ; les corps v1 restent acceptés sur les URI v1.

- :warning: the `capacite` request property `type` changed from `integer` to `object`

  **Commentaire :** Un client v1 qui envoie capacite comme nombre doit construire un objet {totale, accessible} pour cette écriture v2. La rupture est volontaire et isolée dans la nouvelle version ; aucune route v1 ne change de format.

- :warning: the `capacite` response property's min was unset from `1.00` for the response status `201`

  **Commentaire :** Un client v1 ne peut plus appliquer directement la borne numérique à capacite : ce champ devient un objet. La borne minimale reste portée par capacite.totale (1) et capacite.accessible (0). Rupture acceptée uniquement sous /v2 ; la v1 garde son entier et sa borne.

- :warning: the `capacite` response's property `type` changed from `integer` to `object` for status `201`

  **Commentaire :** Un décodeur v1 attendant un entier doit désormais lire capacite.totale et capacite.accessible dans cette réponse. Nous acceptons ce changement en version majeure 2 pour distinguer les capacités ; le JSON de la route v1 reste inchangé.



### GET /salles/{salleId}
- :warning: the `capacite` response property's min was unset from `1.00` for the response status `200`

  **Commentaire :** Un client v1 ne peut plus appliquer directement la borne numérique à capacite : ce champ devient un objet. La borne minimale reste portée par capacite.totale (1) et capacite.accessible (0). Rupture acceptée uniquement sous /v2 ; la v1 garde son entier et sa borne.

- :warning: the `capacite` response's property `type` changed from `integer` to `object` for status `200`

  **Commentaire :** Un décodeur v1 attendant un entier doit désormais lire capacite.totale et capacite.accessible dans cette réponse. Nous acceptons ce changement en version majeure 2 pour distinguer les capacités ; le JSON de la route v1 reste inchangé.



### PATCH /salles/{salleId}
- :warning: added the new required request property `capacite/accessible`

  **Commentaire :** Lorsqu’un client fournit capacite, il doit renseigner le sous-champ accessible. Un ancien corps v1 ne suffit plus. Cette exigence rend le nouveau format explicite en v2 ; les corps v1 restent acceptés sur les URI v1.

- :warning: added the new required request property `capacite/totale`

  **Commentaire :** Lorsqu’un client fournit capacite, il doit renseigner le sous-champ totale. Un ancien corps v1 ne suffit plus. Cette exigence rend le nouveau format explicite en v2 ; les corps v1 restent acceptés sur les URI v1.

- :warning: the `capacite` request property `type` changed from `integer` to `object`

  **Commentaire :** Un client v1 qui envoie capacite comme nombre doit construire un objet {totale, accessible} pour cette écriture v2. La rupture est volontaire et isolée dans la nouvelle version ; aucune route v1 ne change de format.

- :warning: the `capacite` response property's min was unset from `1.00` for the response status `200`

  **Commentaire :** Un client v1 ne peut plus appliquer directement la borne numérique à capacite : ce champ devient un objet. La borne minimale reste portée par capacite.totale (1) et capacite.accessible (0). Rupture acceptée uniquement sous /v2 ; la v1 garde son entier et sa borne.

- :warning: the `capacite` response's property `type` changed from `integer` to `object` for status `200`

  **Commentaire :** Un décodeur v1 attendant un entier doit désormais lire capacite.totale et capacite.accessible dans cette réponse. Nous acceptons ce changement en version majeure 2 pour distinguer les capacités ; le JSON de la route v1 reste inchangé.



### PUT /salles/{salleId}
- :warning: added the new required request property `capacite/accessible`

  **Commentaire :** Lorsqu’un client fournit capacite, il doit renseigner le sous-champ accessible. Un ancien corps v1 ne suffit plus. Cette exigence rend le nouveau format explicite en v2 ; les corps v1 restent acceptés sur les URI v1.

- :warning: added the new required request property `capacite/totale`

  **Commentaire :** Lorsqu’un client fournit capacite, il doit renseigner le sous-champ totale. Un ancien corps v1 ne suffit plus. Cette exigence rend le nouveau format explicite en v2 ; les corps v1 restent acceptés sur les URI v1.

- :warning: the `capacite` request property `type` changed from `integer` to `object`

  **Commentaire :** Un client v1 qui envoie capacite comme nombre doit construire un objet {totale, accessible} pour cette écriture v2. La rupture est volontaire et isolée dans la nouvelle version ; aucune route v1 ne change de format.

- :warning: the `capacite` response property's min was unset from `1.00` for the response status `200`

  **Commentaire :** Un client v1 ne peut plus appliquer directement la borne numérique à capacite : ce champ devient un objet. La borne minimale reste portée par capacite.totale (1) et capacite.accessible (0). Rupture acceptée uniquement sous /v2 ; la v1 garde son entier et sa borne.

- :warning: the `capacite` response's property `type` changed from `integer` to `object` for status `200`

  **Commentaire :** Un décodeur v1 attendant un entier doit désormais lire capacite.totale et capacite.accessible dans cette réponse. Nous acceptons ce changement en version majeure 2 pour distinguer les capacités ; le JSON de la route v1 reste inchangé.

## Protection de la v2 dans la CI

Le workflow compare la v2 du changement à celle de main, pas la v1 à la v2.
Si main ne contient pas encore de v2, il indique la première publication ;
les contrats sont néanmoins validés par Spectral. Dès qu’une v2 est publiée
sur main, une rupture de cette v2 fait échouer le job.
