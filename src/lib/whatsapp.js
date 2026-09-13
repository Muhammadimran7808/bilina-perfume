import { WHATSAPP_NUMBER } from './constants';
import { formatPKR } from './format';

/**
 * WhatsApp deep links.
 *
 * The shop already sells through WhatsApp, so this is a first-class path to
 * buying rather than a support afterthought: a customer who will not fill in a
 * checkout form will often send a pre-filled message.
 */

export function isWhatsAppEnabled() {
  return Boolean(WHATSAPP_NUMBER);
}

function link(message) {
  if (!WHATSAPP_NUMBER) return null;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Enquiry about one product, with a link back to the page being viewed. */
export function productEnquiryLink(product, url) {
  if (!product) return null;
  const lines = [
    `Hi, I'd like to order this:`,
    ``,
    `*${product.name}*`,
    product.volume ? `Size: ${product.volume}` : null,
    `Price: ${formatPKR(product.price)}`,
    url ? `` : null,
    url || null,
  ].filter((l) => l !== null);
  return link(lines.join('\n'));
}

/** The whole basket, itemised, with a total. */
export function cartEnquiryLink(cart, total) {
  if (!Array.isArray(cart) || cart.length === 0) return null;
  const lines = [
    `Hi, I'd like to order:`,
    ``,
    ...cart.map(
      (i) =>
        `• ${i.name}${i.volume ? ` (${i.volume})` : ''} × ${i.quantity} — ${formatPKR(
          Number(i.price) * Number(i.quantity)
        )}`
    ),
    ``,
    `Total: ${formatPKR(total)}`,
  ];
  return link(lines.join('\n'));
}

/** Generic "I have a question" entry point for the floating button. */
export function generalEnquiryLink() {
  return link(`Hi, I have a question about your fragrances.`);
}

/** Share a product to WhatsApp. */
export function shareToWhatsApp(product, url) {
  return link(`${product.name} — ${formatPKR(product.price)}\n${url}`);
}

/** Share a URL to Facebook. */
export function shareToFacebook(url) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}
