export const config = { runtime: 'edge' };

const enc = new TextEncoder();
const THIRTY_DAYS = 30 * 24 * 60 * 60;

function bytesToB64url(bytes) {
  let bin = '';
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sign(payloadObj, secret) {
  const payload = bytesToB64url(enc.encode(JSON.stringify(payloadObj)));
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return `${payload}.${bytesToB64url(sig)}`;
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let email = '', password = '';
  try {
    const body = await request.json();
    email = String(body.email || '').trim();
    password = String(body.password || '').trim().toLowerCase();
  } catch {
    return json({ ok: false, error: 'Malformed request.' }, 400);
  }

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const validPass = password === String(process.env.ASCENSION_PARTNER_PASSWORD || '')
    .trim().toLowerCase();

  if (!validEmail || !validPass) {
    return json({ ok: false, error: 'Access denied. Check your credentials.' }, 401);
  }

  const token = await sign(
    { email, exp: Date.now() + THIRTY_DAYS * 1000 },
    process.env.ASCENSION_SESSION_SECRET
  );

  // Lead capture — non-blocking, never fail the login on this
  try {
    await fetch('https://formspree.io/f/xbdekqyr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        email,
        form_type: 'partner_access',
        _subject: 'ASCENSION — Partner portal access',
        accessed_at: new Date().toISOString(),
      }),
    });
  } catch { /* ignore */ }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `modus_partner=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${THIRTY_DAYS}`,
    },
  });
}
