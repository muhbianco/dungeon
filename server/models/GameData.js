export const UPGRADE_CATALOG = Object.freeze({
  max_hp: { label: 'Vida Máxima', costs: [10, 25, 50, 90, 150] },
  physical_damage: { label: 'Dano Físico', costs: [10, 25, 50, 90, 150] },
  magic_damage: { label: 'Dano Mágico', costs: [10, 25, 50, 90, 150] },
  defense: { label: 'Defesa', costs: [10, 25, 50, 90, 150] },
  speed: { label: 'Velocidade', costs: [10, 25, 50, 90, 150] },
  crit_chance: { label: 'Chance Crítica', costs: [15, 35, 70, 120, 200] },
  gold_gain: { label: 'Ouro Obtido', costs: [10, 25, 50, 90, 150] },
  xp_gain: { label: 'XP Obtida', costs: [10, 25, 50, 90, 150] },
  regen: { label: 'Regeneração', costs: [15, 35, 70, 120, 200] },
  loot_chance: { label: 'Chance de Equipamentos', costs: [15, 35, 70, 120, 200] },
  rare_loot_chance: { label: 'Chance de Equipamentos Raros', costs: [20, 45, 90, 160, 260] },
});

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

/** Catálogo base de equipamentos por slot (compra inicial + upgrades). */
export const EQUIP_CATALOG = Object.freeze({
  helmet: { key: 'iron_helm', name: 'Elmo de Ferro', baseCost: 40, stat: 'defense', perLevel: 2 },
  chest: { key: 'iron_chest', name: 'Peitoral de Ferro', baseCost: 60, stat: 'con', perLevel: 1 },
  gloves: { key: 'iron_gloves', name: 'Luvas de Ferro', baseCost: 35, stat: 'str', perLevel: 1 },
  pants: { key: 'iron_pants', name: 'Calças de Ferro', baseCost: 45, stat: 'defense', perLevel: 1.5 },
  boots: { key: 'swift_boots', name: 'Botas Velozes', baseCost: 40, stat: 'agi', perLevel: 1 },
  ring1: { key: 'power_ring', name: 'Anel de Poder', baseCost: 55, stat: 'str', perLevel: 1 },
  ring2: { key: 'crit_ring', name: 'Anel Crítico', baseCost: 55, stat: 'dex', perLevel: 1 },
  necklace: { key: 'mystic_amulet', name: 'Amuleto Místico', baseCost: 70, stat: 'int', perLevel: 1 },
});

export function equipBonusAtLevel(slot, itemLevel) {
  const catalog = EQUIP_CATALOG[slot];
  if (!catalog) return 0;
  const lv = Math.max(0, Math.floor(Number(itemLevel) || 0));
  return catalog.perLevel * lv;
}

export function describeEquipStats(slot, itemLevel = 0) {
  const catalog = EQUIP_CATALOG[slot];
  if (!catalog) return null;
  const currentLevel = Math.max(0, Math.floor(Number(itemLevel) || 0));
  const nextLevel = currentLevel + 1;
  return {
    stat: catalog.stat,
    statLabel: STAT_LABELS[catalog.stat] || catalog.stat.toUpperCase(),
    perLevel: catalog.perLevel,
    currentBonus: equipBonusAtLevel(slot, currentLevel),
    nextBonus: equipBonusAtLevel(slot, nextLevel),
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

export function equipUpgradeCost(slot, currentLevel) {
  const item = EQUIP_CATALOG[slot];
  if (!item) return null;
  const lv = Math.max(0, Math.floor(currentLevel) || 0);
  if (lv <= 0) return item.baseCost;
  return Math.floor(item.baseCost * (1.45 ** lv));
}

export function equipmentBonuses(equipmentRows = []) {
  const bonus = { str: 0, con: 0, agi: 0, dex: 0, int: 0, defense: 0 };
  for (const row of equipmentRows) {
    const catalog = EQUIP_CATALOG[row.slot];
    if (!catalog) continue;
    const lv = Math.max(1, row.item_level || 1);
    bonus[catalog.stat] = (bonus[catalog.stat] || 0) + catalog.perLevel * lv;
  }
  return bonus;
}

/** Essências pela tabela do GDD (interpolação linear entre marcos). */
export function essencesForFloor(maxFloor) {
  const floor = Math.max(0, Math.floor(Number(maxFloor) || 0));
  if (floor <= 0) return 0;

  const table = [
    [1, 1],
    [5, 5],
    [10, 12],
    [15, 20],
    [20, 35],
    [30, 60],
  ];

  if (floor >= table[table.length - 1][0]) {
    const [f0, e0] = table[table.length - 2];
    const [f1, e1] = table[table.length - 1];
    const slope = (e1 - e0) / (f1 - f0);
    return Math.floor(e1 + (floor - f1) * slope);
  }

  for (let i = 0; i < table.length - 1; i += 1) {
    const [f0, e0] = table[i];
    const [f1, e1] = table[i + 1];
    if (floor >= f0 && floor <= f1) {
      const t = (floor - f0) / (f1 - f0);
      return Math.floor(e0 + t * (e1 - e0));
    }
  }

  return table[0][1];
}
