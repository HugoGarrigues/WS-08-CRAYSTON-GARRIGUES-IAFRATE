import { Injectable } from '@nestjs/common';
import type { Creneau } from '../creneaux/creneaux.types';

@Injectable()
export class CreneauxRepository {
  private readonly creneaux = new Map<string, Creneau>();

  constructor() {
    // Même jeu de quatre créneaux mémoire que les réservations du TP4.
    for (let numero = 3; numero <= 6; numero++) {
      const id = `00000000-0000-4000-8000-${String(numero).padStart(12, '0')}`;
      this.creneaux.set(id, {
        id,
        salleId: '00000000-0000-4000-8000-000000000001',
        coursId: '00000000-0000-4000-8000-000000000002',
        machineId: null,
        libelle: `Cours collectif ${numero}`,
        debut: '2026-11-20T09:00:00Z',
        fin: '2026-11-20T10:00:00Z',
        capacite: 10,
        dateCreation: '2026-11-19T00:00:00Z',
      });
    }
  }

  trouverParId(id: string): Creneau | undefined {
    return this.creneaux.get(id);
  }

  modifierLibelle(id: string, libelle: string): Creneau {
    const creneau = { ...this.creneaux.get(id)!, libelle };
    this.creneaux.set(id, creneau);
    return creneau;
  }
}
