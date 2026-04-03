import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { UnitType } from '../product.entity';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  str_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  str_category: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
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
