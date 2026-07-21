const ENEMY_TYPES = [
  { id: 'slime', name: 'Slime', baseHp: 28, baseDmg: 3, xp: 5, gold: 3, minFloor: 1 },
  { id: 'goblin', name: 'Goblin', baseHp: 42, baseDmg: 5, xp: 10, gold: 5, minFloor: 2 },
  { id: 'skeleton', name: 'Esqueleto', baseHp: 60, baseDmg: 8, xp: 20, gold: 8, minFloor: 4 },
  { id: 'orc', name: 'Orc', baseHp: 95, baseDmg: 12, xp: 35, gold: 15, minFloor: 7 },
  { id: 'necromancer', name: 'Necromante', baseHp: 130, baseDmg: 16, xp: 60, gold: 25, minFloor: 10 },
];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function floorScale(floor) {
  return 1 + (Math.max(1, floor) - 1) * 0.28;
}

export function killsRequiredForFloor(floor) {
  return 6 + Math.max(1, floor) * 2;
}

export function wavesForFloor(floor) {
  if (floor >= 15) return 5;
  if (floor >= 8) return 4;
  return 3;
}

export function buildPlayerCombatant(classData, upgrades = {}, options = {}) {
  const baseAttrs = options.attrs || classData?.attrs || { str: 4, con: 4, agi: 4, dex: 4, int: 4 };
  const equip = options.equipmentBonuses || {};
  const attrs = {
    str: (baseAttrs.str || 0) + (equip.str || 0),
    con: (baseAttrs.con || 0) + (equip.con || 0),
    agi: (baseAttrs.agi || 0) + (equip.agi || 0),
    dex: (baseAttrs.dex || 0) + (equip.dex || 0),
    int: (baseAttrs.int || 0) + (equip.int || 0),
  };
  const u = (key) => upgrades[key] || 0;
  const equipDefense = equip.defense || 0;

  // percentPerLevel alinhado ao catálogo do Guardião
  const hpPct = u('max_hp') * 0.08;
  const physPct = u('physical_damage') * 0.08;
  const magPct = u('magic_damage') * 0.08;
  const defPct = u('defense') * 0.08;
  const spdPct = u('speed') * 0.05;
  const critPctPoints = u('crit_chance') * 0.015;
  const regenPct = u('regen') * 0.12;

  const maxHp = Math.floor((40 + attrs.con * 8) * (1 + hpPct));
  let defense = (attrs.con * 1.2 + equipDefense) * (1 + defPct);
  let physical = (attrs.str * 2.2) * (1 + physPct);
  let magic = (attrs.int * 2.4) * (1 + magPct);
  let critChance = 0.04 + attrs.dex * 0.008 + critPctPoints;
  const baseInterval = Math.max(280, 900 - attrs.agi * 35);
  const attackIntervalMs = Math.max(220, Math.floor(baseInterval / (1 + spdPct)));
  const baseRegen = classData?.id === 'cleric' ? 1.2 : 0.35;
  const regen = baseRegen * (1 + regenPct);

  if (classData?.id === 'warrior') defense *= 1.15;
  if (classData?.id === 'archer') critChance += 0.1;
  if (classData?.id === 'mage') magic *= 1.2;

  const usesMagic = classData?.id === 'mage' || classData?.id === 'cleric';

  return {
    name: classData?.name || 'Herói',
    classId: classData?.id || 'warrior',
    level: options.level || 1,
    maxHp,
    hp: maxHp,
    defense,
    physical,
    magic,
    usesMagic,
    critChance: clamp(critChance, 0, 0.55),
    attackIntervalMs,
    regen,
    goldGainMult: 1 + u('gold_gain') * 0.08,
    xpGainMult: 1 + u('xp_gain') * 0.08,
  };
}

function pickEnemyType(floor) {
  const available = ENEMY_TYPES.filter((e) => e.minFloor <= floor);
  const pool = available.length ? available : [ENEMY_TYPES[0]];
  // Andares altos puxam inimigos mais fortes
  const bias = clamp((floor - 1) / 12, 0, 1);
  const index = Math.min(pool.length - 1, Math.floor(Math.random() * pool.length * (0.45 + bias)));
  return pool[index];
}

