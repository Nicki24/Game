// Éclipsia — boucle de jeu, zones, quêtes, butin, progression et sauvegarde
'use strict';

G.game = (() => {
  const D = G.data, U = G.util, W = G.world, C = G.combat;
  const SAVE_KEY = 'eclipsia_save_v1';
  let villageCache = null;
  let last = 0, saveTimer = 0, revealTimer = 0;

  G.state = {
    mode: 'title', save: null, zone: D.ZONES[0], zoneIdx: 0, map: null, mapCanvas: null, hero: null,
    party: [], mobs: [], projs: [], drops: [], npcs: [], gzones: [], teles: [], timers: [],
    time: 0, lien: 0, combo: 0, comboT: 0, shakeT: 0, shakeAmp: 0, flashT: 0, flashCol: '#fff', auto: false,
    boss: null, bossPortal: null, interactTarget: null,
  };
  const S = G.state;

  // ================================================================ Utilitaires
  function after(t, fn) { S.timers.push({ t, fn }); }
  function shake(a) { S.shakeAmp = Math.max(S.shakeT > 0 ? S.shakeAmp : 0, a); S.shakeT = 0.25; }
  function flash(col) { S.flashT = 0.35; S.flashCol = col; }
  function isNight() { const d = S.save ? S.save.day : 0; return d > 0.6 && d < 0.93; }
  function darkness() {
    if (!S.save) return 0;
    const d = S.save.day;
    let k = 0;
    if (d > 0.5 && d <= 0.6) k = (d - 0.5) / 0.1;
    else if (d > 0.6 && d < 0.9) k = 1;
    else if (d >= 0.9) k = 1 - (d - 0.9) / 0.1;
    return k * (S.zone.town ? 0.45 : 0.62);
  }
  const xpNeed = (l) => Math.floor(40 * Math.pow(l, 1.75));

  // ================================================================ Nouvelle partie / chargement
  function newSave(name, cls) {
    const c = D.CLASSES[cls];
    const save = {
      v: 1, name, cls, lvl: 1, xp: 0, gold: 60, sp: 0, skills: { [c.skills[0]]: 1 },
      equip: { weapon: null, armor: null, helm: null, ring: null }, inv: [],
      cons: { potion_vie: 5, potion_mana: 3, elixir: 0, parchemin: 1 }, stars: 2,
      quests: {}, mainDone: 0, recruited: [], party: [], ranks: {}, bestiary: {}, visits: {},
      day: 0.15, playTime: 0, kills: 0, ended: false, settings: { music: true, sfx: true },
    };
    S.save = save;
    save.equip.weapon = G.items.generate(1, { slot: 'weapon', rarity: 0, cls });
    save.equip.armor = G.items.generate(1, { slot: 'armor', rarity: 0, cls });
    return save;
  }

  function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
  function save() {
    if (!S.save) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S.save)); } catch (e) { /* stockage indisponible */ }
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      S.save = JSON.parse(raw);
      return true;
    } catch (e) { return false; }
  }
  function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* rien */ } }

  function startPlaying() {
    G.audio.setMusic(S.save.settings.music);
    G.audio.setSfx(S.save.settings.sfx);
    S.mode = 'play';
    buildParty();
    enterZone(0);
    G.ui.showHUD(true);
  }

  function buildParty() {
    S.hero = C.makeHero(S.save, 0, 0);
    S.party = [S.hero];
    for (const cid of S.save.party) S.party.push(C.makeAlly(cid, 0, 0));
  }

  // ================================================================ Zones
  function enterZone(idx) {
    const zone = D.ZONES[idx];
    S.zone = zone; S.zoneIdx = idx;
    S.mobs = []; S.projs = []; S.drops = []; S.gzones = []; S.teles = []; S.timers = []; S.npcs = [];
    S.boss = null; S.bossPortal = null; S.combo = 0;
    G.fx.clear();
    if (zone.town) {
      if (!villageCache) {
        const map = W.makeVillage();
        villageCache = { map, canvas: G.sprites.renderMap(map) };
        W.makeMinimap(map);
      }
      S.map = villageCache.map; S.mapCanvas = villageCache.canvas;
      for (const nid in D.NPCS) {
        const n = D.NPCS[nid];
        S.npcs.push({ isNpc: true, nid, name: n.name, x: n.tx * 16 + 8, y: n.ty * 16 + 8, tpl: 'humanoid', pal: n.pal, short: n.small, faceX: 1, anim: 0, st: {}, hurtT: 0 });
      }
    } else {
      S.save.visits[zone.id] = (S.save.visits[zone.id] || 0) + 1;
      S.map = W.makeDungeon(zone, S.save.visits[zone.id]);
      S.mapCanvas = G.sprites.renderMap(S.map);
      W.makeMinimap(S.map);
      spawnMonsters(zone);
    }
    // Placement de l'équipe
    const st = S.map.start;
    for (let i = 0; i < S.party.length; i++) {
      const p = S.party[i];
      p.x = st.x + (i ? (i === 1 ? -14 : 14) : 0); p.y = st.y + (i ? 10 : 0);
      if (W.solidAt(S.map, p.x, p.y)) { p.x = st.x; p.y = st.y; }
      p.dead = false; p.st = {}; p.dash = null; p.roll = null; p.target = null;
      if (zone.town) { p.hp = p.mhp; if (p.kind === 'hero') p.mp = p.mmp; }
    }
    G.render.cam.x = 0;
    W.revealAround(S.map, S.hero.x, S.hero.y);
    G.ui.setMinimap(S.map);
    G.ui.banner(zone.name, zone.sub);
    G.ui.bossBar(null);
    G.audio.playMusic(zone.music);
    G.audio.sfx('portal');
    save();
  }

  function spawnMonsters(zone) {
    const map = S.map;
    for (const sp of map.spawns) {
      const prog = sp.d / map.maxDist;
      const lvl = Math.round(zone.lvl[0] + prog * (zone.lvl[1] - zone.lvl[0] - 1));
      const type = U.weighted(zone.mobs.map((m) => [m, D.MONSTERS[m].rank === 'elite' ? 0.35 : 1]));
      const n = D.MONSTERS[type].rank === 'elite' ? U.randInt(1, 2) : U.randInt(2, 4);
      for (let i = 0; i < n; i++) {
        const t = i === 0 ? type : U.chance(0.6) ? type : U.choice(zone.mobs.filter((m) => D.MONSTERS[m].rank !== 'elite'));
        const p = W.freeNear(map, sp.x, sp.y, 1.5);
        S.mobs.push(C.makeMob(t, lvl + (D.MONSTERS[t].rank === 'elite' ? 1 : 0), p.x, p.y));
      }
    }
    const boss = C.makeMob(zone.boss, zone.lvl[1], map.boss.x, map.boss.y);
    S.mobs.push(boss);
    S.boss = boss;
  }

  function onBossAggro(m) {
    G.ui.banner(m.name, 'Niveau ' + m.lvl + ' — ' + D.ELEMENTS[m.el].name);
    G.ui.bossBar(m);
    G.audio.playMusic(6);
    G.audio.sfx('boss');
    shake(5);
  }

  // ================================================================ Butin et progression
  function onMobKilled(m) {
    const s = S.save;
    s.kills++;
    s.bestiary[m.mid] = (s.bestiary[m.mid] || 0) + 1;
    const xpMul = (m.night ? 1.25 : 1) * (m.summoned ? 0.3 : 1);
    gainXp(Math.round((8 + 5 * (m.lvl - 1)) * m.def.xp * xpMul));
    // Butin
    const drop = (type, extra) => {
      const p = { x: m.x + U.rand(-10, 10), y: m.y + U.rand(-8, 8), type, ...extra };
      if (W.solidAt(S.map, p.x, p.y)) { p.x = m.x; p.y = m.y; }
      S.drops.push(p);
    };
    const boss = m.rank === 'boss', elite = m.rank === 'elite';
    if (!m.summoned || U.chance(0.3)) {
      if (U.chance(0.75) || boss) drop('gold', { v: Math.round((2 + m.lvl * 1.6) * (boss ? 25 : elite ? 3 : 1) * U.rand(0.7, 1.3)) });
      if (U.chance(boss ? 1 : elite ? 0.3 : 0.08)) drop('item', { item: G.items.generate(m.lvl, { boost: boss ? 2.5 : elite ? 0.8 : 0 }) });
      if (boss) { drop('item', { item: G.items.generate(m.lvl, { boost: 3, rarity: Math.max(2, G.items.rollRarity(3)) }) }); for (let i = 0; i < 4; i++) drop('star'); }
      if (U.chance(elite ? 0.3 : 0.07)) drop('star');
      if (U.chance(0.06)) drop('cons', { id: U.chance(0.6) ? 'potion_vie' : 'potion_mana' });
    }
    // Quêtes
    for (const qid in s.quests) {
      const q = D.QUESTS[qid], qs = s.quests[qid];
      if (qs.st !== 'active' || q.target !== m.mid) continue;
      if (q.type === 'kill') {
        qs.n++;
        G.ui.toast(`${q.name} : ${Math.min(qs.n, q.count)}/${q.count}`);
        if (qs.n >= q.count) { qs.st = 'ready'; G.ui.toast(`Quête terminée ! Retournez voir ${D.NPCS[q.giver].name}.`, 'gold'); G.audio.sfx('loot'); }
      } else if (q.type === 'collect' && U.chance(q.rate)) {
        qs.n++;
        G.ui.toast(`${q.item} : ${Math.min(qs.n, q.count)}/${q.count}`);
        if (qs.n >= q.count) { qs.st = 'ready'; G.ui.toast(`Quête terminée ! Retournez voir ${D.NPCS[q.giver].name}.`, 'gold'); G.audio.sfx('loot'); }
      } else if (q.type === 'boss') {
        qs.st = 'done';
        s.mainDone++;
        gainXp(q.reward.xp); s.gold += q.reward.gold;
        after(1.2, () => onMainQuestDone(qid));
      }
    }
    if (boss) {
      G.ui.bossBar(null);
      G.audio.playMusic(S.zone.music);
      S.bossPortal = { x: m.x, y: m.y + 30 };
      if (W.solidAt(S.map, S.bossPortal.x, S.bossPortal.y)) S.bossPortal = { x: m.x, y: m.y };
      for (const o of S.mobs) if (o.summoned && !o.dead) { o.dead = true; G.fx.burst(o.x, o.y, '#fff', 8, 40); }
      flash('#ffffff'); shake(8);
      G.ui.banner('VICTOIRE !', m.name + ' est vaincu');
    }
    save();
  }

  function onMainQuestDone(qid) {
    const q = D.QUESTS[qid];
    const zone = D.ZONES[q.zone];
    if (D.MONSTERS[q.target].final) {
      S.save.ended = true; save();
      after(1.5, () => G.ui.showEnding());
      return;
    }
    G.ui.dialog([{ name: 'Gardien', text: `Vous obtenez le ${zone.fragment} ! Il brille d'une lumière chaude dans votre main.` },
      { name: 'Séléné (vision)', text: "Bravo, Gardien. Reviens à Aubeclair, j'ai une nouvelle mission pour toi." }]);
  }

  function gainXp(n) {
    const s = S.save;
    if (s.lvl >= 30) return;
    s.xp += n;
    let up = false;
    while (s.lvl < 30 && s.xp >= xpNeed(s.lvl)) {
      s.xp -= xpNeed(s.lvl);
      s.lvl++; s.sp++; up = true;
      const newSk = D.CLASSES[s.cls].skills.find((id) => D.SKILLS[id].lvl === s.lvl);
      if (newSk) after(1, () => G.ui.toast('Nouvelle compétence disponible : ' + D.SKILLS[newSk].name, 'gold'));
    }
    if (up) {
      C.refreshHero();
      for (const p of S.party) if (!p.dead) { p.hp = p.mhp; if (p.kind === 'hero') p.mp = p.mmp; }
      G.fx.ring(S.hero.x, S.hero.y - 4, 30, '#ffd84a');
      G.fx.burst(S.hero.x, S.hero.y - 10, '#ffd84a', 24, 80);
      G.fx.text(S.hero.x, S.hero.y - 30, 'NIVEAU ' + s.lvl + ' !', '#ffd84a', 1.6);
      G.audio.sfx('levelup');
      G.ui.toast('Niveau ' + s.lvl + ' ! +1 point de compétence', 'gold');
    }
  }

  function pickup(d) {
    const s = S.save;
    if (d.type === 'gold') { s.gold += d.v; G.fx.text(d.x, d.y - 10, '+' + d.v + ' or', '#ffd84a', 0.8); G.audio.sfx('coin'); }
    else if (d.type === 'star') { s.stars++; G.fx.text(d.x, d.y - 10, "+1 Éclat d'étoile", '#9fe8ff', 0.8); G.audio.sfx('loot'); }
    else if (d.type === 'cons') { s.cons[d.id]++; G.fx.text(d.x, d.y - 10, D.CONSUMABLES[d.id].name, D.CONSUMABLES[d.id].color, 0.8); G.audio.sfx('loot'); }
    else if (d.type === 'item') {
      if (s.inv.length >= 40) { G.ui.toast('Inventaire plein !'); return false; }
      s.inv.push(d.item);
      G.ui.toast('Obtenu : ' + G.items.displayName(d.item), D.RARITIES[d.item.rarity].color);
      G.audio.sfx('loot');
    }
    return true;
  }

  // ================================================================ Actions du joueur
  function usePotion(id, auto) {
    const s = S.save, h = S.hero;
    if (!s.cons[id]) { if (!auto) G.ui.toast('Plus de ' + D.CONSUMABLES[id].name); return false; }
    if (h.potCd > 0 || h.dead) return false;
    if (id === 'parchemin') {
      if (S.zone.town) { G.ui.toast('Vous êtes déjà au village'); return false; }
      s.cons[id]--; enterZone(0); return true;
    }
    s.cons[id]--;
    h.potCd = 1;
    const team = S.party.filter(C.alive);
    if (id === 'potion_vie') for (const p of team) C.heal(p, p.mhp * 0.4);
    if (id === 'potion_mana') { h.mp = Math.min(h.mmp, h.mp + h.mmp * 0.4); G.fx.text(h.x, h.y - 20, '+PM', '#6aa8ff'); }
    if (id === 'elixir') { for (const p of team) C.heal(p, p.mhp); h.mp = h.mmp; }
    G.fx.burst(h.x, h.y - 8, D.CONSUMABLES[id].color, 12, 40);
    G.audio.sfx('heal');
    return true;
  }

  function equip(it) {
    const s = S.save;
    const i = s.inv.indexOf(it);
    if (i < 0) return;
    const old = s.equip[it.slot];
    s.inv.splice(i, 1);
    if (old) s.inv.push(old);
    s.equip[it.slot] = it;
    C.refreshHero(); save();
    G.audio.sfx('loot');
  }
  function unequip(slot) {
    const s = S.save;
    if (!s.equip[slot] || s.inv.length >= 40) return;
    if (slot === 'weapon') { G.ui.toast('Vous devez garder une arme'); return; }
    s.inv.push(s.equip[slot]); s.equip[slot] = null;
    C.refreshHero(); save();
  }
  function sell(it) {
    const s = S.save, i = s.inv.indexOf(it);
    if (i < 0) return;
    s.inv.splice(i, 1); s.gold += G.items.price(it);
    G.audio.sfx('coin'); save();
  }
  function salvage(it) {
    const s = S.save, i = s.inv.indexOf(it);
    if (i < 0) return;
    s.inv.splice(i, 1); const v = G.items.salvageValue(it); s.stars += v;
    G.ui.toast(`Recyclage : +${v} Éclat(s) d'étoile`, '#9fe8ff');
    G.audio.sfx('forge_ok'); save();
  }
  function forge(it) {
    const s = S.save;
    if (it.plus >= 10) return { ok: false, msg: 'Niveau maximum atteint (+10)' };
    const c = G.items.forgeCost(it);
    if (s.gold < c.gold) return { ok: false, msg: "Pas assez d'or" };
    if (s.stars < c.stars) return { ok: false, msg: "Pas assez d'Éclats d'étoile" };
    s.gold -= c.gold; s.stars -= c.stars;
    const ok = Math.random() * 100 < c.chance;
    if (ok) it.plus++;
    C.refreshHero(); save();
    G.audio.sfx(ok ? 'forge_ok' : 'forge_ko');
    return { ok, msg: ok ? `Succès ! ${G.items.displayName(it)}` : "Échec… l'objet est intact, seuls les matériaux sont perdus." };
  }
  function buy(id) {
    const s = S.save, c = D.CONSUMABLES[id];
    if (s.gold < c.price) { G.ui.toast("Pas assez d'or"); return false; }
    s.gold -= c.price; s.cons[id]++;
    G.audio.sfx('coin'); save();
    return true;
  }
  function buyItem(it, price) {
    const s = S.save;
    if (s.gold < price) { G.ui.toast("Pas assez d'or"); return false; }
    if (s.inv.length >= 40) { G.ui.toast('Inventaire plein !'); return false; }
    s.gold -= price; s.inv.push(it);
    G.audio.sfx('coin'); save();
    return true;
  }
  function learnSkill(id) {
    const s = S.save, sk = D.SKILLS[id];
    const r = s.skills[id] || 0;
    if (s.sp <= 0 || r >= 5 || s.lvl < sk.lvl) return false;
    s.sp--; s.skills[id] = r + 1;
    G.audio.sfx('buff'); save();
    return true;
  }
  function recruit(cid) {
    const s = S.save, c = D.COMPANIONS[cid];
    if (s.recruited.includes(cid) || s.gold < c.cost) return false;
    s.gold -= c.cost; s.recruited.push(cid);
    if (s.party.length < 2) s.party.push(cid);
    buildPartyKeepHero();
    G.audio.sfx('levelup'); save();
    return true;
  }
  function toggleParty(cid) {
    const s = S.save;
    const i = s.party.indexOf(cid);
    if (i >= 0) s.party.splice(i, 1);
    else if (s.party.length < 2) s.party.push(cid);
    else { G.ui.toast("L'équipe est complète (2 compagnons max)"); return; }
    buildPartyKeepHero(); save();
  }
  function train(cid) {
    const s = S.save, c = D.COMPANIONS[cid];
    const r = s.ranks[cid] || 0;
    if (r >= 5) return false;
    const cost = Math.round(c.cost * (r + 1) * 0.8);
    if (s.gold < cost) { G.ui.toast("Pas assez d'or"); return false; }
    s.gold -= cost; s.ranks[cid] = r + 1;
    C.refreshHero(); buildPartyKeepHero();
    G.audio.sfx('buff'); save();
    return true;
  }
  function trainCost(cid) { return Math.round(D.COMPANIONS[cid].cost * ((S.save.ranks[cid] || 0) + 1) * 0.8); }

  function buildPartyKeepHero() {
    const h = S.hero;
    S.party = [h];
    for (const cid of S.save.party) {
      const a = C.makeAlly(cid, h.x + U.rand(-12, 12), h.y + 12);
      if (W.solidAt(S.map, a.x, a.y)) { a.x = h.x; a.y = h.y; }
      S.party.push(a);
    }
  }

  // ================================================================ PNJ et quêtes
  function availableQuests(nid) {
    const s = S.save;
    const out = [];
    for (const qid in D.QUESTS) {
      const q = D.QUESTS[qid];
      if (q.giver !== nid || s.quests[qid]) continue;
      if (q.main) { if (qid === 'm' + (s.mainDone + 1)) out.push(qid); }
      else if (s.lvl >= q.minLvl) out.push(qid);
    }
    return out;
  }
  function readyQuests(nid) {
    return Object.keys(S.save.quests).filter((id) => D.QUESTS[id].giver === nid && S.save.quests[id].st === 'ready');
  }
  function npcMarker(nid) {
    if (readyQuests(nid).length) return '?';
    if (availableQuests(nid).length) return '!';
    return null;
  }

  function turnIn(qid) {
    const s = S.save, q = D.QUESTS[qid], r = q.reward;
    s.quests[qid].st = 'done';
    gainXp(r.xp); s.gold += r.gold;
    const parts = [`${r.xp} XP`, `${r.gold} or`];
    if (r.item) { s.cons[r.item] += r.qty; parts.push(`${r.qty} × ${D.CONSUMABLES[r.item].name}`); }
    if (r.stars) { s.stars += r.stars; parts.push(`${r.stars} Éclats d'étoile`); }
    if (r.gear) {
      const it = G.items.generate(s.lvl, { rarity: r.gear });
      if (s.inv.length < 40) s.inv.push(it); else s.equip.ring = s.equip.ring || it;
      parts.push(G.items.displayName(it));
    }
    G.audio.sfx('levelup');
    save();
    return parts.join(', ');
  }

  function interactNpc(nid) {
    const n = D.NPCS[nid];
    const s = S.save;
    const portrait = G.sprites.portrait('humanoid', n.pal, n.small);
    const say = (text) => ({ name: n.name, text, portrait });
    // 1) Quêtes à rendre
    const ready = readyQuests(nid);
    if (ready.length) {
      const qid = ready[0];
      const rew = turnIn(qid);
      G.ui.dialog([say(`Merci, Gardien ! « ${D.QUESTS[qid].name} » est accomplie.`), { name: 'Récompense', text: rew }], () => interactNpc(nid));
      return;
    }
    // 2) Histoire principale
    if (nid === 'selene') {
      const avail = availableQuests(nid);
      const lines = D.SELENE_LINES[Math.min(s.mainDone, D.SELENE_LINES.length - 1)].map(say);
      if (avail.length) {
        G.ui.dialog(lines, () => {
          s.quests[avail[0]] = { st: 'active', n: 0 };
          G.ui.toast('Nouvelle quête : ' + D.QUESTS[avail[0]].name, 'gold');
          G.ui.toast('Nouvelle zone accessible : ' + D.ZONES[D.QUESTS[avail[0]].zone].name, 'gold');
          G.audio.sfx('buff'); save();
        });
      } else {
        const active = Object.keys(s.quests).find((id) => D.QUESTS[id].main && s.quests[id].st === 'active');
        G.ui.dialog(active ? [lines[lines.length - 1], say("Que l'aube te guide, Gardien.")] : lines);
      }
      return;
    }
    // 3) Quêtes secondaires proposées
    const avail = availableQuests(nid);
    const intro = (D.NPC_LINES[nid] || ['…']).map(say);
    const roleAction = () => {
      if (n.role === 'shop') G.ui.openShop();
      else if (n.role === 'forge') G.ui.openForge();
      else if (n.role === 'tavern') G.ui.openTavern();
    };
    if (avail.length) {
      const qid = avail[0], q = D.QUESTS[qid];
      G.ui.dialog(intro.concat([say(q.desc)]), null, [
        { label: 'Accepter la quête', fn: () => { s.quests[qid] = { st: 'active', n: 0 }; G.ui.toast('Nouvelle quête : ' + q.name, 'gold'); G.audio.sfx('buff'); save(); roleAction(); } },
        { label: 'Plus tard', fn: roleAction },
      ]);
      return;
    }
    const active = Object.keys(s.quests).find((id) => D.QUESTS[id].giver === nid && s.quests[id].st === 'active');
    const lines = active ? intro.concat([say(`Alors, « ${D.QUESTS[active].name} » ? ${progressText(active)}`)]) : intro;
    G.ui.dialog(lines, roleAction);
  }

  function progressText(qid) {
    const q = D.QUESTS[qid], qs = S.save.quests[qid];
    if (q.type === 'boss') return 'Vaincre ' + D.MONSTERS[q.target].name;
    return `${Math.min(qs.n, q.count)}/${q.count} ${q.type === 'collect' ? q.item : D.MONSTERS[q.target].name}`;
  }

  function zoneUnlocked(i) { return i === 0 || !!S.save.quests['m' + i]; }

  function interact() {
    const t = S.interactTarget;
    if (!t) return false;
    G.input.reset();
    if (t.type === 'npc') interactNpc(t.nid);
    else if (t.type === 'portal') {
      if (S.zone.town) G.ui.openPortal();
      else G.ui.confirm('Retourner au village d\'Aubeclair ?', () => enterZone(0));
    }
    return true;
  }

  function findInteract() {
    const h = S.hero;
    let best = null, bd = 26;
    for (const n of S.npcs) { const d = U.dist(h, n); if (d < bd) { bd = d; best = { type: 'npc', nid: n.nid, label: 'Parler' }; } }
    for (const p of [S.map.portal, S.bossPortal]) {
      if (!p) continue;
      const d = Math.hypot(h.x - p.x, h.y - p.y);
      if (d < bd) { bd = d; best = { type: 'portal', label: S.zone.town ? 'Voyager' : 'Village' }; }
    }
    S.interactTarget = best;
  }

  // ================================================================ Mort
  function onHeroDeath() {
    G.audio.sfx('die');
    S.mode = 'dying';
    after(1.4, () => { S.mode = 'dead'; G.ui.showDead(); });
  }
  function respawn() {
    const lost = Math.floor(S.save.gold * 0.1);
    S.save.gold -= lost;
    S.mode = 'play';
    for (const p of S.party) { p.dead = false; p.hp = p.mhp; p.buffs = []; }
    S.hero.mp = S.hero.mmp;
    enterZone(0);
    if (lost) G.ui.toast(`Vous avez perdu ${lost} pièces d'or.`);
  }

  // ================================================================ Boucle principale
  function update(dt) {
    S.time += dt;
    for (const t of S.timers) t.t -= dt;
    const due = S.timers.filter((t) => t.t <= 0);
    S.timers = S.timers.filter((t) => t.t > 0);
    for (const t of due) t.fn();
    if (S.shakeT > 0) S.shakeT -= dt; else S.shakeAmp = 0;
    if (S.flashT > 0) S.flashT -= dt;
    G.fx.update(dt);
    if (S.mode !== 'play' && S.mode !== 'dying') return;
    const inp = G.input;
    inp.update();
    const blocked = G.ui.isBlocking();
    if (blocked) { inp.clearPresses(); return; }
    S.save.playTime += dt;
    S.save.day = (S.save.day + dt / 300) % 1;
    if (S.comboT > 0) { S.comboT -= dt; if (S.comboT <= 0) S.combo = 0; }

    if (S.mode === 'play') {
      findInteract();
      if (inp.consume('menu')) { G.ui.openMenu(); return; }
      if (inp.consume('auto')) toggleAuto();
      if (inp.consume('potion_vie')) usePotion('potion_vie');
      if (inp.consume('potion_mana')) usePotion('potion_mana');
      if (inp.consume('interact')) interact();
      if (inp.consume('interact_or_attack') && S.zone.town) interact();
      if (S.zone.town && inp.attack && S.interactTarget) { interact(); return; }
    }
    const h = S.hero;
    h.anim += dt;
    if (!h.dead) C.updateHero(h, dt, inp);
    for (const a of S.party) if (a.kind === 'ally') { a.anim += dt; C.updateAlly(a, dt); }
    for (const m of S.mobs) if (!m.dead) C.updateMob(m, dt);
    for (const n of S.npcs) { n.anim += dt; n.faceX = h.x < n.x ? -1 : 1; }
    C.updateProjs(dt);
    C.updateZones(dt);
    C.separate();
    S.mobs = S.mobs.filter((m) => !m.dead);
    // Ramassage automatique avec aimant
    for (const d of S.drops) {
      const dd = Math.hypot(h.x - d.x, h.y - d.y);
      if (dd < 60 && !h.dead) { const k = Math.min(1, dt * 6); d.x += (h.x - d.x) * k; d.y += (h.y - d.y) * k; }
      if (dd < 10 && !h.dead && !d.taken) d.taken = pickup(d);
    }
    S.drops = S.drops.filter((d) => !d.taken);
    revealTimer -= dt;
    if (revealTimer <= 0) { revealTimer = 0.25; W.revealAround(S.map, h.x, h.y); }
    saveTimer += dt;
    if (saveTimer > 20) { saveTimer = 0; save(); }
  }

  function toggleAuto() {
    S.auto = !S.auto;
    G.ui.toast(S.auto ? 'Combat automatique activé' : 'Combat automatique désactivé');
  }

  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    try {
      update(dt);
      if (S.map && (S.mode === 'play' || S.mode === 'dying' || S.mode === 'dead')) G.render.draw(dt);
      G.ui.update(dt);
    } catch (err) {
      console.error(err);
    }
    requestAnimationFrame(frame);
  }

  function start() {
    G.render.init(document.getElementById('game'));
    G.input.init();
    G.ui.init();
    G.ui.showTitle();
    requestAnimationFrame((t) => { last = t; frame(t); });
  }

  return {
    start, after, shake, flash, isNight, darkness, xpNeed, newSave, hasSave, save, load, wipe, startPlaying,
    enterZone, onBossAggro, onMobKilled, onHeroDeath, respawn, usePotion, equip, unequip, sell, salvage, forge,
    buy, buyItem, learnSkill, recruit, toggleParty, train, trainCost, npcMarker, interact, zoneUnlocked,
    progressText, toggleAuto, gainXp,
  };
})();

window.addEventListener('load', () => G.game.start());
