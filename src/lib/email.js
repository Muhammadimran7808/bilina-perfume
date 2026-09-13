import { Resend } from 'resend';
import { BRAND_NAME } from './constants';
import { formatPKR } from './format';

/**
 * Transactional email via Resend. Server-only — RESEND_API_KEY must never reach
 * the browser, which is why order placement goes through a route handler.
 */

const FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

/** ADMIN_EMAILS is comma-separated so the shop can notify several people. */
export function getAdminEmails() {
  return String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
}

let client = null;
function getClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function itemRows(items) {
  return items
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;">
          ${esc(i.name)}${i.volume ? ` <span style="color:#888;">· ${esc(i.volume)}</span>` : ''}
          <span style="color:#888;"> × ${esc(i.quantity)}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">
          ${esc(formatPKR(Number(i.price) * Number(i.quantity)))}
        </td>
      </tr>`
    )
    .join('');
}

function totalsBlock({ subtotal, shipping, discount, total, coupon }) {
  const row = (label, value, strong = false) => `
    <tr>
      <td style="padding:4px 0;${strong ? 'font-weight:700;padding-top:10px;' : 'color:#666;'}">${esc(label)}</td>
      <td style="padding:4px 0;text-align:right;${strong ? 'font-weight:700;padding-top:10px;' : 'color:#666;'}">${esc(value)}</td>
    </tr>`;
  return `
    ${row('Subtotal', formatPKR(subtotal))}
    ${row('Delivery', shipping ? formatPKR(shipping) : 'Free')}
    ${discount > 0 ? row(`Discount${coupon ? ` (${coupon})` : ''}`, `- ${formatPKR(discount)}`) : ''}
    ${row('Total', formatPKR(total), true)}`;
}

function shell(title, bodyHtml) {
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f6f6f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e6e6e6;">
    <div style="background:#0a0a0a;padding:20px 24px;">
      <span style="color:#C9A96E;font-size:18px;letter-spacing:2px;font-weight:700;">${esc(BRAND_NAME).toUpperCase()}</span>
    </div>
    <div style="padding:24px;">
      <h1 style="margin:0 0 16px;font-size:20px;">${esc(title)}</h1>
      ${bodyHtml}
    </div>
  </div>
</body></html>`;
}

function addressLines(customer) {
  return [
    customer.address,
    customer.apartment,
    customer.city,
    customer.postalCode,
    customer.country || 'Pakistan',
  ]
    .filter(Boolean)
    .map(esc)
    .join(', ');
}

function adminHtml(order) {
  const { orderNumber, items, customer } = order;
  return shell(
    `New order ${orderNumber}`,
    `
    <p style="margin:0 0 20px;color:#666;">Cash on delivery. Contact the customer to confirm.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${itemRows(items)}</table>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px;">
      ${totalsBlock(order)}
    </table>
    <h2 style="font-size:15px;margin:24px 0 8px;">Deliver to</h2>
    <p style="margin:0;font-size:14px;line-height:1.7;">
      <strong>${esc(customer.name)}</strong><br/>
      ${addressLines(customer)}<br/>
      <a href="tel:${esc(customer.phone)}" style="color:#9a7b3f;">${esc(customer.phone)}</a>
      ${customer.email ? `<br/><a href="mailto:${esc(customer.email)}" style="color:#9a7b3f;">${esc(customer.email)}</a>` : ''}
    </p>
    ${customer.notes ? `<p style="margin:12px 0 0;font-size:14px;"><strong>Notes:</strong> ${esc(customer.notes)}</p>` : ''}`
  );
}

function customerHtml(order) {
  const { orderNumber, items, customer } = order;
  return shell(
    'Thank you for your order',
    `
    <p style="margin:0 0 8px;font-size:14px;">Hi ${esc(customer.name)},</p>
    <p style="margin:0 0 20px;color:#666;font-size:14px;">
      We have received your order. Your reference is
      <strong style="color:#1a1a1a;">${esc(orderNumber)}</strong> — please quote it if you get in touch.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${itemRows(items)}</table>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px;">
      ${totalsBlock(order)}
    </table>
    <p style="margin:24px 0 0;font-size:14px;color:#666;">
      You pay <strong style="color:#1a1a1a;">${esc(formatPKR(order.total))}</strong> in cash when your
      order arrives at ${addressLines(customer)}.
    </p>`
  );
}

/**
 * Notify every admin, and the customer if they left an address.
 *
 * Never throws: a delivery failure must not cost a placed order. The caller
 * gets flags describing what actually went out.
 */
export async function sendOrderEmails(order) {
  const resend = getClient();
  const admins = getAdminEmails();
  const result = { adminSent: false, customerSent: false };

  if (!resend) {
    console.warn('RESEND_API_KEY is not set — no order emails were sent.');
    return result;
  }
  if (admins.length === 0) {
    console.warn('ADMIN_EMAILS is not set — nobody was notified of the order.');
  }

  if (admins.length > 0) {
    try {
      await resend.emails.send({
        from: FROM,
        to: admins,
        replyTo: order.customer?.email || undefined,
        subject: `New order ${order.orderNumber} · ${formatPKR(order.total)}`,
        html: adminHtml(order),
      });
      result.adminSent = true;
    } catch (err) {
      console.error('Admin order email failed:', err);
    }
  }

  const customerEmail = String(order.customer?.email || '').trim();
  if (customerEmail) {
    try {
      await resend.emails.send({
        from: FROM,
        to: customerEmail,
        subject: `Your ${BRAND_NAME} order ${order.orderNumber}`,
        html: customerHtml(order),
      });
      result.customerSent = true;
    } catch (err) {
      // Expected until a sending domain is verified: Resend's test sender only
      // delivers to the account owner.
      console.error('Customer confirmation email failed:', err);
    }
  }

  return result;
}
