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
