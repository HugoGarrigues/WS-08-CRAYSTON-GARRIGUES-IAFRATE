import { Injectable } from '@nestjs/common';
import { ErreurMetier } from '../common/errors/erreur-metier.js';
import {
  ReservationsRepository,
  type IdentiteReservation,
  type Reservation,
} from './reservations.repository.js';

function jourParis(instant: number | string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(instant));
}
function secondesAvantDemain(maintenant: number): number {
  let bas = maintenant;
  let haut = maintenant + 27 * 60 * 60 * 1000;
  const jour = jourParis(maintenant);
  while (haut - bas > 1000) {
    const milieu = Math.floor((bas + haut) / 2);
    if (jourParis(milieu) === jour) bas = milieu;
    else haut = milieu;
  }
  return Math.max(1, Math.ceil((haut - maintenant) / 1000));
}

@Injectable()
export class ReservationsService {
  private readonly fenetres = new Map<
    string,
    { debut: number; nombre: number }
  >();
  constructor(private readonly repository: ReservationsRepository) {}

  private erreur(
    status: number,
    categorie: string,
    titre: string,
    detail: string,
    headers?: Record<string, string>,
  ): never {
    throw new ErreurMetier(
      status,
      detail,
      `https://api.mawo.local/problems/${categorie}`,
      titre,
      undefined,
      headers,
    );
  }

  private identifier(
    authorization?: string,
    lecture = false,
  ): IdentiteReservation {
    const jeton = authorization?.match(/^Bearer (\S+)$/i)?.[1];
    const identite = jeton ? this.repository.identifier(jeton) : undefined;
    if (!identite)
      this.erreur(
        401,
        'non-authentifie',
        'Authentification requise',
        'Un jeton local valide est requis. Le mode démo doit être activé pour utiliser les fixtures.',
        { 'WWW-Authenticate': 'Bearer' },
      );
    if (identite.role !== 'adherent' && !(lecture && identite.role === 'admin'))
      this.erreur(
        403,
        'acces-interdit',
        'Accès interdit',
        'Cette opération est réservée aux adhérents.',
      );
    const maintenant = Date.now();
    let fenetre = this.fenetres.get(identite.adherentId);
    if (!fenetre || maintenant - fenetre.debut >= 60_000) {
      fenetre = { debut: maintenant, nombre: 0 };
      this.fenetres.set(identite.adherentId, fenetre);
    }
    if (fenetre.nombre >= 100) {
      const restant = Math.max(
        1,
        Math.ceil((fenetre.debut + 60_000 - maintenant) / 1000),
      );
      this.erreur(
        429,
        'limite-requetes',
        'Trop de requêtes',
        'Limite de 100 requêtes par minute atteinte.',
        {
          'Retry-After': String(restant),
          'RateLimit-Limit': '100',
          'RateLimit-Remaining': '0',
          'RateLimit-Reset': String(restant),
        },
      );
    }
    fenetre.nombre++;
    return identite;
  }

  creer(creneauId: string, authorization?: string): Reservation {
    const identite = this.identifier(authorization);
    const creneau = this.repository.trouverCreneau(creneauId);
    if (!creneau)
      this.erreur(
        404,
        'creneau-introuvable',
        'Créneau introuvable',
        'Aucun créneau ne correspond à cet identifiant.',
      );
    if (Date.parse(creneau.debut) <= Date.now())
      this.erreur(
        409,
        'creneau-non-reservable',
        'Créneau non réservable',
        'Le créneau a déjà commencé.',
      );
    const reservations = this.repository.lister();
    const actives = reservations.filter(
      (r) => r.creneauId === creneauId && r.statut === 'active',
    );
    if (actives.some((r) => r.adherentId === identite.adherentId))
      this.erreur(
        409,
        'reservation-existante',
        'Réservation existante',
        'Cet adhérent a déjà réservé ce créneau.',
      );
    if (actives.length >= creneau.capacite)
      this.erreur(
        409,
        'creneau-complet',
        'Créneau complet',
        'Le créneau ne dispose plus de place.',
      );
    const maintenant = Date.now();
    const jour = jourParis(maintenant);
    const consomme = reservations.filter(
      (r) =>
        r.adherentId === identite.adherentId &&
        jourParis(r.dateCreation) === jour,
    ).length;
    if (consomme >= identite.quota)
      this.erreur(
        429,
        'quota-reservations',
        'Quota atteint',
        'Le quota journalier de créations de réservations est atteint.',
        {
          'Retry-After': String(secondesAvantDemain(maintenant)),
        },
      );
    // Aucun await : contrôle et insertion atomiques dans ce processus mémoire unique.
    return this.repository.creer(identite.adherentId, creneauId);
  }

  trouverParId(id: string, authorization?: string): Reservation {
    const identite = this.identifier(authorization, true);
    const reservation = this.repository.trouverReservation(id);
    if (!reservation)
      this.erreur(
        404,
        'reservation-introuvable',
        'Réservation introuvable',
        'Aucune réservation ne correspond à cet identifiant.',
      );
    if (
      reservation.adherentId !== identite.adherentId &&
      identite.role !== 'admin'
    )
      this.erreur(
        403,
        'acces-interdit',
        'Accès interdit',
        'Cette réservation appartient à un autre adhérent.',
      );
    return reservation;
  }
}
