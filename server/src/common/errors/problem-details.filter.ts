import { normaliserReponsePivot } from './normaliser-reponse.js';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ErreurMetier } from './erreur-metier.js';

interface ErreurValidation {
  champ: string;
  message: string;
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    let status: number;
    let titre: string;
    let detail: string;
    let type: string;
    let erreurs: ErreurValidation[] | undefined;

    if (exception instanceof ErreurMetier) {
      status = exception.status;
      titre = exception.titre;
      detail = exception.message;
      type = exception.type;
      erreurs = exception.erreurs;
      for (const [nom, valeur] of Object.entries(exception.headers ?? {})) {
        response.setHeader(nom, valeur);
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();

      const reponse = exception.getResponse();
      if (
        typeof reponse === 'object' &&
        reponse !== null &&
        'errors' in reponse
      ) {
        erreurs = (reponse as { errors: ErreurValidation[] }).errors;
      }

      titre =
        status === 404
          ? 'Ressource introuvable'
          : status === 400
            ? 'Requête invalide'
            : 'Erreur HTTP';

      type = `https://api.mawo.local/problems/http-${status}`;

      if (
        typeof reponse === 'object' &&
        reponse !== null &&
        'message' in reponse
      ) {
        const messages = (reponse as { message: unknown }).message;

        if (Array.isArray(messages)) {
          detail = 'Les données envoyées sont invalides.';
          erreurs = messages.map((message: unknown) => {
            const texte = String(message);
            const correspondance = texte.match(
              /^property (.+) should not exist$/,
            );

            return {
              champ: correspondance?.[1] ?? 'requête',
              message: texte,
            };
          });
        } else {
          detail = String(messages);
        }
      } else {
        detail = exception.message;
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      titre = 'Erreur interne du serveur';
      detail = 'Une erreur inattendue est survenue.';
      type = 'https://api.mawo.local/problems/erreur-interne';

      this.logger.error(
        `Erreur inattendue sur ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const probleme = normaliserReponsePivot(
      type,
      titre,
      status,
      detail,
      request.url,
      erreurs,
    );

    response.status(status).type('application/problem+json').json(probleme);
  }
}
