import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createClient } from 'redis';

// Durable primary storage: MODUS_DB_DATABASE_URL (injected by Neon/Vercel).
// REDIS_URL is optional and is used only for distributed rate limiting.
const ALLOWED_ORIGINS = new Set(['https://modus.gallery', 'https://www.modus.gallery']);
const SOURCES = {
  modus_join: { tier: 'reader', label: 'MODUS Join' },
  modus_private_waitlist: { tier: 'private', label: 'MODUS Private Waitlist' },
};
const EMAIL_PATTERN = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const RATE_LIMIT = 5;
const RATE_WINDOW_SECONDS = 60 * 60;
const memoryRateLimits = new Map();
let redisClientPromise;

function normalizeEmail(value) {
  return String(value || '').normalize('NFKC').trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function clientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  return String(Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket?.remoteAddress || 'unknown')
    .split(',')[0].trim();
}

function setCors(req, res) {
  const origin = req.headers?.origin;
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

function databaseUrl(env) {
  return env.MODUS_DB_DATABASE_URL || env.DATABASE_URL || '';
}

function defaultGetDatabase(env) {
  const url = databaseUrl(env);
  return url ? neon(url) : null;
}

async function defaultGetRedis(env) {
  if (!env.REDIS_URL) return null;
  if (!redisClientPromise) {
    const client = createClient({ url: env.REDIS_URL });
    client.on('error', () => console.error('Subscribe rate-limit service error'));
    redisClientPromise = client.connect().then(() => client).catch(error => {
      redisClientPromise = undefined;
      throw error;
    });
  }
  return redisClientPromise;
}

function enforceMemoryRateLimit(req, nowMs) {
  const key = hash(clientIp(req)).slice(0, 32);
  const current = memoryRateLimits.get(key);
  if (!current || current.expiresAt <= nowMs) {
    memoryRateLimits.set(key, { count: 1, expiresAt: nowMs + RATE_WINDOW_SECONDS * 1000 });
    return true;
  }
  current.count += 1;
  return current.count <= RATE_LIMIT;
}

async function enforceRateLimit(redis, req, nowMs) {
  if (!redis) return enforceMemoryRateLimit(req, nowMs);
  const key = `modus:subscribe:rate:${hash(clientIp(req)).slice(0, 32)}`;
  const count = Number(await redis.incr(key));
  if (count === 1) await redis.expire(key, RATE_WINDOW_SECONDS);
  return count <= RATE_LIMIT;
}

async function persistSubscriber(sql, record) {
  const crmStatus = record.crmRequested ? 'pending' : 'not_requested';
  const rows = await sql`
    INSERT INTO subscribers (email, source, marketing_consent, consent_at, crm_sync_status)
    VALUES (${record.email}, ${record.source}, TRUE, ${record.consentAt}, ${crmStatus})
    ON CONFLICT (email, source) DO UPDATE SET
      marketing_consent = TRUE,
      consent_at = EXCLUDED.consent_at,
      updated_at = NOW(),
      crm_sync_status = CASE
        WHEN subscribers.crm_sync_status = 'synced' THEN subscribers.crm_sync_status
        ELSE EXCLUDED.crm_sync_status
      END
    RETURNING id, (xmax <> 0) AS duplicate
  `;
  if (rows.length !== 1 || !rows[0].id) throw new Error('subscriber_commit_unconfirmed');
  return { id: rows[0].id, duplicate: Boolean(rows[0].duplicate) };
}

async function updateCrmStatus(sql, id, status) {
  await sql`
    UPDATE subscribers
    SET crm_sync_status = ${status},
        crm_synced_at = CASE WHEN ${status} = 'synced' THEN NOW() ELSE crm_synced_at END,
        updated_at = NOW()
    WHERE id = ${id}
  `;
}

async function sendNotification(record, env, fetchImpl) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) return;
  const response = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL || 'MODUS <noreply@modus.gallery>',
      to: [env.NOTIFY_EMAIL],
      subject: `${SOURCES[record.source].label} / New lead`,
      html: `<p><strong>Source:</strong> ${escapeHtml(SOURCES[record.source].label)}</p>` +
        `<p><strong>Email:</strong> ${escapeHtml(record.email)}</p>` +
        `<p><strong>Consent recorded:</strong> ${escapeHtml(record.consentAt)}</p>`,
    }),
  });
  if (!response.ok) throw new Error('notification_failed');
}

