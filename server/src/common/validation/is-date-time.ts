import { isRFC3339, ValidateBy } from 'class-validator';

/** Format date-time OpenAPI : RFC 3339 et date calendaire valide. */
export function IsDateTimeOpenApi() {
  return ValidateBy({
    name: 'isDateTimeOpenApi',
    validator: {
      validate(valeur: unknown) {
        if (
          typeof valeur !== 'string' ||
          !isRFC3339(valeur) ||
          !/^\d{4}-\d{2}-\d{2}[tT]/.test(valeur)
        )
          return false;
        const [annee, mois, jour] = valeur.slice(0, 10).split('-').map(Number);
        const bissextile =
          annee % 4 === 0 && (annee % 100 !== 0 || annee % 400 === 0);
        const jours = [
          31,
          bissextile ? 29 : 28,
          31,
          30,
          31,
          30,
          31,
          31,
          30,
          31,
          30,
          31,
        ];
        return jour >= 1 && jour <= jours[mois - 1];
      },
      defaultMessage: () =>
        'horodatage doit être une date-heure RFC 3339 valide.',
    },
  });
}
