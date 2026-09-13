/**
 * Storefront-wide business constants.
 *
 * These values previously lived inline in Cart, Checkout and CartSidebar —
 * five copies across three files, which had already drifted (CartSidebar
 * computed its total without the discount term).
 */

// Free delivery at or above this order value.
export const SHIPPING_THRESHOLD = 2000;

// Flat delivery fee below the threshold.
export const SHIPPING_FEE = 200;

export const CURRENCY = 'PKR';
export const CURRENCY_SYMBOL = 'Rs';

export const BRAND_NAME = 'A.S Fragrance';

// Order lifecycle. `PENDING` is the only status an order is created with;
// the rest are set from the admin dashboard.
export const ORDER_STATUS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUSES = Object.values(ORDER_STATUS);

/**
 * Product taxonomy.
 *
 * The shop's filters and the admin form both read these, so the two cannot
 * drift. Previously the filter vocabulary was hardcoded in the shop page while
 * the admin form had no fields for category, gender, notes or stock at all —
 * so every one of those filters matched nothing.
 */

// Fragrance families.
export const PRODUCT_CATEGORIES = [
  'Oud',
  'Floral',
  'Fresh',
  'Woody',
  'Oriental',
  'Citrus',
  'Musk',
];

export const PRODUCT_GENDERS = ['Men', 'Women', 'Unisex'];

export const FRAGRANCE_NOTES = [
  'Oud',
  'Rose',
  'Musk',
  'Amber',
  'Vanilla',
  'Sandalwood',
  'Citrus',
  'Jasmine',
  'Cedar',
  'Bergamot',
];

export const PRODUCT_VOLUMES = ['30ml', '50ml', '75ml', '100ml', '200ml'];

// Below this, the admin product list flags a product as running low.
export const LOW_STOCK_THRESHOLD = 5;