async function syncCrm(record, env, fetchImpl) {
  if (!env.CRM_WEBHOOK_URL) return false;
  const headers = { 'Content-Type': 'application/json' };
  if (env.CRM_WEBHOOK_TOKEN) headers.Authorization = `Bearer ${env.CRM_WEBHOOK_TOKEN}`;
  const response = await fetchImpl(env.CRM_WEBHOOK_URL, { method: 'POST', headers, body: JSON.stringify(record) });
  if (!response.ok) throw new Error('crm_sync_failed');
  return true;
}

export function createSubscribeHandler({ env = process.env, fetchImpl = fetch, now = () => new Date(), getDatabase = defaultGetDatabase, getRedis = defaultGetRedis } = {}) {
  return async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, code: 'method_not_allowed', error: 'Method not allowed.' });
    if (!databaseUrl(env)) return res.status(503).json({ success: false, code: 'storage_not_configured', error: 'Subscriptions are temporarily unavailable.' });

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const email = normalizeEmail(body.email);
    const source = String(body.source || '');
    if (!EMAIL_PATTERN.test(email) || email.length > 254) return res.status(400).json({ success: false, code: 'invalid_email', error: 'Enter a valid email address.' });
    if (!SOURCES[source]) return res.status(400).json({ success: false, code: 'invalid_source', error: 'Invalid signup source.' });
    if (body.consent !== true) return res.status(400).json({ success: false, code: 'consent_required', error: 'Consent is required to receive MODUS emails.' });
    if (String(body.website || '').trim()) return res.status(400).json({ success: false, code: 'spam_detected', error: 'Submission rejected.' });

    try {
      let redis = null;
      if (env.REDIS_URL) {
        try { redis = await getRedis(env); } catch { console.error('Subscribe rate-limit service unavailable'); }
      }
      const timestamp = now();
      if (!await enforceRateLimit(redis, req, timestamp.getTime())) return res.status(429).json({ success: false, code: 'rate_limited', error: 'Too many attempts. Try again later.' });

      const sql = getDatabase(env);
      if (!sql) throw new Error('database_client_unavailable');
      const record = {
        email,
        source,
        sourceLabel: SOURCES[source].label,
        tier: SOURCES[source].tier,
        consent: true,
        consentAt: timestamp.toISOString(),
        crmRequested: Boolean(env.CRM_WEBHOOK_URL),
      };
      const stored = await persistSubscriber(sql, record);

      const notification = sendNotification(record, env, fetchImpl).catch(() => console.error('Subscribe notification delivery failed'));
      const crm = syncCrm(record, env, fetchImpl)
        .then(synced => synced && updateCrmStatus(sql, stored.id, 'synced'))
        .catch(async () => {
          console.error('Subscribe CRM delivery failed');
          try { await updateCrmStatus(sql, stored.id, 'failed'); } catch { console.error('Subscribe CRM status update failed'); }
        });
      await Promise.all([notification, crm]);

      return res.status(stored.duplicate ? 200 : 201).json({
        success: true,
        saved: true,
        duplicate: stored.duplicate,
        message: stored.duplicate ? 'You are already on this list.' : 'Your signup has been saved.',
      });
    } catch {
      console.error('Subscribe persistence failed');
      return res.status(503).json({ success: false, code: 'persistence_failed', error: 'We could not save your signup. Please try again.' });
    }
  };
}

export default createSubscribeHandler();
