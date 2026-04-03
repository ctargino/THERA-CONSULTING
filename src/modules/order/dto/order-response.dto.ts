import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../order.entity';
import type { HalLinks } from '../../../common/types/hal-links.type';
import { OrderItemResponseDto } from './order-item-response.dto';

export class OrderResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  int_total_cents: number;

  @ApiProperty({ enum: OrderStatus })
  str_status: OrderStatus;

  @ApiProperty()
  dt_created_at: Date;

  @ApiProperty()
  dt_updated_at: Date;

  @ApiProperty({ type: () => [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty()
  _links: HalLinks;
}
