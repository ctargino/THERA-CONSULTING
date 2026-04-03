import { Reflector } from '@nestjs/core';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { HATEOAS_RESOURCE_KEY } from '../../common/decorators/hateoas-resource.decorator';
import { OrderResponseDto } from './dto/order-response.dto';
import { Order, OrderStatus } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';

interface ApiResponseMeta {
  status?: number;
  type?: unknown;
  isArray?: boolean;
  description?: string;
  [key: string]: unknown;
}

describe('OrderController', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  describe('@HateoasResource decorator', () => {
    it('should have @HateoasResource("order") on create method', () => {
      const metadata = reflector.get<string | undefined>(
        HATEOAS_RESOURCE_KEY,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        OrderController.prototype.create,
      );

      expect(metadata).toBe('order');
    });

    it('should have @HateoasResource("order") on findAll method', () => {
      const metadata = reflector.get<string | undefined>(
        HATEOAS_RESOURCE_KEY,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        OrderController.prototype.findAll,
      );

      expect(metadata).toBe('order');
    });

    it('should have @HateoasResource("order") on findById method', () => {
      const metadata = reflector.get<string | undefined>(
        HATEOAS_RESOURCE_KEY,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        OrderController.prototype.findById,
      );

      expect(metadata).toBe('order');
    });

    it('should have @HateoasResource("order") on updateStatus method', () => {
      const metadata = reflector.get<string | undefined>(
        HATEOAS_RESOURCE_KEY,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        OrderController.prototype.updateStatus,
      );

      expect(metadata).toBe('order');
    });
  });

  describe('@ApiResponse types', () => {
    const getApiResponseMetadata = (
      method: string,
    ): Record<string, ApiResponseMeta> => {
      return (
        reflector.get<Record<string, ApiResponseMeta>>(
          'swagger/apiResponse',
          (OrderController.prototype as unknown as Record<string, unknown>)[
            method
          ] as () => unknown,
        ) ?? {}
      );
    };

    it('create method should reference OrderResponseDto (not Order)', () => {
      const responses = getApiResponseMetadata('create');
      const successResponse = responses['201'];

      expect(successResponse).toBeDefined();
      expect(successResponse.type).toBe(OrderResponseDto);
    });

    it('findAll method should reference OrderResponseDto with isArray', () => {
      const responses = getApiResponseMetadata('findAll');
      const successResponse = responses['200'];

      expect(successResponse).toBeDefined();
      expect(successResponse.type).toBe(OrderResponseDto);
      expect(successResponse.isArray).toBe(true);
    });

    it('findById method should reference OrderResponseDto (not Order)', () => {
      const responses = getApiResponseMetadata('findById');
      const successResponse = responses['200'];

      expect(successResponse).toBeDefined();
      expect(successResponse.type).toBe(OrderResponseDto);
    });

    it('updateStatus method should reference OrderResponseDto (not Order)', () => {
      const responses = getApiResponseMetadata('updateStatus');
      const successResponse = responses['200'];

      expect(successResponse).toBeDefined();
      expect(successResponse.type).toBe(OrderResponseDto);
    });

    it('no @ApiResponse should reference the raw Order entity', () => {
      const allMethods = ['create', 'findAll', 'findById', 'updateStatus'];

      for (const method of allMethods) {
        const responses = getApiResponseMetadata(method);
        const types = Object.values(responses)
          .map((r) => r.type)
          .filter(Boolean);

        expect(types).not.toContain(Order);
      }
    });
  });

  describe('method invocations', () => {
    let controller: OrderController;
    let orderService: { [K in keyof OrderService]: jest.Mock };

    const mockOrder: Order = {
      id: 1,
      int_total_cents: 1000,
      str_status: OrderStatus.PENDING,
      dt_created_at: new Date(),
      dt_updated_at: new Date(),
      items: [],
    };

    beforeEach(() => {
      orderService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        updateStatus: jest.fn(),
      } as unknown as { [K in keyof OrderService]: jest.Mock };

      controller = new OrderController(orderService as unknown as OrderService);
    });

    it('create should delegate to orderService.create', async () => {
      orderService.create.mockResolvedValue(mockOrder);
      const dto: CreateOrderDto = {
        items: [{ int_product_id: 1, dec_quantity: 2.0 }],
      };

      const result = await controller.create(dto);

      expect(result).toBe(mockOrder);
      expect(orderService.create).toHaveBeenCalledWith(dto);
    });

    it('findAll should delegate to orderService.findAll', async () => {
      orderService.findAll.mockResolvedValue([mockOrder]);

      const result = await controller.findAll();

      expect(result).toEqual([mockOrder]);
      expect(orderService.findAll).toHaveBeenCalled();
    });

    it('findById should delegate to orderService.findById', async () => {
      orderService.findById.mockResolvedValue(mockOrder);

      const result = await controller.findById(1);

      expect(result).toBe(mockOrder);
      expect(orderService.findById).toHaveBeenCalledWith(1);
    });

    it('updateStatus should delegate to orderService.updateStatus', async () => {
      const updatedOrder = { ...mockOrder, str_status: OrderStatus.COMPLETED };
      orderService.updateStatus.mockResolvedValue(updatedOrder);

      const result = await controller.updateStatus(1, {
        str_status: OrderStatus.COMPLETED,
      });

      expect(result).toBe(updatedOrder);
      expect(orderService.updateStatus).toHaveBeenCalledWith(
        1,
        OrderStatus.COMPLETED,
      );
    });
  });
});
