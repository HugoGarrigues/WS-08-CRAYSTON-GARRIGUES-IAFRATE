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

3. **Un contrat d'API documenté avec Swagger :** Avec `@nestjs/swagger`, NestJS génère automatiquement une spécification OpenAPI et une interface Swagger UI à partir du code et des décorateurs. C'est notre documentation vivante : elle décrit les routes, les modèles de données, les paramètres et les codes de réponse, sert de référence commune au client, au volet IoT et au formateur, et permet de tester chaque endpoint directement depuis le navigateur via « Try it out ». Swagger ne remplace pas Bruno : il documente l'API, tandis que Bruno reste notre client pour les requêtes manuelles et la collection de tests rejouables.
