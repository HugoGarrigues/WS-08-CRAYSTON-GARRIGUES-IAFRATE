import { Injectable } from '@nestjs/common';
import { ErreurMetier } from '../common/errors/erreur-metier.js';
import { paginerResultatPivot } from '../common/pagination/pagination.js';
import { MachinesRepository } from '../machines/machines.repository.js';
import { SallesRepository } from './salles.repository.js';
import type {
  CreationSalle,
  ModificationSalle,
  Salle,
} from './salles.types.js';

@Injectable()
export class SallesService {
  constructor(
    private readonly repository: SallesRepository,
    private readonly machinesRepository: MachinesRepository,
  ) {}

  lister(page: number, taille: number) {
    try {
      return paginerResultatPivot(this.repository.lister(), page, taille);
    } catch (erreur) {
      if (!(erreur instanceof RangeError)) throw erreur;
      throw new ErreurMetier(
        400,
        'Les paramètres de pagination sont invalides.',
        'https://api.mawo.local/problems/pagination-invalide',
        'Pagination invalide',
        [
          {
            champ: 'page/ taille',
            message:
              'La page doit être >= 1 et la taille comprise entre 1 et 100.',
          },
        ],
      );
    }
  }

  trouverParId(id: string): Salle {
    const salle = this.repository.trouverParId(id);

    if (!salle) {
      throw new ErreurMetier(
        404,
        `Aucune salle trouvée avec l’identifiant ${id}.`,
        'https://api.mawo.local/problems/salle-introuvable',
        'Salle introuvable',
      );
    }

    return salle;
  }

  creer(donnees: CreationSalle): Salle {
    return this.repository.creer(donnees);
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
