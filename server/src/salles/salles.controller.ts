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
import { PaginationDto } from '../common/pagination/pagination.dto';
import { CreationSalleDto } from './dto/creation-salle.dto';
import { ModificationSalleDto } from './dto/modification-salle.dto';
import { SallesService } from './salles.service';

@Controller('salles')
export class SallesController {
  constructor(private readonly service: SallesService) {}

  @Get()
  lister(@Query() query: PaginationDto) {
    return this.service.lister(query.page, query.taille);
  }

  @Get(':salleId')
  trouverParId(@Param('salleId', ParseUUIDPipe) salleId: string) {
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
    @Param('salleId', ParseUUIDPipe) salleId: string,
    @Body() donnees: CreationSalleDto,
  ) {
    return this.service.remplacer(salleId, donnees);
  }

  @Patch(':salleId')
  modifier(
    @Param('salleId', ParseUUIDPipe) salleId: string,
    @Body() donnees: ModificationSalleDto,
  ) {
    return this.service.modifier(salleId, donnees);
  }

  @Delete(':salleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  supprimer(@Param('salleId', ParseUUIDPipe) salleId: string): void {
    this.service.supprimer(salleId);
  }
}
