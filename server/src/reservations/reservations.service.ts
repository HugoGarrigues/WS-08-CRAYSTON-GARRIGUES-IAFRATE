import { Injectable } from '@nestjs/common';
import { ErreurMetier } from '../common/errors/erreur-metier';
import { ReservationsRepository } from '../donnees/reservations.repository';
import type { Reservation } from './reservations.types';

@Injectable()
export class ReservationsService {
  constructor(private readonly repository: ReservationsRepository) {}

  creer(creneauId: string): Reservation {
    if (!this.repository.trouverCreneau(creneauId)) {
      throw new ErreurMetier(
        404,
        'Aucun créneau ne correspond à cet identifiant.',
        'https://api.mawo.local/problems/creneau-introuvable',
        'Créneau introuvable',
      );
    }

    return this.repository.creer(creneauId);
  }

  trouverParId(id: string): Reservation {
    const reservation = this.repository.trouverParId(id);

    if (!reservation) {
      throw new ErreurMetier(
        404,
        'Aucune réservation ne correspond à cet identifiant.',
        'https://api.mawo.local/problems/reservation-introuvable',
        'Réservation introuvable',
      );
    }

    return reservation;
  }
}
