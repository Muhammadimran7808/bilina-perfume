import {
  calculateShipping,
  generateOrderNumber,
  priceOrder,
  validateCustomer,
} from '@/lib/orders';
import { SHIPPING_FEE, SHIPPING_THRESHOLD } from '@/lib/constants';

const product = (over = {}) => ({
  name: 'Midnight Oud',
  price: 1000,
  stock: 10,
  volume: '50ml',
  isActive: true,
  ...over,
});

const catalogue = (entries) => new Map(Object.entries(entries));

describe('generateOrderNumber', () => {
  it('uses the ASF-YYYYMMDD-NNNN shape', () => {
    expect(generateOrderNumber(new Date(2026, 8, 13))).toMatch(/^ASF-20260913-\d{4}$/);
  });

  it('zero-pads single-digit months and days', () => {
    expect(generateOrderNumber(new Date(2026, 0, 5))).toMatch(/^ASF-20260105-/);
  });
});

describe('calculateShipping', () => {
  it('charges the flat fee below the threshold', () => {
    expect(calculateShipping(SHIPPING_THRESHOLD - 1)).toBe(SHIPPING_FEE);
  });

  it('is free exactly at the threshold', () => {
    expect(calculateShipping(SHIPPING_THRESHOLD)).toBe(0);
  });
});

describe('priceOrder', () => {
  it('prices from the catalogue, not from what the client sent', () => {
    const result = priceOrder(
      [{ id: 'a', quantity: 2, price: 1 }], // a client claiming Rs 1
      catalogue({ a: product({ price: 1500 }) })
    );

    expect(result.problems).toEqual([]);
    expect(result.items[0].price).toBe(1500);
    expect(result.subtotal).toBe(3000);
    expect(result.total).toBe(3000); // over the free-delivery threshold
  });

  it('adds delivery below the threshold', () => {
    const result = priceOrder([{ id: 'a', quantity: 1 }], catalogue({ a: product({ price: 500 }) }));
    expect(result.shipping).toBe(SHIPPING_FEE);
    expect(result.total).toBe(500 + SHIPPING_FEE);
  });

  it('rejects a product that is not in the catalogue', () => {
    const result = priceOrder([{ id: 'ghost', quantity: 1 }], catalogue({}));
    expect(result.problems).toHaveLength(1);
    expect(result.items).toHaveLength(0);
  });

  it('rejects an unpublished product', () => {
    const result = priceOrder(
      [{ id: 'a', quantity: 1 }],
      catalogue({ a: product({ isActive: false }) })
    );
    expect(result.problems[0]).toMatch(/no longer available/i);
  });

  it('rejects an out-of-stock product', () => {
    const result = priceOrder([{ id: 'a', quantity: 1 }], catalogue({ a: product({ stock: 0 }) }));
    expect(result.problems[0]).toMatch(/out of stock/i);
  });

  it('rejects ordering more than the stock on hand', () => {
    const result = priceOrder([{ id: 'a', quantity: 5 }], catalogue({ a: product({ stock: 3 }) }));
    expect(result.problems[0]).toMatch(/only 3 left/i);
  });

  it('rejects a non-positive quantity', () => {
    const result = priceOrder([{ id: 'a', quantity: 0 }], catalogue({ a: product() }));
    expect(result.problems[0]).toMatch(/invalid quantity/i);
  });

  it('applies a percentage coupon', () => {
    const result = priceOrder([{ id: 'a', quantity: 3 }], catalogue({ a: product() }), {
      code: 'WELCOME20',
      percent: 20,
    });
    expect(result.subtotal).toBe(3000);
    expect(result.discount).toBe(600);
    expect(result.appliedCoupon).toBe('WELCOME20');
    expect(result.total).toBe(2400);
  });

  it('ignores a coupon below its minimum spend', () => {
    const result = priceOrder([{ id: 'a', quantity: 1 }], catalogue({ a: product({ price: 500 }) }), {
      code: 'BIG',
      percent: 50,
      minimumSpend: 5000,
    });
    expect(result.discount).toBe(0);
    expect(result.appliedCoupon).toBeNull();
  });

  it('never returns a negative total', () => {
    const result = priceOrder([{ id: 'a', quantity: 1 }], catalogue({ a: product({ price: 100 }) }), {
      code: 'FREE',
      percent: 100,
    });
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  it('charges no delivery on an empty basket', () => {
    expect(priceOrder([], catalogue({})).shipping).toBe(0);
  });
});

describe('validateCustomer', () => {
  const valid = {
    name: 'Ayesha Khan',
    phone: '03001234567',
    address: '12 Mall Road',
    city: 'Lahore',
  };

  it('accepts complete details', () => {
    expect(validateCustomer(valid).valid).toBe(true);
  });

  it.each(['name', 'address', 'city'])('requires %s', (field) => {
    const { valid: ok, errors } = validateCustomer({ ...valid, [field]: '   ' });
    expect(ok).toBe(false);
    expect(errors[field]).toBeTruthy();
  });

  it('requires a phone number', () => {
    expect(validateCustomer({ ...valid, phone: '' }).errors.phone).toBeTruthy();
  });

  it.each(['12345', '0300123456', '+923001234567', 'not a phone'])(
    'rejects the malformed number %s',
    (phone) => {
      expect(validateCustomer({ ...valid, phone }).errors.phone).toBeTruthy();
    }
  );

  it('tolerates spaces and dashes in the phone number', () => {
    expect(validateCustomer({ ...valid, phone: '0300-123 4567' }).valid).toBe(true);
  });

  it('treats email as optional', () => {
    expect(validateCustomer({ ...valid, email: '' }).valid).toBe(true);
  });

  it('rejects a malformed email when one is given', () => {
    expect(validateCustomer({ ...valid, email: 'nope' }).errors.email).toBeTruthy();
  });
});
