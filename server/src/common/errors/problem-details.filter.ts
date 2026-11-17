import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ErreurMetier } from './erreur-metier';

interface ErreurValidation {
  champ: string;
  message: string;
}

function titrePourStatut(status: number): string {
  switch (status) {
    case 400:
      return 'Requête invalide';
    case 401:
      return 'Authentification requise';
    case 403:
      return 'Accès interdit';
    case 404:
      return 'Ressource introuvable';
    case 409:
      return 'Conflit';
    case 422:
      return 'Données invalides';
    default:
      return 'Erreur HTTP';
  }
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const contexte = host.switchToHttp();
    const requete = contexte.getRequest<Request>();
    const reponseHttp = contexte.getResponse<Response>();

    let status = 500;
    let type = 'https://api.mawo.local/problems/erreur-interne';
    let titre = 'Erreur interne du serveur';
    let detail = 'Une erreur inattendue est survenue.';
    let erreurs: ErreurValidation[] | undefined;

    if (exception instanceof ErreurMetier) {
      status = exception.status;
      type = exception.type;
      titre = exception.titre;
      detail = exception.message;
      erreurs = exception.erreurs;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      type = `https://api.mawo.local/problems/http-${status}`;
      titre = titrePourStatut(status);

      const reponse = exception.getResponse();
      if (typeof reponse === 'string') {
        detail = reponse;
      } else if (reponse !== null && typeof reponse === 'object') {
        const objet = reponse as { message?: unknown; errors?: unknown };

        if (Array.isArray(objet.errors)) {
          erreurs = objet.errors as ErreurValidation[];
        }

        if (Array.isArray(objet.message)) {
          detail = 'Les données envoyées sont invalides.';
          erreurs = objet.message.map((message) => ({
            champ: 'requête',
            message: String(message),
          }));
        } else if (objet.message !== undefined) {
          detail = String(objet.message);
        }
      } else {
        detail = exception.message;
      }

      // Les erreurs du parseur JSON ne doivent pas exposer un détail technique.
      if (status === 400 && /JSON|Unexpected|Expected/i.test(detail)) {
        detail = 'Le corps JSON de la requête est invalide.';
      }

      // Le PDF demande un champ errors pour les erreurs de validation 400.
      if (status === 400 && !erreurs?.length) {
        erreurs = [{ champ: 'requête', message: detail }];
      }
    } else {
      this.logger.error(
        `Erreur inattendue sur ${requete.method} ${requete.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const probleme = {
      type,
      title: titre,
      status,
      detail,
      instance: requete.url,
      ...(erreurs?.length ? { errors: erreurs } : {}),
    };

    reponseHttp.status(status).type('application/problem+json').json(probleme);
  }
}
