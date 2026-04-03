import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, UnitType } from './product.entity';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  private validateStock(unitType: UnitType, stock: number): void {
    if (stock < 0) {
      throw new BadRequestException(
        'dec_stock must be greater than or equal to 0',
      );
    }
    if (
      (unitType === UnitType.UNIT || unitType === UnitType.BOX) &&
      stock % 1 !== 0
    ) {
      throw new BadRequestException(
        'dec_stock must be an integer for unit and box types',
      );
    }
  }

  async create(dto: CreateProductDto): Promise<Product> {
    if (dto.int_value_cents <= 0) {
      throw new BadRequestException('int_value_cents must be greater than 0');
    }
    this.validateStock(dto.str_unit_type, dto.dec_stock);
    return this.productRepository.create(dto);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.findAll();
  }

  async findById(id: number): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    if (dto.int_value_cents !== undefined && dto.int_value_cents <= 0) {
      throw new BadRequestException('int_value_cents must be greater than 0');
    }
    if (dto.dec_stock !== undefined) {
      const unitType =
        dto.str_unit_type ??
        (await this.productRepository.findById(id))?.str_unit_type;
      this.validateStock(unitType ?? UnitType.UNIT, dto.dec_stock);
    }
    const product = await this.productRepository.update(id, dto);
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async delete(id: number): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    await this.productRepository.delete(id);
  }
}
