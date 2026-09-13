'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { auth } from '@/firebaseConfig';

/**
 * Password reset.
 *
 * The sign-in page has always linked here, but the route did not exist and
 * sendPasswordResetEmail appeared nowhere in the codebase, so anyone who forgot
 * their password had no way back into their account.
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const address = email.trim();
    if (!address) {
      setError('Enter the email you signed up with');
      return;
    }

    setSending(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, address);
      setSent(true);
    } catch (err) {
      // auth/user-not-found is deliberately not distinguished: saying which
      // addresses have accounts lets anyone enumerate your customers.
      if (err.code === 'auth/user-not-found') {
        setSent(true);
      } else if (err.code === 'auth/invalid-email') {
        setError('That does not look like a valid email address');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else {
        setError('Could not send the reset email. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[13px] text-[#C9A96E] hover:text-[#E2C68A] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>

        {sent ? (
          <div className="border border-[#1e1e1e] bg-[#111] p-8 text-center">
            <MailCheck className="w-10 h-10 text-[#C9A96E] mx-auto mb-4" />
            <h1 className="font-playfair text-2xl font-bold text-[#f5f5f0] mb-3">Check your inbox</h1>
            <p className="text-sm text-[#aaa] leading-relaxed">
              If an account exists for <span className="text-[#f5f5f0]">{email.trim()}</span>, a
              password reset link is on its way. It expires after an hour.
            </p>
            <p className="text-[12px] text-[#666] mt-4">
              Nothing arrived? Check your spam folder, or{' '}
              <button
                onClick={() => setSent(false)}
                className="text-[#C9A96E] hover:text-[#E2C68A] transition-colors"
              >
                try another address
              </button>
              .
            </p>
          </div>
        ) : (
          <div className="border border-[#1e1e1e] bg-[#111] p-8">
            <p className="text-[#C9A96E] text-[11px] font-semibold tracking-[0.25em] uppercase mb-3">
              Reset password
            </p>
            <h1 className="font-playfair text-2xl font-bold text-[#f5f5f0]">
              Forgotten your password?
            </h1>
            <div className="mt-4 h-px w-12 bg-[#C9A96E]" />
            <p className="text-sm text-[#aaa] mt-6 mb-6 leading-relaxed">
              Enter the email address you signed up with and we will send you a link to set a new
              one.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`w-full bg-[#0f0f0f] border px-4 py-3 text-[#f5f5f0] text-sm placeholder-[#444] outline-none transition-colors ${
                    error ? 'border-red-500' : 'border-[#232323] focus:border-[#C9A96E]/50'
                  }`}
                />
                {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-[#C9A96E] hover:bg-[#E2C68A] disabled:opacity-60 text-[#0a0a0a] text-sm font-semibold tracking-wider uppercase py-3 transition-colors"
              >
                {sending ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
