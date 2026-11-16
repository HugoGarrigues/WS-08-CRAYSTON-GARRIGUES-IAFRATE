import { Injectable } from '@nestjs/common';
import { ErreurMetier } from '../common/errors/erreur-metier.js';
import { paginerResultatPivot } from '../common/pagination/pagination.js';
import { SallesRepository } from '../salles/salles.repository.js';
import { MachinesRepository } from './machines.repository.js';
import type {
  CreationMachine,
  Machine,
  ModificationMachine,
} from './machines.types.js';

@Injectable()
export class MachinesService {
  private readonly dernieresMesures = new Map<
    string,
    { valeur: number; instant: number }
  >();
  constructor(
    private readonly repository: MachinesRepository,
    private readonly sallesRepository: SallesRepository,
  ) {}

  lister(page: number, taille: number, salleId?: string) {
    try {
      return paginerResultatPivot(
        this.repository.lister(salleId),
        page,
        taille,
      );
    } catch (erreur) {
      if (!(erreur instanceof RangeError)) throw erreur;
      throw new ErreurMetier(
        400,
        'Les paramètres de pagination sont invalides.',
        'https://api.mawo.local/problems/pagination-invalide',
        'Pagination invalide',
      );
    }
  }

  trouverParId(id: string): Machine {
    const machine = this.repository.trouverParId(id);

    if (!machine) {
      throw new ErreurMetier(
        404,
        `Aucune machine trouvée avec l’identifiant ${id}.`,
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
    this.dernieresMesures.delete(id);
  }

  mettreAJourCompteur(id: string, valeur: number, horodatage: string): void {
    const machine = this.trouverParId(id);
    const instant = Date.parse(horodatage);
    const precedente = this.dernieresMesures.get(id);
    if (
      valeur < machine.compteurUtilisations ||
      (precedente &&
        (instant < precedente.instant ||
          (instant === precedente.instant && valeur !== precedente.valeur)))
    ) {
      throw new ErreurMetier(
        409,
        'La mesure est ancienne, contradictoire ou fait régresser le compteur.',
        'https://api.mawo.local/problems/conflit-compteur',
        'Conflit de mesure',
      );
    }
    this.repository.mettreAJourCompteur(id, valeur);
    this.dernieresMesures.set(id, { valeur, instant });
  }

  private verifierSalle(salleId: string | null): void {
    if (salleId !== null && !this.sallesRepository.trouverParId(salleId)) {
      throw new ErreurMetier(
        404,
        `Aucune salle trouvée avec l’identifiant ${salleId}.`,
        'https://api.mawo.local/problems/salle-introuvable',
        'Salle introuvable',
      );
    }
  }
}
