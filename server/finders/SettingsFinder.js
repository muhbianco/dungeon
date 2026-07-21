import { query } from '../db.js';

const DEFAULT_SETTINGS = {
  sound: true,
  music: true,
  language: 'pt-BR',
  autoDescend: false,
};

export default class SettingsFinder {
  static defaults() {
    return { ...DEFAULT_SETTINGS };
  }

  static async getOrCreate(playerId) {
    const rows = await query(
      `SELECT settings_json
       FROM player_settings
       WHERE player_id = :playerId
       LIMIT 1`,
      { playerId }
    );
    if (rows[0]) {
      const raw = rows[0].settings_json;
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    }

    const settings = this.defaults();
    await query(
      `INSERT INTO player_settings (player_id, settings_json)
       VALUES (:playerId, :settingsJson)`,
      { playerId, settingsJson: JSON.stringify(settings) }
    );
    return settings;
  }

  static async save(playerId, settings) {
    const current = await this.getOrCreate(playerId);
    const merged = { ...this.defaults(), ...current, ...(settings || {}) };
    await query(
      `INSERT INTO player_settings (player_id, settings_json)
       VALUES (:playerId, :settingsJson)
       ON DUPLICATE KEY UPDATE settings_json = VALUES(settings_json)`,
      { playerId, settingsJson: JSON.stringify(merged) }
    );
    return merged;
  }
}
