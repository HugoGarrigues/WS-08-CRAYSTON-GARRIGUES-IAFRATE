export interface Salle {
  id: string;
  nom: string;
  adresse: string;
  capacite: number;
  dateCreation: string;
}

export interface CreationSalle {
  nom: string;
  adresse: string;
  capacite: number;
}

export type ModificationSalle = Partial<CreationSalle>;
