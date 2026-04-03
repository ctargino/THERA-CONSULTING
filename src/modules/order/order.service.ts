import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { OrderItem } from './order-item.entity';
import { OrderRepository } from './order.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { Product } from '../product/product.entity';
import { ProductRepository } from '../product/product.repository';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    const productIds = dto.items.map((item) => item.int_product_id);
    const uniqueIds = [...new Set(productIds)];

    const products = await this.productRepository.findByIds(uniqueIds);

    const productMap = new Map<number, Product>();
    for (const product of products) {
      productMap.set(product.id, product);
    }

    for (const item of dto.items) {
      const product = productMap.get(item.int_product_id);
      if (!product) {
        throw new BadRequestException(
          `Product with id ${item.int_product_id} not found`,
        );
      }
      if (product.dec_stock < item.dec_quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${item.int_product_id}. Available: ${product.dec_stock}, Requested: ${item.dec_quantity}`,
        );
      }
    }

    const orderItems: OrderItem[] = dto.items.map((item) => {
      const product = productMap.get(item.int_product_id)!;
      const totalItemCents = Math.floor(
        product.int_value_cents * item.dec_quantity,
      );
      const orderItem = new OrderItem();
      orderItem.int_product_id = item.int_product_id;
      orderItem.dec_quantity = item.dec_quantity;
      orderItem.int_unit_value_cents = product.int_value_cents;
      orderItem.int_total_item_cents = totalItemCents;
      return orderItem;
    });

    const totalCents = orderItems.reduce(
      (sum, item) => sum + item.int_total_item_cents,
      0,
    );

    const order = new Order();
    order.int_total_cents = totalCents;
    order.str_status = OrderStatus.PENDING;

    return this.orderRepository.createWithItems(order, orderItems);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.findAll();
  }

  async findById(id: number): Promise<Order> {
    const order = await this.orderRepository.findByIdWithItems(id);
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return order;
  }

  async updateStatus(id: number, newStatus: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findByIdWithItems(id);
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    if (order.str_status === newStatus) {
      return order;
    }

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.COMPLETED]: [OrderStatus.CANCELLED],
      [OrderStatus.CANCELLED]: [],
    };

    const allowed = validTransitions[order.str_status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition order from ${order.str_status} to ${newStatus}`,
      );
    }

    if (newStatus === OrderStatus.COMPLETED) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        await this.debitStock(order, queryRunner);
        order.str_status = newStatus;
        await queryRunner.manager.save(order);
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } else if (
      newStatus === OrderStatus.CANCELLED &&
      order.str_status === OrderStatus.COMPLETED
    ) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        await this.restoreStock(order, queryRunner);
        order.str_status = newStatus;
        await queryRunner.manager.save(order);
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } else {
      order.str_status = newStatus;
      await this.dataSource.manager.save(order);
    }

    return order;
  }

  private async debitStock(
    order: Order,
    queryRunner: QueryRunner,
  ): Promise<void> {
    const sortedItems = [...order.items].sort(
      (a, b) => a.int_product_id - b.int_product_id,
    );

    for (const item of sortedItems) {
      const product = await queryRunner.manager
        .getRepository(Product)
        .createQueryBuilder('product')
        .where('product.id = :id', { id: item.int_product_id })
        .setLock('pessimistic_write')
        .getOne();

      if (!product) {
        throw new BadRequestException(
          `Product with id ${item.int_product_id} not found`,
        );
      }

      if (product.dec_stock < item.dec_quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${item.int_product_id}. Available: ${product.dec_stock}, Requested: ${item.dec_quantity}`,
        );
      }

      product.dec_stock = product.dec_stock - item.dec_quantity;
      await queryRunner.manager.save(product);
    }
  }

  private async restoreStock(
    order: Order,
    queryRunner: QueryRunner,
  ): Promise<void> {
    const sortedItems = [...order.items].sort(
      (a, b) => a.int_product_id - b.int_product_id,
    );

    for (const item of sortedItems) {
      const product = await queryRunner.manager
        .getRepository(Product)
        .createQueryBuilder('product')
        .where('product.id = :id', { id: item.int_product_id })
        .setLock('pessimistic_write')
        .getOne();

      if (!product) {
        throw new BadRequestException(
          `Product with id ${item.int_product_id} not found`,
        );
      }

      product.dec_stock = product.dec_stock + item.dec_quantity;
      await queryRunner.manager.save(product);
    }
  }
}
