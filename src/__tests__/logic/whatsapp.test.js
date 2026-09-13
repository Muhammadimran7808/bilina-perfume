/**
 * WhatsApp deep links.
 *
 * The number comes from an env var read at module load, so each case re-imports
 * the module with jest.isolateModules after setting it.
 */

const NUMBER = '923001234567';

function load(number = NUMBER) {
  let mod;
  jest.isolateModules(() => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = number;
    mod = require('@/lib/whatsapp');
  });
  return mod;
}

const product = { id: 'p1', name: 'Midnight Oud', price: 4500, volume: '50ml' };

describe('isWhatsAppEnabled', () => {
  it('is false when no number is configured', () => {
    expect(load('').isWhatsAppEnabled()).toBe(false);
  });

  it('is true once a number is set', () => {
    expect(load().isWhatsAppEnabled()).toBe(true);
  });
});

describe('productEnquiryLink', () => {
  it('points at wa.me with the configured number', () => {
    const href = load().productEnquiryLink(product, 'https://shop.test/products/p1');
    expect(href.startsWith(`https://wa.me/${NUMBER}?text=`)).toBe(true);
  });

  it('carries the name, price and page url through', () => {
    const href = load().productEnquiryLink(product, 'https://shop.test/products/p1');
    const text = decodeURIComponent(href.split('?text=')[1]);
    expect(text).toContain('Midnight Oud');
    expect(text).toContain('Rs 4,500');
    expect(text).toContain('50ml');
    expect(text).toContain('https://shop.test/products/p1');
  });

  it('percent-encodes the message rather than leaving raw newlines', () => {
    const href = load().productEnquiryLink(product, 'https://shop.test/products/p1');
    expect(href).not.toContain('\n');
    expect(href).toContain('%0A');
  });

  it('returns null when no number is configured', () => {
    expect(load('').productEnquiryLink(product, 'https://shop.test')).toBeNull();
  });

  it('returns null without a product', () => {
    expect(load().productEnquiryLink(null, 'https://shop.test')).toBeNull();
  });
});

describe('cartEnquiryLink', () => {
  const cart = [
    { id: 'a', name: 'Rose', price: 1000, quantity: 2, volume: '30ml' },
    { id: 'b', name: 'Oud', price: 1500, quantity: 1 },
  ];

  it('itemises every line with its line total', () => {
    const text = decodeURIComponent(load().cartEnquiryLink(cart, 3500).split('?text=')[1]);
    expect(text).toContain('Rose');
    expect(text).toContain('Rs 2,000'); // 1000 x 2
    expect(text).toContain('Oud');
    expect(text).toContain('Rs 1,500');
  });

  it('states the total', () => {
    const text = decodeURIComponent(load().cartEnquiryLink(cart, 3500).split('?text=')[1]);
    expect(text).toContain('Total: Rs 3,500');
  });

  it('omits the size when a line has none', () => {
    const text = decodeURIComponent(load().cartEnquiryLink(cart, 3500).split('?text=')[1]);
    expect(text).toContain('Rose (30ml)');
    expect(text).toContain('Oud ×');
  });

  it('returns null for an empty cart', () => {
    expect(load().cartEnquiryLink([], 0)).toBeNull();
  });

  it('returns null when no number is configured', () => {
    expect(load('').cartEnquiryLink(cart, 3500)).toBeNull();
  });
});

describe('share links', () => {
  it('builds a WhatsApp share carrying name, price and url', () => {
    const text = decodeURIComponent(
      load().shareToWhatsApp(product, 'https://shop.test/products/p1').split('?text=')[1]
    );
    expect(text).toContain('Midnight Oud');
    expect(text).toContain('Rs 4,500');
    expect(text).toContain('https://shop.test/products/p1');
  });

  it('encodes the url in the Facebook sharer', () => {
    const href = load().shareToFacebook('https://shop.test/products/p1?ref=a&b=c');
    expect(href).toContain('facebook.com/sharer');
    expect(href).toContain(encodeURIComponent('https://shop.test/products/p1?ref=a&b=c'));
  });
});
