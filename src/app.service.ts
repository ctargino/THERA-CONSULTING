import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(private readonly dataSource: DataSource) {}

  getHello(): string {
    return 'Hello World!';
  }

  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    database: { status: string; responseTimeMs: number };
  }> {
    const dbStart = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: 'unhealthy',
          responseTimeMs: Date.now() - dbStart,
        },
      };
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'healthy',
        responseTimeMs: Date.now() - dbStart,
      },
    };
  }
}
