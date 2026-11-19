import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { calculerEtag, correspondEtag } from '../common/cache/etag';
import { CreneauxService } from './creneaux.service';
import { ModificationCreneauDto } from './modification-creneau.dto';

@Controller('creneaux')
export class CreneauxController {
  constructor(private readonly service: CreneauxService) {}

  @Get(':creneauId')
  trouverParId(
    @Param('creneauId', ParseUUIDPipe) id: string,
    @Headers('if-none-match') condition: string | undefined,
    @Res({ passthrough: true }) reponse: Response,
  ) {
    const creneau = this.service.trouverParId(id);
    const etag = calculerEtag(creneau);
    reponse.setHeader('ETag', etag);
    reponse.setHeader('Cache-Control', 'no-cache');
    if (correspondEtag(condition, etag, true)) {
      reponse.status(304);
      return;
    }
    return creneau;
  }

  @Patch(':creneauId')
  modifier(
    @Param('creneauId', ParseUUIDPipe) id: string,
    @Body() donnees: ModificationCreneauDto,
    @Headers('if-match') condition: string | undefined,
    @Res({ passthrough: true }) reponse: Response,
  ) {
    const creneau = this.service.modifierLibelle(
      id,
      donnees.libelle,
      condition,
    );
    reponse.setHeader('ETag', calculerEtag(creneau));
    reponse.setHeader('Cache-Control', 'no-cache');
    return creneau;
  }
}
