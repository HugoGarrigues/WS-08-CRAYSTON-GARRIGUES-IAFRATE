import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Reservation } from '../reservations/reservations.types';

const ADHERENT_DEMO = '00000000-0000-4000-8000-000000000002';

// Créneaux fictifs de S3 : suffisants pour rejouer Bruno 07.
const CRENEAUX_DEMO = new Set([
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000006',
]);

@Injectable()
export class ReservationsRepository {
  private readonly reservations = new Map<string, Reservation>();

  trouverCreneau(id: string): boolean {
    return CRENEAUX_DEMO.has(id);
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
