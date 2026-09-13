'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useContext } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { AppContext } from '@/context/Appcontext'
import Card from './ProductCard'
import mainperfume from '@/app/assets/landscape-img.png'
import bottle from '@/app/assets/bottle.jpg'

/* ── Shared section-header ── */
function SectionHeader({ eyebrow, title, align = 'center' }) {
  return (
    <div className={`mb-12 ${align === 'center' ? 'text-center' : ''}`}>
      <p className="text-[#C9A96E] text-[11px] font-semibold tracking-[0.25em] uppercase mb-3">{eyebrow}</p>
      <h2 className="font-playfair text-3xl md:text-4xl font-bold text-[#f5f5f0] leading-tight">{title}</h2>
      <div className={`mt-4 h-px w-12 bg-[#C9A96E] ${align === 'center' ? 'mx-auto' : ''}`} />
    </div>
  )
}

/* ── Stat pill ── */
function Stat({ value, label }) {
  return (
    <div className="text-center">
      <div className="font-playfair text-2xl md:text-3xl text-[#C9A96E] font-bold">{value}</div>
      <div className="text-[11px] text-[#666] tracking-wider uppercase mt-1">{label}</div>
    </div>
  )
}

// Names must match PRODUCT_CATEGORIES exactly, since each tile links to
// /products?category=<name>. They used to be invented labels — "Oud & Woods",
// "Fresh & Aqua", "Night Noir" — none of which any product could carry, so
// every tile landed on an unfiltered shop.
const CATEGORIES = [
  { name: 'Oud',      sub: 'Deep & Earthy',      gradient: 'from-amber-950/60' },
  { name: 'Floral',   sub: 'Light & Feminine',   gradient: 'from-rose-950/60' },
  { name: 'Fresh',    sub: 'Crisp & Clean',      gradient: 'from-sky-950/60' },
  { name: 'Woody',    sub: 'Dark & Grounding',   gradient: 'from-slate-900/80' },
  { name: 'Oriental', sub: 'Warm & Sensual',     gradient: 'from-violet-950/60' },
  { name: 'Citrus',   sub: 'Bright & Energetic', gradient: 'from-yellow-950/60' },
]

