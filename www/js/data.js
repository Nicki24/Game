// Éclipsia — données de l'univers : classes, compétences, compagnons, monstres, zones, quêtes, objets
'use strict';

G.data = (() => {
  // ---------------------------------------------------------------- Éléments
  const ELEMENTS = {
    phys:    { name: 'Physique', color: '#e8e8e8', icon: '⚔' },
    feu:     { name: 'Feu',      color: '#ff7a2f', icon: '🔥' },
    glace:   { name: 'Glace',    color: '#7fd8ff', icon: '❄' },
    foudre:  { name: 'Foudre',   color: '#ffe04a', icon: '⚡' },
    nature:  { name: 'Nature',   color: '#7ddc52', icon: '🌿' },
    ombre:   { name: 'Ombre',    color: '#b06bff', icon: '☾' },
    lumiere: { name: 'Lumière',  color: '#fff3b0', icon: '☀' },
  };
  // Cycle élémentaire : feu > nature > foudre > glace > feu ; lumière <> ombre
  const STRONG = {
    feu: ['nature', 'glace'], nature: ['foudre'], foudre: ['glace'], glace: ['feu'],
    lumiere: ['ombre'], ombre: ['lumiere'], phys: [],
  };
  function elementMod(att, def) {
    if (!att || att === 'phys' || !def) return 1;
    if (STRONG[att] && STRONG[att].includes(def)) return 1.5;
    if (att === def) return 0.5;
    return 1;
  }

  // ---------------------------------------------------------------- Classes
  // Chaque classe : stats de base (niv. 1) + croissance par niveau, attaque de base, 4 compétences
  const CLASSES = {
    tempete: {
      name: 'Lame-Tempête', title: 'Guerrière de la foudre', element: 'foudre', weapon: 'epee',
      desc: "Combattante de mêlée qui canalise l'orage dans sa lame. Robuste, dévastatrice au corps à corps.",
      base: { hp: 125, mp: 40, atk: 12, mag: 4, def: 8, crit: 5, spd: 64 },
      grow: { hp: 19, mp: 4, atk: 2.7, mag: 0.8, def: 1.9 },
      basic: { type: 'melee', range: 24, arc: 1.9, cd: 0.42, power: 'atk' },
      pal: { h: '#e8eef8', a: '#2f5fbf', b: '#ffd34a', c: '#7a4b22', d: '#28324a', f: '#4a2f1a', s: '#f2c79a' },
      skills: ['tranche_foudre', 'tourbillon', 'charge_orage', 'cri_titan'],
    },
    arcaniste: {
      name: 'Arcaniste de Braise', title: 'Mage des éléments', element: 'feu', weapon: 'baton',
      desc: "Érudit qui plie le feu, la glace et la foudre à sa volonté. Fragile mais d'une puissance terrifiante.",
      base: { hp: 82, mp: 95, atk: 5, mag: 15, def: 4, crit: 6, spd: 60 },
      grow: { hp: 11, mp: 10, atk: 1, mag: 3.1, def: 1 },
      basic: { type: 'proj', range: 150, cd: 0.6, power: 'mag', speed: 190, proj: 'orb', element: 'phys' },
      pal: { h: '#c0392b', a: '#6a2c91', b: '#ff9a3c', c: '#3a1d4f', d: '#2a1838', f: '#3b2614', s: '#f5d2b0' },
      skills: ['boule_braise', 'lance_givre', 'pluie_meteores', 'chaine_eclairs'],
    },
    rodeuse: {
      name: 'Rôdeuse des Vents', title: 'Archère des cimes', element: 'ombre', weapon: 'arc',
      desc: "Chasseuse agile qui frappe de loin. Coups critiques fréquents et grande vitesse de déplacement.",
      base: { hp: 96, mp: 55, atk: 11, mag: 6, def: 5, crit: 12, spd: 72 },
      grow: { hp: 14, mp: 6, atk: 2.6, mag: 1.2, def: 1.3 },
      basic: { type: 'proj', range: 160, cd: 0.48, power: 'atk', speed: 240, proj: 'arrow', element: 'phys' },
      pal: { h: '#3d2a1a', a: '#2e7d4f', b: '#c8a24a', c: '#5b3a1e', d: '#2c3b2a', f: '#3a2414', s: '#e0a878' },
      skills: ['tir_percant', 'volee', 'piege_ombre', 'danse_vent'],
    },
    sentinelle: {
      name: "Sentinelle d'Aube", title: 'Paladine de la lumière', element: 'lumiere', weapon: 'masse',
      desc: "Gardienne sacrée, à la fois bouclier et soigneuse. Idéale pour garder toute l'équipe en vie.",
      base: { hp: 135, mp: 72, atk: 9, mag: 10, def: 10, crit: 4, spd: 58 },
      grow: { hp: 20, mp: 8, atk: 2, mag: 2.2, def: 2.2 },
      basic: { type: 'melee', range: 22, arc: 1.7, cd: 0.5, power: 'atk' },
      pal: { h: '#f4d03f', a: '#ecf0f1', b: '#f1c40f', c: '#a67c2e', d: '#7f8c8d', f: '#5d4a2a', s: '#f4cfa4' },
      skills: ['frappe_sacree', 'priere_aube', 'jugement', 'egide'],
    },
  };

  // ---------------------------------------------------------------- Compétences
  // type: slash | nova | dash | buff | proj | zone | chain | heal
  const SKILLS = {
    // Lame-Tempête
    tranche_foudre: { name: 'Tranche-Foudre', type: 'slash', el: 'foudre', mult: 1.9, per: 0.3, mp: 8, cd: 3, lvl: 1, radius: 36, arc: 2.2, status: ['shock', 0.3],
      desc: "Un arc de foudre devant vous. Peut paralyser." },
    tourbillon: { name: "Tourbillon d'Acier", type: 'nova', el: 'phys', mult: 1.3, per: 0.22, mp: 14, cd: 7, lvl: 3, radius: 46, hits: 3,
      desc: "Tourne sur vous-même et frappe 3 fois tout autour." },
    charge_orage: { name: 'Charge Orageuse', type: 'dash', el: 'foudre', mult: 2.2, per: 0.35, mp: 12, cd: 6, lvl: 6, dist: 90,
      desc: "Fonce à travers les ennemis en les électrocutant." },
    cri_titan: { name: 'Cri du Titan', type: 'buff', el: 'phys', mp: 20, cd: 25, lvl: 10, dur: 10, party: true, buff: { atk: 0.3, def: 0.2 }, per: 0.06,
      desc: "Galvanise l'équipe : +30% attaque et +20% défense." },
    // Arcaniste
    boule_braise: { name: 'Boule de Braise', type: 'proj', el: 'feu', mult: 2.0, per: 0.35, mp: 10, cd: 2.5, lvl: 1, speed: 170, explode: 28, proj: 'fire', status: ['burn', 0.5],
      desc: "Projectile explosif qui enflamme les ennemis." },
    lance_givre: { name: 'Lance de Givre', type: 'proj', el: 'glace', mult: 1.7, per: 0.3, mp: 12, cd: 4, lvl: 3, speed: 260, pierce: true, proj: 'ice', status: ['slow', 0.8],
      desc: "Lance perforante qui ralentit tout sur son passage." },
    pluie_meteores: { name: 'Pluie de Météores', type: 'zone', el: 'feu', mult: 0.8, per: 0.15, mp: 28, cd: 12, lvl: 6, radius: 46, ticks: 6, dur: 2.4, delay: 0.3, status: ['burn', 0.3],
      desc: "Des météores s'abattent sur une large zone." },
    chaine_eclairs: { name: "Chaîne d'Éclairs", type: 'chain', el: 'foudre', mult: 1.6, per: 0.28, mp: 22, cd: 8, lvl: 10, jumps: 6, status: ['shock', 0.4],
      desc: "Un éclair rebondit sur 6 ennemis proches." },
    // Rôdeuse
    tir_percant: { name: 'Tir Perçant', type: 'proj', el: 'phys', mult: 2.1, per: 0.35, mp: 8, cd: 3, lvl: 1, speed: 320, pierce: true, proj: 'arrow',
      desc: "Une flèche qui traverse toute une ligne d'ennemis." },
    volee: { name: 'Volée de Flèches', type: 'proj', el: 'phys', mult: 1.1, per: 0.2, mp: 14, cd: 5, lvl: 3, speed: 260, count: 5, spread: 0.9, proj: 'arrow',
      desc: "Tire 5 flèches en éventail." },
    piege_ombre: { name: "Piège d'Ombre", type: 'zone', el: 'ombre', mult: 0.6, per: 0.12, mp: 18, cd: 10, lvl: 6, radius: 38, ticks: 6, dur: 3, delay: 0, status: ['slow', 1],
      desc: "Une zone d'ombre qui ronge et ralentit les ennemis." },
    danse_vent: { name: 'Danse du Vent', type: 'buff', el: 'phys', mp: 20, cd: 20, lvl: 10, dur: 8, party: false, buff: { spd: 0.4, crit: 25, atk: 0.15 }, per: 0.05,
      desc: "Vitesse +40%, critique +25% et attaque +15%." },
    // Sentinelle
    frappe_sacree: { name: 'Frappe Sacrée', type: 'slash', el: 'lumiere', mult: 1.9, per: 0.3, mp: 8, cd: 3, lvl: 1, radius: 32, arc: 2.0, lifesteal: 0.15,
      desc: "Coup béni qui vous rend une partie des dégâts infligés." },
    priere_aube: { name: "Prière d'Aube", type: 'heal', el: 'lumiere', mult: 0.25, per: 0.05, mp: 20, cd: 10, lvl: 3,
      desc: "Soigne toute l'équipe (25% PV + puissance magique)." },
    jugement: { name: 'Jugement Céleste', type: 'zone', el: 'lumiere', mult: 3.0, per: 0.5, mp: 22, cd: 9, lvl: 6, radius: 42, ticks: 1, dur: 0.1, delay: 0.7, status: ['stun', 0.8],
      desc: "Une colonne de lumière foudroie la zone ciblée." },
    egide: { name: "Égide d'Aube", type: 'buff', el: 'lumiere', mp: 25, cd: 25, lvl: 10, dur: 10, party: true, buff: { def: 0.5, regen: 0.02 }, per: 0.1,
      desc: "Défense +50% et régénération pour toute l'équipe." },
    // Compagnons
    provocation: { name: 'Provocation', type: 'taunt', el: 'phys', cd: 9, radius: 90, buff: { def: 0.5 }, dur: 5 },
    soin_lysa: { name: 'Souffle de Vie', type: 'healone', el: 'lumiere', cd: 6, mult: 0.3 },
    lames_ombre: { name: 'Lames Ombrales', type: 'nova', el: 'ombre', mult: 1.6, cd: 7, radius: 40, hits: 2 },
    arc_tesla: { name: 'Arc Tesla', type: 'chain', el: 'foudre', mult: 1.3, cd: 6, jumps: 4, status: ['shock', 0.3] },
  };

  // ---------------------------------------------------------------- Compagnons (mercenaires)
  const COMPANIONS = {
    brom: {
      name: "Brom Cœur-d'Enclume", role: 'Protecteur', race: 'Nain', cost: 120, unlock: 0, weapon: 'hache',
      desc: "Ancien forgeron de Cendrefer. Attire les ennemis sur lui et encaisse les coups.",
      base: { hp: 150, atk: 9, mag: 2, def: 12, crit: 4, spd: 56 }, grow: { hp: 22, atk: 2, mag: 0.4, def: 2.3 },
      basic: { type: 'melee', range: 22, arc: 1.8, cd: 0.7, power: 'atk' }, skill: 'provocation', ai: 'tank',
      pal: { h: '#b5522b', a: '#7f8c8d', b: '#c0392b', c: '#4a3020', d: '#3b3b46', f: '#2a1c12', s: '#e6b48a' }, short: true,
    },
    lysa: {
      name: 'Lysa Feuillelune', role: 'Soigneuse', race: 'Elfe', cost: 220, unlock: 1, weapon: 'baton',
      desc: "Prêtresse sylvestre. Soigne l'allié le plus blessé et lance des orbes de lumière.",
      base: { hp: 85, atk: 4, mag: 11, def: 5, crit: 5, spd: 62 }, grow: { hp: 12, atk: 0.8, mag: 2.4, def: 1.1 },
      basic: { type: 'proj', range: 130, cd: 0.9, power: 'mag', speed: 170, proj: 'light', element: 'lumiere' }, skill: 'soin_lysa', ai: 'healer',
      pal: { h: '#dfe7a8', a: '#3f9b5a', b: '#f2f2d0', c: '#2b5e37', d: '#2a4a32', f: '#3a2a18', s: '#f5dcc0' },
    },
    kaira: {
      name: 'Kaïra Lame-Nocturne', role: 'Assassine', race: 'Humaine', cost: 420, unlock: 2, weapon: 'dague',
      desc: "Espionne repentie de la Citadelle. Rapide, mortelle, coups critiques fréquents.",
      base: { hp: 95, atk: 12, mag: 4, def: 5, crit: 22, spd: 74 }, grow: { hp: 13, atk: 2.8, mag: 0.6, def: 1.1 },
      basic: { type: 'melee', range: 20, arc: 1.6, cd: 0.38, power: 'atk' }, skill: 'lames_ombre', ai: 'dps',
      pal: { h: '#1b1b2f', a: '#3b2b5a', b: '#b06bff', c: '#1f1530', d: '#201a2e', f: '#120d1a', s: '#d9a27c' },
    },
    pip: {
      name: 'Pip Rouage', role: 'Mécanomancien', race: 'Gnome', cost: 650, unlock: 3, weapon: 'cle',
      desc: "Inventeur génial et un peu fou. Ses arcs électriques rebondissent entre les ennemis.",
      base: { hp: 80, atk: 6, mag: 13, def: 5, crit: 8, spd: 60 }, grow: { hp: 11, atk: 1, mag: 2.8, def: 1 },
      basic: { type: 'proj', range: 140, cd: 0.75, power: 'mag', speed: 220, proj: 'spark', element: 'foudre' }, skill: 'arc_tesla', ai: 'dps',
      pal: { h: '#ff8c1a', a: '#c88a2a', b: '#3dd6d0', c: '#5a3a1a', d: '#4a3a2a', f: '#2a1c12', s: '#f0c8a0' }, short: true,
    },
  };

  // ---------------------------------------------------------------- Monstres
  // tpl = gabarit de sprite ; rank : normal | elite | boss
  const MONSTERS = {
    // Forêt de Sylvebrume
    gluant:      { name: 'Gluant de Brume', tpl: 'slime', el: 'nature', hp: 1, atk: 0.8, def: 0.6, spd: 34, xp: 1, ai: 'melee', pal: { a: '#5fcf5a', b: '#2f8a3a', l: '#c8ffb0', e: '#0b2a10' }, drop: 'gelee' },
    loup_brume:  { name: 'Loup-Brume', tpl: 'beast', el: 'phys', hp: 1.1, atk: 1.1, def: 0.8, spd: 58, xp: 1.2, ai: 'melee', pal: { a: '#8c97a8', b: '#2b2b2b', c: '#c8d0dc', e: '#ffdd55' }, drop: 'croc' },
    sporelin:    { name: 'Sporelin', tpl: 'mushroom', el: 'nature', hp: 0.9, atk: 0.9, def: 0.6, spd: 30, xp: 1.2, ai: 'ranged', proj: 'spore', status: ['poison', 0.5], pal: { a: '#c0392b', b: '#f6e7c8', s: '#f0e2c0', e: '#2b1b0b' } },
    racine_noire:{ name: 'Racine-Noire, Gardien Corrompu', tpl: 'tree', el: 'nature', hp: 14, atk: 1.6, def: 1.2, spd: 30, xp: 12, ai: 'boss', rank: 'boss', scale: 2,
      patterns: ['slam', 'summon', 'ring'], summon: 'gluant', pal: { a: '#3b5d2a', b: '#6d8f3a', c: '#4a2f1d', l: '#ff4d6d' } },
    // Mines de Cendrefer
    gobelin:     { name: 'Gobelin Mineur', tpl: 'humanoid', el: 'phys', hp: 1, atk: 1.1, def: 0.9, spd: 54, xp: 1.1, ai: 'melee', weapon: 'pioche', small: true, pal: { h: '#6b4b2a', s: '#7fb24a', a: '#7a5230', b: '#d0a040', c: '#3a2410', d: '#4a3a2a', f: '#2a1c12', e: '#ff3b3b' }, drop: 'minerai' },
    chauve_braise:{ name: 'Chauve-Souris de Braise', tpl: 'bat', el: 'feu', hp: 0.7, atk: 0.9, def: 0.5, spd: 70, xp: 1, ai: 'melee', fly: true, pal: { a: '#8a2b1a', e: '#ffcc33' } },
    golem_cendre:{ name: 'Golem de Cendre', tpl: 'golem', el: 'feu', hp: 2.2, atk: 1.4, def: 1.6, spd: 30, xp: 2, ai: 'melee', rank: 'elite', pal: { a: '#4a4038', b: '#ff6a1a', l: '#ffd23a' } },
    kragg:       { name: 'Kragg, le Forgeur Déchu', tpl: 'golem', el: 'feu', hp: 16, atk: 1.7, def: 1.5, spd: 36, xp: 14, ai: 'boss', rank: 'boss', scale: 2.2,
      patterns: ['slam', 'charge', 'ring', 'summon'], summon: 'chauve_braise', pal: { a: '#2e2420', b: '#ff3c00', l: '#ffe14a' } },
    // Lac de Givrelune
    esprit_givre:{ name: 'Esprit de Givre', tpl: 'ghost', el: 'glace', hp: 0.9, atk: 1.1, def: 0.7, spd: 44, xp: 1.2, ai: 'ranged', proj: 'ice', fly: true, status: ['slow', 0.4], pal: { a: '#bfefff', b: '#6cc7f0', e: '#1b3a6b' } },
    yeti:        { name: 'Yéti des Glaces', tpl: 'beast', el: 'glace', hp: 1.8, atk: 1.3, def: 1.2, spd: 46, xp: 1.6, ai: 'melee', rank: 'elite', pal: { a: '#eef6ff', b: '#3a4a6b', c: '#a8c8ff', e: '#2b6cff' }, drop: 'fourrure' },
    loup_givre:  { name: 'Loup de Givrelune', tpl: 'beast', el: 'glace', hp: 1.1, atk: 1.1, def: 0.9, spd: 62, xp: 1.2, ai: 'melee', pal: { a: '#7fa8d8', b: '#1c2a4a', c: '#d8ecff', e: '#e0ffff' } },
    nivara:      { name: 'Nivara, Reine Glaciale', tpl: 'ghost', el: 'glace', hp: 17, atk: 1.8, def: 1.4, spd: 40, xp: 16, ai: 'boss', rank: 'boss', scale: 2.4, fly: true,
      patterns: ['ring', 'slam', 'nova', 'summon'], summon: 'esprit_givre', pal: { a: '#e8fbff', b: '#4aa8e8', e: '#0b1f4a' } },
    // Ruines Solaires
    scorpion:    { name: 'Scorpion de Verre', tpl: 'scorpion', el: 'foudre', hp: 1.2, atk: 1.2, def: 1.3, spd: 52, xp: 1.3, ai: 'melee', status: ['poison', 0.3], pal: { a: '#d8b45a', b: '#8ae8ff', e: '#ff3030' }, drop: 'dard' },
    momie:       { name: 'Momie Foudroyée', tpl: 'humanoid', el: 'foudre', hp: 1.4, atk: 1.2, def: 1, spd: 40, xp: 1.4, ai: 'melee', pal: { h: '#e8dcc0', s: '#d8cba8', a: '#e0d4b4', b: '#ffe04a', c: '#a89a78', d: '#c8bb98', f: '#8a7c5c', e: '#4af0ff' } },
    gardien_ruine:{ name: 'Gardien des Ruines', tpl: 'golem', el: 'foudre', hp: 1.6, atk: 1.2, def: 1.5, spd: 26, xp: 1.6, ai: 'ranged', proj: 'spark', rank: 'elite', pal: { a: '#b89b5e', b: '#3a86ff', l: '#ffe04a' } },
    colosse:     { name: "Colosse d'Orage", tpl: 'golem', el: 'foudre', hp: 19, atk: 1.9, def: 1.7, spd: 34, xp: 18, ai: 'boss', rank: 'boss', scale: 2.6,
      patterns: ['charge', 'ring', 'slam', 'nova'], summon: 'scorpion', pal: { a: '#8d7a4a', b: '#4ad8ff', l: '#fff36a' } },
    // Citadelle de l'Éclipse
    chevalier_ombre:{ name: "Chevalier de l'Éclipse", tpl: 'humanoid', el: 'ombre', hp: 1.6, atk: 1.3, def: 1.4, spd: 50, xp: 1.5, ai: 'melee', weapon: 'epee', pal: { h: '#2a2238', s: '#4a3a5a', a: '#3a2a52', b: '#b06bff', c: '#1a1226', d: '#241a34', f: '#120d1a', e: '#ff3bd0' } },
    spectre:     { name: 'Spectre du Néant', tpl: 'ghost', el: 'ombre', hp: 1, atk: 1.3, def: 0.8, spd: 48, xp: 1.4, ai: 'ranged', proj: 'shadow', fly: true, pal: { a: '#6a4a9a', b: '#2a1a4a', e: '#ff4af0' } },
    chien_neant: { name: 'Chien du Néant', tpl: 'beast', el: 'ombre', hp: 1.2, atk: 1.3, def: 0.9, spd: 66, xp: 1.3, ai: 'melee', pal: { a: '#3a2a52', b: '#0d0a14', c: '#7a5aa8', e: '#ff3b6b' } },
    morvane:     { name: 'Morvane, Souverain du Néant', tpl: 'humanoid', el: 'ombre', hp: 24, atk: 2.1, def: 1.8, spd: 44, xp: 30, ai: 'boss', rank: 'boss', scale: 2.4, weapon: 'epee', crown: true, final: true,
      patterns: ['ring', 'slam', 'charge', 'summon', 'nova'], summon: 'spectre', pal: { h: '#0d0a14', s: '#c8b8e8', a: '#1a1028', b: '#ff2b6b', c: '#3a1a52', d: '#120a1e', f: '#0a0610', e: '#ff2b2b' } },
  };

  // ---------------------------------------------------------------- Zones
  const ZONES = [
    { id: 'aubeclair', name: 'Aubeclair', sub: 'Village des Gardiens', town: true, theme: 'village', music: 0 },
    { id: 'sylvebrume', name: 'Forêt de Sylvebrume', sub: 'Niveaux 1 – 6', lvl: [1, 6], theme: 'forest', music: 1,
      mobs: ['gluant', 'loup_brume', 'sporelin'], boss: 'racine_noire', fragment: 'Fragment de Sève', seed: 1101 },
    { id: 'cendrefer', name: 'Mines de Cendrefer', sub: 'Niveaux 6 – 11', lvl: [6, 11], theme: 'mine', music: 2,
      mobs: ['gobelin', 'chauve_braise', 'golem_cendre'], boss: 'kragg', fragment: 'Fragment de Braise', seed: 2202 },
    { id: 'givrelune', name: 'Lac de Givrelune', sub: 'Niveaux 11 – 16', lvl: [11, 16], theme: 'ice', music: 3,
      mobs: ['esprit_givre', 'loup_givre', 'yeti'], boss: 'nivara', fragment: 'Fragment de Givre', seed: 3303 },
    { id: 'ruines', name: 'Ruines Solaires', sub: 'Niveaux 16 – 21', lvl: [16, 21], theme: 'desert', music: 4,
      mobs: ['scorpion', 'momie', 'gardien_ruine'], boss: 'colosse', fragment: "Fragment d'Orage", seed: 4404 },
    { id: 'citadelle', name: "Citadelle de l'Éclipse", sub: 'Niveaux 21 – 26', lvl: [21, 26], theme: 'citadel', music: 5,
      mobs: ['chevalier_ombre', 'spectre', 'chien_neant'], boss: 'morvane', fragment: "Cœur d'Aube", seed: 5505 },
  ];

  // ---------------------------------------------------------------- Objets
  const RARITIES = [
    { id: 0, name: 'Commun',     color: '#d8d8d8', mult: 1.0,  affixes: 0, w: 60 },
    { id: 1, name: 'Magique',    color: '#5aa9ff', mult: 1.2,  affixes: 1, w: 28 },
    { id: 2, name: 'Rare',       color: '#ffd84a', mult: 1.45, affixes: 2, w: 9 },
    { id: 3, name: 'Héroïque',   color: '#c77dff', mult: 1.75, affixes: 3, w: 2.7 },
    { id: 4, name: 'Légendaire', color: '#ff8c2a', mult: 2.1,  affixes: 4, w: 0.3 },
  ];
  const SLOTS = { weapon: 'Arme', armor: 'Armure', helm: 'Casque', ring: 'Talisman' };
  const WEAPON_NAMES = {
    epee: ['Épée', 'Lame', 'Glaive', 'Claymore', 'Épée runique'],
    baton: ['Bâton', 'Sceptre', 'Bâton-étoile', 'Crosse', 'Sceptre astral'],
    arc: ['Arc court', 'Arc long', 'Arc composite', 'Arc-lune', 'Arc céleste'],
    masse: ['Masse', 'Marteau', 'Fléau', 'Masse sacrée', "Marteau d'aube"],
  };
  const GEAR_NAMES = {
    armor: ['Tunique', 'Cotte de mailles', 'Cuirasse', 'Armure de plates', 'Armure astrale'],
    helm: ['Capuche', 'Casque', 'Heaume', 'Couronne', 'Diadème'],
    ring: ['Anneau', 'Amulette', 'Talisman', 'Sceau', 'Relique'],
  };
  const SUFFIXES = [
    [],
    ['du Renard', "de l'Ours", 'du Hibou', 'du Loup', 'du Faucon'],
    ["de l'Aube", 'du Crépuscule', 'des Tempêtes', 'des Brumes', 'des Braises'],
    ['des Anciens', 'du Titan', 'de la Lune Rouge', 'des Gardiens'],
    ["d'Éclipsia", 'du Premier Soleil', 'du Néant Vaincu', 'de Valdris'],
  ];
  const AFFIXES = ['atk', 'mag', 'def', 'hp', 'mp', 'crit', 'spd'];
  const STAT_NAMES = { atk: 'Attaque', mag: 'Magie', def: 'Défense', hp: 'PV', mp: 'PM', crit: 'Critique', spd: 'Vitesse' };

  const CONSUMABLES = {
    potion_vie:   { name: 'Potion de Vie',   price: 30,  desc: 'Rend 40% des PV de toute l\'équipe.', color: '#ff4d6d' },
    potion_mana:  { name: 'Potion de Mana',  price: 25,  desc: 'Rend 40% des PM.', color: '#4d8dff' },
    elixir:       { name: "Élixir d'Aube",   price: 140, desc: 'Rend 100% des PV et PM.', color: '#ffd84a' },
    parchemin:    { name: 'Parchemin de Retour', price: 40, desc: 'Vous téléporte à Aubeclair.', color: '#d8c8a0' },
  };

  // ---------------------------------------------------------------- Quêtes
  // type : talk | boss | kill | collect
  const QUESTS = {
    m1: { main: true, name: "L'Éveil du Gardien", giver: 'selene', type: 'boss', target: 'racine_noire', zone: 1,
      desc: "Séléné vous envoie dans la Forêt de Sylvebrume. Vainquez le gardien corrompu et rapportez le Fragment de Sève.",
      reward: { xp: 150, gold: 150 }, next: 'm2' },
    m2: { main: true, name: 'Le Feu sous la Montagne', giver: 'selene', type: 'boss', target: 'kragg', zone: 2,
      desc: "Le deuxième fragment bat dans les Mines de Cendrefer, aux mains de Kragg, l'ancien maître-forgeron.",
      reward: { xp: 500, gold: 350 }, next: 'm3' },
    m3: { main: true, name: 'Les Larmes de la Lune', giver: 'selene', type: 'boss', target: 'nivara', zone: 3,
      desc: "Le lac de Givrelune a gelé en plein été. Nivara, la Reine Glaciale, garde le Fragment de Givre.",
      reward: { xp: 1200, gold: 700 }, next: 'm4' },
    m4: { main: true, name: "Le Réveil du Colosse", giver: 'selene', type: 'boss', target: 'colosse', zone: 4,
      desc: "Dans les Ruines Solaires, un colosse ancien s'est éveillé, le Fragment d'Orage incrusté dans son torse.",
      reward: { xp: 2500, gold: 1200 }, next: 'm5' },
    m5: { main: true, name: "L'Éclipse Éternelle", giver: 'selene', type: 'boss', target: 'morvane', zone: 5,
      desc: "Les quatre fragments réunis ouvrent la Citadelle de l'Éclipse. Affrontez Morvane et rallumez l'aube.",
      reward: { xp: 5000, gold: 3000 }, next: null },
    s1: { name: 'Gelée en Pagaille', giver: 'mila', type: 'collect', target: 'gluant', item: 'Gelée de gluant', count: 6, rate: 0.6, minLvl: 1,
      desc: "Mila veut de la gelée de gluant pour « fabriquer une lampe qui brille ». Rapportez-en 6.",
      reward: { xp: 80, gold: 60, item: 'potion_vie', qty: 3 } },
    s2: { name: 'La Meute Grise', giver: 'bastien', type: 'kill', target: 'loup_brume', count: 10, minLvl: 2,
      desc: "Les Loups-Brume attaquent les voyageurs. Le garde Bastien demande d'en abattre 10.",
      reward: { xp: 140, gold: 120, gear: 1 } },
    s3: { name: 'Minerai Maudit', giver: 'tilda', type: 'collect', target: 'gobelin', item: 'Minerai de cendre', count: 8, rate: 0.5, minLvl: 6,
      desc: "La forgeronne Tilda a besoin de minerai de cendre volé par les gobelins.",
      reward: { xp: 400, gold: 250, stars: 6 } },
    s4: { name: 'Fourrure Polaire', giver: 'orvin', type: 'collect', target: 'yeti', item: 'Fourrure de yéti', count: 5, rate: 0.6, minLvl: 11,
      desc: "Orvin le marchand veut vendre des manteaux. Rapportez 5 fourrures de yéti.",
      reward: { xp: 900, gold: 600, gear: 2 } },
    s5: { name: 'Le Dard de Verre', giver: 'garance', type: 'kill', target: 'scorpion', count: 15, minLvl: 16,
      desc: "Mère Garance a perdu un client à cause d'un scorpion de verre. Éliminez-en 15.",
      reward: { xp: 1800, gold: 900, item: 'elixir', qty: 3 } },
    s6: { name: 'Chasseur de Spectres', giver: 'bastien', type: 'kill', target: 'spectre', count: 12, minLvl: 21,
      desc: "Bastien veut s'assurer que les spectres ne descendront pas jusqu'au village.",
      reward: { xp: 3500, gold: 1500, gear: 3 } },
  };

  // ---------------------------------------------------------------- PNJ du village
  const NPCS = {
    selene:  { name: 'Séléné', title: "Oracle de l'Aube", tx: 20, ty: 6, pal: { h: '#e8e8ff', a: '#f0f0ff', b: '#ffd84a', c: '#b0a0e0', d: '#d0c8f0', f: '#8a7aa8', s: '#f4dcc8' }, role: 'story' },
    orvin:   { name: 'Orvin', title: 'Marchand', tx: 31, ty: 13, pal: { h: '#7a4a2a', a: '#2a8a6a', b: '#ffd84a', c: '#5a3a1a', d: '#3a3a4a', f: '#2a1c12', s: '#e8b890' }, role: 'shop' },
    tilda:   { name: 'Tilda', title: 'Forgeronne', tx: 9, ty: 13, pal: { h: '#ff6a2a', a: '#5a4a3a', b: '#c0392b', c: '#3a2a1a', d: '#3a3030', f: '#1a120c', s: '#e0a070' }, role: 'forge' },
    garance: { name: 'Mère Garance', title: "Taverne de l'Étoile Filante", tx: 11, ty: 23, pal: { h: '#b0b0b0', a: '#8a3a5a', b: '#f0e0c0', c: '#5a2a3a', d: '#4a2a3a', f: '#2a1c12', s: '#f0c8a8' }, role: 'tavern' },
    bastien: { name: 'Bastien', title: 'Garde du village', tx: 26, ty: 24, pal: { h: '#a0a8b8', a: '#4a5a7a', b: '#c0c8d8', c: '#3a2a1a', d: '#3a4050', f: '#2a1c12', s: '#e0b088' }, role: 'quest' },
    mila:    { name: 'Mila', title: 'Petite curieuse', tx: 17, ty: 17, pal: { h: '#ffb04a', a: '#ff6a8a', b: '#ffffff', c: '#c04a6a', d: '#5a3a6a', f: '#3a2a1a', s: '#f8d8b8' }, role: 'quest', small: true },
  };

  // ---------------------------------------------------------------- Histoire
  const INTRO = [
    "Il y a mille ans, le Cœur d'Aube brillait au sommet du monde.",
    "Sa lumière maintenait dans le ciel l'archipel de Valdris, des îles flottant au-dessus d'une mer de nuages.",
    "Mais Morvane, un mage obsédé par l'immortalité, voulut boire sa lumière. Le Cœur se brisa en cinq fragments…",
    "Depuis cette nuit appelée la Grande Fracture, une éclipse s'étend lentement. Les îles s'enfoncent dans le Néant.",
    "Les fragments ont corrompu les gardiens qui les protégeaient. Les monstres deviennent plus forts à chaque crépuscule.",
    "Au village d'Aubeclair, l'Oracle Séléné a vu un signe dans les étoiles : un Gardien de l'Aube vient de s'éveiller.",
    "C'est vous.",
  ];

  const ENDING = [
    "Morvane s'effondre. Sa couronne d'ombre se fend et un cri résonne jusqu'aux confins du ciel.",
    "Les cinq fragments s'élèvent, tournoient… et le Cœur d'Aube se reforme dans une explosion de lumière dorée.",
    "Pour la première fois depuis mille ans, le soleil se lève sans ombre sur Valdris.",
    "Les îles remontent lentement au-dessus des nuages. À Aubeclair, on danse jusqu'au matin.",
    "Votre nom sera chanté dans chaque taverne de l'archipel : Gardien de l'Aube.",
    "Mais l'aventure continue : les zones restent ouvertes pour forger le meilleur équipement légendaire…",
  ];

  // Dialogues de Séléné selon l'avancement (index = nombre de quêtes principales terminées)
  const SELENE_LINES = [
    ["Gardien… enfin. Les étoiles ne m'ont pas menti.", "La Forêt de Sylvebrume, à l'est, était autrefois paisible. Son gardien, Racine-Noire, a été corrompu par le premier fragment.", "Prends le Portail des Vents au nord-est du village. Ramène-moi le Fragment de Sève."],
    ["Le Fragment de Sève pulse dans tes mains… je sens la forêt respirer à nouveau.", "Mais l'éclipse s'étend. Le prochain fragment est enfoui dans les Mines de Cendrefer.", "Kragg, l'ancien maître-forgeron, l'a fondu dans son propre corps. Méfie-toi de son feu."],
    ["Deux fragments ! Brom m'a dit que tu avais libéré son ancien maître. Merci.", "Le lac de Givrelune a gelé en plein été. La Reine Nivara y garde le Fragment de Givre.", "Le feu est fort contre la glace. Souviens-t'en."],
    ["Le froid quitte enfin mes os… Il ne reste que deux fragments.", "Dans les Ruines Solaires, un colosse forgé par les anciens rois s'est réveillé.", "Il porte le Fragment d'Orage dans sa poitrine. La glace ralentira sa course."],
    ["Quatre fragments. Je peux maintenant ouvrir le chemin vers la Citadelle de l'Éclipse.", "Morvane t'y attend. Il a bu tant de Néant qu'il n'est plus vraiment humain.", "La lumière est sa faiblesse. Va, Gardien. Que l'aube te guide."],
    ["Le Cœur d'Aube brille à nouveau. Grâce à toi, Valdris vivra.", "Les zones restent instables : des monstres légendaires y rôdent encore. Entraîne-toi, Gardien !"],
  ];

  const NPC_LINES = {
    orvin: ["Bienvenue, bienvenue ! Potions, armes, armures… Tout est garanti sans malédiction. Ou presque."],
    tilda: ["Une lame mal entretenue, c'est un Gardien mort. Montre-moi ton équipement.", "Avec des Éclats d'étoile, je peux le renforcer. Et si ça rate, rien n'est détruit : je ne suis pas une amatrice !"],
    garance: ["Bienvenue à l'Étoile Filante ! Ici, les mercenaires boivent, se reposent… et cherchent du travail.", "Tu peux en recruter deux pour t'accompagner. Ils grandissent avec toi."],
    bastien: ["Halte ! Ah, c'est toi, Gardien. Le village compte sur toi."],
    mila: ["T'es un vrai Gardien ? Trop bien ! Tu me montres ton épée ?"],
  };

  return {
    ELEMENTS, elementMod, CLASSES, SKILLS, COMPANIONS, MONSTERS, ZONES, RARITIES, SLOTS,
    WEAPON_NAMES, GEAR_NAMES, SUFFIXES, AFFIXES, STAT_NAMES, CONSUMABLES, QUESTS, NPCS,
    INTRO, ENDING, SELENE_LINES, NPC_LINES,
  };
})();
