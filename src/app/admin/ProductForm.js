'use client';

import { useState } from 'react';
import ImageUpload from '../components/Image-Upload';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_GENDERS,
  PRODUCT_VOLUMES,
} from '@/lib/constants';

const EMPTY = {
  name: '',
  description: '',
  brand: '',
  category: '',
  gender: '',
  volume: '',
  sku: '',
  topNotes: '',
  middleNotes: '',
  baseNotes: '',
  imageUrl: '',
  price: '',
  stock: '',
  rating: '',
  reviews: '',
  isActive: true,
};

const fieldClass =
  'w-full bg-[#111] border border-[#232323] px-3 py-2.5 text-[#f5f5f0] text-sm ' +
  'placeholder-[#444] outline-none focus:border-[#C9A96E]/50 transition-colors';
const labelClass =
  'block text-[11px] font-semibold text-[#888] tracking-[0.12em] uppercase mb-1.5';

function Field({ id, label, hint, error, children }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-[#555] mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}

/**
 * Add/edit form for a product.
 *
 * Every attribute the shop filters on is here — brand, category, gender, the
 * three note groups and stock. Without them those filters match nothing, which
 * is exactly what happened before: this form collected seven fields while the
 * shop page queried eleven.
 */
export default function ProductForm({
  initial,
  onSubmit,
  submitLabel = 'Save product',
  onCancel,
}) {
  const [form, setForm] = useState({ ...EMPTY, ...(initial || {}) });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const next = type === 'checkbox' ? checked : value;
    setForm((prev) => ({ ...prev, [name]: next }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const validate = () => {
    const e = {};
    if (!String(form.name).trim()) e.name = 'Name is required';

    if (form.price === '' || Number.isNaN(Number(form.price))) {
      e.price = 'Price must be a number';
    } else if (Number(form.price) <= 0) {
      e.price = 'Price must be greater than zero';
    }

    if (form.stock !== '' && (Number.isNaN(Number(form.stock)) || Number(form.stock) < 0)) {
      e.stock = 'Stock must be zero or more';
    }

    if (form.rating !== '' && (Number(form.rating) < 0 || Number(form.rating) > 5)) {
      e.rating = 'Rating must be between 0 and 5';
    }

    if (!form.imageUrl) e.imageUrl = 'Upload an image';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <p className={labelClass}>Product image</p>
          <ImageUpload setFormData={setForm} />
          {form.imageUrl && <p className="text-[11px] text-[#C9A96E] mt-2">Uploaded</p>}
          {errors.imageUrl && <p className="text-[11px] text-red-400 mt-1">{errors.imageUrl}</p>}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Field id="name" label="Name" error={errors.name}>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Midnight Oud"
              className={fieldClass}
            />
          </Field>

          <Field id="description" label="Description">
            <textarea
              id="description"
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              placeholder="How does it smell, and who is it for?"
              className={fieldClass}
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field id="price" label="Price (Rs)" error={errors.price}>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={handleChange}
                placeholder="4500"
                className={fieldClass}
              />
            </Field>
            <Field
              id="stock"
              label="Stock"
              error={errors.stock}
              hint="0 removes it from the In Stock filter"
            >
              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={handleChange}
                placeholder="10"
                className={fieldClass}
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="border-t border-[#1e1e1e] pt-6">
        <p className="text-[11px] font-semibold text-[#C9A96E] tracking-[0.2em] uppercase mb-4">
          Filterable attributes
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field id="brand" label="Brand">
            <input
              id="brand"
              name="brand"
              value={form.brand}
              onChange={handleChange}
              placeholder="A.S Fragrance"
              className={fieldClass}
            />
          </Field>

          <Field id="category" label="Family">
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className={fieldClass}
            >
              <option value="">Not set</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field id="gender" label="For">
            <select
              id="gender"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className={fieldClass}
            >
              <option value="">Not set</option>
              {PRODUCT_GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>

          <Field id="volume" label="Volume">
            <select
              id="volume"
              name="volume"
              value={form.volume}
              onChange={handleChange}
              className={fieldClass}
            >
              <option value="">Not set</option>
              {PRODUCT_VOLUMES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-4">
          <Field id="topNotes" label="Top notes" hint="Comma separated">
            <input
              id="topNotes"
              name="topNotes"
              value={form.topNotes}
              onChange={handleChange}
              placeholder="Bergamot, Citrus"
              className={fieldClass}
            />
          </Field>
          <Field id="middleNotes" label="Middle notes" hint="Comma separated">
            <input
              id="middleNotes"
              name="middleNotes"
              value={form.middleNotes}
              onChange={handleChange}
              placeholder="Rose, Jasmine"
              className={fieldClass}
            />
          </Field>
          <Field id="baseNotes" label="Base notes" hint="Comma separated">
            <input
              id="baseNotes"
              name="baseNotes"
              value={form.baseNotes}
              onChange={handleChange}
              placeholder="Oud, Sandalwood"
              className={fieldClass}
            />
          </Field>
        </div>
      </div>

      <div className="border-t border-[#1e1e1e] pt-6 grid sm:grid-cols-3 gap-4">
        <Field id="sku" label="SKU">
          <input
            id="sku"
            name="sku"
            value={form.sku}
            onChange={handleChange}
            placeholder="ASF-001"
            className={fieldClass}
          />
        </Field>
        <Field id="rating" label="Rating" error={errors.rating} hint="0 to 5">
          <input
            id="rating"
            name="rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={form.rating}
            onChange={handleChange}
            placeholder="4.5"
            className={fieldClass}
          />
        </Field>
        <Field id="reviews" label="Review count">
          <input
            id="reviews"
            name="reviews"
            type="number"
            min="0"
            step="1"
            value={form.reviews}
            onChange={handleChange}
            placeholder="12"
            className={fieldClass}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-[#aaa] cursor-pointer">
        <input
          type="checkbox"
          name="isActive"
          checked={form.isActive !== false}
          onChange={handleChange}
          className="accent-[#C9A96E] w-4 h-4"
        />
        Visible in the shop
      </label>

      <div className="flex flex-wrap gap-3 border-t border-[#1e1e1e] pt-6">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#C9A96E] hover:bg-[#E2C68A] disabled:opacity-50 text-[#0a0a0a] text-sm font-semibold tracking-wider uppercase px-8 py-3 transition-colors"
        >
          {saving ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[13px] text-[#C9A96E] border border-[#C9A96E]/40 hover:border-[#C9A96E] px-8 py-3 tracking-wider uppercase transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
