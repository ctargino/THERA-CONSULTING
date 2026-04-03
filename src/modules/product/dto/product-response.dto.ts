import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnitType } from '../product.entity';
import type { HalLinks } from '../../../common/types/hal-links.type';

export class ProductResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  str_name: string;

  @ApiProperty()
  str_category: string;

  @ApiPropertyOptional()
  str_description: string | null;

  @ApiProperty()
  int_value_cents: number;

  @ApiProperty()
  dec_stock: number;

  @ApiProperty({ enum: UnitType })
  str_unit_type: UnitType;

  @ApiProperty()
  dt_created_at: Date;

  @ApiProperty()
  dt_updated_at: Date;

  @ApiProperty()
  _links: HalLinks;
}
