import { Module } from '@nestjs/common';
import { DonneesModule } from '../donnees/donnees.module';
import { MachinesController } from './machines.controller';
import { MachinesService } from './machines.service';

@Module({
  imports: [DonneesModule],
  controllers: [MachinesController],
  providers: [MachinesService],
})
export class MachinesModule {}
