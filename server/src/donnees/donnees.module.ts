import { CreneauxRepository } from './creneaux.repository';
import { Module } from '@nestjs/common';
import { MachinesRepository } from './machines.repository';
import { ReservationsRepository } from './reservations.repository';
import { SallesRepository } from './salles.repository';

@Module({
  providers: [
    SallesRepository,
    MachinesRepository,
    ReservationsRepository,
    CreneauxRepository,
  ],
  exports: [
    SallesRepository,
    MachinesRepository,
    ReservationsRepository,
    CreneauxRepository,
  ],
})
export class DonneesModule {}
