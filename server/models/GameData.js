const STANDARD_COSTS = [10, 20, 35, 55, 80, 115, 160, 220, 300, 400];
const PREMIUM_COSTS = [15, 30, 50, 75, 110, 155, 215, 290, 380, 500];

export const UPGRADE_CATALOG = Object.freeze({
  max_hp: {
    label: 'Vida Máxima',
    description: 'Aumenta a vida máxima',
    percentPerLevel: 8,
    costs: STANDARD_COSTS,
  },
  physical_damage: {
    label: 'Dano Físico',
    description: 'Aumenta o dano físico',
    percentPerLevel: 8,
    costs: STANDARD_COSTS,
  },
  magic_damage: {
    label: 'Dano Mágico',
    description: 'Aumenta o dano mágico',
    percentPerLevel: 8,
    costs: STANDARD_COSTS,
  },
  defense: {
    label: 'Defesa',
    description: 'Aumenta a defesa',
    percentPerLevel: 8,
    costs: STANDARD_COSTS,
  },
  speed: {
    label: 'Velocidade',
    description: 'Aumenta a velocidade de ataque',
    percentPerLevel: 5,
    costs: STANDARD_COSTS,
  },
  crit_chance: {
    label: 'Chance Crítica',
    description: 'Aumenta a chance de crítico',
    percentPerLevel: 1.5,
    costs: PREMIUM_COSTS,
  },
  gold_gain: {
    label: 'Ouro Obtido',
    description: 'Aumenta o ouro ganho nas runs',
    percentPerLevel: 8,
    costs: STANDARD_COSTS,
  },
  xp_gain: {
    label: 'XP Obtida',
    description: 'Aumenta a XP ganha nas runs',
    percentPerLevel: 8,
    costs: STANDARD_COSTS,
  },
  essence_gain: {
    label: 'Essência Obtida',
    description: 'Aumenta as essências ao encerrar a run',
    percentPerLevel: 10,
    costs: PREMIUM_COSTS,
  },
  regen: {
    label: 'Regeneração',
    description: 'Aumenta a regeneração de vida',
    percentPerLevel: 12,
    costs: PREMIUM_COSTS,
  },
  loot_chance: {
    label: 'Chance de Equipamentos',
    description: 'Aumenta a chance de encontrar equipamentos',
    percentPerLevel: 5,
    costs: PREMIUM_COSTS,
  },
  rare_loot_chance: {
    label: 'Chance de Equipamentos Raros',
    description: 'Aumenta a chance de equipamentos raros',
    percentPerLevel: 3,
    costs: PREMIUM_COSTS,
  },
});

export function describeUpgrade(upgradeKey, level = 0) {
  const item = UPGRADE_CATALOG[upgradeKey];
  if (!item) return null;
  const lv = Math.max(0, Math.floor(Number(level) || 0));
  const maxLevel = item.costs.length;
  const pct = item.percentPerLevel;
  return {
    currentPercent: lv * pct,
    nextPercent: Math.min(lv + 1, maxLevel) * pct,
    percentPerLevel: pct,
    maxLevel,
    maxed: lv >= maxLevel,
  };
}

export const CLASSES = Object.freeze({
  warrior: {
    id: 'warrior',
    name: 'Cavaleiro',
    attrs: { str: 8, con: 8, agi: 4, dex: 4, int: 2 },
    levelGain: { str: 2, con: 2, agi: 0, dex: 1, int: 0 },
    passive: '+15% Defesa',
  },
  archer: {
    id: 'archer',
    name: 'Arqueiro',
    attrs: { str: 4, con: 4, agi: 8, dex: 8, int: 3 },
    levelGain: { str: 0, con: 1, agi: 2, dex: 2, int: 0 },
    passive: '+10% Chance Crítica',
  },
  mage: {
    id: 'mage',
    name: 'Mago',
    attrs: { str: 2, con: 4, agi: 4, dex: 5, int: 10 },
    levelGain: { str: 0, con: 1, agi: 1, dex: 1, int: 2 },
    passive: '+20% Dano Mágico',
  },
  cleric: {
    id: 'cleric',
    name: 'Clérigo',
    attrs: { str: 4, con: 7, agi: 3, dex: 4, int: 8 },
    levelGain: { str: 1, con: 2, agi: 0, dex: 0, int: 2 },
    passive: 'Regenera HP lentamente',
  },
});

export const EQUIP_SLOTS = Object.freeze([
  'helmet',
  'chest',
  'gloves',
  'pants',
  'boots',
  'ring1',
  'ring2',
  'necklace',
]);

