import { Module } from '@nestjs/common';
import { DonneesModule } from '../donnees/donnees.module';
import { CreneauxController } from './creneaux.controller';
import { CreneauxService } from './creneaux.service';

@Module({
  imports: [DonneesModule],
  controllers: [CreneauxController],
  providers: [CreneauxService],
})
export class CreneauxModule {}
