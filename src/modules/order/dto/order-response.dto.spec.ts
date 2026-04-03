import { OrderResponseDto } from './order-response.dto';
import { OrderItemResponseDto } from './order-item-response.dto';
import { OrderStatus } from '../order.entity';

describe('OrderResponseDto', () => {
  it('should be instantiable with all fields including items and _links', () => {
    const item = new OrderItemResponseDto();
    item.id = 1;
    item.int_order_id = 10;
    item.int_product_id = 20;
    item.dec_quantity = 2;
    item.int_unit_value_cents = 500;
    item.int_total_item_cents = 1000;

    const dto = new OrderResponseDto();
    dto.id = 1;
    dto.int_total_cents = 1000;
    dto.str_status = OrderStatus.PENDING;
    dto.dt_created_at = new Date();
    dto.dt_updated_at = new Date();
    dto.items = [item];
    dto._links = {
      self: { href: '/orders/1' },
      complete: { href: '/orders/1/status', title: 'Complete this order' },
      cancel: { href: '/orders/1/status', title: 'Cancel this order' },
    };

    expect(dto.id).toBe(1);
    expect(dto.int_total_cents).toBe(1000);
    expect(dto.str_status).toBe(OrderStatus.PENDING);
    expect(dto.dt_created_at).toBeInstanceOf(Date);
    expect(dto.dt_updated_at).toBeInstanceOf(Date);
    expect(dto.items).toHaveLength(1);
    expect(dto.items[0]).toBeInstanceOf(OrderItemResponseDto);
    expect(dto._links).toEqual({
      self: { href: '/orders/1' },
      complete: { href: '/orders/1/status', title: 'Complete this order' },
      cancel: { href: '/orders/1/status', title: 'Cancel this order' },
    });
  });

  it('should have items field typed as OrderItemResponseDto[]', () => {
    const dto = new OrderResponseDto();
    const items: OrderItemResponseDto[] = [];
    dto.items = items;

    expect(Array.isArray(dto.items)).toBe(true);
  });

  it('should accept all enum values for str_status', () => {
    const dto = new OrderResponseDto();

    for (const value of Object.values(OrderStatus)) {
      dto.str_status = value as OrderStatus;
      expect(dto.str_status).toBe(value);
    }
  });

  it('should include _links field', () => {
    const dto = new OrderResponseDto();
    expect('_links' in dto).toBe(true);
  });
});
