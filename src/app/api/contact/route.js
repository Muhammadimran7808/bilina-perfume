import { NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/email';

export const runtime = 'nodejs';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE = 5000;

/**
 * Contact form.
 *
 * The form previously had no value, no onChange and no onClick — nothing it
 * collected went anywhere.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const name = String(body?.name || '').trim();
  const email = String(body?.email || '').trim();
  const subject = String(body?.subject || '').trim();
  const message = String(body?.message || '').trim();

  const fieldErrors = {};
  if (!name) fieldErrors.name = 'Please tell us your name';
  if (!email) fieldErrors.email = 'An email address is required';
  else if (!EMAIL.test(email)) fieldErrors.email = 'Enter a valid email address';
  if (!message) fieldErrors.message = 'Please write a message';
  else if (message.length > MAX_MESSAGE) fieldErrors.message = 'That message is too long';

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: 'Please check the form.', fieldErrors }, { status: 400 });
  }

  try {
    await sendContactEmail({ name, email, subject, message });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Contact email failed:', err);
    return NextResponse.json(
      { error: 'We could not send your message. Please email us directly.' },
      { status: 502 }
    );
  }
}
