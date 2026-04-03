import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

export interface IProductRepository {
  create(dto: CreateProductDto): Promise<Product>;
  findAll(): Promise<Product[]>;
  findById(id: number): Promise<Product | null>;
  findByIds(ids: number[]): Promise<Product[]>;
  update(id: number, dto: UpdateProductDto): Promise<Product | null>;
  delete(id: number): Promise<void>;
}

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.repo.create(dto);
    return this.repo.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.repo.find();
  }

  async findById(id: number): Promise<Product | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByIds(ids: number[]): Promise<Product[]> {
    return this.repo.find({ where: ids.map((id) => ({ id })) });
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product | null> {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) {
      return null;
    }
    if (dto.str_name !== undefined) product.str_name = dto.str_name;
    if (dto.str_category !== undefined) product.str_category = dto.str_category;
    if (dto.str_description !== undefined)
      product.str_description = dto.str_description;
    if (dto.int_value_cents !== undefined)
      product.int_value_cents = dto.int_value_cents;
    if (dto.dec_stock !== undefined) product.dec_stock = dto.dec_stock;
    if (dto.str_unit_type !== undefined)
      product.str_unit_type = dto.str_unit_type;
    return this.repo.save(product);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
