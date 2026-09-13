"use client"
import { useState, useEffect, useContext, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, ArrowLeft } from "lucide-react";
import { AppContext } from "@/context/Appcontext";
import Card from "@/app/components/ProductCard";

function SearchResults() {
  const { visibleProducts } = useContext(AppContext);
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [results, setResults] = useState([]);

  // Follow the URL. The param used to seed initial state only, so using the
  // header's search box while already on /search pushed a new URL without the
  // component ever noticing, and the results never changed.
  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 1) { setResults([]); return; }
    const filtered = visibleProducts.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q)
    );
    setResults(filtered);
  }, [searchQuery, visibleProducts]);

  const handleSubmit = (e) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-[#888] hover:text-[#C9A96E] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-playfair text-2xl font-bold">Search</h1>
        </div>

        {/* Search input */}
        <form onSubmit={handleSubmit} className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
          <input
            autoFocus
            type="text"
            placeholder="Search for fragrances..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-[#0f0f0f] border border-[#1e1e1e] focus:border-[#C9A96E]/50 text-white placeholder-[#444] outline-none text-base"
          />
        </form>

        {/* Results */}
        {searchQuery.trim() === "" ? (
          <p className="text-[#666] text-center py-16">Start typing to search for perfumes…</p>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-semibold text-[#aaa] mb-2">No results for "{searchQuery}"</p>
            <p className="text-[#666] mb-6">Try different keywords or browse our full collection.</p>
            <Link href="/products" className="text-[#C9A96E] text-sm font-medium hover:underline">
              Browse All Products →
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#666] mb-6">
              {results.length} result{results.length !== 1 ? "s" : ""} for "{searchQuery}"
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((product, i) => (
                <Card products={product} key={product.id || i} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" /></div>}>
      <SearchResults />
    </Suspense>
  );
}
