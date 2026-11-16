import { ListeMachinesDto } from '../common/pagination/pagination.dto.js';
import {
  Body,
  UnprocessableEntityException,
  ValidationPipe,
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
import { erreursValidation } from '../common/configurer-application.js';
import { MachinesService } from './machines.service.js';
import {
  CreationMachineDto,
  ModificationMachineDto,
  MiseAJourCompteurDto,
} from './machines.dto.js';

@Controller('machines')
export class MachinesController {
  constructor(private readonly service: MachinesService) {}

  @Get()
  lister(@Query() query: ListeMachinesDto) {
    return this.service.lister(query.page, query.taille, query.salle);
  }

  @Get(':machineId')
  trouverParId(@Param('machineId', new ParseUUIDPipe()) machineId: string) {
    return this.service.trouverParId(machineId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  creer(
    @Body() donnees: CreationMachineDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const machine = this.service.creer(donnees);
    response.location(`/machines/${machine.id}`);
    return machine;
  }

  @Put(':machineId')
  remplacer(
    @Param('machineId', new ParseUUIDPipe()) machineId: string,
    @Body() donnees: CreationMachineDto,
  ) {
    return this.service.modifier(machineId, donnees);
  }

  @Patch(':machineId')
  modifier(
    @Param('machineId', new ParseUUIDPipe()) machineId: string,
    @Body() donnees: ModificationMachineDto,
  ) {
    return this.service.modifier(machineId, donnees);
  }

  @Put(':machineId/compteur')
  @HttpCode(HttpStatus.NO_CONTENT)
  mettreAJourCompteur(
    @Param('machineId', new ParseUUIDPipe()) machineId: string,
    @Body(
      new ValidationPipe({
        expectedType: MiseAJourCompteurDto,
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        exceptionFactory: (erreurs) =>
          new UnprocessableEntityException({
            message: 'La mesure envoyée est invalide.',
            errors: erreursValidation(erreurs),
          }),
      }),
    )
    corps: unknown,
  ) {
    const donnees = corps as MiseAJourCompteurDto;
    this.service.mettreAJourCompteur(
      machineId,
      donnees.valeur,
      donnees.horodatage,
    );
  }

  @Delete(':machineId')
  @HttpCode(HttpStatus.NO_CONTENT)
  supprimer(@Param('machineId', new ParseUUIDPipe()) machineId: string): void {
    this.service.supprimer(machineId);
  }
}
