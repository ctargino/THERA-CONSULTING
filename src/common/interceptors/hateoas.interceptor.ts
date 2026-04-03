import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HATEOAS_RESOURCE_KEY } from '../decorators/hateoas-resource.decorator';
import { LinkService } from '../services/link.service';

@Injectable()
export class HateoasInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly linkService: LinkService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const resourceType = this.reflector.get<string>(
      HATEOAS_RESOURCE_KEY,
      context.getHandler(),
    );

    if (!resourceType) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data: unknown) => {
        if (data == null) return data;
        if (Array.isArray(data)) {
          return data.map((item) => this.enrichItem(item, resourceType));
        }
        return this.enrichItem(data, resourceType);
      }),
    );
  }

  private enrichItem(item: unknown, resourceType: string): unknown {
    const record = item as Record<string, unknown> | null | undefined;
    if (record?.id == null) return item;
    const enriched = { ...record };
    this.stripOrderItemRelations(enriched);
    if (resourceType === 'order' && Array.isArray(enriched.items)) {
      enriched.items = enriched.items.map((oi: Record<string, unknown>) => {
        const copy = { ...oi };
        this.stripOrderItemRelations(copy);
        return copy;
      });
    }
    return {
      ...enriched,
      _links: this.linkService.buildLinks(
        record as { id: number; [key: string]: unknown },
        resourceType,
      ),
    };
  }

  private stripOrderItemRelations(item: Record<string, unknown>): void {
    if ('int_product_id' in item) {
      delete item.order;
      delete item.product;
    }
  }
}
