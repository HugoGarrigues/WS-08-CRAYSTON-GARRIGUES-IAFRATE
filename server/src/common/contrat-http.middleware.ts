import { BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import type { OpenAPIObject, OperationObject } from '@nestjs/swagger';
import { isUUID } from 'class-validator';
import type { RequestHandler } from 'express';

/** Respecter les méthodes et les en-têtes déclarés pour les routes implémentées. */
export function verifierContratHttp(contrat: OpenAPIObject): RequestHandler {
  const routes = Object.entries(contrat.paths).map(([chemin, operations]) => {
    const methodes = Object.keys(operations).filter((m) =>
      [
        'get',
        'post',
        'put',
        'patch',
        'delete',
        'head',
        'options',
        'trace',
      ].includes(m),
    );
    const autorisees = methodes.map((m) => m.toUpperCase());
    if (methodes.includes('get') && !autorisees.includes('HEAD'))
      autorisees.push('HEAD');
    if (!autorisees.includes('OPTIONS')) autorisees.push('OPTIONS');
    return {
      expression: new RegExp(
        `^${chemin.replace(/\{[^}]+\}/g, '[^/]+')}/?$`,
        'i',
      ),
      operations,
      autorisees,
    };
  });

  return (requete, reponse, suite) => {
    const route = routes.find((r) => r.expression.test(requete.path));
    if (!route) return suite();
    if (!route.autorisees.includes(requete.method)) {
      reponse.setHeader('Allow', route.autorisees.join(', '));
      return suite(
        new MethodNotAllowedException(
          'Cette méthode ne fait pas partie des opérations de cette route.',
        ),
      );
    }
    if (requete.method === 'OPTIONS') {
      reponse.setHeader('Allow', route.autorisees.join(', '));
      reponse.status(204).end();
      return;
    }
    const methode =
      requete.method === 'HEAD' ? 'get' : requete.method.toLowerCase();
    const operation = route.operations[
      methode as keyof typeof route.operations
    ] as OperationObject | undefined;
    const parametres = operation?.parameters ?? [];
    const verifieRequestId = parametres.some((p) =>
      '$ref' in p
        ? p.$ref === '#/components/parameters/RequestId'
        : p.in === 'header' && p.name.toLowerCase() === 'x-request-id',
    );
    const requestId = requete.headers['x-request-id'];
    if (
      verifieRequestId &&
      requestId !== undefined &&
      (typeof requestId !== 'string' || !isUUID(requestId))
    ) {
      return suite(
        new BadRequestException({
          message: 'L’en-tête X-Request-Id doit être un UUID.',
          errors: [
            {
              champ: 'X-Request-Id',
              message: 'Un UUID est attendu lorsque cet en-tête est présent.',
            },
          ],
        }),
      );
    }
    return suite();
  };
}