export function createEnemy(floor, waveIndex) {
  const type = pickEnemyType(floor);
  const scale = floorScale(floor) * (1 + waveIndex * 0.08);
  const maxHp = Math.floor(type.baseHp * scale);
  const damage = Math.max(1, Math.floor(type.baseDmg * scale));
  // Recompensas escalam com o andar (e um pouco com a wave)
  const rewardScale = (1 + (Math.max(1, floor) - 1) * 0.38) * (1 + waveIndex * 0.06);
  return {
    id: `${type.id}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    typeId: type.id,
    name: type.name,
    maxHp,
    hp: maxHp,
    damage,
    xp: Math.max(1, Math.floor(type.xp * rewardScale)),
    gold: Math.max(1, Math.floor(type.gold * rewardScale)),
    attackIntervalMs: Math.max(420, 1100 - floor * 18 - waveIndex * 20),
  };
}

export function createFloorEncounter(floor) {
  const killsRequired = killsRequiredForFloor(floor);
  const waveCount = wavesForFloor(floor);
  const perWave = Math.ceil(killsRequired / waveCount);
  const waves = [];

  let remaining = killsRequired;
  for (let w = 0; w < waveCount; w += 1) {
    const count = w === waveCount - 1 ? remaining : Math.min(perWave, remaining);
    remaining -= count;
    const enemies = Array.from({ length: count }, () => createEnemy(floor, w));
    waves.push({ index: w + 1, enemies });
  }

  return {
    floor,
    killsRequired,
    kills: 0,
    waveIndex: 0,
    waves,
    completed: false,
    scale: floorScale(floor),
  };
}

export function currentWave(encounter) {
  return encounter.waves[encounter.waveIndex] || null;
}

export function livingEnemies(encounter) {
  const wave = currentWave(encounter);
  return wave ? wave.enemies.filter((e) => e.hp > 0) : [];
}

export function getActiveEnemy(encounter) {
  return livingEnemies(encounter)[0] || null;
}

function rollCrit(chance) {
  return Math.random() < chance;
}

export function playerAttack(player, enemy) {
  const base = player.usesMagic ? player.magic : player.physical;
  const crit = rollCrit(player.critChance);
  const damage = Math.max(1, Math.floor(base * (crit ? 1.75 : 1) * (0.9 + Math.random() * 0.2)));
  enemy.hp = Math.max(0, enemy.hp - damage);
  return { damage, crit, killed: enemy.hp <= 0 };
}

export function enemyAttack(enemy, player) {
  const mitigated = Math.max(1, Math.floor(enemy.damage * (100 / (100 + player.defense))));
  const damage = Math.max(1, Math.floor(mitigated * (0.85 + Math.random() * 0.3)));
  player.hp = Math.max(0, player.hp - damage);
  return { damage, dead: player.hp <= 0 };
}

export function applyRegen(player, dtMs) {
  if (!player.regen || player.hp <= 0 || player.hp >= player.maxHp) return 0;
  const healed = (player.regen * dtMs) / 1000;
  const before = player.hp;
  player.hp = Math.min(player.maxHp, player.hp + healed);
  return player.hp - before;
}

export function advanceWaveOrComplete(encounter) {
  if (livingEnemies(encounter).length > 0) return 'fighting';

  const justUnlocked = !encounter.completed && encounter.kills >= encounter.killsRequired;
  if (encounter.kills >= encounter.killsRequired) {
    encounter.completed = true; // só libera descida; combate continua
  }

  if (encounter.waveIndex < encounter.waves.length - 1) {
    encounter.waveIndex += 1;
    return justUnlocked ? 'unlocked' : 'next_wave';
  }

  // Farm infinito no andar atual
  const farmIndex = encounter.waves.length;
  const count = Math.max(2, Math.ceil(encounter.killsRequired / Math.max(1, encounter.waves.length)));
  const enemies = Array.from({ length: count }, () => createEnemy(encounter.floor, farmIndex));
  encounter.waves.push({ index: farmIndex + 1, enemies, farm: true });
  encounter.waveIndex = farmIndex;
  return justUnlocked ? 'unlocked' : 'farm_wave';
}

export function summarizeThreat(floor) {
  const scale = floorScale(floor);
  return {
    floor,
    scale,
    killsRequired: killsRequiredForFloor(floor),
    waves: wavesForFloor(floor),
    label: scale < 1.5 ? 'Fraco' : scale < 2.5 ? 'Moderado' : scale < 4 ? 'Perigoso' : 'Letal',
  };
}
