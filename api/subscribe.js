/**
 * MODUS / api/subscribe.js
 * Vercel Serverless Function — Email Collection
 * Stores to Vercel KV + forwards to DanielArmonStanford@gmail.com
 *
 * Deploy: place this file at /api/subscribe.js in your GitHub repo
 * Vercel detects it automatically as a serverless function
 *
 * Environment variables to set in Vercel dashboard:
 *   NOTIFY_EMAIL = DanielArmonStanford@gmail.com
 *   RESEND_API_KEY = (get free key at resend.com — 3,000 emails/month free)
 */

export default async function handler(req, res) {
  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS — allow modus.gallery
  res.setHeader('Access-Control-Allow-Origin', 'https://modus.gallery');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { email, source = 'join', tier = 'reader' } = req.body;

    // Basic validation
    if (!email || !email.includes('@') || email.length > 254) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const ts = new Date().toISOString();
    const entry = { email, source, tier, ts };

    // ── 1. STORE IN VERCEL KV ──────────────────────────────────────────
    // Set up: vercel.com → your project → Storage → Create KV Database
    // Then: vercel env pull to get KV_REST_API_URL and KV_REST_API_TOKEN
    if (process.env.KV_REST_API_URL) {
      const { kv } = await import('@vercel/kv');
      // Store individual entry
      await kv.set(`subscriber:${email}`, entry);
      // Add to sorted set for easy listing (score = timestamp)
      await kv.zadd('subscribers', { score: Date.now(), member: email });
    }

    // ── 2. SEND NOTIFICATION EMAIL via Resend ─────────────────────────
    // Free tier: resend.com — 3,000 emails/month, no credit card
    // Get API key at: resend.com/api-keys
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'MODUS <noreply@modus.gallery>',
          to: [process.env.NOTIFY_EMAIL || 'DanielArmonStanford@gmail.com'],
          subject: `MODUS / New subscriber — ${email}`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 2rem; background: #0A0C14; color: #EAE4D8;">
              <div style="font-family: monospace; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #D4A84B; margin-bottom: 1rem;">
                MODUS / The List
              </div>
              <h1 style="font-size: 24px; font-weight: 300; letter-spacing: -0.02em; margin: 0 0 1rem;">
                New subscriber
              </h1>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B7B60; padding: 0.5rem 0; border-bottom: 0.5px solid rgba(234,228,216,0.1);">Email</td>
                  <td style="padding: 0.5rem 0; border-bottom: 0.5px solid rgba(234,228,216,0.1); color: #D4A84B;">${email}</td>
                </tr>
                <tr>
                  <td style="font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B7B60; padding: 0.5rem 0; border-bottom: 0.5px solid rgba(234,228,216,0.1);">Source</td>
                  <td style="padding: 0.5rem 0; border-bottom: 0.5px solid rgba(234,228,216,0.1);">${source}</td>
                </tr>
                <tr>
                  <td style="font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B7B60; padding: 0.5rem 0; border-bottom: 0.5px solid rgba(234,228,216,0.1);">Tier</td>
                  <td style="padding: 0.5rem 0; border-bottom: 0.5px solid rgba(234,228,216,0.1);">${tier}</td>
                </tr>
                <tr>
                  <td style="font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B7B60; padding: 0.5rem 0;">Time</td>
                  <td style="padding: 0.5rem 0;">${ts}</td>
                </tr>
              </table>
              <div style="margin-top: 2rem; font-family: monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(234,228,216,0.3);">
                MODUS · Stanford Emporium Inc. · modus.gallery
              </div>
            </div>
          `
        })
      });
    }

    // ── 3. SEND WELCOME EMAIL to subscriber ──────────────────────────
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Daniel Stanford / MODUS <daniel@modus.gallery>',
          to: [email],
          subject: 'You are on the MODUS list.',
          html: `
            <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 3rem 2rem; background: #07080E; color: #EAE0CC;">
              <div style="font-family: monospace; font-size: 10px; letter-spacing: 0.32em; text-transform: uppercase; color: #D4A84B; margin-bottom: 2rem;">
                MODUS / The List
              </div>
              <h1 style="font-size: clamp(28px, 5vw, 42px); font-weight: 300; letter-spacing: -0.03em; line-height: 1.1; margin: 0 0 1.5rem;">
                You are on<br>the list.
              </h1>
              <p style="font-size: 17px; font-style: italic; font-weight: 300; color: rgba(234,224,204,0.6); line-height: 1.65; margin: 0 0 2rem;">
                MODUS is read by the people who understand why these things matter.
              </p>
              <p style="font-size: 16px; font-weight: 300; color: rgba(234,224,204,0.75); line-height: 1.7; margin: 0 0 2rem;">
                You will hear from us when there is something worth saying. Not before.
              </p>
              <div style="border-top: 0.5px solid rgba(212,168,75,0.22); padding-top: 1.5rem; margin-top: 1.5rem;">
                <p style="font-size: 14px; font-weight: 300; color: rgba(234,224,204,0.45); line-height: 1.65; margin: 0 0 1.5rem;">
                  In the meantime — the publication is live at modus.gallery. Five departments. The MODUS Index. Fine art, bodywork, Porsche, Sri Lanka.
                </p>
                <a href="https://modus.gallery" style="display: inline-block; font-family: monospace; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #D4A84B; text-decoration: none; border: 0.5px solid rgba(212,168,75,0.35); padding: 10px 20px;">
                  Read MODUS →
                </a>
              </div>
              <div style="margin-top: 3rem; font-family: monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(234,224,204,0.2); line-height: 1.8;">
                Daniel Stanford · Editor-in-Chief<br>
                MODUS · Stanford Emporium Inc. · Montreal<br>
                modus.gallery
              </div>
            </div>
          `
        })
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Subscribed successfully'
    });

  } catch (err) {
    console.error('Subscribe error:', err);
    return res.status(500).json({ error: 'Subscription failed. Please try again.' });
  }
}
