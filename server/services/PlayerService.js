import { v4 as uuidv4 } from 'uuid';
import PlayerFinder from '../finders/PlayerFinder.js';
import UpgradeFinder from '../finders/UpgradeFinder.js';
import StatsFinder from '../finders/StatsFinder.js';
import SettingsFinder from '../finders/SettingsFinder.js';
import { UPGRADE_CATALOG, essencesForFloor } from '../models/GameData.js';

function serializePlayer(player) {
  return {
    id: player.id,
    playerKey: player.player_key,
    displayName: player.display_name,
    essences: player.essences,
    maxFloorRecord: player.max_floor_record,
  };
}

export default class PlayerService {
  static async bootstrap(playerKey = null, displayName = null) {
    const key = playerKey || uuidv4();
    let player = await PlayerFinder.findByKey(key);

    if (!player) {
      player = await PlayerFinder.create({
        playerKey: key,
        displayName: displayName || null,
      });
      await StatsFinder.getOrCreate(player.id);
      await SettingsFinder.getOrCreate(player.id);
    } else if (displayName && displayName !== player.display_name) {
      player = await PlayerFinder.setDisplayName(player.id, displayName);
    }

    return this.getProfile(player.player_key);
  }

  static async getProfile(playerKey) {
    const player = await PlayerFinder.findByKey(playerKey);
    if (!player) {
      const err = new Error('Jogador não encontrado');
      err.status = 404;
      throw err;
    }

    const [upgradesRows, stats, settings] = await Promise.all([
      UpgradeFinder.listByPlayer(player.id),
      StatsFinder.getOrCreate(player.id),
      SettingsFinder.getOrCreate(player.id),
    ]);

    const upgrades = {};
    for (const key of Object.keys(UPGRADE_CATALOG)) {
      upgrades[key] = 0;
    }
    for (const row of upgradesRows) {
      upgrades[row.upgrade_key] = row.level;
    }

    return {
      player: serializePlayer(player),
      upgrades,
      catalog: UPGRADE_CATALOG,
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

  static async endRun(playerKey, payload = {}) {
    const player = await PlayerFinder.findByKey(playerKey);
    if (!player) {
      const err = new Error('Jogador não encontrado');
      err.status = 404;
      throw err;
    }

    const maxFloor = Math.max(0, Math.floor(Number(payload.maxFloor) || 0));
    const awarded = essencesForFloor(maxFloor);
    const nextRecord = Math.max(player.max_floor_record, maxFloor);
    const nextEssences = player.essences + awarded;

    const updated = await PlayerFinder.updateProgress(player.id, {
      essences: nextEssences,
      maxFloorRecord: nextRecord,
    });

    const stats = await StatsFinder.incrementRunEnd(player.id, {
      kills: payload.kills,
      goldEarned: payload.goldEarned,
      playTimeSeconds: payload.playTimeSeconds,
    });

    return {
      player: serializePlayer(updated),
      awardedEssences: awarded,
      stats: {
        runs: stats.runs,
        deaths: stats.deaths,
        kills: stats.kills,
        goldEarnedTotal: Number(stats.gold_earned_total),
        playTimeSeconds: Number(stats.play_time_seconds),
      },
    };
  }

  static async buyUpgrade(playerKey, upgradeKey) {
    if (!UPGRADE_CATALOG[upgradeKey]) {
      const err = new Error('Melhoria inválida');
      err.status = 400;
      throw err;
    }

    const player = await PlayerFinder.findByKey(playerKey);
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
    });

    return {
      player: serializePlayer(updated),
      upgradeKey,
      level: nextLevel,
      spent: cost,
    };
  }

  static async saveSettings(playerKey, settings) {
    const player = await PlayerFinder.findByKey(playerKey);
    if (!player) {
      const err = new Error('Jogador não encontrado');
      err.status = 404;
      throw err;
    }
    return SettingsFinder.save(player.id, settings || {});
  }
}
