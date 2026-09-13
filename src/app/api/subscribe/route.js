import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { sendSubscriberNotice } from '@/lib/email';

export const runtime = 'nodejs';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Newsletter sign-up.
 *
 * The footer form used to flip a local flag to show "You're on the list" and
 * throw the address away. Addresses are stored keyed by email, so a repeat
 * sign-up updates rather than duplicating.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const email = String(body?.email || '').trim().toLowerCase();
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const ref = db.collection('subscribers').doc(email);
    const existing = await ref.get();

    await ref.set(
      {
        email,
        subscribedAt: existing.exists
          ? existing.data().subscribedAt
          : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Only worth a notification the first time.
    if (!existing.exists) {
      await sendSubscriberNotice(email).catch((err) =>
        console.error('Subscriber notice failed:', err)
      );
    }

    return NextResponse.json({ ok: true, alreadySubscribed: existing.exists });
  } catch (err) {
    console.error('Subscribe failed:', err);
    return NextResponse.json({ error: 'Could not sign you up. Please try again.' }, { status: 500 });
  }
}
