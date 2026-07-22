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
  skill_cdr: {
    label: 'Recarga de Habilidades',
    description: 'Reduz o tempo de recarga das habilidades',
    percentPerLevel: 5,
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
    passive: '+15% Defesa · Dano melee (STR)',
    damageStyle: 'melee',
  },
  archer: {
    id: 'archer',
    name: 'Arqueiro',
    attrs: { str: 4, con: 4, agi: 8, dex: 8, int: 3 },
    levelGain: { str: 0, con: 1, agi: 2, dex: 2, int: 0 },
    passive: '+10% Crítico · Dano ranged (DEX)',
    damageStyle: 'ranged',
  },
  mage: {
    id: 'mage',
    name: 'Mago',
    attrs: { str: 2, con: 4, agi: 4, dex: 5, int: 10 },
    levelGain: { str: 0, con: 1, agi: 1, dex: 1, int: 2 },
    passive: '+20% Magia · Dano mágico (INT)',
    damageStyle: 'magic',
  },
  cleric: {
    id: 'cleric',
    name: 'Clérigo',
    attrs: { str: 4, con: 7, agi: 3, dex: 4, int: 8 },
    levelGain: { str: 1, con: 2, agi: 0, dex: 0, int: 2 },
    passive: 'Regen alta · Dano mágico (INT)',
    damageStyle: 'magic',
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
 * Equipamentos por classe — 2 atributos por item, alinhados ao playstyle.
 * melee (warrior): STR · ranged (archer): DEX · magic (mage/cleric): INT
 */
export const CLASS_EQUIP_CATALOG = Object.freeze({
  warrior: {
    helmet: {
      key: 'iron_helm',
      name: 'Elmo de Ferro',
      baseCost: 40,
      stats: [
        { stat: 'defense', perLevel: 1.5 },
        { stat: 'con', perLevel: 0.5 },
      ],
    },
    chest: {
      key: 'iron_chest',
      name: 'Peitoral de Ferro',
      baseCost: 60,
      stats: [
        { stat: 'con', perLevel: 1 },
        { stat: 'defense', perLevel: 1 },
      ],
    },
    gloves: {
      key: 'iron_gloves',
      name: 'Manoplas de Guerra',
      baseCost: 35,
      stats: [
        { stat: 'str', perLevel: 1 },
        { stat: 'con', perLevel: 0.5 },
      ],
    },
    pants: {
      key: 'iron_pants',
      name: 'Grevas de Ferro',
      baseCost: 45,
      stats: [
        { stat: 'defense', perLevel: 1.5 },
        { stat: 'str', perLevel: 0.5 },
      ],
    },
    boots: {
      key: 'war_boots',
      name: 'Botas Pesadas',
      baseCost: 40,
      stats: [
        { stat: 'con', perLevel: 1 },
        { stat: 'agi', perLevel: 0.5 },
      ],
    },
    ring1: {
      key: 'might_ring',
      name: 'Anel da Força',
      baseCost: 55,
      stats: [
        { stat: 'str', perLevel: 1 },
        { stat: 'con', perLevel: 0.5 },
      ],
    },
    ring2: {
      key: 'bulwark_ring',
      name: 'Anel do Baluarte',
      baseCost: 55,
      stats: [
        { stat: 'defense', perLevel: 1.5 },
        { stat: 'str', perLevel: 0.5 },
      ],
    },
    necklace: {
      key: 'veteran_amulet',
      name: 'Amuleto do Veterano',
      baseCost: 70,
      stats: [
        { stat: 'str', perLevel: 1 },
        { stat: 'defense', perLevel: 1 },
      ],
    },
  },
  archer: {
    helmet: {
      key: 'hunter_hood',
      name: 'Capuz Reforçado',
      baseCost: 40,
      stats: [
        { stat: 'defense', perLevel: 1.5 },
        { stat: 'dex', perLevel: 0.5 },
      ],
    },
    chest: {
      key: 'leather_vest',
      name: 'Colete de Couro',
      baseCost: 60,
      stats: [
        { stat: 'con', perLevel: 1 },
        { stat: 'defense', perLevel: 1 },
      ],
    },
    gloves: {
      key: 'aim_gloves',
      name: 'Luvas de Mira',
      baseCost: 35,
      stats: [
        { stat: 'dex', perLevel: 1 },
        { stat: 'agi', perLevel: 0.5 },
      ],
    },
    pants: {
      key: 'ranger_pants',
      name: 'Calças Blindadas',
      baseCost: 45,
      stats: [
        { stat: 'defense', perLevel: 1.5 },
        { stat: 'agi', perLevel: 0.5 },
      ],
    },
    boots: {
      key: 'swift_boots',
      name: 'Botas Velozes',
      baseCost: 40,
      stats: [
        { stat: 'agi', perLevel: 1.5 },
        { stat: 'dex', perLevel: 0.5 },
      ],
    },
    ring1: {
      key: 'wind_ring',
      name: 'Anel do Vento',
      baseCost: 55,
      stats: [
        { stat: 'agi', perLevel: 1 },
        { stat: 'dex', perLevel: 0.5 },
      ],
    },
    ring2: {
      key: 'guard_ring',
      name: 'Anel da Guarda',
      baseCost: 55,
      stats: [
        { stat: 'defense', perLevel: 1.5 },
        { stat: 'con', perLevel: 0.5 },
      ],
    },
    necklace: {
      key: 'hawk_amulet',
      name: 'Amuleto do Falcão',
      baseCost: 70,
      stats: [
        { stat: 'dex', perLevel: 1 },
        { stat: 'agi', perLevel: 1 },
      ],
    },
  },
  mage: {
    helmet: {
      key: 'arcane_hood',
      name: 'Capuz Arcano',
      baseCost: 40,
      stats: [
        { stat: 'int', perLevel: 1 },
        { stat: 'defense', perLevel: 0.5 },
      ],
    },
    chest: {
      key: 'mage_robe',
      name: 'Manto Arcano',
      baseCost: 60,
      stats: [
        { stat: 'con', perLevel: 1 },
        { stat: 'int', perLevel: 0.5 },
      ],
    },
    gloves: {
      key: 'rune_gloves',
      name: 'Luvas Rúnicas',
      baseCost: 35,
      stats: [
        { stat: 'int', perLevel: 1.5 },
        { stat: 'agi', perLevel: 0.5 },
      ],
    },
    pants: {
      key: 'silk_pants',
      name: 'Calças de Seda',
      baseCost: 45,
      stats: [
        { stat: 'int', perLevel: 1 },
        { stat: 'con', perLevel: 0.5 },
      ],
    },
    boots: {
      key: 'channel_boots',
      name: 'Botas do Canalizador',
      baseCost: 40,
      stats: [
        { stat: 'agi', perLevel: 1 },
        { stat: 'defense', perLevel: 0.5 },
      ],
    },
    ring1: {
      key: 'focus_ring',
      name: 'Anel do Foco',
      baseCost: 55,
      stats: [
        { stat: 'int', perLevel: 1 },
        { stat: 'con', perLevel: 0.5 },
      ],
    },
    ring2: {
      key: 'ward_ring',
      name: 'Anel de Proteção',
      baseCost: 55,
      stats: [
        { stat: 'defense', perLevel: 1.5 },
        { stat: 'int', perLevel: 0.5 },
      ],
    },
    necklace: {
      key: 'mystic_amulet',
      name: 'Amuleto Místico',
      baseCost: 70,
      stats: [
        { stat: 'int', perLevel: 1.5 },
        { stat: 'con', perLevel: 0.5 },
      ],
    },
  },
  cleric: {
    helmet: {
      key: 'faith_circlet',
      name: 'Diadema da Fé',
      baseCost: 40,
      stats: [
        { stat: 'int', perLevel: 1 },
        { stat: 'defense', perLevel: 0.5 },
      ],
    },
    chest: {
      key: 'holy_vestments',
      name: 'Vestes Sagradas',
      baseCost: 60,
      stats: [
        { stat: 'con', perLevel: 1 },
        { stat: 'defense', perLevel: 1 },
      ],
    },
    gloves: {
      key: 'blessed_gloves',
      name: 'Luvas Abençoadas',
      baseCost: 35,
      stats: [
        { stat: 'int', perLevel: 1 },
        { stat: 'con', perLevel: 0.5 },
      ],
    },
    pants: {
      key: 'temple_pants',
      name: 'Calças do Templo',
      baseCost: 45,
      stats: [
        { stat: 'con', perLevel: 1 },
        { stat: 'defense', perLevel: 0.5 },
      ],
    },
    boots: {
      key: 'pilgrim_boots',
      name: 'Botas do Peregrino',
      baseCost: 40,
      stats: [
        { stat: 'defense', perLevel: 1.5 },
        { stat: 'con', perLevel: 0.5 },
      ],
    },
    ring1: {
      key: 'vital_ring',
      name: 'Anel Vital',
      baseCost: 55,
      stats: [
        { stat: 'con', perLevel: 1 },
        { stat: 'int', perLevel: 0.5 },
      ],
    },
    ring2: {
      key: 'spirit_ring',
      name: 'Anel Espiritual',
      baseCost: 55,
      stats: [
        { stat: 'int', perLevel: 1 },
        { stat: 'defense', perLevel: 0.5 },
      ],
    },
    necklace: {
      key: 'divine_amulet',
      name: 'Amuleto Divino',
      baseCost: 70,
      stats: [
        { stat: 'int', perLevel: 1.5 },
        { stat: 'con', perLevel: 0.5 },
      ],
    },
  },
});

/** @deprecated use getEquipItem(classId, slot) */
export const EQUIP_CATALOG = CLASS_EQUIP_CATALOG.warrior;

export function getEquipItem(classId, slot) {
  return CLASS_EQUIP_CATALOG[classId]?.[slot] || null;
}

/** Normaliza catálogo legado (stat único) ou novo (stats[]). */
export function getEquipStatEntries(catalog) {
  if (!catalog) return [];
  if (Array.isArray(catalog.stats) && catalog.stats.length) {
    return catalog.stats.map((entry) => ({
      stat: entry.stat,
      perLevel: Number(entry.perLevel) || 0,
    }));
  }
  if (catalog.stat) {
    return [{ stat: catalog.stat, perLevel: Number(catalog.perLevel) || 0 }];
  }
  return [];
}

export function equipBonusAtLevel(classId, slot, itemLevel) {
  const catalog = getEquipItem(classId, slot);
  if (!catalog) return {};
  const lv = Math.max(0, Math.floor(Number(itemLevel) || 0));
  const bonus = {};
  for (const entry of getEquipStatEntries(catalog)) {
    bonus[entry.stat] = (bonus[entry.stat] || 0) + entry.perLevel * lv;
  }
  return bonus;
}

export function describeEquipStats(classId, slot, itemLevel = 0) {
  const catalog = getEquipItem(classId, slot);
  if (!catalog) return null;
  const currentLevel = Math.max(0, Math.floor(Number(itemLevel) || 0));
  const nextLevel = currentLevel + 1;
  const entries = getEquipStatEntries(catalog);
  const bonusLines = entries.map((entry) => ({
    stat: entry.stat,
    statLabel: STAT_LABELS[entry.stat] || entry.stat.toUpperCase(),
    perLevel: entry.perLevel,
    currentBonus: entry.perLevel * currentLevel,
    nextBonus: entry.perLevel * nextLevel,
  }));

  return {
    bonusLines,
    // legado (primeiro atributo) — UI nova usa bonusLines
    stat: bonusLines[0]?.stat,
    statLabel: bonusLines.map((b) => b.statLabel).join(' · '),
    perLevel: bonusLines[0]?.perLevel,
    currentBonus: bonusLines[0]?.currentBonus ?? 0,
    nextBonus: bonusLines[0]?.nextBonus ?? 0,
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
    for (const entry of getEquipStatEntries(catalog)) {
      bonus[entry.stat] = (bonus[entry.stat] || 0) + entry.perLevel * lv;
    }
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

const SKILL_UPGRADE_COSTS = [0, 60, 100, 160, 240, 340, 470, 630, 820, 1050];

/**
 * 4 habilidades por classe. Auto-cast em combate.
 * kind: damage | heal
 * damageType: physical | magic | hybrid
 */
export const CLASS_SKILLS = Object.freeze({
  warrior: [
    {
      key: 'heavy_slash',
      name: 'Golpe Devastador',
      description: 'Um golpe físico poderoso no alvo.',
      kind: 'damage',
      damageType: 'physical',
      cooldownMs: 7000,
      power: 2.8,
      priority: 40,
    },
    {
      key: 'shield_bash',
      name: 'Bash de Escudo',
      description: 'Ataque físico rápido que atordoa o ritmo do inimigo.',
      kind: 'damage',
      damageType: 'physical',
      cooldownMs: 5000,
      power: 1.9,
      priority: 30,
    },
    {
      key: 'war_cry',
      name: 'Grito de Guerra',
      description: 'Investida física em área concentrada.',
      kind: 'damage',
      damageType: 'physical',
      cooldownMs: 9000,
      power: 3.2,
      priority: 50,
    },
    {
      key: 'iron_guard',
      name: 'Guarda de Ferro',
      description: 'Recupera um pouco de vida pela disciplina de combate.',
      kind: 'heal',
      damageType: 'physical',
      cooldownMs: 12000,
      healPower: 0.18,
      priority: 80,
    },
  ],
  archer: [
    {
      key: 'precise_shot',
      name: 'Tiro Certeiro',
      description: 'Disparo físico preciso.',
      kind: 'damage',
      damageType: 'physical',
      cooldownMs: 4500,
      power: 2.2,
      priority: 35,
    },
    {
      key: 'piercing_arrow',
      name: 'Flecha Perfurante',
      description: 'Dano físico elevado ignorando parte da defesa.',
      kind: 'damage',
      damageType: 'physical',
      cooldownMs: 7000,
      power: 2.9,
      priority: 45,
    },
    {
      key: 'arrow_rain',
      name: 'Chuva de Flechas',
      description: 'Rajada física intensa.',
      kind: 'damage',
      damageType: 'physical',
      cooldownMs: 10000,
      power: 3.4,
      priority: 55,
    },
    {
      key: 'hunters_focus',
      name: 'Foco do Caçador',
      description: 'Recupera fôlego e vida com concentração.',
      kind: 'heal',
      damageType: 'physical',
      cooldownMs: 14000,
      healPower: 0.14,
      priority: 75,
    },
  ],
  mage: [
    {
      key: 'fireball',
      name: 'Bola de Fogo',
      description: 'Projétil mágico de fogo.',
      kind: 'damage',
      damageType: 'magic',
      cooldownMs: 5500,
      power: 2.5,
      priority: 40,
    },
    {
      key: 'arc_bolt',
      name: 'Raio Arcano',
      description: 'Raio mágico rápido.',
      kind: 'damage',
      damageType: 'magic',
      cooldownMs: 4000,
      power: 1.8,
      priority: 30,
    },
    {
      key: 'frost_nova',
      name: 'Nova de Gelo',
      description: 'Explosão mágica de gelo.',
      kind: 'damage',
      damageType: 'magic',
      cooldownMs: 9000,
      power: 3.3,
      priority: 50,
    },
    {
      key: 'mana_shield',
      name: 'Escudo Arcano',
      description: 'Converte magia em restauração de vida.',
      kind: 'heal',
      damageType: 'magic',
      cooldownMs: 13000,
      healPower: 0.16,
      priority: 80,
    },
  ],
  cleric: [
    {
      key: 'holy_smite',
      name: 'Punição Sagrada',
      description: 'Golpe mágico de luz.',
      kind: 'damage',
      damageType: 'magic',
      cooldownMs: 5500,
      power: 2.3,
      priority: 35,
    },
    {
      key: 'heal',
      name: 'Cura',
      description: 'Restaura uma porção significativa da vida.',
      kind: 'heal',
      damageType: 'magic',
      cooldownMs: 8000,
      healPower: 0.28,
      priority: 90,
    },
    {
      key: 'divine_strike',
      name: 'Golpe Divino',
      description: 'Ataque híbrido físico e mágico.',
      kind: 'damage',
      damageType: 'hybrid',
      cooldownMs: 7000,
      power: 2.6,
      priority: 45,
    },
    {
      key: 'blessing',
      name: 'Bênção',
      description: 'Cura menor e constante do espírito.',
      kind: 'heal',
      damageType: 'magic',
      cooldownMs: 11000,
      healPower: 0.15,
      priority: 70,
    },
  ],
});

export function getClassSkills(classId) {
  return CLASS_SKILLS[classId] || [];
}

export function getSkill(classId, skillKey) {
  return getClassSkills(classId).find((s) => s.key === skillKey) || null;
}

export function skillUpgradeCost(currentLevel) {
  const lv = Math.max(1, Math.floor(Number(currentLevel) || 1));
  if (lv >= 10) return null;
  return SKILL_UPGRADE_COSTS[lv] ?? Math.floor(60 * (1.4 ** lv));
}

export function skillPowerMultiplier(skillLevel) {
  const lv = Math.max(1, Math.floor(Number(skillLevel) || 1));
  return 1 + (lv - 1) * 0.12;
}
