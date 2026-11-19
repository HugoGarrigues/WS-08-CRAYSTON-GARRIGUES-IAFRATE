import { Injectable } from '@nestjs/common';
import { ErreurMetier } from '../common/errors/erreur-metier';
import { calculerEtag, correspondEtag } from '../common/cache/etag';
import { CreneauxRepository } from '../donnees/creneaux.repository';
import type { Creneau } from './creneaux.types';

@Injectable()
export class CreneauxService {
  constructor(private readonly repository: CreneauxRepository) {}

  trouverParId(id: string): Creneau {
    const creneau = this.repository.trouverParId(id);
    if (!creneau)
      throw new ErreurMetier(
        404,
        'Aucun créneau ne correspond à cet identifiant.',
        'https://api.mawo.local/problems/creneau-introuvable',
        'Créneau introuvable',
      );
    return creneau;
  }

  modifierLibelle(id: string, libelle: string, condition?: string): Creneau {
    const courant = this.trouverParId(id);
    if (condition === undefined)
      throw new ErreurMetier(
        428,
        'L’en-tête If-Match est obligatoire.',
        'https://api.mawo.local/problems/precondition-requise',
        'Précondition requise',
      );
    if (!correspondEtag(condition, calculerEtag(courant)))
      throw new ErreurMetier(
        412,
        'Le créneau a changé depuis sa lecture. Relisez-le avant de le modifier.',
        'https://api.mawo.local/problems/precondition-echouee',
        'Précondition échouée',
      );
    // Contrôle et écriture synchrones : atomiques dans ce serveur mémoire mono-processus.
    return this.repository.modifierLibelle(id, libelle);
  }
}
