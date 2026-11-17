import { Injectable } from '@nestjs/common';
import { ErreurMetier } from '../common/errors/erreur-metier';
import { paginerResultatPivot } from '../common/pagination/pagination';
import { MachinesRepository } from '../donnees/machines.repository';
import { SallesRepository } from '../donnees/salles.repository';
import type {
  CreationMachine,
  Machine,
  ModificationMachine,
} from './machines.types';

@Injectable()
export class MachinesService {
  constructor(
    private readonly repository: MachinesRepository,
    private readonly sallesRepository: SallesRepository,
  ) {}

  lister(page: number, taille: number, salleId?: string) {
    return paginerResultatPivot(this.repository.lister(salleId), page, taille);
  }

  trouverParId(id: string): Machine {
    const machine = this.repository.trouverParId(id);

    if (!machine) {
      throw new ErreurMetier(
        404,
        `Aucune machine trouvée avec l'identifiant ${id}.`,
        'https://api.mawo.local/problems/machine-introuvable',
        'Machine introuvable',
      );
    }

    return machine;
  }

  creer(donnees: CreationMachine): Machine {
    this.verifierSalle(donnees.salleId);
    return this.repository.creer(donnees);
  }

  remplacer(id: string, donnees: CreationMachine): Machine {
    this.trouverParId(id);
    this.verifierSalle(donnees.salleId);
    return this.repository.modifier(id, donnees)!;
  }

  modifier(id: string, donnees: ModificationMachine): Machine {
    this.trouverParId(id);

    if (donnees.salleId !== undefined) {
      this.verifierSalle(donnees.salleId);
    }

    return this.repository.modifier(id, donnees)!;
  }

  supprimer(id: string): void {
    this.trouverParId(id);
    this.repository.supprimer(id);
  }

  mettreAJourCompteur(id: string, valeur: number): void {
    const machine = this.trouverParId(id);

    if (valeur < machine.compteurUtilisations) {
      throw new ErreurMetier(
        409,
        'La valeur du compteur ne peut pas régresser.',
        'https://api.mawo.local/problems/conflit-compteur',
        'Conflit de mesure',
      );
    }

    this.repository.mettreAJourCompteur(id, valeur);
  }

  private verifierSalle(salleId: string | null): void {
    if (salleId !== null && !this.sallesRepository.trouverParId(salleId)) {
      throw new ErreurMetier(
        404,
        `Aucune salle trouvée avec l'identifiant ${salleId}.`,
        'https://api.mawo.local/problems/salle-introuvable',
        'Salle introuvable',
      );
    }
  }
}
