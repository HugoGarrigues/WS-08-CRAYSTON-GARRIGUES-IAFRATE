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
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { ListeMachinesDto } from '../common/pagination/pagination.dto';
import { erreursValidation } from '../common/validation/erreurs-validation';
import { CreationMachineDto } from './dto/creation-machine.dto';
import { MiseAJourCompteurDto } from './dto/mise-a-jour-compteur.dto';
import { ModificationMachineDto } from './dto/modification-machine.dto';
import { MachinesService } from './machines.service';

@Controller('machines')
export class MachinesController {
  constructor(private readonly service: MachinesService) {}

  @Get()
  lister(@Query() query: ListeMachinesDto) {
    return this.service.lister(query.page, query.taille, query.salle);
  }

  @Get(':machineId')
  trouverParId(@Param('machineId', ParseUUIDPipe) machineId: string) {
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
    @Param('machineId', ParseUUIDPipe) machineId: string,
    @Body() donnees: CreationMachineDto,
  ) {
    return this.service.remplacer(machineId, donnees);
  }

  @Patch(':machineId')
  modifier(
    @Param('machineId', ParseUUIDPipe) machineId: string,
    @Body() donnees: ModificationMachineDto,
  ) {
    return this.service.modifier(machineId, donnees);
  }

  @Put(':machineId/compteur')
  @HttpCode(HttpStatus.NO_CONTENT)
  mettreAJourCompteur(
    @Param('machineId', ParseUUIDPipe) machineId: string,
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
  ): void {
    const donnees = corps as MiseAJourCompteurDto;
    this.service.mettreAJourCompteur(machineId, donnees.valeur);
  }

  @Delete(':machineId')
  @HttpCode(HttpStatus.NO_CONTENT)
  supprimer(@Param('machineId', ParseUUIDPipe) machineId: string): void {
    this.service.supprimer(machineId);
  }
}
