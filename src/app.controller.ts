import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Check application and database health' })
  @ApiResponse({
    status: 200,
    description: 'Health status',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-04-03T12:00:00.000Z',
        uptime: 123.456,
        database: { status: 'healthy', responseTimeMs: 5 },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'Database connection failed' })
  healthCheck(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    database: { status: string; responseTimeMs: number };
  }> {
    return this.appService.healthCheck();
  }
}
