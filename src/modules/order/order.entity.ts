import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ name: 'int_total_cents', type: 'integer' })
  int_total_cents: number;

  @ApiProperty({ enum: OrderStatus })
  @Column({
    name: 'str_status',
    type: 'simple-enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  str_status: OrderStatus;

  @ApiProperty()
  @CreateDateColumn({ name: 'dt_created_at' })
  dt_created_at: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'dt_updated_at' })
  dt_updated_at: Date;

  @ApiProperty({ type: () => [OrderItem] })
  @OneToMany(() => OrderItem, (item) => item.order, { eager: true })
  items: OrderItem[];
}
