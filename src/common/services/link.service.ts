import { Injectable } from '@nestjs/common';
import { HalLinks } from '../types/hal-links.type';

@Injectable()
export class LinkService {
  buildLinks(
    entity: { id: number; [key: string]: unknown },
    resourceType: string,
  ): HalLinks {
    const links: HalLinks = {};

    if (resourceType === 'product') {
      links.self = { href: `/products/${entity.id}` };
    } else if (resourceType === 'order') {
      links.self = { href: `/orders/${entity.id}` };

      const status = entity.str_status as string;
      if (status === 'pending') {
        links.complete = {
          href: `/orders/${entity.id}/status`,
          title: 'Complete this order',
        };
        links.cancel = {
          href: `/orders/${entity.id}/status`,
          title: 'Cancel this order',
        };
      } else if (status === 'completed') {
        links.cancel = {
          href: `/orders/${entity.id}/status`,
          title: 'Cancel this order',
        };
      }
    }

    return links;
  }
}
