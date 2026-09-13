'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';
import { toast } from 'react-toastify';
import { BRAND_NAME } from '@/lib/constants';

const fieldClass =
  'w-full bg-[#111] border border-[#232323] py-3 px-4 text-[#f5f5f0] text-sm ' +
  'placeholder-[#444] outline-none focus:border-[#C9A96E]/50 transition-colors';

const EMPTY = { name: '', email: '', subject: '', message: '' };

export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setErrors({});
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        toast.error(data.error || 'Could not send your message.');
        return;
      }

      setSent(true);
      setForm(EMPTY);
      toast.success('Message sent. We will get back to you shortly.');
    } catch {
      toast.error('Could not reach the server. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-8 py-20">
      <div className="grid md:grid-cols-2 items-start gap-12 md:gap-16">
        <div>
          <p className="text-[#C9A96E] text-[11px] font-semibold tracking-[0.25em] uppercase mb-3">
            Get in touch
          </p>
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-[#f5f5f0]">
            We would love to hear from you
          </h1>
          <div className="mt-4 h-px w-12 bg-[#C9A96E]" />
          <p className="text-sm text-[#aaa] mt-6 leading-relaxed">
            Questions about a fragrance, an order on its way, or which scent suits someone you are
            buying for — send us a message and we will reply personally.
          </p>

          <div className="mt-12 space-y-6">
            <ContactRow icon={Mail} label="Email" value="a.sfragrance@gmail.com"
              href="mailto:a.sfragrance@gmail.com" />
            <ContactRow icon={Phone} label="Phone" value="+92 300 1234567" href="tel:+923001234567" />
            <ContactRow icon={MapPin} label="Based in" value="Lahore, Pakistan" />
          </div>

          <div className="mt-12">
            <h2 className="text-[11px] font-semibold text-[#888] tracking-[0.15em] uppercase mb-4">
              Follow
            </h2>
            <div className="flex gap-3">
              <Social icon={Facebook} label="Facebook" href="https://facebook.com" />
              <Social icon={Instagram} label="Instagram" href="https://instagram.com" />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {sent && (
            <div className="border border-[#C9A96E]/30 bg-[#C9A96E]/5 px-4 py-3">
              <p className="text-sm text-[#C9A96E]">
                Thank you — your message is on its way to {BRAND_NAME}.
              </p>
            </div>
          )}

          <Field error={errors.name}>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Name"
              className={fieldClass} />
          </Field>
          <Field error={errors.email}>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="Email" className={fieldClass} />
          </Field>
          <Field error={errors.subject}>
            <input name="subject" value={form.subject} onChange={handleChange} placeholder="Subject"
              className={fieldClass} />
          </Field>
          <Field error={errors.message}>
            <textarea name="message" rows={6} value={form.message} onChange={handleChange}
              placeholder="Message" className={`${fieldClass} pt-3`} />
          </Field>

          <button type="submit" disabled={sending}
            className="w-full bg-[#C9A96E] hover:bg-[#E2C68A] disabled:opacity-60 text-[#0a0a0a] text-sm font-semibold tracking-wider uppercase px-4 py-3 transition-colors">
            {sending ? 'Sending...' : 'Send message'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ error, children }) {
  return (
    <div>
      {children}
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function ContactRow({ icon: Icon, label, value, href }) {
  const text = <span className="text-[#f5f5f0] text-sm">{value}</span>;
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 border border-[#232323] bg-[#111] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[#C9A96E]" />
      </div>
      <div>
        <p className="text-[11px] text-[#666] tracking-[0.12em] uppercase mb-0.5">{label}</p>
        {href ? (
          <a href={href} className="text-[#f5f5f0] text-sm hover:text-[#C9A96E] transition-colors">
            {value}
          </a>
        ) : (
          text
        )}
      </div>
    </div>
  );
}

function Social({ icon: Icon, label, href }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
      className="w-10 h-10 border border-[#232323] bg-[#111] flex items-center justify-center text-[#888] hover:text-[#C9A96E] hover:border-[#C9A96E]/40 transition-colors">
      <Icon className="w-4 h-4" />
    </a>
  );
}