export const EQUIP_SLOT_LABELS = Object.freeze({
  helmet: 'Capacete',
  chest: 'Peitoral',
  gloves: 'Luvas',
  pants: 'Calças',
  boots: 'Botas',
  ring1: 'Anel 1',
  ring2: 'Anel 2',
  necklace: 'Colar',
});

export const STAT_LABELS = Object.freeze({
  str: 'STR',
  con: 'CON',
  agi: 'AGI',
  dex: 'DEX',
  int: 'INT',
  defense: 'DEF',
});

/**
 * Equipamentos por classe — cada classe recebe atributos alinhados ao playstyle.
 * Mesmos slots, nomes/stats diferentes.
 */
export const CLASS_EQUIP_CATALOG = Object.freeze({
  warrior: {
    helmet: { key: 'iron_helm', name: 'Elmo de Ferro', baseCost: 40, stat: 'defense', perLevel: 2 },
    chest: { key: 'iron_chest', name: 'Peitoral de Ferro', baseCost: 60, stat: 'con', perLevel: 1 },
    gloves: { key: 'iron_gloves', name: 'Manoplas de Guerra', baseCost: 35, stat: 'str', perLevel: 1 },
    pants: { key: 'iron_pants', name: 'Grevas de Ferro', baseCost: 45, stat: 'defense', perLevel: 1.5 },
    boots: { key: 'war_boots', name: 'Botas Pesadas', baseCost: 40, stat: 'con', perLevel: 1 },
    ring1: { key: 'might_ring', name: 'Anel da Força', baseCost: 55, stat: 'str', perLevel: 1 },
    ring2: { key: 'bulwark_ring', name: 'Anel do Baluarte', baseCost: 55, stat: 'defense', perLevel: 1.5 },
    necklace: { key: 'veteran_amulet', name: 'Amuleto do Veterano', baseCost: 70, stat: 'con', perLevel: 1 },
  },
  archer: {
    helmet: { key: 'hunter_hood', name: 'Capuz do Caçador', baseCost: 40, stat: 'dex', perLevel: 1 },
    chest: { key: 'leather_vest', name: 'Colete de Couro', baseCost: 60, stat: 'con', perLevel: 1 },
    gloves: { key: 'aim_gloves', name: 'Luvas de Mira', baseCost: 35, stat: 'dex', perLevel: 1 },
    pants: { key: 'ranger_pants', name: 'Calças do Patrulheiro', baseCost: 45, stat: 'agi', perLevel: 1 },
    boots: { key: 'swift_boots', name: 'Botas Velozes', baseCost: 40, stat: 'agi', perLevel: 1.5 },
    ring1: { key: 'wind_ring', name: 'Anel do Vento', baseCost: 55, stat: 'agi', perLevel: 1 },
    ring2: { key: 'crit_ring', name: 'Anel Crítico', baseCost: 55, stat: 'dex', perLevel: 1.5 },
    necklace: { key: 'hawk_amulet', name: 'Amuleto do Falcão', baseCost: 70, stat: 'dex', perLevel: 1 },
  },
  mage: {
    helmet: { key: 'arcane_hood', name: 'Capuz Arcano', baseCost: 40, stat: 'int', perLevel: 1 },
    chest: { key: 'mage_robe', name: 'Manto Arcano', baseCost: 60, stat: 'con', perLevel: 1 },
    gloves: { key: 'rune_gloves', name: 'Luvas Rúnicas', baseCost: 35, stat: 'int', perLevel: 1.5 },
    pants: { key: 'silk_pants', name: 'Calças de Seda', baseCost: 45, stat: 'int', perLevel: 1 },
    boots: { key: 'channel_boots', name: 'Botas do Canalizador', baseCost: 40, stat: 'agi', perLevel: 1 },
    ring1: { key: 'focus_ring', name: 'Anel do Foco', baseCost: 55, stat: 'int', perLevel: 1 },
    ring2: { key: 'ward_ring', name: 'Anel de Proteção', baseCost: 55, stat: 'defense', perLevel: 1.5 },
    necklace: { key: 'mystic_amulet', name: 'Amuleto Místico', baseCost: 70, stat: 'int', perLevel: 1.5 },
  },
  cleric: {
    helmet: { key: 'faith_circlet', name: 'Diadema da Fé', baseCost: 40, stat: 'int', perLevel: 1 },
    chest: { key: 'holy_vestments', name: 'Vestes Sagradas', baseCost: 60, stat: 'con', perLevel: 1 },
    gloves: { key: 'blessed_gloves', name: 'Luvas Abençoadas', baseCost: 35, stat: 'int', perLevel: 1 },
    pants: { key: 'temple_pants', name: 'Calças do Templo', baseCost: 45, stat: 'con', perLevel: 1 },
    boots: { key: 'pilgrim_boots', name: 'Botas do Peregrino', baseCost: 40, stat: 'defense', perLevel: 1.5 },
    ring1: { key: 'vital_ring', name: 'Anel Vital', baseCost: 55, stat: 'con', perLevel: 1 },
    ring2: { key: 'spirit_ring', name: 'Anel Espiritual', baseCost: 55, stat: 'int', perLevel: 1 },
    necklace: { key: 'divine_amulet', name: 'Amuleto Divino', baseCost: 70, stat: 'int', perLevel: 1.5 },
  },
});

