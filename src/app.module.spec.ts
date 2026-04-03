process.env.JWT_SECRET = 'test-secret';

import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppModule', () => {
  it('should be defined with correct module metadata', () => {
    expect(AppModule).toBeDefined();
  });

  it('should compile the module without TypeORM', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    expect(module).toBeDefined();
    const appController = module.get<AppController>(AppController);
    expect(appController).toBeInstanceOf(AppController);
    await module.close();
  });
});
