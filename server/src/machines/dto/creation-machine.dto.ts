import {
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const STATUTS_MACHINE = ['disponible', 'maintenance', 'hors_service'] as const;

export class CreationMachineDto {
  @ValidateIf((_objet, valeur) => valeur !== null)
  @IsUUID()
  salleId!: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nom!: string;

  @IsIn(STATUTS_MACHINE)
  statut!: (typeof STATUTS_MACHINE)[number];
}
