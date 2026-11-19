import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';

/** Les corps des opérations implémentées sont tous obligatoires dans OpenAPI. */
export class ValidationEntreesPipe extends ValidationPipe {
  override async transform(valeur: unknown, metadata: ArgumentMetadata) {
    if (metadata.type === 'body' && valeur === undefined) {
      throw new BadRequestException({
        message: 'Un corps JSON est obligatoire pour cette opération.',
        errors: [
          { champ: 'corps', message: 'Le corps de la requête est absent.' },
        ],
      });
    }
    return super.transform(valeur, metadata);
  }
}
