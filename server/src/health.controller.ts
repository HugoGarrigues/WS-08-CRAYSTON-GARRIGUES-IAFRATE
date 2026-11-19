import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get('live')
  verifier() {
    return { status: 'ok' };
  }
}
