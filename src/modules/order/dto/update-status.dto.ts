import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '../order.entity';

export class UpdateStatusDto {
  @ApiProperty({ enum: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] })
  @IsEnum([OrderStatus.COMPLETED, OrderStatus.CANCELLED], {
    message: 'str_status must be either completed or cancelled',
  })
  str_status: OrderStatus.COMPLETED | OrderStatus.CANCELLED;
}
