'use client'
import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppContext } from '@/context/Appcontext';

/**
 * Restricts a route to signed-in users holding one of `allow`.
 *
 * This is a UX guard only — it stops the wrong people seeing the screen, but a
 * determined user can always run the client bundle however they like. The real
 * enforcement is in the Firestore security rules (see firestore.rules), which
 * reject writes from anyone whose users/{uid}.role is not 'admin'.
 */
export default function RoleGuard({ allow = ['admin'], children }) {
  const { user, role, loading } = useContext(AppContext);
  const router = useRouter();

  const permitted = !!user && allow.includes(role);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (!allow.includes(role)) {
      router.replace('/');
    }
  }, [loading, user, role, allow, router]);

  // Render nothing until the role is known, so the guarded screen never flashes
  // on-screen for an unauthorised visitor while the redirect is in flight.
  if (loading || !permitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-[#C9A96E] text-sm tracking-wide">
          {loading ? 'Checking permissions…' : 'Redirecting…'}
        </p>
      </div>
    );
  }

  return children;
}
