import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderStatus } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Product, UnitType } from '../product/product.entity';
import { ProductRepository } from '../product/product.repository';

const mockProduct1: Product = {
  id: 1,
  str_name: 'Coffee',
  str_category: 'Beverages',
  str_description: null,
  int_value_cents: 500,
  dec_stock: 10.0,
  str_unit_type: UnitType.UNIT,
  dt_created_at: new Date(),
  dt_updated_at: new Date(),
};

const mockProduct2: Product = {
  id: 2,
  str_name: 'Rice',
  str_category: 'Grains',
  str_description: null,
  int_value_cents: 800,
  dec_stock: 5.0,
  str_unit_type: UnitType.KILO,
  dt_updated_at: new Date(),
  dt_created_at: new Date(),
};

const createMockOrderItem = (
  id: number,
  productId: number,
  quantity: number,
  unitValueCents: number,
): OrderItem => ({
  id,
  int_order_id: 1,
  int_product_id: productId,
  dec_quantity: quantity,
  int_unit_value_cents: unitValueCents,
  int_total_item_cents: Math.floor(unitValueCents * quantity),
  order: null as unknown as Order,
  product: null as unknown as Product,
});

const createMockOrder = (status: OrderStatus = OrderStatus.PENDING): Order => ({
  id: 1,
  int_total_cents: 2200,
  str_status: status,
  dt_created_at: new Date(),
  dt_updated_at: new Date(),
  items: [
    createMockOrderItem(1, 1, 2.0, 500),
    createMockOrderItem(2, 2, 1.5, 800),
  ],
});

const mockRepository: {
  [K in keyof OrderRepository]: jest.Mock;
} = {
  createWithItems: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByIdWithItems: jest.fn(),
};

const mockProductRepository: {
  [K in keyof ProductRepository]: jest.Mock;
} = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByIds: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const createMockQueryRunner = (): QueryRunner =>
  ({
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      getRepository: jest.fn().mockReturnThis(),
      createQueryBuilder: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      save: jest.fn(),
    },
  }) as unknown as QueryRunner;

let mockQueryRunner: QueryRunner;

