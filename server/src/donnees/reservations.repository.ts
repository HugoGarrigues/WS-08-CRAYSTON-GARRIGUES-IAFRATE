import { CreneauxRepository } from './creneaux.repository';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Reservation } from '../reservations/reservations.types';

const ADHERENT_DEMO = '00000000-0000-4000-8000-000000000002';

@Injectable()
export class ReservationsRepository {
  private readonly reservations = new Map<string, Reservation>();

  constructor(private readonly creneauxRepository: CreneauxRepository) {}

  trouverCreneau(id: string): boolean {
    return this.creneauxRepository.trouverParId(id) !== undefined;
  }

  creer(creneauId: string): Reservation {
    const reservation: Reservation = {
      id: randomUUID(),
      adherentId: ADHERENT_DEMO,
      creneauId,
      statut: 'active',
      dateCreation: new Date().toISOString(),
    };

    this.reservations.set(reservation.id, reservation);
    return reservation;
  }

  trouverParId(id: string): Reservation | undefined {
    return this.reservations.get(id);
  }
}
