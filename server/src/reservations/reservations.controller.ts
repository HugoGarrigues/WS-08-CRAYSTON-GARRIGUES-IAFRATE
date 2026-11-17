import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CreationReservationDto } from './dto/creation-reservation.dto';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  creer(
    @Body() donnees: CreationReservationDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const reservation = this.service.creer(donnees.creneauId);
    response.location(`/reservations/${reservation.id}`);
    return reservation;
  }

  @Get(':reservationId')
  trouverParId(@Param('reservationId', ParseUUIDPipe) reservationId: string) {
    return this.service.trouverParId(reservationId);
  }
}
