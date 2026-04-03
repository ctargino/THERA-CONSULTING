import { SetMetadata } from '@nestjs/common';

export const HATEOAS_RESOURCE_KEY = 'hateoas:resource';

export const HateoasResource = (resourceType: string) =>
  SetMetadata(HATEOAS_RESOURCE_KEY, resourceType);
