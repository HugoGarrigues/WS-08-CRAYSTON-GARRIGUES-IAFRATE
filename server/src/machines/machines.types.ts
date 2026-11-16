export type StatutMachine =
  | 'disponible'
  | 'maintenance'
  | 'hors_service';

export interface Machine {
  id: string;
  salleId: string | null;
  nom: string;
  statut: StatutMachine;
  compteurUtilisations: number;
  dateCreation: string;
}

export interface CreationMachine {
  salleId: string | null;
  nom: string;
  statut: StatutMachine;
}

export type ModificationMachine = Partial<CreationMachine>;
