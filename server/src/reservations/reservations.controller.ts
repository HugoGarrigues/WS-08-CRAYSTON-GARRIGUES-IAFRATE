import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CreationReservationDto } from './reservations.dto.js';
import { ReservationsService } from './reservations.service.js';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  creer(
    @Body() donnees: CreationReservationDto,
    @Headers('authorization') authorization: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const reservation = this.service.creer(donnees.creneauId, authorization);
    response.location(`/reservations/${reservation.id}`);
    return reservation;
  }

  @Get(':reservationId')
  trouverParId(
    @Param('reservationId', new ParseUUIDPipe()) id: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.service.trouverParId(id, authorization);
  }
}
