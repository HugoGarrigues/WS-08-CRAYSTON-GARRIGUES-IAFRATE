import { PaginationDto } from '../common/pagination/pagination.dto.js';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { SallesService } from './salles.service.js';
import { CreationSalleDto, ModificationSalleDto } from './salles.dto.js';

@Controller('salles')
export class SallesController {
  constructor(private readonly service: SallesService) {}

  @Get()
  lister(@Query() query: PaginationDto) {
    return this.service.lister(query.page, query.taille);
  }

  @Get(':salleId')
  trouverParId(@Param('salleId', new ParseUUIDPipe()) salleId: string) {
    return this.service.trouverParId(salleId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  creer(
    @Body() donnees: CreationSalleDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const salle = this.service.creer(donnees);
    response.location(`/salles/${salle.id}`);
    return salle;
  }

  @Put(':salleId')
  remplacer(
    @Param('salleId', new ParseUUIDPipe()) salleId: string,
    @Body() donnees: CreationSalleDto,
  ) {
    return this.service.modifier(salleId, donnees);
  }

  @Patch(':salleId')
  modifier(
    @Param('salleId', new ParseUUIDPipe()) salleId: string,
    @Body() donnees: ModificationSalleDto,
  ) {
    return this.service.modifier(salleId, donnees);
  }

  @Delete(':salleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  supprimer(@Param('salleId', new ParseUUIDPipe()) salleId: string) {
    this.service.supprimer(salleId);
  }
}
