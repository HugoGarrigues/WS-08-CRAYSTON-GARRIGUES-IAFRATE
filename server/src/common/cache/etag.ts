import { createHash } from 'node:crypto';

/** Validateur fort de la représentation JSON effectivement renvoyée. */
export function calculerEtag(representation: unknown): string {
  return `"${createHash('sha256').update(JSON.stringify(representation)).digest('hex')}"`;
}

export function correspondEtag(
  condition: string | undefined,
  courant: string,
  faible = false,
): boolean {
  if (condition === undefined) return false;
  if (condition.trim() === '*') return true;
  return condition.split(',').some((valeur) => {
    const candidat = valeur.trim();
    return (faible ? candidat.replace(/^W\//, '') : candidat) === courant;
  });
}
