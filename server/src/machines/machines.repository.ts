import { Injectable } from '@nestjs/common';
import type {
  CreationMachine,
  Machine,
  ModificationMachine,
} from './machines.types.js';

@Injectable()
export class MachinesRepository {
  private readonly machines = new Map<string, Machine>();

  lister(salleId?: string): Machine[] {
    return [...this.machines.values()]
      .filter(
        (machine) =>
          salleId === undefined || machine.salleId === salleId,
      )
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  trouverParId(id: string): Machine | undefined {
    return this.machines.get(id);
  }

  creer(donnees: CreationMachine): Machine {
    const machine: Machine = {
      id: crypto.randomUUID(),
      ...donnees,
      compteurUtilisations: 0,
      dateCreation: new Date().toISOString(),
    };

    this.machines.set(machine.id, machine);
    return machine;
  }

  modifier(
    id: string,
    donnees: ModificationMachine,
  ): Machine | undefined {
    const machineExistante = this.machines.get(id);

    if (!machineExistante) {
      return undefined;
    }

    // Ne pas écraser les propriétés existantes avec undefined.
    const donneesDefinies = Object.fromEntries(
      Object.entries(donnees).filter(
        ([, valeur]) => valeur !== undefined,
      ),
    ) as ModificationMachine;

    const machineModifiee: Machine = {
      ...machineExistante,
      ...donneesDefinies,
    };

    this.machines.set(id, machineModifiee);
    return machineModifiee;
  }

  supprimer(id: string): boolean {
    return this.machines.delete(id);
  }

  mettreAJourCompteur(
    id: string,
    compteur: number,
  ): Machine | undefined {
    const machine = this.machines.get(id);

    if (!machine) {
      return undefined;
    }

    const machineMiseAJour: Machine = {
      ...machine,
      compteurUtilisations: compteur,
    };

    this.machines.set(id, machineMiseAJour);
    return machineMiseAJour;
  }
}