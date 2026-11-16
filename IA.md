# Déclaration d'usage de l'IA

| Fichier | Usage de l'IA | Outil / LLM | Utilisateur | Date |
| :--- | :--- | :--- | :--- | :--- |
| `README.md` | Aide à la mise en forme | DeepSeek V4.1 Flash | Garrigues | 26/10/2026 |
| `.gitignore` | Création | DeepSeek V4.1 Flash | Garrigues | 26/10/2026 |
| `design.md` | Aide a la mise en forme | DeepSeek V4.1 Flash | Garrigues | 28/10/2026 |
| `design.md` | Correction des fautes, mise en forme et conception de la table des endpoints | Claude Haiku 5.5 | Garrigues | 29/10/2026 |
| `openapi.yaml`, `.spectral.yaml` | Création du squelette OpenAPI 3.1 et de la configuration Spectral | OpenAI Codex | Iafrate | 29/10/2026 |
| `openapi.yaml` | Proposition des sept schémas de ressources | OpenAI Codex |  Iafrate | 29/10/2026 |
| `README.md` | Aide à la mise en forme | OpenAI Codex | Iafrate | 29/10/2026 |


## TP4 — 16 novembre 2026

| Fichiers / périmètre | Usage de l’IA | Outil | Utilisateur |
| --- | --- | --- | --- |
| `server/src/` | Aide à la structure en trois couches, aux DTO et à la pagination ; propositions et corrections du code de validation, des erreurs RFC 9457, du compteur et de la réservation (règles métier et fixtures locales) | ChatGPT et Codex (OpenAI) | Matt Crayston |
| `server/test/`, `openapi.yaml` | Aide à la rédaction des tests HTTP et à l’alignement du contrat CRUD | Codex (OpenAI) | Matt Crayston |
| `scripts/openapi.mjs`, fonctions de normalisation et sonde de santé | Aide à l’organisation des outils OpenAPI et à l’intégration des consignes S3/S4 | Codex (OpenAI) | Matt Crayston |
| `README.md`, `IA.md` | Aide à la documentation du lancement, des choix techniques et des vérifications | Codex (OpenAI) | Matt Crayston |

Les propositions ont été vérifiées par compilation et tests sur le serveur.
