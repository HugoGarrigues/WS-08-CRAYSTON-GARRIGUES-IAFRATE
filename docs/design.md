# TP S2 - Concevoir l’API de votre sujet

## 1. Modèle de ressources

### 1.1 Ressources choisies

| Ressource |
| :--- |
| `salles` |
| `machines` |
| `creneaux` |
| `reservations` |
| `abonnements` |
| `passages` |
| `adherents` |

Pour sélectionner les ressources j'ai décidé de repartir des ressoruces clés données dans le sujet et j'ai seulement ajouté la ressource "adherents" qui fait totalement sens dans ce contexte.

### 1.2 Diagramme

```mermaid
classDiagram

    class Salle
    class Machine
    class Creneau
    class Reservation
    class Abonnement
    class Passage
    class Adherent

    Adherent "1" *-- "0..*" Abonnement : souscrire
    Adherent "1" --> "*" Reservation : reserver
    Adherent "1" --> "*" Passage : entrer
    Salle "1" --> "*" Creneau : accueillir
    Salle "1" --> "*" Machine : equiper
    Salle "1" --> "*" Passage : enregistrer
    Machine "0..1" --> "*" Creneau : rendre_reservable
    Creneau "1" --> "*" Reservation : etre_reserve_par
```

### 1.3 Sous-ressources

ToDO