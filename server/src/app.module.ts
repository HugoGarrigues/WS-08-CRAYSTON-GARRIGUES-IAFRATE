import { ValidationEntreesPipe } from './common/validation/validation-entrees.pipe';
import { HealthController } from './health.controller';
import {
  BadRequestException,
  type ValidationPipeOptions,
} from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { erreursValidation } from './common/validation/erreurs-validation';
import { ProblemDetailsFilter } from './common/errors/problem-details.filter';
import { MachinesModule } from './machines/machines.module';
import { ReservationsModule } from './reservations/reservations.module';
import { SallesModule } from './salles/salles.module';

const optionsValidation: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  forbidUnknownValues: true,
  exceptionFactory: (erreurs) =>
    new BadRequestException({
      message: 'Les données envoyées sont invalides.',
      errors: erreursValidation(erreurs),
    }),
};

@Module({
  imports: [SallesModule, MachinesModule, ReservationsModule],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () => new ValidationEntreesPipe(optionsValidation),
    },
    {
      provide: APP_FILTER,
      useClass: ProblemDetailsFilter,
    },
  ],
})
export class AppModule {}
