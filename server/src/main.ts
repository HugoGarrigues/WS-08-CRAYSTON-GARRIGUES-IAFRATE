import { NestFactory } from '@nestjs/core';
import { SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { AppModule } from './app.module';

const OPERATIONS_IMPLEMENTEES: Record<string, string[]> = {
  '/salles': ['get', 'post'],
  '/salles/{salleId}': ['get', 'put', 'patch', 'delete'],
  '/machines': ['get', 'post'],
  '/machines/{machineId}': ['get', 'put', 'patch', 'delete'],
  '/machines/{machineId}/compteur': ['put'],
  '/reservations': ['post'],
  '/reservations/{reservationId}': ['get'],
};

function filtrerContrat(contrat: OpenAPIObject): OpenAPIObject {
  const paths: Record<string, unknown> = {};

  for (const [chemin, methodes] of Object.entries(
    OPERATIONS_IMPLEMENTEES,
  )) {
    const element = contrat.paths?.[chemin];

    if (!element) {
      continue;
    }

    paths[chemin] = Object.fromEntries(
      Object.entries(element).filter(
        ([cle]) =>
          cle === 'parameters' ||
          cle.startsWith('x-') ||
          methodes.includes(cle),
      ),
    );
  }

  return { ...contrat, paths: paths as OpenAPIObject['paths'] };
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Le contrat TP3 reste la source de vérité. Swagger n'affiche que les
  // opérations réellement implémentées, sauf si SWAGGER_COMPLET=1.
  const contrat = parse(
    readFileSync(join(__dirname, '..', '..', 'openapi.yaml'), 'utf8'),
  ) as OpenAPIObject;
  const document =
    process.env.SWAGGER_COMPLET === '1'
      ? contrat
      : filtrerContrat(contrat);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
