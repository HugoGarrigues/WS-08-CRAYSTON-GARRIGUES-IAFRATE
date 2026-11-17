import { Module } from '@nestjs/common';
import { MachinesRepository } from './machines.repository';
import { ReservationsRepository } from './reservations.repository';
import { SallesRepository } from './salles.repository';

@Module({
  providers: [SallesRepository, MachinesRepository, ReservationsRepository],
  exports: [SallesRepository, MachinesRepository, ReservationsRepository],
})
export class DonneesModule {}
