import { query } from '../db.js';

const DEFAULT_SETTINGS = {
  sound: true,
  music: true,
  language: 'pt-BR',
};

export default class StatsFinder {
  static async getOrCreate(playerId) {
    const rows = await query(
      `SELECT player_id, runs, deaths, kills, gold_earned_total, play_time_seconds
       FROM player_stats
       WHERE player_id = :playerId
       LIMIT 1`,
      { playerId }
    );
    if (rows[0]) return rows[0];

    await query(
      `INSERT INTO player_stats (player_id) VALUES (:playerId)`,
      { playerId }
    );
    return this.getOrCreate(playerId);
  }

  static async incrementRunEnd(playerId, { kills = 0, goldEarned = 0, playTimeSeconds = 0 } = {}) {
    await this.getOrCreate(playerId);
    await query(
      `UPDATE player_stats
       SET runs = runs + 1,
           deaths = deaths + 1,
           kills = kills + :kills,
           gold_earned_total = gold_earned_total + :goldEarned,
           play_time_seconds = play_time_seconds + :playTimeSeconds
       WHERE player_id = :playerId`,
      {
        playerId,
        kills: Math.max(0, Math.floor(Number(kills)) || 0),
        goldEarned: Math.max(0, Math.floor(Number(goldEarned)) || 0),
        playTimeSeconds: Math.max(0, Math.floor(Number(playTimeSeconds)) || 0),
      }
    );
    return this.getOrCreate(playerId);
  }
}
