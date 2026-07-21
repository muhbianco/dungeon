import { query } from '../db.js';
import { CLASSES, attrsForLevel } from '../models/GameData.js';

const COLS = `id, player_id, class_id, level, xp,
  str_stat, con_stat, agi_stat, dex_stat, int_stat,
  created_at, updated_at`;

export default class CharacterFinder {
  static async listByPlayer(playerId) {
    return query(
      `SELECT ${COLS} FROM characters WHERE player_id = :playerId ORDER BY class_id ASC`,
      { playerId }
    );
  }

  static async findByPlayerClass(playerId, classId) {
    const rows = await query(
      `SELECT ${COLS}
       FROM characters
       WHERE player_id = :playerId AND class_id = :classId
       LIMIT 1`,
      { playerId, classId }
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const rows = await query(
      `SELECT ${COLS} FROM characters WHERE id = :id LIMIT 1`,
      { id }
    );
    return rows[0] || null;
  }

  static async getOrCreate(playerId, classId) {
    if (!CLASSES[classId]) {
      const err = new Error('Classe inválida');
      err.status = 400;
      throw err;
    }
    let row = await this.findByPlayerClass(playerId, classId);
    if (row) return row;

    const attrs = attrsForLevel(classId, 1);
    const result = await query(
      `INSERT INTO characters
         (player_id, class_id, level, xp, str_stat, con_stat, agi_stat, dex_stat, int_stat)
       VALUES
         (:playerId, :classId, 1, 0, :str, :con, :agi, :dex, :intStat)`,
      {
        playerId,
        classId,
        str: attrs.str,
        con: attrs.con,
        agi: attrs.agi,
        dex: attrs.dex,
        intStat: attrs.int,
      }
    );
    return this.findById(result.insertId);
  }

  static async saveProgress(characterId, { level, xp, attrs }) {
    await query(
      `UPDATE characters
       SET level = :level,
           xp = :xp,
           str_stat = :str,
           con_stat = :con,
           agi_stat = :agi,
           dex_stat = :dex,
           int_stat = :intStat
       WHERE id = :characterId`,
      {
        characterId,
        level,
        xp,
        str: attrs.str,
        con: attrs.con,
        agi: attrs.agi,
        dex: attrs.dex,
        intStat: attrs.int,
      }
    );
    return this.findById(characterId);
  }
}
