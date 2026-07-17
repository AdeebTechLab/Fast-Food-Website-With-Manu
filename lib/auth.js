// Lightweight session/auth helpers shared by the /api routes.
// Uses only Node's built-in `crypto` module (no external JWT library needed)
// so the admin panel has zero extra dependencies beyond @vercel/blob.

const crypto = require('crypto');

const SESSION_COOKIE = 'hns_admin_session';
const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12 hours

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(input) {
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  while (input.length % 4) input += '=';
  return Buffer.from(input, 'base64').toString('utf8');
}

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'SESSION_SECRET environment variable is not set. Add it in your Vercel project settings.'
    );
  }
  return secret;
}

// Signs a small JSON payload into `<payload>.<hmac>` token.
function sign(payloadObj) {
  const secret = getSecret();
  const payload = base64url(JSON.stringify(payloadObj));
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${hmac}`;
}

// Verifies a token and returns the decoded payload, or null if invalid/expired.
function verify(token) {
  let secret;
  try {
    secret = getSecret();
  } catch {
    return null;
  }
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, hmac] = parts;

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const a = Buffer.from(hmac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(base64urlDecode(payload));
    if (!data.exp || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

function createSessionCookie(username) {
  const token = sign({ u: username, exp: Date.now() + SESSION_TTL_SECONDS * 1000 });
  const secureFlag = process.env.VERCEL ? ' Secure;' : ''; // allow http on localhost dev
  return `${SESSION_COOKIE}=${token}; HttpOnly;${secureFlag} SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}`;
}

function clearSessionCookie() {
  const secureFlag = process.env.VERCEL ? ' Secure;' : '';
  return `${SESSION_COOKIE}=; HttpOnly;${secureFlag} SameSite=Lax; Path=/; Max-Age=0`;
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  });
  return out;
}

function getSessionFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  return verify(token);
}

// Constant-time string comparison to avoid leaking credential length/content via timing.
function safeCompare(a, b) {
  const bufA = Buffer.from(String(a ?? ''));
  const bufB = Buffer.from(String(b ?? ''));
  if (bufA.length !== bufB.length) {
    // Still do a comparison of equal-length buffers so the operation takes
    // roughly constant time regardless of whether lengths matched.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// Reads and JSON-parses a request body regardless of whether the platform
// already parsed it into an object for us.
async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch {
      return {};
    }
  }
  // Fall back to manually reading the stream (covers edge runtimes / configs
  // where automatic body parsing didn't happen).
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

module.exports = {
  SESSION_COOKIE,
  createSessionCookie,
  clearSessionCookie,
  getSessionFromRequest,
  safeCompare,
  readJsonBody,
};
