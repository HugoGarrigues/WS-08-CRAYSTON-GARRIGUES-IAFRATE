import {
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
  Min,
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

export class MiseAJourCompteurDto {
  @IsInt()
  @Min(0)
  valeur!: number;

  @Matches(/T.*(?:Z|[+-][0-9]{2}:[0-9]{2})$/)
  @IsISO8601({ strict: true, strictSeparator: true })
  @IsString()
  @IsNotEmpty()
  horodatage!: string;
}
