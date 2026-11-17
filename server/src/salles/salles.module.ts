import { Module } from '@nestjs/common';
import { DonneesModule } from '../donnees/donnees.module';
import { SallesController } from './salles.controller';
import { SallesService } from './salles.service';

@Module({
  imports: [DonneesModule],
  controllers: [SallesController],
  providers: [SallesService],
})
export class SallesModule {}
