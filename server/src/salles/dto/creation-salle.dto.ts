import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

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
