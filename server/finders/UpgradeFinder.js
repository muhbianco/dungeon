import { query } from '../db.js';

export default class UpgradeFinder {
  static async listByPlayer(playerId) {
    return query(
      `SELECT upgrade_key, level
       FROM permanent_upgrades
       WHERE player_id = :playerId
       ORDER BY upgrade_key ASC`,
      { playerId }
    );
  }

  static async getLevel(playerId, upgradeKey) {
    const rows = await query(
      `SELECT level
       FROM permanent_upgrades
       WHERE player_id = :playerId AND upgrade_key = :upgradeKey
       LIMIT 1`,
      { playerId, upgradeKey }
    );
    return rows[0]?.level ?? 0;
  }

  static async upsertLevel(playerId, upgradeKey, level) {
    await query(
      `INSERT INTO permanent_upgrades (player_id, upgrade_key, level)
       VALUES (:playerId, :upgradeKey, :level)
       ON DUPLICATE KEY UPDATE level = VALUES(level)`,
      { playerId, upgradeKey, level }
    );
    return this.getLevel(playerId, upgradeKey);
  }
}
