import { IsUUID } from 'class-validator';

export class CreationReservationDto {
  @IsUUID()
  creneauId!: string;
}
