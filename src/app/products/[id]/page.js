'use client'

import Image from "next/image"
import { Star, Heart, ShoppingCart, ChevronLeft, ChevronRight, CheckCircle, Package, Zap } from "lucide-react"
import { use, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppContext } from "@/context/Appcontext"
import Card from "@/app/components/ProductCard"
import Link from "next/link"

export default function ProductPage({ params }) {
  const resolvedParams = use(params)
  const productId = resolvedParams.id

  const { visibleProducts, addToCart, toggleWishlist, isInWishlist, addToRecentlyViewed } = useContext(AppContext)
  const router = useRouter()

  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  // Find product by id
  const product = visibleProducts.find((p) => p.id === productId)

  // Add to recently viewed when product loads
  useEffect(() => {
    if (product) addToRecentlyViewed(product)
  }, [product])

  if (!product && visibleProducts.length > 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-playfair text-2xl font-semibold text-[#aaa] mb-4">Product not found</h2>
          <Link href="/products" className="text-[#C9A96E] hover:underline">← Back to Shop</Link>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Build images array (support single or multiple)
  const images = product.images?.length
    ? product.images
    : [product.imageUrl || product.image || '/placeholder.svg']

  const inWishlist = isInWishlist(product.id)
  const relatedProducts = visibleProducts.filter((p) => p.id !== product.id).slice(0, 4)

  const fragranceNotes = [
    { label: 'Top Notes', value: product.topNotes || product.fragranceNotes?.top },
    { label: 'Heart Notes', value: product.middleNotes || product.fragranceNotes?.middle },
    { label: 'Base Notes', value: product.baseNotes || product.fragranceNotes?.base },
  ].filter((n) => n.value)

  const cartItem = {
    id: product.id,
    name: product.name,
    price: Number(product.price),
    image: images[0],
    volume: product.volume || '30ml',
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) addToCart(cartItem)
  }

  const handleBuyNow = () => {
    for (let i = 0; i < quantity; i++) addToCart(cartItem, { silent: true })
    router.push('/checkout')
  }

  const inStock = product.stock === undefined || product.stock > 0

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm text-[#666]">
          <Link href="/" className="hover:text-[#C9A96E]">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-[#C9A96E]">Shop</Link>
          <span>/</span>
          <span className="text-[#aaa] truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* Main product section */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-start">

          {/* ── Image gallery ── */}
          <div className="lg:sticky top-24">
            {/* Main image */}
            <div className="relative aspect-square bg-[#0f0f0f] overflow-hidden border border-[#1e1e1e]/50 mb-4">
              <Image
                src={images[selectedImage]}
                alt={product.name}
                fill
                className="object-contain p-8"
                priority
              />
              {/* In Stock badge */}
              {inStock ? (
                <span className="absolute top-4 left-4 flex items-center gap-1.5 bg-green-900/80 text-green-400 text-xs font-medium px-3 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" /> In Stock
                </span>
              ) : (
                <span className="absolute top-4 left-4 bg-red-900/80 text-red-400 text-xs font-medium px-3 py-1 rounded-full">
                  Out of Stock
                </span>
              )}
              {/* Image nav arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((i) => (i === 0 ? images.length - 1 : i - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#0a0a0a]/60 rounded-full flex items-center justify-center hover:bg-[#0a0a0a]/80"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((i) => (i === images.length - 1 ? 0 : i + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#0a0a0a]/60 rounded-full flex items-center justify-center hover:bg-[#0a0a0a]/80"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-16 h-16  overflow-hidden border-2 transition-all ${
                      selectedImage === i ? 'border-[#C9A96E]' : 'border-[#1e1e1e] hover:border-[#2a2a2a]'
                    }`}
                  >
                    <Image src={img} alt={`View ${i + 1}`} fill className="object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product info ── */}
          <div>
            {product.brand && (
              <p className="text-[#C9A96E] text-sm font-medium tracking-wider uppercase mb-2">{product.brand}</p>
            )}
            <h1 className="font-playfair text-2xl md:text-3xl font-bold mb-3">{product.name}</h1>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Number(product.rating)
                          ? 'fill-[#C9A96E] text-[#C9A96E]'
                          : 'fill-[#444] text-[#444]'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-[#888]">
                  {product.rating} / 5 {product.reviews && `(${product.reviews} reviews)`}
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-[#C9A96E]">Rs {product.price}</span>
              {product.originalPrice && (
                <span className="text-lg text-[#666] line-through">Rs {product.originalPrice}</span>
              )}
              {product.volume && (
                <span className="text-sm text-[#666] ml-2">/ {product.volume}</span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-[#888] leading-relaxed mb-6">{product.description}</p>
            )}

            <hr className="border-[#1e1e1e] mb-6" />

            {/* Fragrance Notes */}
            {fragranceNotes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Fragrance Notes</h3>
                <div className="flex flex-col gap-2">
                  {fragranceNotes.map((note) => (
                    <div key={note.label} className="flex items-start gap-3">
                      <span className="text-xs font-medium text-[#C9A96E] bg-[#C9A96E]/10 px-2 py-0.5 shrink-0 mt-0.5">{note.label}</span>
                      <span className="text-sm text-[#888]">{note.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white mb-3">Quantity</h3>
              <div className="inline-flex items-center border border-[#232323] overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2.5 hover:bg-[#161616] transition-colors text-lg leading-none"
                >
                  −
                </button>
                <span className="px-5 py-2.5 text-sm font-semibold min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-4 py-2.5 hover:bg-[#161616] transition-colors text-lg leading-none"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className="flex-1 flex items-center justify-center gap-2 font-semibold py-3.5 border border-[#C9A96E]/50 hover:border-[#C9A96E] text-[#C9A96E] hover:bg-[#C9A96E]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inStock ? <><ShoppingCart className="w-4 h-4" /> Add to Cart</> : 'Out of Stock'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!inStock}
                className="flex-1 flex items-center justify-center gap-2 font-semibold py-3.5 bg-[#C9A96E] hover:bg-[#E2C68A] text-black transition-all hover:shadow-lg hover:shadow-[#C9A96E]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" /> Buy Now
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                className={`w-14 flex items-center justify-center  border transition-all ${
                  inWishlist
                    ? 'bg-[#C9A96E]/10 border-[#C9A96E]/40 text-[#C9A96E]'
                    : 'border-[#232323] text-[#888] hover:border-[#C9A96E]/40 hover:text-[#C9A96E]'
                }`}
                aria-label="Toggle wishlist"
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Delivery info */}
            <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-4 flex items-start gap-3">
              <Package className="w-5 h-5 text-[#C9A96E] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Free delivery on orders over Rs 2000</p>
                <p className="text-xs text-[#666] mt-0.5">Estimated delivery: 2–5 business days</p>
              </div>
            </div>

            <hr className="border-[#1e1e1e] my-6" />

            {/* Product details accordion */}
            <ProductDetails product={product} />
          </div>
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <div className="bg-[#080808] border-t border-[#1e1e1e] py-16 px-6 md:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-playfair text-2xl font-bold text-center mb-10">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p, i) => (
                <Card products={p} key={p.id || i} index={i} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductDetails({ product }) {
  const [open, setOpen] = useState(null)

  const sections = [
    {
      title: 'Product Details',
      content: product.details || `Volume: ${product.volume || '—'} · Concentration: ${product.concentration || 'Eau de Parfum'} · Brand: ${product.brand || 'A.S Fragrance'}`,
    },
    {
      title: 'How to Use',
      content: product.howToUse || 'Spray onto pulse points — wrists, neck, and behind the ears. Apply after showering for longer-lasting scent.',
    },
    {
      title: 'Shipping & Returns',
      content: 'Orders are processed within 1–2 business days. Free shipping on orders over Rs 2000. Returns accepted within 7 days for unopened products.',
    },
  ]

  return (
    <div className="space-y-0">
      {sections.map((s) => (
        <div key={s.title} className="border-b border-[#1e1e1e]">
          <button
            onClick={() => setOpen(open === s.title ? null : s.title)}
            className="w-full flex items-center justify-between py-4 text-sm font-medium text-white hover:text-[#C9A96E] transition-colors"
          >
            {s.title}
            <span className="text-lg leading-none">{open === s.title ? '−' : '+'}</span>
          </button>
          {open === s.title && (
            <p className="text-sm text-[#888] pb-4 leading-relaxed">{s.content}</p>
          )}
        </div>
      ))}
    </div>
  )
}
