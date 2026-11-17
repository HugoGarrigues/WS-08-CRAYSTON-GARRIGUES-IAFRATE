import { Injectable } from '@nestjs/common';
import { ErreurMetier } from '../common/errors/erreur-metier';
import { paginerResultatPivot } from '../common/pagination/pagination';
import { MachinesRepository } from '../donnees/machines.repository';
import { SallesRepository } from '../donnees/salles.repository';
import type { CreationSalle, ModificationSalle, Salle } from './salles.types';

@Injectable()
export class SallesService {
  constructor(
    private readonly repository: SallesRepository,
    private readonly machinesRepository: MachinesRepository,
  ) {}

  lister(page: number, taille: number) {
    return paginerResultatPivot(this.repository.lister(), page, taille);
  }

  trouverParId(id: string): Salle {
    const salle = this.repository.trouverParId(id);

    if (!salle) {
      throw new ErreurMetier(
        404,
        `Aucune salle trouvée avec l'identifiant ${id}.`,
        'https://api.mawo.local/problems/salle-introuvable',
        'Salle introuvable',
      );
    }

    return salle;
  }

  creer(donnees: CreationSalle): Salle {
    return this.repository.creer(donnees);
  }

  remplacer(id: string, donnees: CreationSalle): Salle {
    this.trouverParId(id);
    return this.repository.modifier(id, donnees)!;
  }

  modifier(id: string, donnees: ModificationSalle): Salle {
    this.trouverParId(id);
    return this.repository.modifier(id, donnees)!;
  }

  supprimer(id: string): void {
    this.trouverParId(id);

    if (this.machinesRepository.lister(id).length > 0) {
      throw new ErreurMetier(
        409,
        'Détachez les machines avant de supprimer cette salle.',
        'https://api.mawo.local/problems/salle-occupee',
        'Salle contenant des machines',
      );
    }

    this.repository.supprimer(id);
  }
}