export default function HeroSection() {
  const { visibleProducts } = useContext(AppContext)
  const router = useRouter()

  return (
    <div className="bg-[#0a0a0a]">

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section className="relative min-h-[94vh] flex items-center overflow-hidden">
        {/* background image */}
        <Image
          src={mainperfume}
          alt="hero background"
          fill
          className="object-cover md:object-center object-right"
          priority
        />
        {/* dark overlay */}
        <div className="absolute inset-0 bg-[#0a0a0a]/1" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 via-[#0a0a0a]/40 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 w-full py-24 md:py-32">

          {/* Text */}
          <div className="max-w-2xl">
            {/* eyebrow */}
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="h-px w-8 bg-[#C9A96E]" />
              <span className="text-[#C9A96E] text-[11px] font-semibold tracking-[0.3em] uppercase">Luxury Fragrances</span>
            </div>

            {/* heading */}
            <h1 className="font-playfair text-[clamp(2.8rem,7vw,5.5rem)] font-bold leading-[1.05] text-[#f5f5f0] mb-6">
              Scent that<br />
              <em className="not-italic text-[#C9A96E]">defines</em> you
            </h1>

            <p className="text-[#777] text-base leading-relaxed max-w-md mb-10">
              Every bottle in the A.S Fragrance collection is crafted to embody triumph.
              Discover your signature — a scent as unique as your story.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 mb-14">
              <button
                onClick={() => router.push('/products')}
                className="group flex items-center gap-2.5 bg-[#C9A96E] hover:bg-[#E2C68A] text-[#0a0a0a] text-sm font-semibold tracking-wider uppercase px-8 py-3.5 transition-all duration-300 hover:shadow-xl hover:shadow-[#C9A96E]/20 hover:-translate-y-0.5"
              >
                Explore Collection
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <Link
                href="/about"
                className="flex items-center gap-2 text-[#888] hover:text-[#C9A96E] text-sm font-medium tracking-wider uppercase border-b border-transparent hover:border-[#C9A96E] transition-all pb-0.5"
              >
                Our Story <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Trust markers. Derived from real data where possible, and
                otherwise a policy the shop honours — never an invented number. */}
            <div className="flex gap-10 pt-8 border-t border-white/10">
              {visibleProducts.length > 0 && (
                <Stat
                  value={`${visibleProducts.length}`}
                  label={visibleProducts.length === 1 ? 'Fragrance' : 'Fragrances'}
                />
              )}
              <Stat value="100%" label="Authentic" />
              <Stat value="COD" label="Pay on delivery" />
            </div>
          </div>

        </div>

        {/* bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
      </section>

      {/* ════════════════════════════════════════
          TRUST BAR
      ════════════════════════════════════════ */}
      <section className="border-y border-[#1e1e1e]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#1e1e1e]">
            {[
              { icon: '🚚', title: 'Free Delivery',    sub: 'Orders over Rs 2,000' },
              { icon: '💎', title: '100% Authentic',   sub: 'Genuine luxury products' },
              { icon: '💳', title: 'Secure Checkout',  sub: 'COD & online payments' },
              { icon: '↩',  title: 'Easy Returns',     sub: '7-day return policy' },
            ].map(item => (
              <div key={item.title} className="flex items-center gap-4 px-6 py-5">
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div>
                  <p className="text-[13px] font-semibold text-[#f5f5f0] tracking-wide">{item.title}</p>
                  <p className="text-[11px] text-[#555] mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          BEST SELLERS
      ════════════════════════════════════════ */}
      {visibleProducts.length > 0 && (
        <section className="py-24 px-6 md:px-8 max-w-7xl mx-auto">
          <SectionHeader eyebrow="Most Loved" title="Best Sellers" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {visibleProducts.slice(0, 4).map((p, i) => (
              <Card products={p} key={p.id || i} index={i} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-[13px] text-[#C9A96E] border border-[#C9A96E]/40 hover:border-[#C9A96E] hover:bg-[#C9A96E]/5 px-8 py-3 tracking-wider uppercase transition-all"
            >
              View All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          EDITORIAL STRIP — Brand story
      ════════════════════════════════════════ */}
      <section className="py-24 bg-[#0d0d0d] border-y border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-6 md:px-8 grid lg:grid-cols-2 gap-16 items-center">
          {/* image */}
          <div className="relative flex justify-center">
            <div className="absolute -inset-6 bg-[#C9A96E]/4 rounded-[2px] blur-2xl" />
            <Image
              src={bottle}
              alt="A.S Fragrance artisanal craft"
              width={420}
              height={420}
              className="relative object-contain"
            />
            {/* floating badge */}
            <div className="absolute -bottom-5 -right-5 hidden md:flex bg-[#C9A96E] text-[#0a0a0a] text-center px-6 py-4">
              <div>
                <div className="font-playfair text-3xl font-bold leading-none">100%</div>
                <div className="text-[10px] font-semibold tracking-widest uppercase mt-1">Authentic</div>
              </div>
            </div>
          </div>

          {/* copy */}
          <div>
            <p className="text-[#C9A96E] text-[11px] font-semibold tracking-[0.3em] uppercase mb-4">Our Philosophy</p>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-[#f5f5f0] leading-tight mb-6">
              Born from<br />passion, worn<br />with pride.
            </h2>
            <p className="text-[#666] leading-relaxed mb-6 text-[15px]">
              A.S Fragrance was born from a belief that every victory deserves a signature scent.
              We handpick the finest ingredients and craft each perfume with the precision of a
              master artisan.
            </p>
            <p className="text-[#666] leading-relaxed mb-10 text-[15px]">
              From bold oud bases to delicate floral hearts — every note is intentional,
              every bottle a statement.
            </p>
            <Link
              href="/about"
              className="group inline-flex items-center gap-3 text-[13px] font-semibold tracking-[0.15em] uppercase text-[#C9A96E] border-b border-[#C9A96E]/40 hover:border-[#C9A96E] pb-1 transition-all"
            >
              Discover Our Story
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SHOP BY COLLECTION
      ════════════════════════════════════════ */}
      <section className="py-24 px-6 md:px-8 max-w-7xl mx-auto">
        <SectionHeader eyebrow="Browse" title="Shop by Collection" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.name}
              href={`/products?category=${encodeURIComponent(cat.name)}`}
              className={`relative group overflow-hidden bg-gradient-to-b ${cat.gradient} to-[#0a0a0a] border border-[#1e1e1e] hover:border-[#C9A96E]/40 transition-all duration-400`}
            >
              <div className="px-6 py-8 md:py-10">
                <h3 className="font-playfair text-lg md:text-xl font-bold text-[#f5f5f0] group-hover:text-[#C9A96E] transition-colors mb-1">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-[#555] tracking-wider">{cat.sub}</p>
                <div className="mt-5 flex items-center gap-2 text-[#C9A96E] text-[11px] font-semibold tracking-widest uppercase opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                  Shop <ArrowRight className="w-3 h-3" />
                </div>
              </div>
              {/* hover shimmer line */}
              <div className="absolute bottom-0 left-0 h-px w-0 bg-[#C9A96E] group-hover:w-full transition-all duration-500" />
            </Link>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          PROMO BANNER
      ════════════════════════════════════════ */}
      <section className="mx-4 md:mx-8 mb-24 border border-[#C9A96E]/20 bg-[#0d0d0d] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#C9A96E08_0%,_transparent_70%)]" />
        <div className="relative z-10 text-center px-8 py-16 md:py-20">
          {/* No promo code here. Codes are shared on WhatsApp and Facebook, so
              printing one on the homepage would hand it to every visitor and
              make it permanent. */}
          <p className="text-[#C9A96E] text-[11px] font-semibold tracking-[0.3em] uppercase mb-4">
            Follow us
          </p>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-[#f5f5f0] mb-4">
            Offers drop on our socials
          </h2>
          <p className="text-[#666] mb-8 max-w-md mx-auto text-[15px]">
            Promo codes and new arrivals go out on WhatsApp and Facebook first. Enter your code at
            checkout to redeem it.
          </p>
          <button
            onClick={() => router.push('/products')}
            className="bg-[#C9A96E] hover:bg-[#E2C68A] text-[#0a0a0a] text-sm font-semibold tracking-wider uppercase px-10 py-3.5 transition-all hover:shadow-xl hover:shadow-[#C9A96E]/20 hover:-translate-y-0.5"
          >
            Shop the Collection
          </button>
        </div>
      </section>

      {/* ════════════════════════════════════════
          NEW ARRIVALS (when enough products)
      ════════════════════════════════════════ */}
      {visibleProducts.length > 4 && (
        <section className="py-24 px-6 md:px-8 max-w-7xl mx-auto">
          <SectionHeader eyebrow="Just Arrived" title="New Additions" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...visibleProducts].reverse().slice(0, 4).map((p, i) => (
              <Card products={p} key={`new-${p.id || i}`} index={i} />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
