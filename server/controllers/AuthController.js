import crypto from 'node:crypto';
import config from '../config.js';
import DiscordAuthService from '../auth/DiscordAuthService.js';
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
    res.json({
      configured: discordAuth.isConfigured(),
      authenticated: Boolean(session?.playerId),
      redirectUri: config.discord.redirectUri,
    });
  }

  static login(req, res) {
    if (!discordAuth.isConfigured()) {
      return res.redirect('/?auth=disabled');
    }
    const state = crypto.randomBytes(16).toString('hex');
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
      console.error('[auth] callback failed:', err.message);
      return res.redirect('/?auth=failed');
    }
  }

  static logout(_req, res) {
    clearSession(res);
    res.json({ ok: true });
  }
}
