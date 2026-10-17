// Éclipsia — objets : génération aléatoire, rareté, statistiques, forge, recyclage
'use strict';

G.items = (() => {
  const D = G.data, U = G.util;

  function rollRarity(boost = 0) {
    const entries = D.RARITIES.map((r) => [r.id, r.id === 0 ? r.w / (1 + boost) : r.w * Math.pow(1 + boost, r.id)]);
    return U.weighted(entries);
  }

  function affixValue(stat, lvl, rar) {
    switch (stat) {
      case 'atk': case 'mag': return Math.round(2 + lvl * 0.8 + rar);
      case 'def': return Math.round(1 + lvl * 0.6 + rar);
      case 'hp': return Math.round(8 + lvl * 4 + rar * 5);
      case 'mp': return Math.round(5 + lvl * 2 + rar * 3);
      case 'crit': return U.randInt(1, 3) + rar;
      case 'spd': return U.randInt(3, 6) + rar;
    }
    return 0;
  }

  function generate(lvl, opts = {}) {
    const cls = D.CLASSES[opts.cls || G.state.save.cls];
    lvl = Math.max(1, Math.round(lvl));
    const slot = opts.slot || U.weighted([['weapon', 35], ['armor', 25], ['helm', 20], ['ring', 20]]);
    const rarity = opts.rarity != null ? opts.rarity : rollRarity(opts.boost || 0);
    const R = D.RARITIES[rarity];
    const tier = U.clamp(Math.floor((lvl - 1) / 5), 0, 4);
    const stats = {};
    let kind, base;
    if (slot === 'weapon') {
      kind = cls.weapon;
      base = D.WEAPON_NAMES[kind][tier];
      const main = cls.basic.power;
      stats[main] = Math.round((4 + lvl * 2.2) * R.mult);
      if (main === 'mag') stats.mp = Math.round((4 + lvl) * R.mult);
    } else if (slot === 'armor') {
      kind = 'armor'; base = D.GEAR_NAMES.armor[tier];
      stats.def = Math.round((3 + lvl * 1.5) * R.mult);
      stats.hp = Math.round((10 + lvl * 6) * R.mult);
    } else if (slot === 'helm') {
      kind = 'helm'; base = D.GEAR_NAMES.helm[tier];
      stats.def = Math.round((2 + lvl * 0.9) * R.mult);
      stats.hp = Math.round((5 + lvl * 3) * R.mult);
    } else {
      kind = 'ring'; base = D.GEAR_NAMES.ring[tier];
      stats.mp = Math.round((5 + lvl * 2) * R.mult);
      const a = U.choice(['atk', 'mag', 'crit']);
      stats[a] = (stats[a] || 0) + affixValue(a, lvl, rarity);
    }
    for (let i = 0; i < R.affixes; i++) {
      const a = U.choice(D.AFFIXES);
      stats[a] = (stats[a] || 0) + affixValue(a, lvl, rarity);
    }
    let el = null;
    if (slot === 'weapon' && rarity >= 2 && Math.random() < 0.55) el = U.choice(['feu', 'glace', 'foudre', 'nature', 'ombre', 'lumiere']);
    const suffix = rarity > 0 ? ' ' + U.choice(D.SUFFIXES[rarity]) : '';
    return { uid: U.uid() + '_' + Date.now(), slot, kind, name: base + suffix, rarity, lvl, stats, plus: 0, el };
  }

  // Statistiques effectives (avec le bonus de forge)
  function stats(it) {
    const m = 1 + 0.1 * (it.plus || 0);
    const out = {};
    for (const k in it.stats) out[k] = k === 'crit' || k === 'spd' ? it.stats[k] + Math.floor((it.plus || 0) / 3) : Math.round(it.stats[k] * m);
    return out;
  }

  function score(it) {
    if (!it) return 0;
    const s = stats(it);
    return (s.atk || 0) * 2 + (s.mag || 0) * 2 + (s.def || 0) * 2 + (s.hp || 0) * 0.3 + (s.mp || 0) * 0.3 + (s.crit || 0) * 3 + (s.spd || 0) * 2;
  }

  function price(it) {
    return Math.round((10 + it.lvl * 4) * (1 + it.rarity * 1.2) * (1 + (it.plus || 0) * 0.3));
  }

  function displayName(it) {
    return it.name + (it.plus ? ' +' + it.plus : '');
  }

  function icon(it) {
    const col = D.RARITIES[it.rarity].color;
    const glow = it.el ? D.ELEMENTS[it.el].color : null;
    return G.sprites.itemIcon(it.kind, col, glow);
  }

  // Forge
  const CHANCES = [100, 95, 90, 80, 70, 60, 50, 40, 32, 25];
  function forgeCost(it) {
    return { gold: Math.round((20 + it.lvl * 8) * (it.plus + 1)), stars: it.plus + 1, chance: CHANCES[it.plus] || 0 };
  }
  function salvageValue(it) { return 1 + it.rarity * 2 + (it.plus || 0); }

  return { generate, stats, score, price, displayName, icon, forgeCost, salvageValue, rollRarity };
})();
