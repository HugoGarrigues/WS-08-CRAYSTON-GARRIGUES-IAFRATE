import {
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const STATUTS_MACHINE = ['disponible', 'maintenance', 'hors_service'] as const;

export class ModificationMachineDto {
  @ValidateIf((_objet, valeur) => valeur !== undefined && valeur !== null)
  @IsUUID()
  salleId?: string | null;

  @ValidateIf((_objet, valeur) => valeur !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nom?: string;

  @ValidateIf((_objet, valeur) => valeur !== undefined)
  @IsIn(STATUTS_MACHINE)
  statut?: (typeof STATUTS_MACHINE)[number];
}
