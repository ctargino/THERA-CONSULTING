import { LinkService } from './link.service';

describe('LinkService', () => {
  let service: LinkService;

  beforeEach(() => {
    service = new LinkService();
  });

  describe('buildLinks', () => {
    describe('product resource type', () => {
      it('should return self link with correct href', () => {
        const entity = { id: 1 };
        const links = service.buildLinks(entity, 'product');

        expect(links).toEqual({
          self: { href: '/products/1' },
        });
      });

      it('should include the correct entity ID in href', () => {
        const entity = { id: 42 };
        const links = service.buildLinks(entity, 'product');

        expect(links.self.href).toBe('/products/42');
      });

      it('should return only self link for product', () => {
        const entity = { id: 1 };
        const links = service.buildLinks(entity, 'product');

        expect(Object.keys(links)).toEqual(['self']);
      });
    });

    describe('order resource type — pending status', () => {
      it('should return self link', () => {
        const entity = { id: 1, str_status: 'pending' };
        const links = service.buildLinks(entity, 'order');

        expect(links.self).toEqual({ href: '/orders/1' });
      });

      it('should return complete action link with title', () => {
        const entity = { id: 1, str_status: 'pending' };
        const links = service.buildLinks(entity, 'order');

        expect(links.complete).toEqual({
          href: '/orders/1/status',
          title: 'Complete this order',
        });
      });

      it('should return cancel action link with title', () => {
        const entity = { id: 1, str_status: 'pending' };
        const links = service.buildLinks(entity, 'order');

        expect(links.cancel).toEqual({
          href: '/orders/1/status',
          title: 'Cancel this order',
        });
      });

      it('should include the correct entity ID in action link hrefs', () => {
        const entity = { id: 99, str_status: 'pending' };
        const links = service.buildLinks(entity, 'order');

        expect(links.complete.href).toBe('/orders/99/status');
        expect(links.cancel.href).toBe('/orders/99/status');
      });

      it('should return self, complete, and cancel links', () => {
        const entity = { id: 1, str_status: 'pending' };
        const links = service.buildLinks(entity, 'order');

        expect(Object.keys(links).sort()).toEqual([
          'cancel',
          'complete',
          'self',
        ]);
      });
    });

    describe('order resource type — completed status', () => {
      it('should return self link', () => {
        const entity = { id: 1, str_status: 'completed' };
        const links = service.buildLinks(entity, 'order');

        expect(links.self).toEqual({ href: '/orders/1' });
      });

      it('should return cancel action link', () => {
        const entity = { id: 1, str_status: 'completed' };
        const links = service.buildLinks(entity, 'order');

        expect(links.cancel).toEqual({
          href: '/orders/1/status',
          title: 'Cancel this order',
        });
      });

      it('should not return complete action link', () => {
        const entity = { id: 1, str_status: 'completed' };
        const links = service.buildLinks(entity, 'order');

        expect(links.complete).toBeUndefined();
      });

      it('should return only self and cancel links', () => {
        const entity = { id: 1, str_status: 'completed' };
        const links = service.buildLinks(entity, 'order');

        expect(Object.keys(links).sort()).toEqual(['cancel', 'self']);
      });
    });

    describe('order resource type — cancelled status', () => {
      it('should return only self link', () => {
        const entity = { id: 1, str_status: 'cancelled' };
        const links = service.buildLinks(entity, 'order');

        expect(links).toEqual({ self: { href: '/orders/1' } });
      });

      it('should not return complete or cancel action links', () => {
        const entity = { id: 1, str_status: 'cancelled' };
        const links = service.buildLinks(entity, 'order');

        expect(links.complete).toBeUndefined();
        expect(links.cancel).toBeUndefined();
      });
    });

    describe('unknown resource type', () => {
      it('should return empty links for unknown resource type', () => {
        const entity = { id: 1 };
        const links = service.buildLinks(entity, 'unknown');

        expect(links).toEqual({});
      });
    });
  });
});
