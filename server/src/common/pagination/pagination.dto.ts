import { Transform } from 'class-transformer';
import { IsInt, IsUUID, Max, Min, ValidateIf } from 'class-validator';

function entierStrict({ value }: { value: unknown }): number {
  return typeof value === 'string' && /^[1-9][0-9]*$/.test(value)
    ? Number(value)
    : NaN;
}

export class PaginationDto {
  @Transform(entierStrict)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  page = 1;

  @Transform(entierStrict)
  @IsInt()
  @Min(1)
  @Max(100)
  taille = 20;
}

export class ListeMachinesDto extends PaginationDto {
  @ValidateIf((_objet, valeur) => valeur !== undefined)
  @IsUUID()
  salle?: string;
}
