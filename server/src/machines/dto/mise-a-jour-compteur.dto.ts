import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsString,
  Matches,
  Min,
} from 'class-validator';

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
