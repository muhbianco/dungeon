import { v4 as uuidv4 } from 'uuid';
import PlayerFinder from '../finders/PlayerFinder.js';
import CharacterFinder from '../finders/CharacterFinder.js';
import EquipmentFinder from '../finders/EquipmentFinder.js';
import SkillFinder from '../finders/SkillFinder.js';
import UpgradeFinder from '../finders/UpgradeFinder.js';
import StatsFinder from '../finders/StatsFinder.js';
import SettingsFinder from '../finders/SettingsFinder.js';
import {
  UPGRADE_CATALOG,
  CLASSES,
  EQUIP_SLOT_LABELS,
  EQUIP_SLOTS,
  attrsForLevel,
  applyXp,
  xpToNextLevel,
  equipUpgradeCost,
  equipmentBonuses,
  essencesForFloor,
  describeEquipStats,
  getEquipItem,
  getClassSkills,
  getSkill,
  skillUpgradeCost,
  skillPowerMultiplier,
} from '../models/GameData.js';

function serializePlayer(player) {
  return {
    id: player.id,
    playerKey: player.player_key,
    discordId: player.discord_id,
    displayName: player.display_name,
    globalName: player.global_name,
    avatar: player.avatar && player.discord_id
      ? `https://cdn.discordapp.com/avatars/${player.discord_id}/${player.avatar}.${String(player.avatar).startsWith('a_') ? 'gif' : 'png'}?size=64`
      : null,
    essences: player.essences,
    gold: Number(player.gold || 0),
    maxFloorRecord: player.max_floor_record,
  };
}

function buildClassShop(classId) {
  const shop = {};
  for (const slot of EQUIP_SLOTS) {
    const item = getEquipItem(classId, slot);
    const stats = describeEquipStats(classId, slot, 0);
    shop[slot] = {
      slot,
      label: EQUIP_SLOT_LABELS[slot],
      key: item?.key,
      name: item?.name,
      baseCost: item?.baseCost,
      buyCost: equipUpgradeCost(classId, slot, 0),
      ...stats,
    };
  }
  return shop;
}

function serializeSkills(classId, skillRows = []) {
  const levels = {};
  for (const row of skillRows) {
    levels[row.skill_key] = row.skill_level;
  }
  return getClassSkills(classId).map((skill) => {
    const level = levels[skill.key] || 1;
    return {
      ...skill,
      level,
      powerMult: skillPowerMultiplier(level),
      nextCost: skillUpgradeCost(level),
      cooldownLabel: `${(skill.cooldownMs / 1000).toFixed(1)}s`,
    };
  });
}

function serializeCharacter(row, equipmentRows = [], skillRows = []) {
  const classId = row.class_id;
  const bonuses = equipmentBonuses(classId, equipmentRows);
  const equipment = {};
  for (const slot of EQUIP_SLOTS) {
    equipment[slot] = null;
  }
  for (const eq of equipmentRows) {
    const catalog = getEquipItem(classId, eq.slot);
    const stats = describeEquipStats(classId, eq.slot, eq.item_level);
    equipment[eq.slot] = {
      slot: eq.slot,
      label: EQUIP_SLOT_LABELS[eq.slot],
      itemKey: eq.item_key,
      name: catalog?.name || eq.item_key,
      itemLevel: eq.item_level,
      rarity: eq.rarity,
      nextCost: equipUpgradeCost(classId, eq.slot, eq.item_level),
      ...stats,
    };
  }

  return {
    id: row.id,
    classId,
    className: CLASSES[classId]?.name || classId,
    level: row.level,
    xp: row.xp,
    xpToNext: xpToNextLevel(row.level),
    attrs: {
      str: row.str_stat,
      con: row.con_stat,
      agi: row.agi_stat,
      dex: row.dex_stat,
      int: row.int_stat,
    },
    equipmentBonuses: bonuses,
    equipment,
    skills: serializeSkills(classId, skillRows),
    shop: buildClassShop(classId),
  };
}

async function loadCharacterBundle(characterRow) {
  const [eqs, skills] = await Promise.all([
    EquipmentFinder.listByCharacter(characterRow.id),
    SkillFinder.ensureDefaults(characterRow.id, characterRow.class_id),
  ]);
  return serializeCharacter(characterRow, eqs, skills);
}

