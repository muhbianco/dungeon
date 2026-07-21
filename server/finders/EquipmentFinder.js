import { query } from '../db.js';
import { EQUIP_SLOTS, getEquipItem } from '../models/GameData.js';

export default class EquipmentFinder {
  static async listByCharacter(characterId) {
    return query(
      `SELECT id, character_id, slot, item_key, item_level, rarity
       FROM character_equipment
       WHERE character_id = :characterId`,
      { characterId }
    );
  }

  static async getSlot(characterId, slot) {
    const rows = await query(
      `SELECT id, character_id, slot, item_key, item_level, rarity
       FROM character_equipment
       WHERE character_id = :characterId AND slot = :slot
       LIMIT 1`,
      { characterId, slot }
    );
    return rows[0] || null;
  }

  static async upsert(characterId, classId, slot, itemLevel = 1) {
    if (!EQUIP_SLOTS.includes(slot)) {
      const err = new Error('Slot inválido');
      err.status = 400;
      throw err;
    }
    const item = getEquipItem(classId, slot);
    if (!item) {
      const err = new Error('Equipamento inválido para a classe');
      err.status = 400;
      throw err;
    }
    await query(
      `INSERT INTO character_equipment (character_id, slot, item_key, item_level, rarity)
       VALUES (:characterId, :slot, :itemKey, :itemLevel, 'common')
       ON DUPLICATE KEY UPDATE
         item_key = VALUES(item_key),
         item_level = VALUES(item_level)`,
      {
        characterId,
        slot,
        itemKey: item.key,
        itemLevel: Math.max(1, Math.floor(itemLevel) || 1),
      }
    );
    return this.getSlot(characterId, slot);
  }
}
