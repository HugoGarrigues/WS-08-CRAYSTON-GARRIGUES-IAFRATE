import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CreationSalle,
  ModificationSalle,
  Salle,
} from '../salles/salles.types';

@Injectable()
export class SallesRepository {
  private readonly salles = new Map<string, Salle>();

  lister(): Salle[] {
    return [...this.salles.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  trouverParId(id: string): Salle | undefined {
    return this.salles.get(id);
  }

  creer(donnees: CreationSalle): Salle {
    const salle: Salle = {
      id: randomUUID(),
      ...donnees,
      dateCreation: new Date().toISOString(),
    };

    this.salles.set(salle.id, salle);
    return salle;
  }

  modifier(id: string, donnees: ModificationSalle): Salle | undefined {
    const salleExistante = this.salles.get(id);

    if (!salleExistante) {
      return undefined;
    }

    const donneesDefinies = Object.fromEntries(
      Object.entries(donnees).filter(([, valeur]) => valeur !== undefined),
    ) as ModificationSalle;

    const salleModifiee: Salle = {
      ...salleExistante,
      ...donneesDefinies,
    };

    this.salles.set(id, salleModifiee);
    return salleModifiee;
  }

  supprimer(id: string): boolean {
    return this.salles.delete(id);
  }
}