export default class PlayerService {
  static async loginFromDiscord(discordUser, avatarHash) {
    const player = await PlayerFinder.upsertDiscord({
      playerKey: uuidv4(),
      discordId: String(discordUser.id),
      displayName: discordUser.username || discordUser.global_name || 'Jogador',
      globalName: discordUser.global_name || null,
      avatar: avatarHash || null,
    });
    await StatsFinder.getOrCreate(player.id);
    await SettingsFinder.getOrCreate(player.id);
    return player;
  }

  static async getProfileById(playerId) {
    const player = await PlayerFinder.findById(playerId);
    if (!player) {
      const err = new Error('Jogador não encontrado');
      err.status = 404;
      throw err;
    }

    const [upgradesRows, stats, settings, characters] = await Promise.all([
      UpgradeFinder.listByPlayer(player.id),
      StatsFinder.getOrCreate(player.id),
      SettingsFinder.getOrCreate(player.id),
      CharacterFinder.listByPlayer(player.id),
    ]);

    const upgrades = {};
    for (const key of Object.keys(UPGRADE_CATALOG)) upgrades[key] = 0;
    for (const row of upgradesRows) upgrades[row.upgrade_key] = row.level;

    const characterPayload = [];
    for (const ch of characters) {
      characterPayload.push(await loadCharacterBundle(ch));
    }

    const shopByClass = {};
    for (const classId of Object.keys(CLASSES)) {
      shopByClass[classId] = buildClassShop(classId);
    }

    return {
      player: serializePlayer(player),
      upgrades,
      catalog: UPGRADE_CATALOG,
      characters: characterPayload,
      shop: shopByClass,
      slots: EQUIP_SLOTS,
      slotLabels: EQUIP_SLOT_LABELS,
      stats: {
        runs: stats.runs,
        deaths: stats.deaths,
        kills: stats.kills,
        goldEarnedTotal: Number(stats.gold_earned_total),
        playTimeSeconds: Number(stats.play_time_seconds),
      },
      settings,
    };
  }

  static async ensureCharacter(playerId, classId) {
    const character = await CharacterFinder.getOrCreate(playerId, classId);
    return loadCharacterBundle(character);
  }

  static async endRun(playerId, payload = {}) {
    const player = await PlayerFinder.findById(playerId);
    if (!player) {
      const err = new Error('Jogador não encontrado');
      err.status = 404;
      throw err;
    }

    const classId = payload.classId;
    if (!CLASSES[classId]) {
      const err = new Error('Classe inválida');
      err.status = 400;
      throw err;
    }

    const character = await CharacterFinder.getOrCreate(playerId, classId);
    const xpGained = Math.max(0, Math.floor(Number(payload.xpGained) || 0));
    const goldGained = Math.max(0, Math.floor(Number(payload.goldEarned) || 0));
    const maxFloor = Math.max(0, Math.floor(Number(payload.maxFloor) || 0));

    const progress = applyXp(character.level, character.xp, xpGained);
    const attrs = attrsForLevel(classId, progress.level);
    const updatedChar = await CharacterFinder.saveProgress(character.id, {
      level: progress.level,
      xp: progress.xp,
      attrs,
    });

    const awardedBase = essencesForFloor(maxFloor);
    const essenceLevel = await UpgradeFinder.getLevel(player.id, 'essence_gain');
    const essenceMult = 1 + essenceLevel * 0.10;
    const awarded = Math.max(0, Math.floor(awardedBase * essenceMult));
    const updatedPlayer = await PlayerFinder.updateProgress(player.id, {
      essences: player.essences + awarded,
      maxFloorRecord: Math.max(player.max_floor_record, maxFloor),
      gold: Number(player.gold || 0) + goldGained,
    });

    const stats = await StatsFinder.incrementRunEnd(player.id, {
      kills: payload.kills,
      goldEarned: goldGained,
      playTimeSeconds: payload.playTimeSeconds,
    });

    const eqs = await EquipmentFinder.listByCharacter(updatedChar.id);
    const skills = await SkillFinder.ensureDefaults(updatedChar.id, updatedChar.class_id);

    return {
      player: serializePlayer(updatedPlayer),
      character: serializeCharacter(updatedChar, eqs, skills),
      awardedEssences: awarded,
      xpGained,
      goldBanked: goldGained,
      levelsGained: progress.levelsGained,
      stats: {
        runs: stats.runs,
        deaths: stats.deaths,
        kills: stats.kills,
        goldEarnedTotal: Number(stats.gold_earned_total),
        playTimeSeconds: Number(stats.play_time_seconds),
      },
    };
  }

