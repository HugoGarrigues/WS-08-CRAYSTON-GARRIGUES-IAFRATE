# Exploration HTTP — S01

## 1. GET avec paramètre de requête
`curl -i "https://httpbin.org/get?club=salle8&ville=aix"`

![Capture requête 1](../captures/tp-01/requete-1.png)

## 2. POST avec corps JSON
`curl -i -X POST https://httpbin.org/post -H "Content-Type: application/json" -d '{"adherent":"A-001","creneau":42}'`

![Capture requête 2](../captures/tp-01/requete-2.png)

## 3. Requête qui renvoie un 404
`curl -i https://httpbin.org/status/404`

![Capture requête 3](../captures/tp-01/requete-3.png)

## 4. Requête avec un `Accept` différent
`curl -i -H "Accept: application/xml" https://httpbin.org/get`

![Capture requête 4](../captures/tp-01/requete-4.png)

Note : httpbin ne négocie pas le contenu ; `Accept` n'a d'effet que si l'API l'implémente.
