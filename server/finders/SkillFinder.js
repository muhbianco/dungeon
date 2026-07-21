import { query } from '../db.js';
import { getClassSkills } from '../models/GameData.js';

export default class SkillFinder {
  static async listByCharacter(characterId) {
    return query(
      `SELECT skill_key, skill_level
       FROM character_skills
       WHERE character_id = :characterId`,
      { characterId }
    );
  }

  static async getLevel(characterId, skillKey) {
    const rows = await query(
      `SELECT skill_level
       FROM character_skills
       WHERE character_id = :characterId AND skill_key = :skillKey
       LIMIT 1`,
      { characterId, skillKey }
    );
    return rows[0]?.skill_level ?? 0;
  }

  static async ensureDefaults(characterId, classId) {
    const skills = getClassSkills(classId);
    for (const skill of skills) {
      await query(
        `INSERT IGNORE INTO character_skills (character_id, skill_key, skill_level)
         VALUES (:characterId, :skillKey, 1)`,
        { characterId, skillKey: skill.key }
      );
    }
    return this.listByCharacter(characterId);
  }

  static async upsertLevel(characterId, skillKey, skillLevel) {
    await query(
      `INSERT INTO character_skills (character_id, skill_key, skill_level)
       VALUES (:characterId, :skillKey, :skillLevel)
       ON DUPLICATE KEY UPDATE skill_level = VALUES(skill_level)`,
      {
        characterId,
        skillKey,
        skillLevel: Math.max(1, Math.floor(skillLevel) || 1),
      }
    );
    return this.getLevel(characterId, skillKey);
  }
}
