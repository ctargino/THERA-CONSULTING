import { OrderItemResponseDto } from './order-item-response.dto';

describe('OrderItemResponseDto', () => {
  it('should be instantiable with all scalar fields', () => {
    const dto = new OrderItemResponseDto();
    dto.id = 1;
    dto.int_order_id = 10;
    dto.int_product_id = 20;
    dto.dec_quantity = 2.5;
    dto.int_unit_value_cents = 1000;
    dto.int_total_item_cents = 2500;

    expect(dto.id).toBe(1);
    expect(dto.int_order_id).toBe(10);
    expect(dto.int_product_id).toBe(20);
    expect(dto.dec_quantity).toBe(2.5);
    expect(dto.int_unit_value_cents).toBe(1000);
    expect(dto.int_total_item_cents).toBe(2500);
  });

  it('should exclude order and product relation fields', () => {
    const dto = new OrderItemResponseDto();

    expect('order' in dto).toBe(false);
    expect('product' in dto).toBe(false);
  });

  it('should include FK fields int_order_id and int_product_id', () => {
    const dto = new OrderItemResponseDto();

    expect('int_order_id' in dto).toBe(true);
    expect('int_product_id' in dto).toBe(true);
  });

  it('should not have _links property', () => {
    const dto = new OrderItemResponseDto();
    expect('_links' in dto).toBe(false);
  });
});
