import PlayerService from '../services/PlayerService.js';
import { CLASSES } from '../models/GameData.js';

function playerKeyFromReq(req) {
  return req.header('x-player-key') || req.body?.playerKey || req.query?.playerKey || null;
}

export default class PlayerController {
  static async bootstrap(req, res, next) {
    try {
      const profile = await PlayerService.bootstrap(
        req.body?.playerKey || null,
        req.body?.displayName || null
      );
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res, next) {
    try {
      const playerKey = playerKeyFromReq(req);
      if (!playerKey) {
        return res.status(401).json({ error: 'playerKey obrigatório' });
      }
      const profile = await PlayerService.getProfile(playerKey);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }

  static async endRun(req, res, next) {
    try {
      const playerKey = playerKeyFromReq(req);
      if (!playerKey) {
        return res.status(401).json({ error: 'playerKey obrigatório' });
      }
      const result = await PlayerService.endRun(playerKey, req.body || {});
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async buyUpgrade(req, res, next) {
    try {
      const playerKey = playerKeyFromReq(req);
      if (!playerKey) {
        return res.status(401).json({ error: 'playerKey obrigatório' });
      }
      const upgradeKey = req.body?.upgradeKey;
      if (!upgradeKey) {
        return res.status(400).json({ error: 'upgradeKey obrigatório' });
      }
      const result = await PlayerService.buyUpgrade(playerKey, upgradeKey);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async saveSettings(req, res, next) {
    try {
      const playerKey = playerKeyFromReq(req);
      if (!playerKey) {
        return res.status(401).json({ error: 'playerKey obrigatório' });
      }
      const settings = await PlayerService.saveSettings(playerKey, req.body?.settings || req.body);
      res.json({ settings });
    } catch (err) {
      next(err);
    }
  }

  static meta(_req, res) {
    res.json({ classes: CLASSES });
  }
}
