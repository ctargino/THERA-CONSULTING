import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Check,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UnitType {
  UNIT = 'unit',
  BOX = 'box',
  KILO = 'kilo',
}

@Entity('product')
@Check('"int_value_cents" > 0')
@Check('"dec_stock" >= 0')
export class Product {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 255 })
  str_name: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 100 })
  str_category: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  str_description: string | null;

  @ApiProperty()
  @Column({ type: 'integer' })
  int_value_cents: number;

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
  dec_stock: number;

  @ApiProperty({ enum: UnitType })
  @Column({ type: 'simple-enum', enum: UnitType })
  str_unit_type: UnitType;

  @ApiProperty()
  @CreateDateColumn({ name: 'dt_created_at' })
  dt_created_at: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'dt_updated_at' })
  dt_updated_at: Date;
}
