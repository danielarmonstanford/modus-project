export const config = {
  matcher: '/ascension/partners/:path*',
};

const enc = new TextEncoder();

function b64urlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function verify(token, secret) {
  if (!token || token.indexOf('.') === -1) return null;
  const [payload, sig] = token.split('.');
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  );
  const ok = await crypto.subtle.verify(
    'HMAC', key, b64urlToBytes(sig), enc.encode(payload)
  );
  if (!ok) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(b64urlToBytes(payload)));
    if (!data.exp || Date.now() > data.exp) return null;
    return data;
  } catch { return null; }
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)modus_partner=([^;]+)/);
  const session = match
    ? await verify(decodeURIComponent(match[1]), process.env.ASCENSION_SESSION_SECRET)
    : null;

  if (session) return; // authenticated — continue to static file

  const redirect = new URL('/ascension/access.html', url.origin);
  redirect.searchParams.set('next', url.pathname);
  return Response.redirect(redirect.toString(), 302);
}
