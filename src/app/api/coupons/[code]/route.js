import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

/**
 * Look up a coupon so checkout can show the discount before submitting.
 *
 * This is a convenience for the UI only — /api/orders re-validates the code and
 * recomputes the discount, so a forged response here buys nothing. Codes used
 * to be a hardcoded map in two client files, printed on the page as
 * "Try: WELCOME20, SAVE10, ASFF15".
 */
export async function GET(_request, { params }) {
  const { code } = await params;
  const normalised = String(code || '').trim().toUpperCase();

  if (!normalised) {
    return NextResponse.json({ error: 'Enter a code.' }, { status: 400 });
  }

  let db;
  try {
    db = getAdminDb();
  } catch (err) {
    console.error('Firebase Admin is not configured:', err.message);
    return NextResponse.json({ error: 'Could not check that code.' }, { status: 503 });
  }

  try {
    const snap = await db.collection('coupons').doc(normalised).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'That code is not valid.' }, { status: 404 });
    }

    const data = snap.data();
    if (data.isActive === false) {
      return NextResponse.json({ error: 'That code is no longer active.' }, { status: 410 });
    }

    const expires = data.expiresAt?.toDate?.() ?? (data.expiresAt ? new Date(data.expiresAt) : null);
    if (expires && expires.getTime() < Date.now()) {
      return NextResponse.json({ error: 'That code has expired.' }, { status: 410 });
    }

    const percent = Number(data.percent);
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      return NextResponse.json({ error: 'That code is not valid.' }, { status: 404 });
    }

    return NextResponse.json({
      code: normalised,
      percent,
      minimumSpend: Number(data.minimumSpend) || 0,
    });
  } catch (err) {
    console.error('Coupon lookup failed:', err);
    return NextResponse.json({ error: 'Could not check that code.' }, { status: 500 });
  }
}
