import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  int_order_id: number;

  @ApiProperty()
  int_product_id: number;

  @ApiProperty()
  dec_quantity: number;

  @ApiProperty()
  int_unit_value_cents: number;

  @ApiProperty()
  int_total_item_cents: number;
}
