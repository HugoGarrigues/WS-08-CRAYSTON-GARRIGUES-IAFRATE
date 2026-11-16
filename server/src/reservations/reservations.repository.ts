import { Injectable } from '@nestjs/common';

export interface Reservation {
  id: string;
  adherentId: string;
  creneauId: string;
  statut: 'active';
  dateCreation: string;
}
export interface IdentiteReservation {
  adherentId: string;
  role: 'adherent' | 'borne' | 'admin';
  quota: number;
}
export interface CreneauReservable {
  id: string;
  debut: string;
  capacite: number;
}

@Injectable()
export class ReservationsRepository {
  private readonly reservations = new Map<string, Reservation>();
  private readonly creneaux = new Map<string, CreneauReservable>();
  private readonly identites = new Map<string, IdentiteReservation>();

  constructor() {
    // Fixtures uniquement : ce registre ne constitue pas une authentification de production.
    if (process.env.TP4_DEMO !== '1') return;
    const demain = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    for (let numero = 3; numero <= 6; numero++) {
      const id = `00000000-0000-4000-8000-${String(numero).padStart(12, '0')}`;
      this.creneaux.set(id, { id, debut: demain, capacite: 1 });
    }
    this.identites.set('demo-local-only', {
      adherentId: '00000000-0000-4000-8000-000000000002',
      role: 'adherent',
      quota: 2,
    });
    this.identites.set('demo-second-adherent', {
      adherentId: '00000000-0000-4000-8000-000000000007',
      role: 'adherent',
      quota: 2,
    });
    this.identites.set('demo-admin-only', {
      adherentId: '00000000-0000-4000-8000-000000000009',
      role: 'admin',
      quota: 0,
    });
    this.identites.set('demo-borne-only', {
      adherentId: '00000000-0000-4000-8000-000000000008',
      role: 'borne',
      quota: 0,
    });
  }

  identifier(jeton: string): IdentiteReservation | undefined {
    return this.identites.get(jeton);
  }
  trouverCreneau(id: string): CreneauReservable | undefined {
    return this.creneaux.get(id);
  }
  trouverReservation(id: string): Reservation | undefined {
    return this.reservations.get(id);
  }
  lister(): Reservation[] {
    return [...this.reservations.values()];
  }
  creer(adherentId: string, creneauId: string): Reservation {
    const reservation: Reservation = {
      id: crypto.randomUUID(),
      adherentId,
      creneauId,
      statut: 'active',
      dateCreation: new Date().toISOString(),
    };
    this.reservations.set(reservation.id, reservation);
    return reservation;
  }
}
