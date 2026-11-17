import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class PaginationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  taille = 20;
}

export class ListeMachinesDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  salle?: string;
}
