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
    passive: '+15% Defesa',
  },
  archer: {
    id: 'archer',
    name: 'Arqueiro',
    attrs: { str: 4, con: 4, agi: 8, dex: 8, int: 3 },
    passive: '+10% Chance Crítica',
  },
  mage: {
    id: 'mage',
    name: 'Mago',
    attrs: { str: 2, con: 4, agi: 4, dex: 5, int: 10 },
    passive: '+20% Dano Mágico',
  },
  cleric: {
    id: 'cleric',
    name: 'Clérigo',
    attrs: { str: 4, con: 7, agi: 3, dex: 4, int: 8 },
    passive: 'Regenera HP lentamente',
  },
});

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
