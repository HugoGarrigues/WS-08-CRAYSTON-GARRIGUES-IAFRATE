export interface ResultatPagine<T> {
  items: T[];
  page: number;
  taille: number;
  total: number;
  pageSuivante: number | null;
}

/**
 * NC-204 : pagination par décalage (page et taille).
 * La taille maximale est de 100 éléments.
 */
export function paginerResultatPivot<T>(
  elements: readonly T[],
  page: number,
  taille: number,
): ResultatPagine<T> {
  if (!Number.isInteger(page) || page < 1) {
    throw new RangeError(
      'Le numéro de page doit être un entier supérieur ou égal à 1.',
    );
  }

  if (!Number.isInteger(taille) || taille < 1 || taille > 100) {
    throw new RangeError(
      'La taille doit être un entier compris entre 1 et 100.',
    );
  }

  const debut = (page - 1) * taille;

  return {
    items: elements.slice(debut, debut + taille),
    page,
    taille,
    total: elements.length,
    pageSuivante: page * taille < elements.length ? page + 1 : null,
  };
}
