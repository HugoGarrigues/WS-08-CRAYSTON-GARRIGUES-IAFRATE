import type { OpenAPIObject } from '@nestjs/swagger';
import type { RequestHandler } from 'express';

export const DATE_DEPRECATION_V1 = '2026-11-19T00:00:00Z';
export const DATE_ARRET_V1 = '2027-06-30T23:59:59Z';

/** NC-106 : date structurée RFC 9745, réutilisée dans les réponses v1. */
export function dateStampVersionPivot(date: string): string {
  const instant = Date.parse(date);
  if (!Number.isFinite(instant))
    throw new RangeError('Date de dépréciation invalide.');
  return `@${Math.floor(instant / 1000)}`;
}

export function deprecierV1(contrat: OpenAPIObject): RequestHandler {
  const chemins = Object.keys(contrat.paths).map(
    (chemin) => new RegExp(`^${chemin.replace(/\{[^}]+\}/g, '[^/]+')}/?$`, 'i'),
  );
  return (requete, reponse, suite) => {
    if (chemins.some((chemin) => chemin.test(requete.path))) {
      reponse.setHeader(
        'Deprecation',
        dateStampVersionPivot(DATE_DEPRECATION_V1),
      );
      reponse.setHeader('Sunset', new Date(DATE_ARRET_V1).toUTCString());
      reponse.append(
        'Link',
        `</v2${requete.originalUrl}>; rel="successor-version"`,
      );
    }
    suite();
  };
}
