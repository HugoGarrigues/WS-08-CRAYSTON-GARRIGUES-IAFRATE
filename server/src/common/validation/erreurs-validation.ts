import type { ValidationError } from 'class-validator';

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
