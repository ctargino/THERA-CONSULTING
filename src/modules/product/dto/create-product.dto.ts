import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { UnitType } from '../product.entity';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  str_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  str_category: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  str_description?: string;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  int_value_cents: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  dec_stock: number;

  @ApiProperty({ enum: UnitType })
  @IsEnum(UnitType)
  str_unit_type: UnitType;
}
