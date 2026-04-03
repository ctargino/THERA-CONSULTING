import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { HateoasInterceptor } from './hateoas.interceptor';
import { LinkService } from '../services/link.service';

describe('HateoasInterceptor', () => {
  let interceptor: HateoasInterceptor;
  let reflector: { get: jest.Mock };
  let linkService: { buildLinks: jest.Mock };

  const mockContext = (handler = jest.fn()): ExecutionContext =>
    ({
      getHandler: () => handler,
    }) as unknown as ExecutionContext;

  const mockCallHandler = (data: unknown): CallHandler =>
    ({ handle: () => of(data) }) as CallHandler;

  beforeEach(() => {
    reflector = { get: jest.fn() };
    linkService = { buildLinks: jest.fn() };
    interceptor = new HateoasInterceptor(
      reflector as unknown as Reflector,
      linkService as unknown as LinkService,
    );
  });

  describe('no decorator metadata', () => {
    it('should pass through unchanged when no @HateoasResource metadata is found', (done) => {
      reflector.get.mockReturnValue(undefined);
      const data = { id: 1, name: 'Product' };
      const context = mockContext();
      const next = mockCallHandler(data);

      interceptor.intercept(context, next).subscribe({
        next: (value) => {
          expect(value).toBe(data);
          expect(linkService.buildLinks).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('single entity response', () => {
    it('should enrich single entity with _links when @HateoasResource is present', (done) => {
      reflector.get.mockReturnValue('product');
      const data = { id: 1, name: 'Product' };
      linkService.buildLinks.mockReturnValue({ self: { href: '/products/1' } });
      const context = mockContext();
      const next = mockCallHandler(data);

      interceptor.intercept(context, next).subscribe({
        next: (value) => {
          expect(value).toEqual({
            id: 1,
            name: 'Product',
            _links: { self: { href: '/products/1' } },
          });
          done();
        },
      });
    });

    it('should call buildLinks with correct entity and resourceType', (done) => {
      reflector.get.mockReturnValue('order');
      const data = { id: 5, str_status: 'pending' };
      const context = mockContext();
      const next = mockCallHandler(data);

      interceptor.intercept(context, next).subscribe({
        next: () => {
          expect(linkService.buildLinks).toHaveBeenCalledWith(data, 'order');
          done();
        },
      });
    });
  });

  describe('array response', () => {
    it('should map buildLinks over each item in array response', (done) => {
      reflector.get.mockReturnValue('product');
      const items = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ];
      linkService.buildLinks
        .mockReturnValueOnce({ self: { href: '/products/1' } })
        .mockReturnValueOnce({ self: { href: '/products/2' } });
      const context = mockContext();
      const next = mockCallHandler(items);

      interceptor.intercept(context, next).subscribe({
        next: (value) => {
          expect(value).toEqual([
            { id: 1, name: 'A', _links: { self: { href: '/products/1' } } },
            { id: 2, name: 'B', _links: { self: { href: '/products/2' } } },
          ]);
          expect(linkService.buildLinks).toHaveBeenCalledTimes(2);
          done();
        },
      });
    });
  });

  describe('null and undefined responses', () => {
    it('should pass through null response unchanged', (done) => {
      reflector.get.mockReturnValue('product');
      const context = mockContext();
      const next = mockCallHandler(null);

      interceptor.intercept(context, next).subscribe({
        next: (value) => {
          expect(value).toBeNull();
          expect(linkService.buildLinks).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should pass through undefined response unchanged', (done) => {
      reflector.get.mockReturnValue('order');
      const context = mockContext();
      const next = mockCallHandler(undefined);

      interceptor.intercept(context, next).subscribe({
        next: (value) => {
          expect(value).toBeUndefined();
          expect(linkService.buildLinks).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('OrderItem relation stripping', () => {
    it('should strip order and product relation properties from OrderItem instances', (done) => {
      reflector.get.mockReturnValue('order');
      const orderItem = {
        id: 10,
        int_order_id: 1,
        int_product_id: 2,
        dec_quantity: 3,
        order: { id: 1, str_status: 'pending' },
        product: { id: 2, name: 'Widget' },
      };
      linkService.buildLinks.mockReturnValue({ self: { href: '/orders/10' } });
      const context = mockContext();
      const next = mockCallHandler(orderItem);

      interceptor.intercept(context, next).subscribe({
        next: (value) => {
          expect(value).toEqual({
            id: 10,
            int_order_id: 1,
            int_product_id: 2,
            dec_quantity: 3,
            _links: { self: { href: '/orders/10' } },
          });
          expect(value).not.toHaveProperty('order');
          expect(value).not.toHaveProperty('product');
          done();
        },
      });
    });

    it('should preserve OrderItem FK IDs after stripping', (done) => {
      reflector.get.mockReturnValue('order');
      const orderItem = {
        id: 10,
        int_order_id: 42,
        int_product_id: 99,
        order: { id: 42 },
        product: { id: 99 },
      };
      linkService.buildLinks.mockReturnValue({ self: { href: '/orders/10' } });
      const context = mockContext();
      const next = mockCallHandler(orderItem);

      interceptor.intercept(context, next).subscribe({
        next: (value) => {
          expect((value as Record<string, unknown>).int_order_id).toBe(42);
          expect((value as Record<string, unknown>).int_product_id).toBe(99);
          done();
        },
      });
    });

    it('should strip relations from OrderItem instances nested in an order', (done) => {
      reflector.get.mockReturnValue('order');
      const order = {
        id: 1,
        str_status: 'pending',
        items: [
          {
            id: 10,
            int_order_id: 1,
            int_product_id: 2,
            order: { id: 1 },
            product: { id: 2, name: 'Widget' },
          },
          {
            id: 11,
            int_order_id: 1,
            int_product_id: 3,
            order: { id: 1 },
            product: { id: 3, name: 'Gadget' },
          },
        ],
      };
      linkService.buildLinks.mockReturnValue({ self: { href: '/orders/1' } });
      const context = mockContext();
      const next = mockCallHandler(order);

      interceptor.intercept(context, next).subscribe({
        next: (value) => {
          const enriched = value as Record<string, unknown>;
          expect(enriched._links).toBeDefined();
          const items = enriched.items as Record<string, unknown>[];
          for (const item of items) {
            expect(item).not.toHaveProperty('order');
            expect(item).not.toHaveProperty('product');
            expect(item).toHaveProperty('int_order_id');
            expect(item).toHaveProperty('int_product_id');
          }
          done();
        },
      });
    });
  });
});
