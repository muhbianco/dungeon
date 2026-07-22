import config from '../config.js';

const DEFAULT_TIMEOUT = 8000;

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export default class GoogleAuthService {
  constructor() {
    this.cfg = config.google;
    this.enabled = Boolean(this.cfg.clientId && this.cfg.clientSecret);
  }

  isConfigured() {
    return this.enabled && Boolean(config.session.secret);
  }

  buildAuthUrl(state) {
    const params = new URLSearchParams({
      client_id: this.cfg.clientId,
      redirect_uri: this.cfg.redirectUri,
      response_type: 'code',
      scope: this.cfg.scope,
      state,
      access_type: 'online',
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCode(code) {
    const body = new URLSearchParams({
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.cfg.redirectUri,
    });
    const res = await fetchWithTimeout('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Google token falhou (${res.status}): ${detail.slice(0, 200)}`);
    }
    return res.json();
  }

  async fetchUser(accessToken) {
    const res = await fetchWithTimeout('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Google /userinfo falhou (${res.status}).`);
    return res.json();
  }
}