/** @deprecated use getEquipItem(classId, slot) */
export const EQUIP_CATALOG = CLASS_EQUIP_CATALOG.warrior;

export function getEquipItem(classId, slot) {
  return CLASS_EQUIP_CATALOG[classId]?.[slot] || null;
}

export function equipBonusAtLevel(classId, slot, itemLevel) {
  const catalog = getEquipItem(classId, slot);
  if (!catalog) return 0;
  const lv = Math.max(0, Math.floor(Number(itemLevel) || 0));
  return catalog.perLevel * lv;
}

export function describeEquipStats(classId, slot, itemLevel = 0) {
  const catalog = getEquipItem(classId, slot);
  if (!catalog) return null;
  const currentLevel = Math.max(0, Math.floor(Number(itemLevel) || 0));
  const nextLevel = currentLevel + 1;
  return {
    stat: catalog.stat,
    statLabel: STAT_LABELS[catalog.stat] || catalog.stat.toUpperCase(),
    perLevel: catalog.perLevel,
    currentBonus: equipBonusAtLevel(classId, slot, currentLevel),
    nextBonus: equipBonusAtLevel(classId, slot, nextLevel),
  };
}

export function xpToNextLevel(level) {
  const lv = Math.max(1, Math.floor(level) || 1);
  return Math.floor(100 * (lv ** 1.65));
}

export function attrsForLevel(classId, level) {
  const cls = CLASSES[classId];
  if (!cls) return { str: 1, con: 1, agi: 1, dex: 1, int: 1 };
  const lv = Math.max(1, Math.floor(level) || 1);
  const gains = cls.levelGain;
  const extra = lv - 1;
  return {
    str: cls.attrs.str + gains.str * extra,
    con: cls.attrs.con + gains.con * extra,
    agi: cls.attrs.agi + gains.agi * extra,
    dex: cls.attrs.dex + gains.dex * extra,
    int: cls.attrs.int + gains.int * extra,
  };
}

/** Aplica XP e retorna { level, xp, leveledUp, levelsGained }. */
export function applyXp(level, xp, gained) {
  let lv = Math.max(1, Math.floor(level) || 1);
  let cur = Math.max(0, Math.floor(xp) || 0) + Math.max(0, Math.floor(gained) || 0);
  let levelsGained = 0;
  let need = xpToNextLevel(lv);
  while (cur >= need && lv < 100) {
    cur -= need;
    lv += 1;
    levelsGained += 1;
    need = xpToNextLevel(lv);
  }
  return {
    level: lv,
    xp: cur,
    xpToNext: xpToNextLevel(lv),
    leveledUp: levelsGained > 0,
    levelsGained,
  };
}

export function equipUpgradeCost(classId, slot, currentLevel) {
  const item = getEquipItem(classId, slot);
  if (!item) return null;
  const lv = Math.max(0, Math.floor(currentLevel) || 0);
  if (lv <= 0) return item.baseCost;
  return Math.floor(item.baseCost * (1.45 ** lv));
}

export function equipmentBonuses(classId, equipmentRows = []) {
  const bonus = { str: 0, con: 0, agi: 0, dex: 0, int: 0, defense: 0 };
  for (const row of equipmentRows) {
    const catalog = getEquipItem(classId, row.slot);
    if (!catalog) continue;
    const lv = Math.max(1, row.item_level || 1);
    bonus[catalog.stat] = (bonus[catalog.stat] || 0) + catalog.perLevel * lv;
  }
  return bonus;
}

/** Essências — escala forte com o andar máximo da run. */
export function essencesForFloor(maxFloor) {
  const floor = Math.max(0, Math.floor(Number(maxFloor) || 0));
  if (floor <= 0) return 0;
  // Andar 1≈4 · 5≈35 · 10≈110 · 20≈380 · 30≈780
  return Math.max(1, Math.floor(3.2 * (floor ** 1.55) + floor * 2));
}
