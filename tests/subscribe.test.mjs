import test from 'node:test';
import assert from 'node:assert/strict';
import { createSubscribeHandler } from '../api/subscribe.js';

let ip = 10;
const signup = { email: ' Person@Example.COM ', source: 'modus_join', consent: true, website: '' };
const configured = { MODUS_DB_DATABASE_URL: 'postgresql://test.invalid/database' };

function request(body = {}, method = 'POST', address = `203.0.113.${ip++}`) {
  return { method, body, headers: { origin: 'https://modus.gallery', 'x-forwarded-for': address } };
}
function response() {
  return { statusCode: 200, headers: {}, body: undefined, ended: false,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { this.ended = true; return this; } };
}
function databaseMock({ fail = false } = {}) {
  const records = new Map();
  const sql = async (strings, ...values) => {
    if (fail) throw new Error('database unavailable');
    const query = strings.join('?');
    if (query.includes('INSERT INTO subscribers')) {
      const [email, source] = values;
      const key = `${source}:${email}`;
      if (records.has(key)) return [{ id: records.get(key).id, duplicate: true }];
      const row = { id: `00000000-0000-4000-8000-${String(records.size + 1).padStart(12, '0')}`, email, source };
      records.set(key, row);
      return [{ id: row.id, duplicate: false }];
    }
    if (query.includes('UPDATE subscribers')) return [];
    throw new Error('unexpected query');
  };
  return { sql, records };
}
function redisMock() {
  const counts = new Map();
  return { async incr(key) { const count = (counts.get(key) || 0) + 1; counts.set(key, count); return count; }, async expire() { return true; } };
}

test('rejects invalid email without touching storage', async () => {
  let calls = 0;
  const handler = createSubscribeHandler({ env: configured, getDatabase: () => { calls++; } });
  const res = response();
  await handler(request({ ...signup, email: 'not-an-email' }), res);
  assert.equal(res.statusCode, 400); assert.equal(res.body.code, 'invalid_email'); assert.equal(calls, 0);
});

test('returns explicit error when Postgres is not configured', async () => {
  const handler = createSubscribeHandler({ env: {}, getDatabase: () => assert.fail('database should not run') });
  const res = response(); await handler(request(signup), res);
  assert.equal(res.statusCode, 503); assert.equal(res.body.code, 'storage_not_configured'); assert.equal(res.body.success, false);
});

test('never reports success when Postgres persistence fails', async () => {
  const db = databaseMock({ fail: true });
  const handler = createSubscribeHandler({ env: configured, getDatabase: () => db.sql });
  const res = response(); await handler(request(signup), res);
  assert.equal(res.statusCode, 503); assert.equal(res.body.code, 'persistence_failed'); assert.equal(res.body.success, false);
});

test('normalizes and confirms a committed signup', async () => {
  const db = databaseMock();
  const handler = createSubscribeHandler({ env: configured, getDatabase: () => db.sql, now: () => new Date('2026-11-18T12:00:00Z') });
  const res = response(); await handler(request(signup), res);
  assert.equal(res.statusCode, 201); assert.equal(res.body.saved, true); assert.equal(res.body.duplicate, false);
  assert.equal([...db.records.values()][0].email, 'person@example.com');
});

test('database uniqueness handles duplicates and keeps sources separate', async () => {
  const db = databaseMock();
  const handler = createSubscribeHandler({ env: configured, getDatabase: () => db.sql });
  const first = response(), duplicate = response(), privateList = response();
  await handler(request(signup), first); await handler(request(signup), duplicate);
  await handler(request({ ...signup, source: 'modus_private_waitlist' }), privateList);
  assert.equal(first.statusCode, 201); assert.equal(duplicate.statusCode, 200); assert.equal(duplicate.body.duplicate, true);
  assert.equal(privateList.statusCode, 201); assert.equal(db.records.size, 2);
});

test('requires consent and rejects honeypot submissions', async () => {
  const db = databaseMock(); const handler = createSubscribeHandler({ env: configured, getDatabase: () => db.sql });
  const consent = response(), spam = response();
  await handler(request({ ...signup, consent: false }), consent); await handler(request({ ...signup, website: 'spam' }), spam);
  assert.equal(consent.body.code, 'consent_required'); assert.equal(spam.body.code, 'spam_detected'); assert.equal(db.records.size, 0);
});

test('handles OPTIONS before configuration checks', async () => {
  const res = response(); await createSubscribeHandler({ env: {} })(request({}, 'OPTIONS'), res);
  assert.equal(res.statusCode, 204); assert.equal(res.ended, true);
});

test('rate limits with Redis but persists when optional Redis is unavailable', async () => {
  const db = databaseMock(), redis = redisMock();
  const handler = createSubscribeHandler({ env: { ...configured, REDIS_URL: 'rediss://test.invalid' }, getDatabase: () => db.sql, getRedis: async () => redis });
  let res;
  for (let n = 0; n < 6; n++) { res = response(); await handler(request({ ...signup, email: `p${n}@example.com` }, 'POST', '203.0.113.240'), res); }
  assert.equal(res.statusCode, 429); assert.equal(res.body.code, 'rate_limited');
  const fallback = createSubscribeHandler({ env: { ...configured, REDIS_URL: 'rediss://test.invalid' }, getDatabase: () => db.sql, getRedis: async () => { throw new Error('down'); } });
  const fallbackRes = response(); await fallback(request({ ...signup, email: 'fallback@example.com' }), fallbackRes);
  assert.equal(fallbackRes.statusCode, 201);
});

test('escapes notification HTML and notification failure does not undo storage', async () => {
  const db = databaseMock(); let notification;
  const handler = createSubscribeHandler({ env: { ...configured, RESEND_API_KEY: 'test', NOTIFY_EMAIL: 'owner@example.com' }, getDatabase: () => db.sql,
    fetchImpl: async (_url, options) => { notification = JSON.parse(options.body); return { ok: false, status: 502 }; } });
  const res = response(); await handler(request({ ...signup, email: "o'connor@example.com" }), res);
  assert.equal(res.statusCode, 201); assert.match(notification.html, /o&#39;connor@example\.com/); assert.doesNotMatch(notification.html, /o'connor@example\.com/);
});

test('CRM failure is recorded without undoing persistence', async () => {
  const db = databaseMock();
  const handler = createSubscribeHandler({ env: { ...configured, CRM_WEBHOOK_URL: 'https://crm.invalid/hook' }, getDatabase: () => db.sql, fetchImpl: async () => ({ ok: false }) });
  const res = response(); await handler(request(signup), res);
  assert.equal(res.statusCode, 201); assert.equal(res.body.saved, true);
});
