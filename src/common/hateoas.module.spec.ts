import { Test, TestingModule } from '@nestjs/testing';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HateoasModule } from './hateoas.module';
import { LinkService } from './services/link.service';
import { HateoasInterceptor } from './interceptors/hateoas.interceptor';

interface ProviderRecord {
  provide: unknown;
  useClass: unknown;
}

describe('HateoasModule', () => {
  it('should provide LinkService', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HateoasModule],
    }).compile();

    const linkService = module.get<LinkService>(LinkService);
    expect(linkService).toBeDefined();
    expect(linkService).toBeInstanceOf(LinkService);

    await module.close();
  });

  it('should register HateoasInterceptor as APP_INTERCEPTOR in module providers', () => {
    const providers = Reflect.getMetadata(
      'providers',
      HateoasModule,
    ) as ProviderRecord[];

    expect(providers).toBeDefined();
    expect(providers.length).toBe(2);

    const appInterceptorProvider = providers.find(
      (p) => p.provide === APP_INTERCEPTOR,
    );
    expect(appInterceptorProvider).toBeDefined();
    expect(appInterceptorProvider?.useClass).toBe(HateoasInterceptor);
  });

  it('should be importable without errors in a test module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HateoasModule],
    }).compile();

    expect(module).toBeDefined();
    expect(HateoasModule).toBeDefined();

    await module.close();
  });
});
