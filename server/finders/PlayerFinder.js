import { query } from '../db.js';

export default class PlayerFinder {
  static async findByKey(playerKey) {
    const rows = await query(
      `SELECT id, player_key, display_name, essences, max_floor_record, created_at, updated_at
       FROM players
       WHERE player_key = :playerKey
       LIMIT 1`,
      { playerKey }
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const rows = await query(
      `SELECT id, player_key, display_name, essences, max_floor_record, created_at, updated_at
       FROM players
       WHERE id = :id
       LIMIT 1`,
      { id }
    );
    return rows[0] || null;
  }

  static async create({ playerKey, displayName = null }) {
    const result = await query(
      `INSERT INTO players (player_key, display_name)
       VALUES (:playerKey, :displayName)`,
      { playerKey, displayName }
    );
    return this.findById(result.insertId);
  }

  static async updateProgress(playerId, { essences, maxFloorRecord }) {
    await query(
      `UPDATE players
       SET essences = :essences,
           max_floor_record = :maxFloorRecord
       WHERE id = :playerId`,
      { playerId, essences, maxFloorRecord }
    );
    return this.findById(playerId);
  }

  static async setDisplayName(playerId, displayName) {
    await query(
      `UPDATE players SET display_name = :displayName WHERE id = :playerId`,
      { playerId, displayName }
    );
    return this.findById(playerId);
  }
}
