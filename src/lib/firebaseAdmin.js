import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin, for server routes only.
 *
 * This bypasses security rules entirely, so it must never be imported from a
 * client component. The service account is supplied as a single JSON blob in
 * FIREBASE_SERVICE_ACCOUNT_KEY, which is how Vercel wants multi-line secrets.
 */

let cached = null;

function readServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY is not set. Download a service account key from ' +
        'Firebase Console > Project settings > Service accounts and paste the JSON into .env.local.'
    );
  }

  let parsed;
  try {
    // Tolerate the key being base64-encoded, which avoids newline mangling in
    // some hosting dashboards.
    const text = raw.trim().startsWith('{')
      ? raw
      : Buffer.from(raw, 'base64').toString('utf8');
    parsed = JSON.parse(text);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON or base64-encoded JSON.');
  }

  if (parsed.private_key) {
    // Escaped newlines survive .env round-trips; the SDK needs real ones.
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }
  return parsed;
}

export function getAdminDb() {
  if (cached) return cached;

  const app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({ credential: cert(readServiceAccount()) });

  cached = getFirestore(app);
  return cached;
}
