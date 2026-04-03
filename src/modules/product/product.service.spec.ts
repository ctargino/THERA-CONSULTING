import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, UnitType } from './product.entity';

const mockProduct: Product = {
  id: 1,
  str_name: 'Test Product',
  str_category: 'Test Category',
  str_description: null,
  int_value_cents: 1000,
  dec_stock: 10,
  str_unit_type: UnitType.UNIT,
  dt_created_at: new Date(),
  dt_updated_at: new Date(),
};

const mockRepository: {
  [K in keyof ProductRepository]: jest.Mock;
} = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByIds: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: ProductRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  describe('create', () => {
    const dto: CreateProductDto = {
      str_name: 'Test Product',
      str_category: 'Test Category',
      int_value_cents: 1000,
      dec_stock: 10,
      str_unit_type: UnitType.UNIT,
    };

    it('should create a valid product successfully', async () => {
      mockRepository.create.mockResolvedValue(mockProduct);

      const result = await service.create(dto);

      expect(result).toEqual(mockProduct);
      expect(mockRepository.create).toHaveBeenCalledWith(dto);
    });

    it('should reject product with int_value_cents <= 0', async () => {
      const invalidDto = { ...dto, int_value_cents: 0 };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto)).rejects.toThrow(
        'int_value_cents must be greater than 0',
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should reject product with negative int_value_cents', async () => {
      const invalidDto = { ...dto, int_value_cents: -500 };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should reject product with negative dec_stock', async () => {
      const invalidDto = { ...dto, dec_stock: -1 };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto)).rejects.toThrow(
        'dec_stock must be greater than or equal to 0',
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      mockRepository.findAll.mockResolvedValue([mockProduct]);

      const result = await service.findAll();

      expect(result).toEqual([mockProduct]);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a product by ID', async () => {
      mockRepository.findById.mockResolvedValue(mockProduct);

      const result = await service.findById(1);

      expect(result).toEqual(mockProduct);
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException for non-existent ID', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
      await expect(service.findById(999)).rejects.toThrow(
        'Product with id 999 not found',
      );
    });
  });

  describe('update', () => {
    it('should update product fields', async () => {
      const updatedProduct = {
        ...mockProduct,
        str_name: 'Updated Product',
      };
      mockRepository.update.mockResolvedValue(updatedProduct);

      const dto: UpdateProductDto = { str_name: 'Updated Product' };
      const result = await service.update(1, dto);

      expect(result).toEqual(updatedProduct);
      expect(mockRepository.update).toHaveBeenCalledWith(1, dto);
    });

    it('should reject update with int_value_cents <= 0', async () => {
      const dto: UpdateProductDto = { int_value_cents: 0 };

      await expect(service.update(1, dto)).rejects.toThrow(BadRequestException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should reject update with negative dec_stock', async () => {
      mockRepository.findById.mockResolvedValue(mockProduct);
      const dto: UpdateProductDto = { dec_stock: -5 };

      await expect(service.update(1, dto)).rejects.toThrow(BadRequestException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should allow update with valid int_value_cents and dec_stock', async () => {
      mockRepository.update.mockResolvedValue(mockProduct);

      const dto: UpdateProductDto = {
        int_value_cents: 2000,
        dec_stock: 50,
      };
      const result = await service.update(1, dto);

      expect(result).toEqual(mockProduct);
      expect(mockRepository.update).toHaveBeenCalledWith(1, dto);
    });

    it('should throw NotFoundException when updating non-existent product', async () => {
      mockRepository.update.mockResolvedValue(null);

      const dto: UpdateProductDto = { str_name: 'Updated' };

      await expect(service.update(999, dto)).rejects.toThrow(NotFoundException);
      await expect(service.update(999, dto)).rejects.toThrow(
        'Product with id 999 not found',
      );
    });
  });

  describe('delete', () => {
    it('should delete a product', async () => {
      mockRepository.findById.mockResolvedValue(mockProduct);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.delete(1);

      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when deleting non-existent product', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
