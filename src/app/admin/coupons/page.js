'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { Plus, Pencil, Trash2, Search, Tag } from 'lucide-react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { db } from '@/firebaseConfig';
import { formatPKR } from '@/lib/format';

/**
 * Promo code management.
 *
 * Codes live in Firestore keyed by the code itself, so a lookup is a single
 * document read. firestore.rules allows reads and writes only for admins, which
 * is what lets this page talk to Firestore directly and also stops anyone
 * enumerating codes from the browser — they are marketed on social media, not
 * advertised on the site.
 */

const fieldClass =
  'w-full bg-[#111] border border-[#232323] px-3 py-2.5 text-[#f5f5f0] text-sm ' +
  'placeholder-[#444] outline-none focus:border-[#C9A96E]/50 transition-colors';
const labelClass =
  'block text-[11px] font-semibold text-[#888] tracking-[0.12em] uppercase mb-1.5';

const EMPTY = { code: '', percent: '', minimumSpend: '', expiresAt: '', isActive: true };

/** Firestore Timestamp, Date or string -> yyyy-mm-dd for a date input. */
function toDateInput(value) {
  if (!value) return '';
  const d = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function isExpired(value) {
  if (!value) return false;
  const d = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | coupon
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, 'coupons'));
      setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error loading coupons:', err);
      setError(err.message || 'Could not load promo codes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? coupons.filter((c) => c.id.toLowerCase().includes(q)) : coupons;
    return [...list].sort((a, b) => a.id.localeCompare(b.id));
  }, [coupons, query]);

  const toggleActive = async (coupon) => {
    const next = coupon.isActive === false;
    setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, isActive: next } : c)));
    try {
      await updateDoc(doc(db, 'coupons', coupon.id), { isActive: next });
      toast.success(next ? `${coupon.id} is live` : `${coupon.id} paused`);
    } catch (err) {
      console.error('Error toggling coupon:', err);
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !next } : c))
      );
      toast.error('Could not change that code');
    }
  };

  const handleDelete = async (coupon) => {
    const confirmed = await Swal.fire({
      title: `Delete ${coupon.id}?`,
      html: '<p>Anyone still holding this code will be told it is invalid.</p><p>Pausing it instead keeps the record.</p>',
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

    try {
      await deleteDoc(doc(db, 'coupons', coupon.id));
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      toast.success('Promo code deleted');
    } catch (err) {
      console.error('Error deleting coupon:', err);
      toast.error('Could not delete that code');
    }
  };

  if (editing) {
    return (
      <CouponForm
        initial={editing === 'new' ? null : editing}
        existingCodes={coupons.map((c) => c.id)}
        onDone={async () => {
          setEditing(null);
          await load();
        }}
        onCancel={() => setEditing(null)}
      />
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
            placeholder="Search codes"
            className={`${fieldClass} pl-9`}
          />
        </div>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-2 bg-[#C9A96E] hover:bg-[#E2C68A] text-[#0a0a0a] text-sm font-semibold tracking-wider uppercase px-6 py-2.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New code
        </button>
      </div>

      {error && (
        <div className="border border-red-500/30 bg-red-500/5 px-4 py-3 mb-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="border border-[#1e1e1e] bg-[#111] py-20 text-center text-sm text-[#888]">
          Loading promo codes...
        </div>
      ) : visible.length === 0 ? (
        <div className="border border-[#1e1e1e] bg-[#111] py-20 text-center px-6">
          <Tag className="w-10 h-10 text-[#2a2a2a] mx-auto mb-4" />
          <p className="text-[#888] text-sm">
            {coupons.length === 0 ? 'No promo codes yet.' : 'No code matches that search.'}
          </p>
          {coupons.length === 0 && (
            <p className="text-[12px] text-[#555] mt-2 max-w-sm mx-auto">
              Codes are never shown on the site. Create one here, then share it on WhatsApp or
              Facebook.
            </p>
          )}
        </div>
      ) : (
        <div className="border border-[#1e1e1e] overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-[#111] text-[11px] text-[#888] tracking-[0.12em] uppercase">
                <th className="text-left font-semibold px-4 py-3">Code</th>
                <th className="text-right font-semibold px-4 py-3">Discount</th>
                <th className="text-right font-semibold px-4 py-3">Min spend</th>
                <th className="text-left font-semibold px-4 py-3">Expires</th>
                <th className="text-center font-semibold px-4 py-3">Live</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => {
                const expired = isExpired(c.expiresAt);
                const live = c.isActive !== false && !expired;
                return (
                  <tr key={c.id} className="border-t border-[#1e1e1e] hover:bg-[#0f0f0f]">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-[#C9A96E]">{c.id}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-[#f5f5f0]">{c.percent}%</td>
                    <td className="px-4 py-3 text-right text-[#888]">
                      {Number(c.minimumSpend) > 0 ? formatPKR(c.minimumSpend) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {c.expiresAt ? (
                        <span className={expired ? 'text-red-400' : 'text-[#888]'}>
                          {toDateInput(c.expiresAt)}
                          {expired && ' (expired)'}
                        </span>
                      ) : (
                        <span className="text-[#555]">No expiry</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(c)}
                        disabled={expired}
                        title={expired ? 'Expired codes cannot be reactivated without a new date' : live ? 'Pause this code' : 'Make this code live'}
                        aria-label={`${live ? 'Pause' : 'Activate'} ${c.id}`}
                        className={`relative w-10 h-5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          live ? 'bg-[#C9A96E]' : 'bg-[#2a2a2a]'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 bg-[#0a0a0a] transition-transform ${
                            live ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditing(c)}
                          title="Edit"
                          aria-label={`Edit ${c.id}`}
                          className="w-8 h-8 flex items-center justify-center text-[#888] hover:text-[#C9A96E] hover:bg-white/5 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          title="Delete"
                          aria-label={`Delete ${c.id}`}
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

function CouponForm({ initial, existingCodes, onDone, onCancel }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState(
    initial
      ? {
          code: initial.id,
          percent: String(initial.percent ?? ''),
          minimumSpend: initial.minimumSpend ? String(initial.minimumSpend) : '',
          expiresAt: toDateInput(initial.expiresAt),
          isActive: initial.isActive !== false,
        }
      : EMPTY
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Codes are typed by customers, so normalise the case here rather than
    // relying on everyone remembering to.
    const next = type === 'checkbox' ? checked : name === 'code' ? value.toUpperCase() : value;
    setForm((prev) => ({ ...prev, [name]: next }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const validate = () => {
    const e = {};
    const code = form.code.trim();

    if (!code) e.code = 'Enter a code';
    else if (!/^[A-Z0-9]{3,20}$/.test(code))
      e.code = 'Use 3 to 20 letters and numbers, no spaces';
    else if (!isEdit && existingCodes.includes(code)) e.code = 'That code already exists';

    const percent = Number(form.percent);
    if (form.percent === '' || Number.isNaN(percent)) e.percent = 'Enter a discount';
    else if (percent <= 0 || percent > 100) e.percent = 'Must be between 1 and 100';

    if (form.minimumSpend !== '' && Number(form.minimumSpend) < 0)
      e.minimumSpend = 'Cannot be negative';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const code = form.code.trim();
      await setDoc(doc(db, 'coupons', code), {
        percent: Number(form.percent),
        minimumSpend: Number(form.minimumSpend) || 0,
        // Stored end-of-day so a code is usable for the whole of its last date.
        expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`) : null,
        isActive: form.isActive,
        updatedAt: new Date(),
        ...(isEdit ? {} : { createdAt: new Date() }),
      });
      toast.success(isEdit ? 'Promo code updated' : `${code} created`);
      await onDone();
    } catch (err) {
      console.error('Error saving coupon:', err);
      toast.error('Could not save that code');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="max-w-xl">
      <h2 className="font-playfair text-2xl font-bold text-[#f5f5f0] mb-6">
        {isEdit ? `Edit ${initial.id}` : 'New promo code'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="code" className={labelClass}>
            Code
          </label>
          <input
            id="code"
            name="code"
            value={form.code}
            onChange={handleChange}
            disabled={isEdit}
            placeholder="EIDSALE"
            autoComplete="off"
            className={`${fieldClass} font-mono tracking-wider disabled:opacity-50`}
          />
          {errors.code ? (
            <p className="text-[11px] text-red-400 mt-1">{errors.code}</p>
          ) : (
            <p className="text-[11px] text-[#555] mt-1">
              {isEdit
                ? 'The code itself cannot be changed. Delete it and make a new one instead.'
                : 'Letters and numbers only. Customers can type it in any case.'}
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="percent" className={labelClass}>
              Discount %
            </label>
            <input
              id="percent"
              name="percent"
              type="number"
              min="1"
              max="100"
              value={form.percent}
              onChange={handleChange}
              placeholder="20"
              className={fieldClass}
            />
            {errors.percent && <p className="text-[11px] text-red-400 mt-1">{errors.percent}</p>}
          </div>

          <div>
            <label htmlFor="minimumSpend" className={labelClass}>
              Minimum spend
            </label>
            <input
              id="minimumSpend"
              name="minimumSpend"
              type="number"
              min="0"
              value={form.minimumSpend}
              onChange={handleChange}
              placeholder="0"
              className={fieldClass}
            />
            {errors.minimumSpend ? (
              <p className="text-[11px] text-red-400 mt-1">{errors.minimumSpend}</p>
            ) : (
              <p className="text-[11px] text-[#555] mt-1">Leave blank for no minimum</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="expiresAt" className={labelClass}>
            Expires
          </label>
          <input
            id="expiresAt"
            name="expiresAt"
            type="date"
            value={form.expiresAt}
            onChange={handleChange}
            className={fieldClass}
          />
          <p className="text-[11px] text-[#555] mt-1">
            Leave blank to run indefinitely. Valid to the end of the day chosen.
          </p>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-[#aaa] cursor-pointer">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={handleChange}
            className="accent-[#C9A96E] w-4 h-4"
          />
          Accept this code at checkout
        </label>

        <div className="flex flex-wrap gap-3 border-t border-[#1e1e1e] pt-5">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#C9A96E] hover:bg-[#E2C68A] disabled:opacity-50 text-[#0a0a0a] text-sm font-semibold tracking-wider uppercase px-8 py-3 transition-colors"
          >
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create code'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-[13px] text-[#C9A96E] border border-[#C9A96E]/40 hover:border-[#C9A96E] px-8 py-3 tracking-wider uppercase transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
