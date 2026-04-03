import { ProductResponseDto } from './modules/product/dto/product-response.dto';
import { OrderResponseDto } from './modules/order/dto/order-response.dto';
import { OrderItemResponseDto } from './modules/order/dto/order-item-response.dto';

describe('Swagger extraModels configuration', () => {
  it('all response DTOs are importable and distinct classes', () => {
    expect(ProductResponseDto).toBeDefined();
    expect(OrderResponseDto).toBeDefined();
    expect(OrderItemResponseDto).toBeDefined();

    expect(ProductResponseDto).not.toBe(OrderResponseDto);
    expect(OrderResponseDto).not.toBe(OrderItemResponseDto);
    expect(ProductResponseDto).not.toBe(OrderItemResponseDto);
  });
});
