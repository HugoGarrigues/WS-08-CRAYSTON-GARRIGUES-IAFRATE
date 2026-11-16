export interface ProblemeHttp {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors?: Array<{ champ: string; message: string }>;
}

/** NC-104 : point commun de construction des réponses RFC 9457. */
export function normaliserReponsePivot(
  type: string,
  title: string,
  status: number,
  detail: string,
  instance: string,
  errors?: ProblemeHttp['errors'],
): ProblemeHttp {
  return {
    type,
    title,
    status,
    detail,
    instance,
    ...(errors?.length ? { errors } : {}),
  };
}
