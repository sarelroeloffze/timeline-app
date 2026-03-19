/**
 * licenseValidator.js  —  Ed25519 license verification
 * =====================================================
 * Works in: modern browsers, Electron renderer, Node.js 18+
 *
 * QUICK INTEGRATION (plain HTML app):
 *   <script type="module">
 *     import { validateLicense } from './licenseValidator.js';
 *     const result = await validateLicense(storedKey);
 *     if (!result.valid) showLockScreen(result);
 *     else if (result.type === 'trial') showTrialBanner(result);
 *   </script>
 *
 * QUICK INTEGRATION (Vite / React):
 *   import { validateLicense } from './licenseValidator';
 *
 * QUICK INTEGRATION (Node.js 18+, ESM):
 *   import { validateLicense } from './licenseValidator.js';
 *
 * LICENSE KEY FORMAT:
 *   BASE64URL_PAYLOAD.BASE64URL_SIGNATURE
 *   Payload = base64url(JSON.stringify({ email, app, type, issued, expires }))
 *   Signature = Ed25519 signature over the payload string bytes
 *
 * SETUP:
 *   1. Open keyGenerator.html in a browser → click "Generate New Key Pair"
 *   2. Paste the public key into PUBLIC_KEY_B64URL below
 *   3. Store the private key in a password manager / secure vault
 *   4. Use keyGenerator.html to issue license keys to users
 */

// ─── Configuration — edit these three constants ────────────────────────────────

/** Ed25519 public key — base64url, 32 raw bytes. Get it from keyGenerator.html. */
const PUBLIC_KEY_B64URL = 'REPLACE_WITH_YOUR_PUBLIC_KEY';

/** Remote revocation endpoint. POST { key } → { valid, reason }.
 *  Leave ONLINE_CHECK_ENABLED = false until you have a live endpoint. */
const VALIDATION_URL       = 'https://your-server.com/api/validate';
const ONLINE_CHECK_ENABLED = false;

// ──────────────────────────────────────────────────────────────────────────────

// atob/btoa polyfill for older Node.js (< 16)
const _atob = typeof atob === 'function'
  ? atob
  : (s) => Buffer.from(s, 'base64').toString('binary');
const _btoa = typeof btoa === 'function'
  ? btoa
  : (s) => Buffer.from(s, 'binary').toString('base64');

function b64urlToBytes(s) {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/')
                + '='.repeat((4 - (s.length % 4)) % 4);
  return Uint8Array.from(_atob(padded), (c) => c.charCodeAt(0));
}

async function _getCrypto() {
  if (typeof globalThis.crypto?.subtle !== 'undefined') return globalThis.crypto;
  // Node.js 18+ without --experimental-global-webcrypto flag
  try {
    const mod = await import('node:crypto');
    return mod.webcrypto ?? mod.default?.webcrypto;
  } catch {
    throw new Error('WebCrypto not available. Node.js 18+ required for server-side use.');
  }
}

async function _verifySignature(payloadStr, sigB64url) {
  const crypto = await _getCrypto();
  const pubKeyBytes = b64urlToBytes(PUBLIC_KEY_B64URL);

  const publicKey = await crypto.subtle.importKey(
    'raw',
    pubKeyBytes,
    { name: 'Ed25519' },
    false,
    ['verify'],
  );

  return crypto.subtle.verify(
    { name: 'Ed25519' },
    publicKey,
    b64urlToBytes(sigB64url),
    new TextEncoder().encode(payloadStr),
  );
}

/** Best-effort remote revocation check. Never throws — returns { checked: false } if offline. */
async function _remoteCheck(licenseKey) {
  if (!ONLINE_CHECK_ENABLED
    || !VALIDATION_URL
    || VALIDATION_URL.includes('your-server')) {
    return { checked: false };
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(VALIDATION_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ key: licenseKey }),
      signal:  controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { checked: false };
    const data = await res.json();
    return { checked: true, valid: !!data.valid, reason: data.reason ?? '' };
  } catch {
    return { checked: false }; // offline — fall back to local signature + date check
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} LicenseResult
 * @property {boolean}            valid          — true if authentic, not expired, not revoked
 * @property {'trial'|'full'|null} type
 * @property {string|null}        email
 * @property {string|null}        app
 * @property {string|null}        issued         — YYYY-MM-DD
 * @property {string|null}        expires        — YYYY-MM-DD, or null = never expires
 * @property {number|null}        daysRemaining  — negative when expired
 * @property {boolean}            expired
 * @property {string}             reason         — human-readable status message
 */

/**
 * Validate a license key string.
 *
 * @param {string} licenseKey
 * @returns {Promise<LicenseResult>}
 */
export async function validateLicense(licenseKey) {
  const fail = (reason) => ({
    valid: false, type: null, email: null, app: null,
    issued: null, expires: null, daysRemaining: null, expired: false, reason,
  });

  if (!licenseKey || typeof licenseKey !== 'string') {
    return fail('No license key provided.');
  }

  // Strip accidental whitespace or line breaks the user may have copy-pasted
  const key    = licenseKey.trim().replace(/\s+/g, '');
  const dotIdx = key.lastIndexOf('.');
  if (dotIdx < 1 || dotIdx === key.length - 1) {
    return fail('Malformed license key — expected PAYLOAD.SIGNATURE.');
  }

  const payloadB64 = key.slice(0, dotIdx);
  const sigB64     = key.slice(dotIdx + 1);

  // 1. Cryptographic signature check
  let sigOk = false;
  try {
    sigOk = await _verifySignature(payloadB64, sigB64);
  } catch (err) {
    return fail('Signature verification error: ' + err.message);
  }
  if (!sigOk) return fail('Invalid license key — signature does not match.');

  // 2. Decode payload
  let payload;
  try {
    const json = new TextDecoder().decode(b64urlToBytes(payloadB64));
    payload = JSON.parse(json);
  } catch {
    return fail('Corrupt license payload — could not decode.');
  }

  // 3. Expiry check
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let daysRemaining = null;
  let expired = false;
  if (payload.expires) {
    const expiryDate = new Date(payload.expires + 'T00:00:00');
    daysRemaining = Math.round((expiryDate - today) / 86_400_000);
    expired = daysRemaining < 0;
  }

  // 4. Remote revocation check (best-effort — never blocks if offline)
  if (!expired) {
    const remote = await _remoteCheck(key);
    if (remote.checked && !remote.valid) {
      return fail(remote.reason || 'License has been revoked.');
    }
  }

  const absD = Math.abs(daysRemaining ?? 0);
  return {
    valid: !expired,
    type:  payload.type   ?? null,
    email: payload.email  ?? null,
    app:   payload.app    ?? null,
    issued:  payload.issued  ?? null,
    expires: payload.expires ?? null,
    daysRemaining,
    expired,
    reason: expired
      ? `License expired ${absD} day${absD !== 1 ? 's' : ''} ago.`
      : daysRemaining !== null
        ? `Valid — ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining.`
        : 'Valid — no expiry.',
  };
}

// CJS interop — allows require('./licenseValidator.js') in CommonJS contexts
// when the file is transpiled or bundled. Pure ESM environments use the export above.
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { validateLicense };
}
