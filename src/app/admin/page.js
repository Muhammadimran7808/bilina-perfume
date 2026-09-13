'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { Package, ClipboardList, AlertTriangle, Wallet } from 'lucide-react';
import { db } from '@/firebaseConfig';
import { AppContext } from '@/context/Appcontext';
import { formatPKR } from '@/lib/format';
import { LOW_STOCK_THRESHOLD, ORDER_STATUS } from '@/lib/constants';

export default function AdminOverviewPage() {
  const { perfumesData } = useContext(AppContext);
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState(null);

  useEffect(() => {
    // Unordered read: the overview only aggregates, so it needs no index and
    // still works before the orders composite index exists.
    getDocs(collection(db, 'orders'))
      .then((snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch((err) => {
        console.error('Error loading orders:', err);
        setOrdersError(err.message || 'Could not load orders');
      });
  }, []);

  const stats = useMemo(() => {
    const pending = orders.filter(
      (o) => (o.status || ORDER_STATUS.PENDING) === ORDER_STATUS.PENDING
    ).length;
    const revenue = orders
      .filter((o) => o.status !== ORDER_STATUS.CANCELLED)
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const lowStock = perfumesData.filter((p) => (Number(p.stock) || 0) <= LOW_STOCK_THRESHOLD);
    return { pending, revenue, lowStock };
  }, [orders, perfumesData]);

  return (
    <section className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          icon={Package}
          label="Products"
          value={perfumesData.length}
          href="/admin/products"
        />
        <Stat icon={ClipboardList} label="Orders" value={orders.length} href="/admin/orders" />
        <Stat icon={Wallet} label="Pending" value={stats.pending} href="/admin/orders" />
        <Stat icon={Wallet} label="Revenue" value={formatPKR(stats.revenue)} />
      </div>

      {ordersError && (
        <div className="border border-red-500/30 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-400">{ordersError}</p>
        </div>
      )}

      {perfumesData.length === 0 && (
        <div className="border border-[#C9A96E]/30 bg-[#C9A96E]/5 p-6">
          <h2 className="font-playfair text-xl font-bold text-[#f5f5f0] mb-2">
            Your shop is empty
          </h2>
          <p className="text-sm text-[#aaa] mb-4">
            Add your first product and it appears in the shop straight away.
          </p>
          <Link
            href="/admin/products"
            className="inline-block bg-[#C9A96E] hover:bg-[#E2C68A] text-[#0a0a0a] text-sm font-semibold tracking-wider uppercase px-6 py-2.5 transition-colors"
          >
            Add a product
          </Link>
        </div>
      )}

      {stats.lowStock.length > 0 && (
        <div className="border border-[#1e1e1e] bg-[#111] p-5">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold text-[#C9A96E] tracking-[0.15em] uppercase mb-4">
            <AlertTriangle className="w-3.5 h-3.5" />
            Running low
          </h2>
          <ul className="space-y-2">
            {stats.lowStock.map((p) => (
              <li key={p.id} className="flex justify-between text-sm">
                <span className="text-[#f5f5f0]">{p.name}</span>
                <span className={(Number(p.stock) || 0) === 0 ? 'text-red-400' : 'text-[#888]'}>
                  {(Number(p.stock) || 0) === 0 ? 'Out of stock' : `${p.stock} left`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Stat({ icon: Icon, label, value, href }) {
  const body = (
    <div className="border border-[#1e1e1e] bg-[#111] p-5 h-full hover:border-[#C9A96E]/30 transition-colors">
      <div className="flex items-center gap-2 text-[11px] text-[#888] tracking-[0.15em] uppercase mb-3">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="font-playfair text-2xl font-bold text-[#f5f5f0]">{value}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
