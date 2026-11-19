import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ModificationCreneauDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  libelle!: string;
}
