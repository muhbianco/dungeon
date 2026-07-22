import crypto from 'node:crypto';
import config from '../config.js';
import DiscordAuthService from '../auth/DiscordAuthService.js';
import GoogleAuthService from '../auth/GoogleAuthService.js';
import {
  setSession,
  clearSession,
  setStateCookie,
  clearStateCookie,
  readSession,
  readStateCookie,
} from '../auth/session.js';
import PlayerService from '../services/PlayerService.js';

const discordAuth = new DiscordAuthService();
const googleAuth = new GoogleAuthService();

export function requireAuth(req, res, next) {
  const session = readSession(req);
  if (!session?.playerId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  req.session = session;
  req.playerId = session.playerId;
  return next();
}

export default class AuthController {
  static status(req, res) {
    const session = readSession(req);
    const discordConfigured = discordAuth.isConfigured();
    const googleConfigured = googleAuth.isConfigured();
    res.json({
      configured: discordConfigured || googleConfigured,
      discordConfigured,
      googleConfigured,
      authenticated: Boolean(session?.playerId),
      redirectUri: config.discord.redirectUri,
      googleRedirectUri: config.google.redirectUri,
    });
  }

  static login(req, res) {
    if (!discordAuth.isConfigured()) {
      return res.redirect('/?auth=disabled');
    }
    const state = `d.${crypto.randomBytes(16).toString('hex')}`;
    setStateCookie(res, state);
    return res.redirect(discordAuth.buildAuthUrl(state));
  }

  static async callback(req, res) {
    try {
      if (!discordAuth.isConfigured()) {
        return res.redirect('/?auth=disabled');
      }

      const { code, state, error } = req.query;
      if (error) return res.redirect(`/?auth=${encodeURIComponent(String(error))}`);
      if (!code || !state) return res.redirect('/?auth=missing_code');

      const expected = readStateCookie(req);
      clearStateCookie(res);
      if (!expected || expected !== state) {
        return res.redirect('/?auth=state_mismatch');
      }

      const token = await discordAuth.exchangeCode(String(code));
      const accessToken = token.access_token;
      if (!accessToken) return res.redirect('/?auth=token_failed');

      const member = await discordAuth.isGuildMember(accessToken);
      if (!member) return res.redirect('/?auth=not_in_guild');

      const user = await discordAuth.fetchUser(accessToken);
      const player = await PlayerService.loginFromDiscord(user, user.avatar || null);

      setSession(res, {
        playerId: player.id,
        discordId: player.discord_id,
        displayName: player.display_name,
      });

      return res.redirect('/');
    } catch (err) {
      console.error('[auth] discord callback failed:', err.message);
      return res.redirect('/?auth=failed');
    }
  }

  static googleLogin(req, res) {
    if (!googleAuth.isConfigured()) {
      return res.redirect('/?auth=google_disabled');
    }
    const state = `g.${crypto.randomBytes(16).toString('hex')}`;
    setStateCookie(res, state);
    return res.redirect(googleAuth.buildAuthUrl(state));
  }

  static async googleCallback(req, res) {
    try {
      if (!googleAuth.isConfigured()) {
        return res.redirect('/?auth=google_disabled');
      }

      const { code, state, error } = req.query;
      if (error) return res.redirect(`/?auth=${encodeURIComponent(String(error))}`);
      if (!code || !state) return res.redirect('/?auth=missing_code');

      const expected = readStateCookie(req);
      clearStateCookie(res);
      if (!expected || expected !== state || !String(state).startsWith('g.')) {
        return res.redirect('/?auth=state_mismatch');
      }

      const token = await googleAuth.exchangeCode(String(code));
      const accessToken = token.access_token;
      if (!accessToken) return res.redirect('/?auth=token_failed');

      const user = await googleAuth.fetchUser(accessToken);
      if (!user?.sub) return res.redirect('/?auth=failed');

      const player = await PlayerService.loginFromGoogle(user);

      setSession(res, {
        playerId: player.id,
        googleId: player.google_id,
        displayName: player.display_name,
      });

      return res.redirect('/');
    } catch (err) {
      console.error('[auth] google callback failed:', err.message);
      return res.redirect('/?auth=failed');
    }
  }

  static logout(_req, res) {
    clearSession(res);
    res.json({ ok: true });
  }
}