  static async buyOrUpgradeEquip(playerId, classId, slot) {
    if (!EQUIP_SLOTS.includes(slot) || !getEquipItem(classId, slot)) {
      const err = new Error('Equipamento inválido para a classe');
      err.status = 400;
      throw err;
    }
    if (!CLASSES[classId]) {
      const err = new Error('Classe inválida');
      err.status = 400;
      throw err;
    }

    const character = await CharacterFinder.getOrCreate(playerId, classId);
    const current = await EquipmentFinder.getSlot(character.id, slot);
    const nextLevel = current ? current.item_level + 1 : 1;
    if (nextLevel > 20) {
      const err = new Error('Equipamento no nível máximo');
      err.status = 400;
      throw err;
    }

    const cost = equipUpgradeCost(classId, slot, current ? current.item_level : 0);
    await PlayerFinder.spendGold(playerId, cost);
    const item = await EquipmentFinder.upsert(character.id, classId, slot, nextLevel);
    const player = await PlayerFinder.findById(playerId);
    const refreshed = await CharacterFinder.findById(character.id);
    const eqs = await EquipmentFinder.listByCharacter(character.id);
    const skills = await SkillFinder.ensureDefaults(character.id, classId);

    return {
      player: serializePlayer(player),
      character: serializeCharacter(refreshed, eqs, skills),
      item: {
        slot: item.slot,
        itemLevel: item.item_level,
        spent: cost,
      },
    };
  }

  static async buySkillUpgrade(playerId, classId, skillKey) {
    if (!CLASSES[classId] || !getSkill(classId, skillKey)) {
      const err = new Error('Habilidade inválida');
      err.status = 400;
      throw err;
    }

    const character = await CharacterFinder.getOrCreate(playerId, classId);
    await SkillFinder.ensureDefaults(character.id, classId);
    const currentLevel = (await SkillFinder.getLevel(character.id, skillKey)) || 1;
    if (currentLevel >= 10) {
      const err = new Error('Habilidade no nível máximo');
      err.status = 400;
      throw err;
    }

    const cost = skillUpgradeCost(currentLevel);
    await PlayerFinder.spendGold(playerId, cost);
    await SkillFinder.upsertLevel(character.id, skillKey, currentLevel + 1);
    const player = await PlayerFinder.findById(playerId);
    const refreshed = await CharacterFinder.findById(character.id);

    return {
      player: serializePlayer(player),
      character: await loadCharacterBundle(refreshed),
      skillKey,
      level: currentLevel + 1,
      spent: cost,
    };
  }

  static async buyUpgrade(playerId, upgradeKey) {
    if (!UPGRADE_CATALOG[upgradeKey]) {
      const err = new Error('Melhoria inválida');
      err.status = 400;
      throw err;
    }

    const player = await PlayerFinder.findById(playerId);
    if (!player) {
      const err = new Error('Jogador não encontrado');
      err.status = 404;
      throw err;
    }

    const currentLevel = await UpgradeFinder.getLevel(player.id, upgradeKey);
    const costs = UPGRADE_CATALOG[upgradeKey].costs;
    if (currentLevel >= costs.length) {
      const err = new Error('Melhoria já está no nível máximo');
      err.status = 400;
      throw err;
    }

    const cost = costs[currentLevel];
    if (player.essences < cost) {
      const err = new Error('Essências insuficientes');
      err.status = 400;
      throw err;
    }

    const nextLevel = currentLevel + 1;
    await UpgradeFinder.upsertLevel(player.id, upgradeKey, nextLevel);
    const updated = await PlayerFinder.updateProgress(player.id, {
      essences: player.essences - cost,
      maxFloorRecord: player.max_floor_record,
      gold: Number(player.gold || 0),
    });

    return {
      player: serializePlayer(updated),
      upgradeKey,
      level: nextLevel,
      spent: cost,
    };
  }

  static async saveSettings(playerId, settings) {
    return SettingsFinder.save(playerId, settings || {});
  }
}
