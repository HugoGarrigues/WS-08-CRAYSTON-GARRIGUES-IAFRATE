export interface Creneau {
  id: string;
  salleId: string;
  coursId: string | null;
  machineId: string | null;
  libelle: string;
  debut: string;
  fin: string;
  capacite: number;
  dateCreation: string;
}
