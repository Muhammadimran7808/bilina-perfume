import { SHIPPING_FEE, SHIPPING_THRESHOLD } from './constants';

/**
 * Order pricing and validation, shared by the server route and the tests.
 *
 * Everything here runs on the server. The browser's figures are treated as a
 * display hint only — the cart it posts carries ids and quantities, and prices
 * are re-read from Firestore, because a client-supplied total can say zero.
 */

/** e.g. ASF-20260913-4821 — short enough to read out over the phone. */
export function generateOrderNumber(date = new Date()) {
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  return `ASF-${stamp}-${suffix}`;
}

export function calculateShipping(subtotal) {
  return subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

/**
 * Price a cart against authoritative product records.
 *
 * @param {Array<{id: string, quantity: number}>} cart  what the browser posted
 * @param {Map<string, object>} products                id -> Firestore product
 * @param {{code: string, percent: number, minimumSpend?: number}|null} coupon
 */
export function priceOrder(cart, products, coupon = null) {
  const items = [];
  const problems = [];

  for (const line of cart) {
    const product = products.get(line.id);
    if (!product) {
      problems.push(`A product in your cart is no longer available.`);
      continue;
    }
    if (product.isActive === false) {
      problems.push(`${product.name} is no longer available.`);
      continue;
    }

    const quantity = Math.floor(Number(line.quantity));
    if (!Number.isFinite(quantity) || quantity < 1) {
      problems.push(`${product.name} had an invalid quantity.`);
      continue;
    }

    const stock = Number(product.stock);
    if (Number.isFinite(stock) && stock > 0 && quantity > stock) {
      problems.push(`Only ${stock} left of ${product.name}.`);
      continue;
    }
    if (Number.isFinite(stock) && stock <= 0) {
      problems.push(`${product.name} is out of stock.`);
      continue;
    }

    const price = Number(product.price) || 0;
    items.push({
      id: line.id,
      name: product.name,
      price,
      quantity,
      volume: product.volume || null,
      image: product.imageUrl || product.image || null,
      lineTotal: price * quantity,
    });
  }

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const shipping = items.length ? calculateShipping(subtotal) : 0;

  let discount = 0;
  let appliedCoupon = null;
  if (coupon && subtotal >= (Number(coupon.minimumSpend) || 0)) {
    discount = Math.round((subtotal * Number(coupon.percent)) / 100);
    appliedCoupon = coupon.code;
  }

  return {
    items,
    problems,
    subtotal,
    shipping,
    discount,
    appliedCoupon,
    total: Math.max(0, subtotal + shipping - discount),
  };
}

const PHONE = /^03\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate the delivery details.
 *
 * Phone is required and format-checked: it is the only reliable way to reach a
 * cash-on-delivery customer, and checkout previously accepted any non-empty
 * string.
 */
export function validateCustomer(customer = {}) {
  const errors = {};
  const need = (key, message) => {
    if (!String(customer[key] || '').trim()) errors[key] = message;
  };

  need('name', 'Name is required');
  need('address', 'Address is required');
  need('city', 'City is required');

  const phone = String(customer.phone || '').replace(/[\s-]/g, '');
  if (!phone) errors.phone = 'Phone number is required';
  else if (!PHONE.test(phone)) errors.phone = 'Enter a valid number, e.g. 03001234567';

  const email = String(customer.email || '').trim();
  if (email && !EMAIL.test(email)) errors.email = 'Enter a valid email address';

  return { valid: Object.keys(errors).length === 0, errors };
}
