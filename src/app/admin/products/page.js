'use client';

import { useContext, useMemo, useState } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Search, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { AppContext } from '@/context/Appcontext';
import { formatPKR } from '@/lib/format';
import { LOW_STOCK_THRESHOLD } from '@/lib/constants';
import ProductForm from '../ProductForm';

export default function AdminProductsPage() {
  const { perfumesData, SaveProduct, updateProduct, deleteProduct } = useContext(AppContext);

  // null = list, 'new' = add form, otherwise the product being edited.
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? perfumesData.filter((p) =>
          [p.name, p.brand, p.sku, p.category].filter(Boolean).join(' ').toLowerCase().includes(q)
        )
      : perfumesData;
    return [...list].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [perfumesData, query]);

  const handleCreate = async (form) => {
    const result = await SaveProduct(form);
    if (result.success) {
      toast.success('Product added');
      setEditing(null);
    } else {
      toast.error(result.error || 'Could not add the product');
    }
  };

  const handleUpdate = async (form) => {
    const result = await updateProduct(editing.id, form);
    if (result.success) {
      toast.success('Product updated');
      setEditing(null);
    } else {
      toast.error(result.error || 'Could not update the product');
    }
  };

  const handleDelete = async (product) => {
    const confirmed = await Swal.fire({
      title: 'Delete this product?',
      html: `<p><strong>${product.name}</strong> will be removed from the shop.</p><p>This cannot be undone.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Keep it',
      background: '#111',
      color: '#f5f5f0',
      confirmButtonColor: '#b91c1c',
      cancelButtonColor: '#232323',
    });
    if (!confirmed.isConfirmed) return;

    const result = await deleteProduct(product.id);
    if (result.success) toast.success('Product deleted');
    else toast.error(result.error || 'Could not delete the product');
  };

  if (editing === 'new') {
    return (
      <section>
        <h2 className="font-playfair text-2xl font-bold text-[#f5f5f0] mb-6">Add a product</h2>
        <ProductForm
          onSubmit={handleCreate}
          submitLabel="Add product"
          onCancel={() => setEditing(null)}
        />
      </section>
    );
  }

  if (editing) {
    return (
      <section>
        <h2 className="font-playfair text-2xl font-bold text-[#f5f5f0] mb-6">
          Edit {editing.name}
        </h2>
        <ProductForm
          initial={editing}
          onSubmit={handleUpdate}
          submitLabel="Save changes"
          onCancel={() => setEditing(null)}
        />
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, brand or SKU"
            className="w-full bg-[#111] border border-[#232323] pl-9 pr-3 py-2.5 text-[#f5f5f0] text-sm placeholder-[#444] outline-none focus:border-[#C9A96E]/50 transition-colors"
          />
        </div>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-2 bg-[#C9A96E] hover:bg-[#E2C68A] text-[#0a0a0a] text-sm font-semibold tracking-wider uppercase px-6 py-2.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="border border-[#1e1e1e] bg-[#111] py-20 text-center">
          <p className="text-[#888] text-sm">
            {perfumesData.length === 0
              ? 'No products yet. Add your first one to open the shop.'
              : 'No product matches that search.'}
          </p>
        </div>
      ) : (
        <div className="border border-[#1e1e1e] overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-[#111] text-[11px] text-[#888] tracking-[0.12em] uppercase">
                <th className="text-left font-semibold px-4 py-3">Product</th>
                <th className="text-left font-semibold px-4 py-3">Family</th>
                <th className="text-right font-semibold px-4 py-3">Price</th>
                <th className="text-right font-semibold px-4 py-3">Stock</th>
                <th className="text-center font-semibold px-4 py-3">Live</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const stock = Number(p.stock) || 0;
                return (
                  <tr key={p.id} className="border-t border-[#1e1e1e] hover:bg-[#0f0f0f]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 bg-[#161616] border border-[#1e1e1e] shrink-0">
                          <Image
                            src={p.imageUrl || p.image || '/placeholder.svg'}
                            alt={p.name || 'Product'}
                            fill
                            sizes="44px"
                            className="object-contain p-1"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[#f5f5f0] truncate">{p.name}</p>
                          <p className="text-[11px] text-[#555] truncate">
                            {[p.brand, p.volume, p.sku].filter(Boolean).join(' · ') || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#888]">
                      {[p.category, p.gender].filter(Boolean).join(' / ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-[#f5f5f0]">{formatPKR(p.price)}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          stock === 0
                            ? 'text-red-400'
                            : stock <= LOW_STOCK_THRESHOLD
                              ? 'text-[#C9A96E]'
                              : 'text-[#888]'
                        }
                      >
                        {stock === 0 ? 'Out' : stock}
                        {stock > 0 && stock <= LOW_STOCK_THRESHOLD && (
                          <AlertTriangle className="inline w-3 h-3 ml-1 -mt-0.5" />
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          p.isActive === false ? 'bg-[#444]' : 'bg-green-500'
                        }`}
                        title={p.isActive === false ? 'Hidden' : 'Visible'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditing(p)}
                          title="Edit"
                          aria-label={`Edit ${p.name}`}
                          className="w-8 h-8 flex items-center justify-center text-[#888] hover:text-[#C9A96E] hover:bg-white/5 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          title="Delete"
                          aria-label={`Delete ${p.name}`}
                          className="w-8 h-8 flex items-center justify-center text-[#888] hover:text-red-400 hover:bg-white/5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
