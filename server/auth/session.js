import crypto from 'node:crypto';
import config from '../config.js';

const SECRET = config.session.secret;
const IS_PROD = config.nodeEnv === 'production';

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

export function sign(payload, ttlMs = config.session.ttlMs) {
  if (!SECRET) throw new Error('SESSION_SECRET ausente.');
  const now = Date.now();
  const body = { ...payload, iat: now, exp: now + ttlMs };
  const data = b64url(JSON.stringify(body));
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verify(token) {
  if (!token || typeof token !== 'string' || !SECRET) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let body;
  try {
    body = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!body || typeof body.exp !== 'number' || Date.now() > body.exp) return null;
  return body;
}

export function parseCookies(header) {
  const out = {};
  if (typeof header !== 'string') return out;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const key = part.slice(0, eq).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      out[key] = part.slice(eq + 1).trim();
    }
  }
  return out;
}

function serialize(name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path || '/'}`);
  if (opts.maxAge != null) parts.push(`Max-Age=${Math.floor(opts.maxAge / 1000)}`);
  if (opts.httpOnly !== false) parts.push('HttpOnly');
  parts.push(`SameSite=${opts.sameSite || 'Lax'}`);
  if (opts.secure) parts.push('Secure');
  return parts.join('; ');
}

function appendCookie(res, cookieStr) {
  const prev = res.getHeader('Set-Cookie');
  if (!prev) res.setHeader('Set-Cookie', cookieStr);
  else if (Array.isArray(prev)) res.setHeader('Set-Cookie', [...prev, cookieStr]);
  else res.setHeader('Set-Cookie', [prev, cookieStr]);
}

export function setSession(res, payload) {
  const token = sign(payload);
  appendCookie(res, serialize(config.session.cookieName, token, {
    maxAge: config.session.ttlMs,
    httpOnly: true,
    sameSite: 'Lax',
    secure: IS_PROD,
  }));
  return token;
}

export function clearSession(res) {
  appendCookie(res, serialize(config.session.cookieName, '', {
    maxAge: 0,
    httpOnly: true,
    sameSite: 'Lax',
    secure: IS_PROD,
  }));
}

export function setStateCookie(res, value) {
  appendCookie(res, serialize(config.session.stateCookie, value, {
    maxAge: 10 * 60 * 1000,
    httpOnly: true,
    sameSite: 'Lax',
    secure: IS_PROD,
  }));
}

export function clearStateCookie(res) {
  appendCookie(res, serialize(config.session.stateCookie, '', {
    maxAge: 0,
    httpOnly: true,
    sameSite: 'Lax',
    secure: IS_PROD,
  }));
}

export function readSession(req) {
  const cookies = parseCookies(req.headers?.cookie);
  return verify(cookies[config.session.cookieName]);
}

export function readStateCookie(req) {
  const cookies = parseCookies(req.headers?.cookie);
  return cookies[config.session.stateCookie] || null;
}
