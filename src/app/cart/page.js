'use client'
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Banknote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";
import { useContext, useState } from "react";
import { AppContext } from "@/context/Appcontext";


export default function Cart() {
  const { cart, removeFromCart, updateCartQuantity } = useContext(AppContext);


  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

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
          <h1 className="font-playfair text-2xl font-bold">Shopping Cart</h1>
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
                    {/* Quantity controls */}
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

            {/* Cart is review-only. Delivery details and order placement live on
                /checkout, which used to be a near-duplicate of this page that had
                drifted: this one demanded a login and made email optional, that
                one demanded neither and collected three more address fields, and
                both wrote different shapes into the same orders collection. */}
            <Link
              href="/checkout"
              className="block w-full text-center bg-[#C9A96E] hover:bg-[#E2C68A] text-[#0a0a0a] text-sm font-semibold tracking-wider uppercase py-3.5 transition-colors"
            >
              Proceed to checkout
            </Link>

            <div className="flex items-center gap-2 text-xs text-[#666] justify-center">
              <Banknote className="w-3.5 h-3.5" />
              Cash on delivery
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
