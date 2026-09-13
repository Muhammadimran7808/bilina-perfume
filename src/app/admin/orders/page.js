'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { ChevronLeft, RefreshCw, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { db } from '@/firebaseConfig';
import { formatPKR } from '@/lib/format';
import { ORDER_STATUSES, ORDER_STATUS } from '@/lib/constants';

const STATUS_COLOR = {
  [ORDER_STATUS.PENDING]: 'text-[#C9A96E] border-[#C9A96E]/40',
  [ORDER_STATUS.PROCESSING]: 'text-blue-400 border-blue-400/40',
  [ORDER_STATUS.SHIPPED]: 'text-purple-400 border-purple-400/40',
  [ORDER_STATUS.DELIVERED]: 'text-green-400 border-green-400/40',
  [ORDER_STATUS.CANCELLED]: 'text-red-400 border-red-400/40',
};

/** Firestore Timestamp, a Date, or a string — orders carry all three. */
function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value) {
  const d = toDate(value);
  return d
    ? d.toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Unknown date';
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      // Surfaced rather than swallowed: a missing index and a permission
      // failure look identical as an empty list, and that cost us before.
      console.error('Error loading orders:', err);
      setError(err.message || 'Could not load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'All' && (o.status || ORDER_STATUS.PENDING) !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return [o.orderNumber, o.id, o.customer?.name, o.customer?.phone, o.userEmail]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [orders, statusFilter, search]);

  const changeStatus = async (order, status) => {
    const previous = order.status;
    // Optimistic: the dropdown should not feel laggy on a slow connection.
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
    setSelected((s) => (s && s.id === order.id ? { ...s, status } : s));
    try {
      await updateDoc(doc(db, 'orders', order.id), { status, updatedAt: new Date() });
      toast.success(`Marked ${status.toLowerCase()}`);
    } catch (err) {
      console.error('Error updating status:', err);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: previous } : o)));
      setSelected((s) => (s && s.id === order.id ? { ...s, status: previous } : s));
      toast.error('Could not update the status');
    }
  };

  if (selected) {
    const o = selected;
    const items = Array.isArray(o.items) ? o.items : [];
    return (
      <section>
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-[13px] text-[#C9A96E] hover:text-[#E2C68A] mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          All orders
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="font-playfair text-2xl font-bold text-[#f5f5f0]">
              {o.orderNumber || o.id.slice(0, 12).toUpperCase()}
            </h2>
            <p className="text-[13px] text-[#666] mt-1">{formatDate(o.createdAt)}</p>
          </div>
          <select
            value={o.status || ORDER_STATUS.PENDING}
            onChange={(e) => changeStatus(o, e.target.value)}
            className="bg-[#111] border border-[#232323] px-3 py-2 text-sm text-[#f5f5f0] outline-none focus:border-[#C9A96E]/50"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border border-[#1e1e1e] bg-[#111] p-5">
            <h3 className="text-[11px] font-semibold text-[#888] tracking-[0.15em] uppercase mb-4">
              Items
            </h3>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={`${item.id}-${i}`} className="flex justify-between gap-4 text-sm">
                  <span className="text-[#f5f5f0]">
                    {item.name}
                    <span className="text-[#555]"> × {item.quantity}</span>
                    {item.volume && <span className="text-[#555]"> · {item.volume}</span>}
                  </span>
                  <span className="text-[#aaa] whitespace-nowrap">
                    {formatPKR(Number(item.price) * Number(item.quantity))}
                  </span>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-[#555]">No line items recorded.</p>}
            </div>

            <div className="border-t border-[#1e1e1e] mt-5 pt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={formatPKR(o.subtotal)} />
              <Row label="Delivery" value={o.shipping ? formatPKR(o.shipping) : 'Free'} />
              {o.discount > 0 && (
                <Row
                  label={`Discount${o.coupon ? ` (${o.coupon})` : ''}`}
                  value={`- ${formatPKR(o.discount)}`}
                />
              )}
              <div className="flex justify-between pt-2 border-t border-[#1e1e1e] text-[#f5f5f0] font-semibold">
                <span>Total</span>
                <span>{formatPKR(o.total)}</span>
              </div>
              <p className="text-[12px] text-[#666] pt-1">Payment: {o.paymentMethod || 'COD'}</p>
            </div>
          </div>

          <div className="border border-[#1e1e1e] bg-[#111] p-5">
            <h3 className="text-[11px] font-semibold text-[#888] tracking-[0.15em] uppercase mb-4">
              Customer
            </h3>
            <dl className="space-y-3 text-sm">
              <Detail label="Name" value={o.customer?.name} />
              <Detail label="Phone" value={o.customer?.phone} href={`tel:${o.customer?.phone}`} />
              <Detail
                label="Email"
                value={o.customer?.email || o.userEmail}
                href={`mailto:${o.customer?.email || o.userEmail}`}
              />
              <Detail
                label="Address"
                value={[
                  o.customer?.address,
                  o.customer?.apartment,
                  o.customer?.city,
                  o.customer?.postalCode,
                  o.customer?.country,
                ]
                  .filter(Boolean)
                  .join(', ')}
              />
              {o.customer?.notes && <Detail label="Notes" value={o.customer.notes} />}
              <Detail label="Account" value={o.userId ? 'Registered' : 'Guest checkout'} />
            </dl>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Order number, name or phone"
              className="w-full bg-[#111] border border-[#232323] pl-9 pr-3 py-2.5 text-[#f5f5f0] text-sm placeholder-[#444] outline-none focus:border-[#C9A96E]/50 transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#111] border border-[#232323] px-3 py-2.5 text-sm text-[#f5f5f0] outline-none focus:border-[#C9A96E]/50"
          >
            <option value="All">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-[13px] text-[#C9A96E] border border-[#C9A96E]/40 hover:border-[#C9A96E] px-5 py-2.5 tracking-wider uppercase transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="border border-red-500/30 bg-red-500/5 px-4 py-3 mb-6">
          <p className="text-sm text-red-400">{error}</p>
          <p className="text-[12px] text-[#888] mt-1">
            If this mentions an index, Firebase logs a link in the browser console that creates it.
          </p>
        </div>
      )}

      {loading ? (
        <div className="border border-[#1e1e1e] bg-[#111] py-20 text-center text-sm text-[#888]">
          Loading orders...
        </div>
      ) : visible.length === 0 ? (
        <div className="border border-[#1e1e1e] bg-[#111] py-20 text-center text-sm text-[#888]">
          {orders.length === 0 ? 'No orders yet.' : 'No order matches those filters.'}
        </div>
      ) : (
        <div className="border border-[#1e1e1e] overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-[#111] text-[11px] text-[#888] tracking-[0.12em] uppercase">
                <th className="text-left font-semibold px-4 py-3">Order</th>
                <th className="text-left font-semibold px-4 py-3">Customer</th>
                <th className="text-left font-semibold px-4 py-3">Placed</th>
                <th className="text-right font-semibold px-4 py-3">Total</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => {
                const status = o.status || ORDER_STATUS.PENDING;
                return (
                  <tr
                    key={o.id}
                    onClick={() => setSelected(o)}
                    className="border-t border-[#1e1e1e] hover:bg-[#0f0f0f] cursor-pointer"
                  >
                    <td className="px-4 py-3 text-[#f5f5f0] whitespace-nowrap">
                      {o.orderNumber || o.id.slice(0, 12).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#f5f5f0]">{o.customer?.name || 'Unknown'}</p>
                      <p className="text-[11px] text-[#555]">{o.customer?.phone || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-[#888] whitespace-nowrap">
                      {formatDate(o.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right text-[#f5f5f0] whitespace-nowrap">
                      {formatPKR(o.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block border px-2.5 py-1 text-[11px] tracking-wider uppercase ${
                          STATUS_COLOR[status] || 'text-[#888] border-[#232323]'
                        }`}
                      >
                        {status}
                      </span>
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

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-[#aaa]">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Detail({ label, value, href }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[11px] text-[#666] tracking-[0.12em] uppercase mb-0.5">{label}</dt>
      <dd className="text-[#f5f5f0]">
        {href ? (
          <a href={href} className="hover:text-[#C9A96E] transition-colors">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
