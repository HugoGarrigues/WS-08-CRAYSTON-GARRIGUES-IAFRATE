import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreationSalleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nom!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  adresse!: string;

  @IsInt()
  @Min(1)
  capacite!: number;
}

export class ModificationSalleDto {
  @ValidateIf((_objet, valeur) => valeur !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nom?: string;

  @ValidateIf((_objet, valeur) => valeur !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  adresse?: string;

  @ValidateIf((_objet, valeur) => valeur !== undefined)
  @IsInt()
  @Min(1)
  capacite?: number;
}
