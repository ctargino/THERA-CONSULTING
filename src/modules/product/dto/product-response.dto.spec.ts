import { ProductResponseDto } from './product-response.dto';
import { UnitType } from '../product.entity';

describe('ProductResponseDto', () => {
  it('should be instantiable with all fields including _links', () => {
    const dto = new ProductResponseDto();
    dto.id = 1;
    dto.str_name = 'Test Product';
    dto.str_category = 'food';
    dto.str_description = 'A description';
    dto.int_value_cents = 1000;
    dto.dec_stock = 10;
    dto.str_unit_type = UnitType.UNIT;
    dto.dt_created_at = new Date();
    dto.dt_updated_at = new Date();
    dto._links = { self: { href: '/products/1' } };

    expect(dto.id).toBe(1);
    expect(dto.str_name).toBe('Test Product');
    expect(dto.str_category).toBe('food');
    expect(dto.str_description).toBe('A description');
    expect(dto.int_value_cents).toBe(1000);
    expect(dto.dec_stock).toBe(10);
    expect(dto.str_unit_type).toBe(UnitType.UNIT);
    expect(dto.dt_created_at).toBeInstanceOf(Date);
    expect(dto.dt_updated_at).toBeInstanceOf(Date);
    expect(dto._links).toEqual({ self: { href: '/products/1' } });
  });

  it('should accept null for nullable str_description', () => {
    const dto = new ProductResponseDto();
    dto.str_description = null;

    expect(dto.str_description).toBeNull();
  });

  it('should accept all enum values for str_unit_type', () => {
    const dto = new ProductResponseDto();

    for (const value of Object.values(UnitType)) {
      dto.str_unit_type = value as UnitType;
      expect(dto.str_unit_type).toBe(value);
    }
  });

  it('should have _links property', () => {
    const dto = new ProductResponseDto();
    expect('_links' in dto).toBe(true);
  });
});
