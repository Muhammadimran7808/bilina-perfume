import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { generateOrderNumber, priceOrder, validateCustomer } from '@/lib/orders';
import { ORDER_STATUS } from '@/lib/constants';
import { sendOrderEmails } from '@/lib/email';

// The Admin SDK needs Node, not the edge runtime.
export const runtime = 'nodejs';

const MAX_LINES = 50;

/**
 * Place an order.
 *
 * The browser posts cart ids and quantities plus delivery details; it does not
 * get to say what anything costs. Prices come from Firestore, totals are
 * recomputed here, and stock is decremented in the same transaction that writes
 * the order, so two people cannot buy the same last bottle.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const { cart, customer, couponCode, userId = null, userEmail = null } = body || {};

  if (!Array.isArray(cart) || cart.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
  }
  if (cart.length > MAX_LINES) {
    return NextResponse.json({ error: 'That is too many items for one order.' }, { status: 400 });
  }

  const { valid, errors } = validateCustomer(customer);
  if (!valid) {
    return NextResponse.json(
      { error: 'Please check your delivery details.', fieldErrors: errors },
      { status: 400 }
    );
  }

  let db;
  try {
    db = getAdminDb();
  } catch (err) {
    console.error('Firebase Admin is not configured:', err.message);
    return NextResponse.json(
      { error: 'Ordering is temporarily unavailable. Please contact us to place your order.' },
      { status: 503 }
    );
  }

  try {
    const ids = [...new Set(cart.map((line) => String(line.id)).filter(Boolean))];
    if (ids.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
    }

    const coupon = await loadCoupon(db, couponCode);

    const orderNumber = generateOrderNumber();
    const orderRef = db.collection('orders').doc();

    const priced = await db.runTransaction(async (tx) => {
      const refs = ids.map((id) => db.collection('products').doc(id));
      const snaps = await tx.getAll(...refs);

      const products = new Map();
      snaps.forEach((snap) => {
        if (snap.exists) products.set(snap.id, snap.data());
      });

      const result = priceOrder(cart, products, coupon);
      if (result.problems.length > 0) {
        const error = new Error(result.problems[0]);
        error.userFacing = true;
        throw error;
      }

      // Decrement stock only where the product actually tracks it.
      for (const item of result.items) {
        const data = products.get(item.id);
        if (Number.isFinite(Number(data.stock))) {
          tx.update(db.collection('products').doc(item.id), {
            stock: FieldValue.increment(-item.quantity),
          });
        }
      }

      tx.set(orderRef, {
        orderNumber,
        items: result.items,
        customer: {
          name: String(customer.name).trim(),
          phone: String(customer.phone).replace(/[\s-]/g, ''),
          email: String(customer.email || '').trim() || null,
          address: String(customer.address).trim(),
          apartment: String(customer.apartment || '').trim() || null,
          city: String(customer.city).trim(),
          postalCode: String(customer.postalCode || '').trim() || null,
          country: String(customer.country || 'Pakistan').trim(),
          notes: String(customer.notes || '').trim() || null,
        },
        userId: userId || null,
        userEmail: userEmail || String(customer.email || '').trim() || null,
        subtotal: result.subtotal,
        shipping: result.shipping,
        discount: result.discount,
        coupon: result.appliedCoupon,
        total: result.total,
        paymentMethod: 'COD',
        status: ORDER_STATUS.PENDING,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return result;
    });

    // Email must never cost a customer their order, so failures are logged and
    // swallowed rather than surfaced.
    const email = await sendOrderEmails({
      orderNumber,
      items: priced.items,
      customer,
      subtotal: priced.subtotal,
      shipping: priced.shipping,
      discount: priced.discount,
      total: priced.total,
      coupon: priced.appliedCoupon,
    }).catch((err) => {
      console.error('Order email failed:', err);
      return { adminSent: false, customerSent: false };
    });

    return NextResponse.json({
      orderNumber,
      orderId: orderRef.id,
      total: priced.total,
      emailed: email?.adminSent ?? false,
    });
  } catch (err) {
    if (err.userFacing) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error('Order placement failed:', err);
    return NextResponse.json(
      { error: 'We could not place your order. Please try again.' },
      { status: 500 }
    );
  }
}

/** Coupons live in Firestore so they can be changed without a deploy. */
async function loadCoupon(db, code) {
  const trimmed = String(code || '').trim().toUpperCase();
  if (!trimmed) return null;

  try {
    const snap = await db.collection('coupons').doc(trimmed).get();
    if (!snap.exists) return null;

    const data = snap.data();
    if (data.isActive === false) return null;

    const expires = data.expiresAt?.toDate?.() ?? (data.expiresAt ? new Date(data.expiresAt) : null);
    if (expires && expires.getTime() < Date.now()) return null;

    const percent = Number(data.percent);
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) return null;

    return { code: trimmed, percent, minimumSpend: Number(data.minimumSpend) || 0 };
  } catch (err) {
    // A broken coupon lookup should not block the sale.
    console.error('Coupon lookup failed:', err);
    return null;
  }
}
