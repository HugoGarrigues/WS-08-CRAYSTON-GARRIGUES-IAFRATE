import { HealthController } from './health.controller.js';
import { ReservationsController } from './reservations/reservations.controller.js';
import { ReservationsRepository } from './reservations/reservations.repository.js';
import { ReservationsService } from './reservations/reservations.service.js';
import { Module } from '@nestjs/common';
import { SallesController } from './salles/salles.controller.js';
import { SallesRepository } from './salles/salles.repository.js';
import { SallesService } from './salles/salles.service.js';
import { MachinesController } from './machines/machines.controller.js';
import { MachinesRepository } from './machines/machines.repository.js';
import { MachinesService } from './machines/machines.service.js';

@Module({
  imports: [],
  controllers: [
    HealthController,
    SallesController,
    MachinesController,
    ReservationsController,
  ],
  providers: [
    ReservationsRepository,
    ReservationsService,
    SallesRepository,
    SallesService,
    MachinesRepository,
    MachinesService,
  ],
})
export class AppModule {}
