import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';

export interface IOrderRepository {
  createWithItems(order: Order, items: OrderItem[]): Promise<Order>;
  findAll(): Promise<Order[]>;
  findById(id: number): Promise<Order | null>;
  findByIdWithItems(id: number): Promise<Order | null>;
}

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,
  ) {}

  async createWithItems(order: Order, items: OrderItem[]): Promise<Order> {
    return this.repo.manager.transaction(async (manager) => {
      const savedOrder = await manager.save(order);
      for (const item of items) {
        item.int_order_id = savedOrder.id;
        await manager.save(item);
      }
      return savedOrder;
    });
  }

  async findAll(): Promise<Order[]> {
    return this.repo.find();
  }

  async findById(id: number): Promise<Order | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByIdWithItems(id: number): Promise<Order | null> {
    return this.repo.findOne({ where: { id } });
  }
}
