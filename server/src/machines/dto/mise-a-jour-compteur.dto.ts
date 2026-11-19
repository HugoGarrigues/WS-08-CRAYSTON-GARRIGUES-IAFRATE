import { IsDateTimeOpenApi } from '../../common/validation/is-date-time';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class MiseAJourCompteurDto {
  @IsInt()
  @Min(0)
  valeur!: number;

  @IsDateTimeOpenApi()
  @IsString()
  @IsNotEmpty()
  horodatage!: string;
}
