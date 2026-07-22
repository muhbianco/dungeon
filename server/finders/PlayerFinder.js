import { query } from '../db.js';

const PLAYER_COLS = `id, player_key, discord_id, google_id, display_name, global_name, avatar,
  essences, gold, max_floor_record, last_login, created_at, updated_at`;

export default class PlayerFinder {
  static async findByKey(playerKey) {
    const rows = await query(
      `SELECT ${PLAYER_COLS} FROM players WHERE player_key = :playerKey LIMIT 1`,
      { playerKey }
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const rows = await query(
      `SELECT ${PLAYER_COLS} FROM players WHERE id = :id LIMIT 1`,
      { id }
    );
    return rows[0] || null;
  }

  static async findByDiscordId(discordId) {
    const rows = await query(
      `SELECT ${PLAYER_COLS} FROM players WHERE discord_id = :discordId LIMIT 1`,
      { discordId }
    );
    return rows[0] || null;
  }

  static async findByGoogleId(googleId) {
    const rows = await query(
      `SELECT ${PLAYER_COLS} FROM players WHERE google_id = :googleId LIMIT 1`,
      { googleId }
    );
    return rows[0] || null;
  }

  static async create({
    playerKey,
    discordId = null,
    googleId = null,
    displayName = null,
    globalName = null,
    avatar = null,
  }) {
    const result = await query(
      `INSERT INTO players (player_key, discord_id, google_id, display_name, global_name, avatar, last_login)
       VALUES (:playerKey, :discordId, :googleId, :displayName, :globalName, :avatar, NOW())`,
      { playerKey, discordId, googleId, displayName, globalName, avatar }
    );
    return this.findById(result.insertId);
  }

  static async upsertDiscord({
    playerKey,
    discordId,
    displayName,
    globalName,
    avatar,
  }) {
    const existing = await this.findByDiscordId(discordId);
    if (existing) {
      await query(
        `UPDATE players
         SET display_name = :displayName,
             global_name = :globalName,
             avatar = :avatar,
             last_login = NOW()
         WHERE id = :id`,
        { id: existing.id, displayName, globalName, avatar }
      );
      return this.findById(existing.id);
    }
    return this.create({
      playerKey,
      discordId,
      displayName,
      globalName,
      avatar,
    });
  }

  static async upsertGoogle({
    playerKey,
    googleId,
    displayName,
    globalName,
    avatar,
  }) {
    const existing = await this.findByGoogleId(googleId);
    if (existing) {
      await query(
        `UPDATE players
         SET display_name = :displayName,
             global_name = :globalName,
             avatar = :avatar,
             last_login = NOW()
         WHERE id = :id`,
        { id: existing.id, displayName, globalName, avatar }
      );
      return this.findById(existing.id);
    }
    return this.create({
      playerKey,
      googleId,
      displayName,
      globalName,
      avatar,
    });
  }

  static async updateProgress(playerId, { essences, maxFloorRecord, gold }) {
    await query(
      `UPDATE players
       SET essences = :essences,
           max_floor_record = :maxFloorRecord,
           gold = :gold
       WHERE id = :playerId`,
      { playerId, essences, maxFloorRecord, gold }
    );
    return this.findById(playerId);
  }

  static async addGold(playerId, amount) {
    await query(
      `UPDATE players SET gold = gold + :amount WHERE id = :playerId`,
      { playerId, amount: Math.max(0, Math.floor(amount) || 0) }
    );
    return this.findById(playerId);
  }

  static async spendGold(playerId, amount) {
    const result = await query(
      `UPDATE players
       SET gold = gold - :amount
       WHERE id = :playerId AND gold >= :amount`,
      { playerId, amount: Math.max(0, Math.floor(amount) || 0) }
    );
    if (!result.affectedRows) {
      const err = new Error('Ouro insuficiente');
      err.status = 400;
      throw err;
    }
    return this.findById(playerId);
  }

  static async listRanking(limit = 50) {
    const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit) || 50)));
    return query(
      `SELECT p.id,
              p.display_name,
              p.global_name,
              p.avatar,
              p.discord_id,
              p.google_id,
              p.max_floor_record,
              COALESCE(s.runs, 0) AS runs
       FROM players p
       LEFT JOIN player_stats s ON s.player_id = p.id
       WHERE p.max_floor_record > 0
       ORDER BY p.max_floor_record DESC, s.runs DESC, p.id ASC
       LIMIT ${safeLimit}`
    );
  }
}