const mockDataSource = {
  manager: {
    getRepository: jest.fn().mockReturnThis(),
    save: jest.fn(),
  },
  createQueryRunner: jest.fn(),
} as unknown as DataSource;

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockQueryRunner = createMockQueryRunner();
    (mockDataSource.createQueryRunner as jest.Mock).mockReturnValue(
      mockQueryRunner,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: OrderRepository, useValue: mockRepository },
        { provide: ProductRepository, useValue: mockProductRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  describe('create', () => {
    const dto: CreateOrderDto = {
      items: [
        { int_product_id: 1, dec_quantity: 2.0 },
        { int_product_id: 2, dec_quantity: 1.5 },
      ],
    };

    it('should create an order with valid items and sufficient stock', async () => {
      const order = createMockOrder();
      mockProductRepository.findByIds.mockResolvedValue([
        mockProduct1,
        mockProduct2,
      ]);
      mockRepository.createWithItems.mockResolvedValue(order);

      const result = await service.create(dto);

      expect(result).toEqual(order);

      expect(mockProductRepository.findByIds).toHaveBeenCalled();

      expect(mockRepository.createWithItems).toHaveBeenCalled();
    });

    it('should throw BadRequestException for insufficient stock', async () => {
      const lowStockProduct = { ...mockProduct1, dec_stock: 1.0 };
      mockProductRepository.findByIds.mockResolvedValue([
        lowStockProduct,
        mockProduct2,
      ]);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow('Insufficient stock');
      expect(mockRepository.createWithItems).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for non-existent product', async () => {
      mockProductRepository.findByIds.mockResolvedValue([mockProduct1]);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow('not found');
      expect(mockRepository.createWithItems).not.toHaveBeenCalled();
    });

    it('should calculate order total as sum of floored item totals', async () => {
      const singleItemDto: CreateOrderDto = {
        items: [{ int_product_id: 2, dec_quantity: 1.5 }],
      };
      mockProductRepository.findByIds.mockResolvedValue([mockProduct2]);

      const expectedItemTotal = Math.floor(800 * 1.5);

      mockRepository.createWithItems.mockImplementation(
        // eslint-disable-next-line @typescript-eslint/require-await
        async (order: Order) => order,
      );

      const result = await service.create(singleItemDto);

      expect(result.int_total_cents).toBe(expectedItemTotal);
      expect(mockRepository.createWithItems).toHaveBeenCalledWith(
        expect.objectContaining({ int_total_cents: expectedItemTotal }),
        expect.arrayContaining([
          expect.objectContaining({
            int_total_item_cents: expectedItemTotal,
          }),
        ]),
      );
    });

    it('should apply floor rounding for decimal quantities', async () => {
      const fractionalDto: CreateOrderDto = {
        items: [{ int_product_id: 2, dec_quantity: 0.333 }],
      };
      mockProductRepository.findByIds.mockResolvedValue([mockProduct2]);

      const expectedItemTotal = Math.floor(800 * 0.333);

      mockRepository.createWithItems.mockImplementation(
        // eslint-disable-next-line @typescript-eslint/require-await
        async (order: Order) => order,
      );

      const result = await service.create(fractionalDto);

      expect(result.int_total_cents).toBe(expectedItemTotal);
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      const order = createMockOrder();
      mockRepository.findAll.mockResolvedValue([order]);

      const result = await service.findAll();

      expect(result).toEqual([order]);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return an order with items', async () => {
      const order = createMockOrder();
      mockRepository.findByIdWithItems.mockResolvedValue(order);

      const result = await service.findById(1);

      expect(result).toEqual(order);
      expect(mockRepository.findByIdWithItems).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException for non-existent order', async () => {
      mockRepository.findByIdWithItems.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
      await expect(service.findById(999)).rejects.toThrow(
        'Order with id 999 not found',
      );
    });
  });

  describe('updateStatus', () => {
    it('should complete a pending order and debit stock', async () => {
      const order = createMockOrder();
      mockRepository.findByIdWithItems.mockResolvedValue(order);
      const getOneMock = (mockQueryRunner.manager as Record<string, jest.Mock>)
        .getOne;
      getOneMock.mockResolvedValueOnce(mockProduct1);
      getOneMock.mockResolvedValueOnce(mockProduct2);
      (
        mockQueryRunner.manager as Record<string, jest.Mock>
      ).save.mockResolvedValue(undefined);

      const result = await service.updateStatus(1, OrderStatus.COMPLETED);

      expect(result.str_status).toBe(OrderStatus.COMPLETED);
      expect(
        (mockQueryRunner as Record<string, jest.Mock>).startTransaction,
      ).toHaveBeenCalled();
      expect(
        (mockQueryRunner as Record<string, jest.Mock>).commitTransaction,
      ).toHaveBeenCalled();
      expect(
        (mockQueryRunner as Record<string, jest.Mock>).release,
      ).toHaveBeenCalled();
    });

    it('should cancel a pending order without changing stock', async () => {
      const order = createMockOrder();
      mockRepository.findByIdWithItems.mockResolvedValue(order);
      (mockDataSource.manager.save as jest.Mock).mockResolvedValue({
        ...order,
        str_status: OrderStatus.CANCELLED,
      });

      const result = await service.updateStatus(1, OrderStatus.CANCELLED);

      expect(result.str_status).toBe(OrderStatus.CANCELLED);
      expect(
        (mockQueryRunner as Record<string, jest.Mock>).startTransaction,
      ).not.toHaveBeenCalled();
    });

    it('should cancel a completed order and restore stock', async () => {
      const order = createMockOrder(OrderStatus.COMPLETED);
      mockRepository.findByIdWithItems.mockResolvedValue(order);
      const getOneMock = (mockQueryRunner.manager as Record<string, jest.Mock>)
        .getOne;
      getOneMock.mockResolvedValueOnce(mockProduct1);
      getOneMock.mockResolvedValueOnce(mockProduct2);
      (
        mockQueryRunner.manager as Record<string, jest.Mock>
      ).save.mockResolvedValue(undefined);

      const result = await service.updateStatus(1, OrderStatus.CANCELLED);

      expect(result.str_status).toBe(OrderStatus.CANCELLED);
      expect(
        (mockQueryRunner as Record<string, jest.Mock>).startTransaction,
      ).toHaveBeenCalled();
      expect(
        (mockQueryRunner as Record<string, jest.Mock>).commitTransaction,
      ).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const order = createMockOrder(OrderStatus.CANCELLED);
      mockRepository.findByIdWithItems.mockResolvedValue(order);

      await expect(
        service.updateStatus(1, OrderStatus.COMPLETED),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateStatus(1, OrderStatus.COMPLETED),
      ).rejects.toThrow('Cannot transition order');
    });

    it('should throw NotFoundException for non-existent order', async () => {
      mockRepository.findByIdWithItems.mockResolvedValue(null);

      await expect(
        service.updateStatus(999, OrderStatus.COMPLETED),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return same order if status is already the target', async () => {
      const order = createMockOrder();
      mockRepository.findByIdWithItems.mockResolvedValue(order);

      const result = await service.updateStatus(1, OrderStatus.PENDING);

      expect(result).toEqual(order);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDataSource.manager.save).not.toHaveBeenCalled();
    });

    it('should rollback transaction on insufficient stock during completion', async () => {
      const order = createMockOrder();
      const lowStockProduct = { ...mockProduct1, dec_stock: 0.5 };
      mockRepository.findByIdWithItems.mockResolvedValue(order);
      const getOneMock = (mockQueryRunner.manager as Record<string, jest.Mock>)
        .getOne;
      getOneMock.mockResolvedValueOnce(lowStockProduct);

      await expect(
        service.updateStatus(1, OrderStatus.COMPLETED),
      ).rejects.toThrow(BadRequestException);
      expect(
        (mockQueryRunner as Record<string, jest.Mock>).rollbackTransaction,
      ).toHaveBeenCalled();
      expect(
        (mockQueryRunner as Record<string, jest.Mock>).release,
      ).toHaveBeenCalled();
    });

    it('should rollback both stock and status save on failure during completion', async () => {
      const order = createMockOrder();
      mockRepository.findByIdWithItems.mockResolvedValue(order);
      const getOneMock = (mockQueryRunner.manager as Record<string, jest.Mock>)
        .getOne;
      getOneMock.mockResolvedValueOnce(mockProduct1);
      getOneMock.mockResolvedValueOnce(mockProduct2);
      (mockQueryRunner.manager as Record<string, jest.Mock>).save
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('DB connection lost'));

      await expect(
        service.updateStatus(1, OrderStatus.COMPLETED),
      ).rejects.toThrow('DB connection lost');
      expect(
        (mockQueryRunner as Record<string, jest.Mock>).rollbackTransaction,
      ).toHaveBeenCalled();
      expect(
        (mockQueryRunner as Record<string, jest.Mock>).commitTransaction,
      ).not.toHaveBeenCalled();
      expect(
        (mockQueryRunner as Record<string, jest.Mock>).release,
      ).toHaveBeenCalled();
    });
  });
});
