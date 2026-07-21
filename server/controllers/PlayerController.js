import PlayerService from '../services/PlayerService.js';
import { CLASSES } from '../models/GameData.js';

export default class PlayerController {
  static async me(req, res, next) {
    try {
      const profile = await PlayerService.getProfileById(req.playerId);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }

  static async ensureCharacter(req, res, next) {
    try {
      const classId = req.body?.classId || req.params.classId;
      const character = await PlayerService.ensureCharacter(req.playerId, classId);
      res.json({ character });
    } catch (err) {
      next(err);
    }
  }

  static async endRun(req, res, next) {
    try {
      const result = await PlayerService.endRun(req.playerId, req.body || {});
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async buyUpgrade(req, res, next) {
    try {
      const upgradeKey = req.body?.upgradeKey;
      if (!upgradeKey) return res.status(400).json({ error: 'upgradeKey obrigatório' });
      const result = await PlayerService.buyUpgrade(req.playerId, upgradeKey);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async buyEquipment(req, res, next) {
    try {
      const { classId, slot } = req.body || {};
      if (!classId || !slot) {
        return res.status(400).json({ error: 'classId e slot obrigatórios' });
      }
      const result = await PlayerService.buyOrUpgradeEquip(req.playerId, classId, slot);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async saveSettings(req, res, next) {
    try {
      const settings = await PlayerService.saveSettings(
        req.playerId,
        req.body?.settings || req.body
      );
      res.json({ settings });
    } catch (err) {
      next(err);
    }
  }

  static meta(_req, res) {
    res.json({ classes: CLASSES });
  }
}
