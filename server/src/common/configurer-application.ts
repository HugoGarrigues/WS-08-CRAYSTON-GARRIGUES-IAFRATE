import {
  BadRequestException,
  type INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { ProblemDetailsFilter } from './errors/problem-details.filter.js';

export function erreursValidation(
  erreurs: ValidationError[],
  prefixe = '',
): Array<{ champ: string; message: string }> {
  return erreurs.flatMap((erreur) => {
    const champ = prefixe ? `${prefixe}.${erreur.property}` : erreur.property;
    return [
      ...Object.values(erreur.constraints ?? {}).map((message) => ({
        champ,
        message,
      })),
      ...erreursValidation(erreur.children ?? [], champ),
    ];
  });
}

export function configurerApplication(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      exceptionFactory: (erreurs) =>
        new BadRequestException({
          message: 'Les données envoyées sont invalides.',
          errors: erreursValidation(erreurs),
        }),
    }),
  );
  app.useGlobalFilters(new ProblemDetailsFilter());
}
