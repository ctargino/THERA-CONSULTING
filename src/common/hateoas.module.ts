import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LinkService } from './services/link.service';
import { HateoasInterceptor } from './interceptors/hateoas.interceptor';

@Module({
  providers: [
    LinkService,
    { provide: APP_INTERCEPTOR, useClass: HateoasInterceptor },
  ],
})
export class HateoasModule {}
