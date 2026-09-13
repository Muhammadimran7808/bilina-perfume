'use client'
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag, Banknote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useContext, useState } from "react";
import Swal from 'sweetalert2';
import { AppContext } from "@/context/Appcontext";
import { SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";
import { formatPKR } from "@/lib/format";
import { validateCustomer } from "@/lib/orders";

const COUNTRIES = [
  'Pakistan', 'Afghanistan', 'Australia', 'Bahrain', 'Bangladesh', 'Canada',
  'China', 'Egypt', 'France', 'Germany', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Italy', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Lebanon', 'Malaysia',
  'Maldives', 'Morocco', 'Nepal', 'Netherlands', 'New Zealand', 'Nigeria',
  'Oman', 'Philippines', 'Qatar', 'Russia', 'Saudi Arabia', 'Singapore',
  'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland',
  'Thailand', 'Turkey', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'United States', 'Yemen',
]

export default function Checkout() {
  const { user, loading, cart, removeFromCart, updateCartQuantity, clearCart } = useContext(AppContext);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [checkoutForm, setCheckoutForm] = useState({ name: '', email: '', phone: '', address: '', apartment: '', city: '', country: 'Pakistan', postalCode: '', notes: '' });
  const [formErrors, setFormErrors] = useState({});
  const [placing, setPlacing] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  // Indicative only. The server re-prices everything, including the coupon,
  // and its figures are what get charged.
  const discount = appliedCoupon ? Math.round((subtotal * appliedCoupon.percent) / 100) : 0;
  const total = subtotal + shipping - discount;

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponError('');
    try {
      const res = await fetch(`/api/coupons/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || 'That code is not valid.');
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon(data);
      setCouponInput('');
    } catch {
      setCouponError('Could not check that code. Please try again.');
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  const validateForm = () => {
    // Same validator the API runs, so the browser cannot accept something the
    // server will reject. Phone is required and format-checked: it is how a
    // cash-on-delivery customer actually gets reached.
    const { valid, errors } = validateCustomer(checkoutForm);
    setFormErrors(errors);
    return valid;
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (!validateForm()) return;

    setPlacing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Only ids and quantities: the server prices the order itself.
          cart: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
          customer: checkoutForm,
          couponCode: appliedCoupon?.code || null,
          userId: user?.uid || null,
          userEmail: user?.email || checkoutForm.email || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) setFormErrors(data.fieldErrors);
        Swal.fire({
          title: 'Order not placed',
          text: data.error || 'Please try again.',
          icon: 'error',
          background: '#111',
          color: '#fff',
          confirmButtonColor: '#C9A96E',
        });
        return;
      }

      clearCart();

      Swal.fire({
        title: 'Order placed',
        html:
          `<p>Thank you, <strong>${checkoutForm.name}</strong>.</p>` +
          `<p style="margin-top:12px">Your order number is<br/>` +
          `<strong style="color:#C9A96E;font-size:18px;letter-spacing:1px">${data.orderNumber}</strong></p>` +
          `<p style="margin-top:12px;font-size:13px;color:#aaa">` +
          `Pay ${formatPKR(data.total)} in cash when it arrives. We will call to confirm.</p>`,
        icon: 'success',
        background: '#111',
        color: '#fff',
        confirmButtonColor: '#C9A96E',
        confirmButtonText: 'Continue shopping',
      }).then(() => {
        window.location.href = '/products';
      });
    } catch (err) {
      console.error('Order error:', err);
      Swal.fire({
        title: 'Something went wrong',
        text: 'We could not reach the server. Please check your connection and try again.',
        icon: 'error',
        background: '#111',
        color: '#fff',
        confirmButtonColor: '#C9A96E',
      });
    } finally {
      setPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag className="w-20 h-20 text-[#444] mx-auto mb-6" />
          <h2 className="font-playfair text-2xl font-bold text-white mb-3">Your cart is empty</h2>
          <p className="text-[#666] mb-8">Add some fragrances to get started.</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#E2C68A] text-black font-semibold px-8 py-3 rounded-full transition-all"
          >
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/products" className="text-[#888] hover:text-[#C9A96E] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-playfair text-2xl font-bold">Checkout</h1>
          <span className="text-[#666] text-sm">({cart.length} item{cart.length !== 1 ? 's' : ''})</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Cart items ── */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-4 bg-[#0f0f0f] border border-[#1e1e1e] p-4">
                <div className="w-24 h-24 bg-[#111] overflow-hidden shrink-0">
                  <Image
                    src={item.image || item.imageUrl || '/placeholder.svg'}
                    alt={item.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-white text-sm">{item.name}</h3>
                      <p className="text-xs text-[#666] mt-0.5">Volume: {item.volume || '30ml'}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-[#555] hover:text-red-400 transition-colors shrink-0"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-[#232323] overflow-hidden">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="px-3 py-1.5 hover:bg-[#161616] transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-4 py-1.5 text-sm font-semibold min-w-[2.5rem] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-1.5 hover:bg-[#161616] transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-[#C9A96E] font-bold">Rs {(Number(item.price) * item.quantity).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Coupon */}
            <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#C9A96E]" /> Coupon Code
              </h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-[#C9A96E]/10 border border-[#C9A96E]/30 px-4 py-2.5">
                  <span className="text-sm text-[#C9A96E] font-mono font-semibold">{appliedCoupon.code} — {appliedCoupon.percent}% off</span>
                  <button onClick={removeCoupon} className="text-[#666] hover:text-white text-xs">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value); setCouponError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                    className="flex-1 bg-[#111] border border-[#232323] focus:border-[#C9A96E]/50 px-3 py-2 text-sm text-white placeholder-[#444] outline-none"
                  />
                  <button
                    onClick={applyCoupon}
                    className="bg-[#C9A96E] hover:bg-[#E2C68A] text-black font-semibold px-4 py-2 text-sm transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponError && <p className="text-red-400 text-xs mt-2">{couponError}</p>}
            </div>
          </div>

          {/* ── Order summary + checkout ── */}
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-5">
              <h3 className="text-base font-bold mb-4">Order Summary</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-[#888]">
                  <span>Subtotal</span>
                  <span className="text-white">Rs {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#888]">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-400' : 'text-white'}>
                    {shipping === 0 ? 'Free' : `Rs ${shipping}`}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount ({appliedCoupon})</span>
                    <span>−Rs {discount.toLocaleString()}</span>
                  </div>
                )}
                <hr className="border-[#1e1e1e] my-1" />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-[#C9A96E]">Rs {total.toLocaleString()}</span>
                </div>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-[#666] mt-3">
                  Add Rs {(SHIPPING_THRESHOLD - subtotal).toLocaleString()} more for free shipping
                </p>
              )}
            </div>

            {/* Delivery form */}
            <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-5">
              <h3 className="text-base font-bold mb-4">Delivery Details</h3>
              <div className="space-y-3">
                {/* Name */}
                {[
                  { key: 'name',  placeholder: 'Full Name *',    type: 'text' },
                  { key: 'email', placeholder: 'Email *',         type: 'email' },
                  { key: 'phone', placeholder: 'Phone Number *',  type: 'tel' },
                ].map(({ key, placeholder, type }) => (
                  <div key={key}>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={checkoutForm[key]}
                      onChange={(e) => setCheckoutForm((f) => ({ ...f, [key]: e.target.value }))}
                      className={`w-full bg-[#111] border  px-3 py-2.5 text-sm text-white placeholder-[#444] outline-none transition-colors ${
                        formErrors[key] ? 'border-red-500' : 'border-[#232323] focus:border-[#C9A96E]/50'
                      }`}
                    />
                    {formErrors[key] && <p className="text-red-400 text-xs mt-1">{formErrors[key]}</p>}
                  </div>
                ))}

                {/* Country */}
                <div>
                  <select
                    value={checkoutForm.country}
                    onChange={(e) => setCheckoutForm((f) => ({ ...f, country: e.target.value }))}
                    className={`w-full bg-[#111] border  px-3 py-2.5 text-sm text-white outline-none transition-colors appearance-none ${
                      formErrors.country ? 'border-red-500' : 'border-[#232323] focus:border-[#C9A96E]/50'
                    }`}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c} className="bg-[#111]">{c}</option>
                    ))}
                  </select>
                  {formErrors.country && <p className="text-red-400 text-xs mt-1">{formErrors.country}</p>}
                </div>

                {/* Street Address */}
                <div>
                  <input
                    type="text"
                    placeholder="Street Address *"
                    value={checkoutForm.address}
                    onChange={(e) => setCheckoutForm((f) => ({ ...f, address: e.target.value }))}
                    className={`w-full bg-[#111] border  px-3 py-2.5 text-sm text-white placeholder-[#444] outline-none transition-colors ${
                      formErrors.address ? 'border-red-500' : 'border-[#232323] focus:border-[#C9A96E]/50'
                    }`}
                  />
                  {formErrors.address && <p className="text-red-400 text-xs mt-1">{formErrors.address}</p>}
                </div>

                {/* Apartment */}
                <input
                  type="text"
                  placeholder="Apartment, suite, etc. (optional)"
                  value={checkoutForm.apartment}
                  onChange={(e) => setCheckoutForm((f) => ({ ...f, apartment: e.target.value }))}
                  className="w-full bg-[#111] border border-[#232323] focus:border-[#C9A96E]/50 px-3 py-2.5 text-sm text-white placeholder-[#444] outline-none transition-colors"
                />

                {/* City + Postal Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="City *"
                      value={checkoutForm.city}
                      onChange={(e) => setCheckoutForm((f) => ({ ...f, city: e.target.value }))}
                      className={`w-full bg-[#111] border  px-3 py-2.5 text-sm text-white placeholder-[#444] outline-none transition-colors ${
                        formErrors.city ? 'border-red-500' : 'border-[#232323] focus:border-[#C9A96E]/50'
                      }`}
                    />
                    {formErrors.city && <p className="text-red-400 text-xs mt-1">{formErrors.city}</p>}
                  </div>
                  <input
                    type="text"
                    placeholder="Postal Code (optional)"
                    value={checkoutForm.postalCode}
                    onChange={(e) => setCheckoutForm((f) => ({ ...f, postalCode: e.target.value }))}
                    className="w-full bg-[#111] border border-[#232323] focus:border-[#C9A96E]/50 px-3 py-2.5 text-sm text-white placeholder-[#444] outline-none transition-colors"
                  />
                </div>

                {/* Notes */}
                <input
                  type="text"
                  placeholder="Order notes (optional)"
                  value={checkoutForm.notes}
                  onChange={(e) => setCheckoutForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full bg-[#111] border border-[#232323] focus:border-[#C9A96E]/50 px-3 py-2.5 text-sm text-white placeholder-[#444] outline-none transition-colors"
                />
              </div>

              {/* Payment — cash on delivery only.
                  The card and wallet options here were disabled "Coming Soon"
                  panels with no radio input, yet ~110 lines of forms, state and
                  validation sat behind them, and Bank Deposit published a
                  placeholder account number a customer could have paid into. */}
              <div className="mt-5">
                <h4 className="text-sm font-semibold text-white mb-3">Payment</h4>
                <div className="flex items-start gap-3 border border-[#C9A96E]/30 bg-[#C9A96E]/5 p-4">
                  <Banknote className="w-5 h-5 text-[#C9A96E] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-[#f5f5f0] font-medium">Cash on delivery</p>
                    <p className="text-xs text-[#888] mt-1">
                      Pay in cash when your order arrives. We will call to confirm before dispatch.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="w-full mt-4 font-bold py-3.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed bg-[#C9A96E] hover:bg-[#E2C68A] text-black hover:shadow-lg hover:shadow-[#C9A96E]/20"
              >
                {placing ? (
                  <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Placing Order…</>
                ) : (
                  <>Place Order · Rs {total.toLocaleString()}</>
                )}
              </button>
            </div>

            <Link href="/products" className="block text-center text-sm text-[#666] hover:text-[#C9A96E] transition-colors">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
