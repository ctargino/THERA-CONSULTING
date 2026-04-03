import { Reflector } from '@nestjs/core';
import {
  HATEOAS_RESOURCE_KEY,
  HateoasResource,
} from './hateoas-resource.decorator';

describe('HateoasResource Decorator', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  it('should set metadata with correct key on handler', () => {
    class TestController {
      @HateoasResource('product')
      getProducts(): unknown[] {
        return [];
      }
    }

    const metadata: unknown = reflector.get(
      HATEOAS_RESOURCE_KEY,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      TestController.prototype.getProducts,
    );

    expect(metadata).toBeDefined();
  });

  it('should set metadata with the provided resourceType value', () => {
    class TestController {
      @HateoasResource('product')
      getProduct(): unknown {
        return {};
      }
    }

    const metadata = reflector.get<string | undefined>(
      HATEOAS_RESOURCE_KEY,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      TestController.prototype.getProduct,
    );

    expect(metadata).toBe('product');
  });

  it('should work with different resourceType values', () => {
    class TestController {
      @HateoasResource('order')
      getOrders(): unknown[] {
        return [];
      }
    }

    const metadata = reflector.get<string | undefined>(
      HATEOAS_RESOURCE_KEY,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      TestController.prototype.getOrders,
    );

    expect(metadata).toBe('order');
  });

  it('should not set metadata on undecorated handlers', () => {
    class TestController {
      undecorated(): unknown {
        return {};
      }
    }

    const metadata: unknown = reflector.get(
      HATEOAS_RESOURCE_KEY,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      TestController.prototype.undecorated,
    );

    expect(metadata).toBeUndefined();
  });
});
