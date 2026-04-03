import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from './order.entity';
import { Product } from '../product/product.entity';

@Entity('order_items')
@Check('"dec_quantity" >= 0.001')
export class OrderItem {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ name: 'int_order_id', type: 'integer' })
  int_order_id: number;

  @ApiProperty()
  @Column({ name: 'int_product_id', type: 'integer' })
  int_product_id: number;

  @ApiProperty()
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    transformer: {
      to(value: number): string {
        return String(value);
      },
      from(value: string): number {
        return parseFloat(value);
      },
    },
  })
  dec_quantity: number;

  @ApiProperty()
  @Column({ name: 'int_unit_value_cents', type: 'integer' })
  int_unit_value_cents: number;

  @ApiProperty()
  @Column({ name: 'int_total_item_cents', type: 'integer' })
  int_total_item_cents: number;

  @ApiProperty({ type: () => Order })
  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'int_order_id' })
  order: Order;

  @ApiProperty({ type: () => Product })
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'int_product_id' })
  product: Product;
}
