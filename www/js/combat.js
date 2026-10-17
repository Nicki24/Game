// Éclipsia — entités, combat, compétences et intelligence artificielle
'use strict';

G.combat = (() => {
  const D = G.data, U = G.util, W = G.world;
  const S = () => G.state;

  // ================================================================ Création d'entités
  function heroStats(save) {
    const c = D.CLASSES[save.cls];
    const L = save.lvl - 1;
    const s = {
      hp: c.base.hp + c.grow.hp * L, mp: c.base.mp + c.grow.mp * L,
      atk: c.base.atk + c.grow.atk * L, mag: c.base.mag + c.grow.mag * L,
      def: c.base.def + c.grow.def * L, crit: c.base.crit, spd: c.base.spd,
    };
    let spdPct = 0;
    for (const slot in save.equip) {
      const it = save.equip[slot];
      if (!it) continue;
      const st = G.items.stats(it);
      for (const k in st) { if (k === 'spd') spdPct += st[k]; else s[k] += st[k]; }
    }
    s.spd = s.spd * (1 + spdPct / 100);
    for (const k of ['hp', 'mp', 'atk', 'mag', 'def']) s[k] = Math.round(s[k]);
    return s;
  }

  function makeHero(save, x, y) {
    const c = D.CLASSES[save.cls];
    const st = heroStats(save);
    return {
      id: 'hero', kind: 'hero', team: 'ally', name: save.name, x, y, r: 5,
      hp: st.hp, mhp: st.hp, mp: st.mp, mmp: st.mp, s: st, lvl: save.lvl,
      tpl: 'humanoid', pal: c.pal, weapon: c.weapon, basic: c.basic, el: null,
      buffs: [], st: {}, faceX: 1, dir: 0, atkCd: 0, anim: 0, hurtT: 0, skillCd: {},
      rollCd: 0, iframes: 0, potCd: 0, lastHit: 99,
    };
  }

  function refreshHero() {
    const S0 = S(), h = S0.hero;
    if (!h) return;
    const st = heroStats(S0.save);
    const hpR = h.hp / h.mhp, mpR = h.mp / h.mmp;
    h.s = st; h.mhp = st.hp; h.mmp = st.mp; h.lvl = S0.save.lvl;
    h.hp = Math.min(h.mhp, Math.max(1, Math.round(hpR * h.mhp)));
    h.mp = Math.min(h.mmp, Math.round(mpR * h.mmp));
    for (const a of S0.party) if (a.kind === 'ally') { const p = allyStats(a.cid); const r = a.hp / a.mhp; a.s = p; a.mhp = p.hp; a.hp = Math.max(a.dead ? 0 : 1, Math.round(r * a.mhp)); a.lvl = S0.save.lvl; }
  }

  function allyStats(cid) {
    const c = D.COMPANIONS[cid], save = S().save;
    const L = save.lvl - 1, rank = (save.ranks && save.ranks[cid]) || 0;
    const m = 1 + 0.1 * rank;
    return {
      hp: Math.round((c.base.hp + c.grow.hp * L) * m), mp: 100,
      atk: Math.round((c.base.atk + c.grow.atk * L) * m), mag: Math.round((c.base.mag + c.grow.mag * L) * m),
      def: Math.round((c.base.def + c.grow.def * L) * m), crit: c.base.crit + rank * 2, spd: c.base.spd,
    };
  }

  function makeAlly(cid, x, y) {
    const c = D.COMPANIONS[cid];
    const st = allyStats(cid);
    return {
      id: 'ally_' + cid, cid, kind: 'ally', team: 'ally', name: c.name.split(' ')[0], x, y, r: 5,
      hp: st.hp, mhp: st.hp, mp: 100, mmp: 100, s: st, lvl: S().save.lvl,
      tpl: 'humanoid', pal: c.pal, short: c.short, weapon: c.weapon, basic: c.basic, ai: c.ai, skillId: c.skill,
      buffs: [], st: {}, faceX: 1, dir: 0, atkCd: 0, anim: 0, hurtT: 0, skillCd: 2, reviveT: 0, el: null,
    };
  }

  function makeMob(mid, lvl, x, y, opts = {}) {
    const d = D.MONSTERS[mid];
    const L = lvl - 1;
    const night = G.game.isNight();
    const nm = night ? 1.2 : 1;
    const elite = d.rank === 'elite', boss = d.rank === 'boss';
    const hpMult = boss ? 1.8 : 1;
    const mhp = Math.round((24 + 16 * L) * d.hp * nm * hpMult);
    const m = {
      id: 'm' + U.uid(), mid, kind: 'mob', team: 'enemy', name: d.name, x, y, r: boss ? 9 : elite ? 7 : 5,
      hp: mhp, mhp, s: {
        atk: (6 + 3.2 * L) * d.atk * nm, mag: (6 + 3.2 * L) * d.atk * nm,
        def: (2 + 1.4 * L) * d.def, crit: boss ? 8 : 4, spd: d.spd,
      },
      lvl, def: d, rank: d.rank || 'normal', el: d.el, tpl: d.tpl, pal: d.pal, short: d.small, weapon: d.weapon,
      scale: d.scale || (elite ? 1.35 : 1), home: { x, y }, state: 'idle', wanderT: U.rand(0, 3), wp: null,
      buffs: [], st: {}, faceX: -1, dir: Math.PI, atkCd: U.rand(0.5, 1.5), anim: U.rand(0, 1), hurtT: 0, windup: 0,
      night, summoned: !!opts.summoned,
    };
    if (boss) m.boss = { cd: 2.5, active: false, phase: 1, charge: null };
    return m;
  }

  // ================================================================ Statistiques en combat
  function buffSum(e, k) {
    let v = 0;
    for (const b of e.buffs) if (b.k[k]) v += b.k[k];
    return v;
  }
  function stat(e, k) {
    const base = e.s[k] || 0;
    if (k === 'crit') return base + buffSum(e, 'crit');
    if (k === 'spd') return base * (1 + buffSum(e, 'spd')) * (e.st.slow > 0 ? 0.5 : 1);
    return base * (1 + buffSum(e, k));
  }
  function addBuff(e, k, dur, tag) {
    e.buffs = e.buffs.filter((b) => b.tag !== tag);
    e.buffs.push({ k, t: dur, tag });
  }

  const alive = (e) => e && !e.dead;
  function foes(e) { return e.team === 'ally' ? S().mobs.filter(alive) : S().party.filter(alive); }
  function friends(e) { return e.team === 'ally' ? S().party.filter(alive) : S().mobs.filter(alive); }
  function nearest(list, p, max = Infinity, needLos = false) {
    let best = null, bd = max * max;
    for (const t of list) {
      const d = U.dist2(p, t);
      if (d < bd && (!needLos || W.los(S().map, p, t))) { bd = d; best = t; }
    }
    return best;
  }

  // ================================================================ Dégâts
  function hit(src, tgt, mult, el = 'phys', opt = {}) {
    const S0 = S();
    if (!alive(tgt)) return 0;
    if (tgt.iframes > 0) { G.fx.text(tgt.x, tgt.y - 16, 'Esquive', '#9fe8ff'); return 0; }
    const power = stat(src, opt.power || (src.basic && src.basic.power) || 'atk');
    let dmg = power * mult * U.rand(0.9, 1.1);
    dmg *= 50 / (50 + stat(tgt, 'def'));
    const em = D.elementMod(el, tgt.el);
    dmg *= em;
    const crit = Math.random() * 100 < stat(src, 'crit') + (opt.critBonus || 0);
    if (crit) dmg *= 1.8;
    if (src.team === 'ally') dmg *= 1 + Math.min(S0.combo, 30) * 0.01;
    if (tgt.boss && tgt.boss.phase === 2) dmg *= 0.85;
    dmg = Math.max(1, Math.round(dmg));
    tgt.hp -= dmg;
    tgt.hurtT = 0.12;
    if (tgt.team === 'ally') tgt.lastHit = 0;
    // Texte flottant
    const col = tgt.team === 'ally' ? '#ff5a5a' : crit ? '#ffd84a' : el !== 'phys' ? D.ELEMENTS[el].color : '#ffffff';
    G.fx.text(tgt.x + U.rand(-4, 4), tgt.y - 14 * (tgt.scale || 1) - 4, dmg + (crit ? '!' : ''), col, crit ? 1.4 : 1);
    if (em > 1 && src.team === 'ally' && Math.random() < 0.5) G.fx.text(tgt.x, tgt.y - 26 * (tgt.scale || 1), 'FAIBLE !', '#ff9a3c', 0.9);
    G.fx.burst(tgt.x, tgt.y - 6, el === 'phys' ? '#ffffff' : D.ELEMENTS[el].color, crit ? 8 : 4, 50);
    G.audio.sfx(crit ? 'crit' : tgt.team === 'ally' ? 'hurt' : 'hit');
    if (crit && src.kind === 'hero') G.game.shake(2);
    // Statuts
    if (opt.status && Math.random() < opt.status[1]) applyStatus(tgt, opt.status[0], src);
    if (opt.lifesteal) heal(src, dmg * opt.lifesteal, true);
    // Lien d'Aube & combo
    if (src.team === 'ally') {
      S0.lien = Math.min(100, S0.lien + (src.kind === 'hero' ? 1.6 : 0.8));
      S0.combo++; S0.comboT = 2.5;
      if (tgt.rank !== 'boss' && !tgt.boss) { const a = U.angleTo(src, tgt); W.move(S0.map, tgt, Math.cos(a) * 2, Math.sin(a) * 2); }
      if (tgt.state === 'idle') tgt.state = 'chase';
      tgt.aggroT = 6;
    }
    if (tgt.hp <= 0) kill(tgt, src);
    return dmg;
  }

  function applyStatus(t, name, src) {
    if (t.boss && name === 'stun') { t.st.slow = 1; return; }
    const dur = { burn: 3, slow: 2.5, stun: 1, shock: 0.8, poison: 4 }[name] || 2;
    if (name === 'shock') name = 'stun';
    t.st[name] = Math.max(t.st[name] || 0, dur);
    if (name === 'burn' || name === 'poison') t.dotDmg = Math.max(1, stat(src, src.basic ? src.basic.power : 'atk') * 0.15);
    const label = { burn: 'Brûlure', slow: 'Ralenti', stun: 'Étourdi', poison: 'Poison' }[name];
    G.fx.text(t.x, t.y - 22, label, { burn: '#ff7a2f', slow: '#7fd8ff', stun: '#ffe04a', poison: '#7ddc52' }[name], 0.8);
  }

  function heal(e, amount, quiet) {
    if (!alive(e)) return;
    amount = Math.round(amount);
    e.hp = Math.min(e.mhp, e.hp + amount);
    if (!quiet || amount > 5) G.fx.text(e.x, e.y - 18, '+' + amount, '#6dff8a', quiet ? 0.8 : 1.1);
  }

  function kill(t, src) {
    const S0 = S();
    t.dead = true; t.hp = 0;
    if (t.team === 'enemy') {
      G.fx.burst(t.x, t.y - 6, D.ELEMENTS[t.el] ? D.ELEMENTS[t.el].color : '#fff', 14, 70);
      G.audio.sfx('die');
      S0.lien = Math.min(100, S0.lien + 4);
      G.game.onMobKilled(t);
    } else {
      G.fx.burst(t.x, t.y - 6, '#ff4d6d', 12, 60);
      if (t.kind === 'ally') { t.reviveT = 15; G.ui.toast(t.name + ' est à terre (retour dans 15 s)'); }
      else G.game.onHeroDeath();
    }
  }

  // ================================================================ Attaques et projectiles
  function shoot(src, angle, spec) {
    const sp = spec.speed || 200;
    S().projs.push({
      x: src.x + Math.cos(angle) * 6, y: src.y - 6 + Math.sin(angle) * 6, vx: Math.cos(angle) * sp, vy: Math.sin(angle) * sp,
      src, team: src.team, mult: spec.mult || 1, el: spec.el || 'phys', kind: spec.kind || 'orb', pierce: spec.pierce,
      explode: spec.explode, status: spec.status, power: spec.power, life: spec.life || 1.1, hit: new Set(), r: spec.r || 4, ang: angle,
    });
  }

  function heroElement(e) {
    if (e.kind !== 'hero') return null;
    const w = S().save.equip.weapon;
    return w && w.el ? w.el : null;
  }

  function basicAttack(e, target) {
    const b = e.basic;
    const dir = target ? U.angleTo(e, target) : e.dir;
    e.dir = dir; e.faceX = Math.cos(dir) >= 0 ? 1 : -1;
    const el = heroElement(e) || b.element || 'phys';
    e.atkCd = b.cd / (1 + buffSum(e, 'spd') * 0.5);
    if (b.type === 'melee') {
      e.swing = { t: 0, max: 0.2, dir, arc: b.arc };
      G.audio.sfx('swing');
      for (const t of foes(e)) {
        const d = U.dist(e, t);
        if (d > b.range + t.r + 4) continue;
        let da = Math.abs(((U.angleTo(e, t) - dir + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (d < 10 || da < b.arc / 2) hit(e, t, 1, el, { power: b.power });
      }
    } else {
      e.swing = { t: 0, max: 0.15, dir, arc: 0 };
      G.audio.sfx('shoot');
      shoot(e, dir, { speed: b.speed, mult: 1, el, kind: el !== 'phys' && b.proj === 'orb' ? el : b.proj, power: b.power, life: b.range / b.speed + 0.15 });
    }
  }

  function skillMult(sk, rank) { return (sk.mult || 0) + (sk.per || 0) * (rank - 1); }

  // Utilise une compétence (héros ou compagnon). Renvoie true si lancée.
  function castSkill(e, id, rank = 1) {
    const sk = D.SKILLS[id];
    const S0 = S();
    const pw = e.kind === 'hero' ? D.CLASSES[S0.save.cls].basic.power : e.basic.power;
    const mult = skillMult(sk, rank);
    const tgt = nearest(foes(e), e, 180, true);
    const dir = tgt ? U.angleTo(e, tgt) : e.dir;
    e.dir = dir; e.faceX = Math.cos(dir) >= 0 ? 1 : -1;
    const opt = { power: pw, status: sk.status, lifesteal: sk.lifesteal };
    const elc = D.ELEMENTS[sk.el].color;
    switch (sk.type) {
      case 'slash': {
        e.swing = { t: 0, max: 0.25, dir, arc: sk.arc };
        G.fx.arc(e.x, e.y - 6, dir, sk.arc, sk.radius, elc);
        G.audio.sfx(sk.el === 'foudre' ? 'zap' : 'swing');
        for (const t of foes(e)) {
          const d = U.dist(e, t);
          if (d > sk.radius + t.r) continue;
          const da = Math.abs(((U.angleTo(e, t) - dir + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
          if (d < 12 || da < sk.arc / 2) hit(e, t, mult, sk.el, opt);
        }
        break;
      }
      case 'nova': {
        const hits = sk.hits || 1;
        for (let i = 0; i < hits; i++) {
          G.game.after(i * 0.2, () => {
            if (!alive(e)) return;
            e.swing = { t: 0, max: 0.2, dir: e.dir + i * 2.1, arc: 6.28 };
            G.fx.ring(e.x, e.y - 4, sk.radius, elc);
            G.audio.sfx('swing');
            for (const t of foes(e)) if (U.dist(e, t) < sk.radius + t.r) hit(e, t, mult, sk.el, opt);
          });
        }
        break;
      }
      case 'dash': {
        e.dash = { t: sk.dist / 300, vx: Math.cos(dir) * 300, vy: Math.sin(dir) * 300, hit: new Set(), mult, el: sk.el, opt };
        e.iframes = Math.max(e.iframes || 0, sk.dist / 300 + 0.1);
        G.audio.sfx('zap');
        break;
      }
      case 'buff': {
        const targets = sk.party ? friends(e) : [e];
        const k = {};
        for (const key in sk.buff) k[key] = sk.buff[key] + (key === 'crit' ? 0 : (sk.per || 0) * (rank - 1));
        for (const t of targets) { addBuff(t, k, sk.dur, id); G.fx.ring(t.x, t.y - 4, 18, elc); G.fx.burst(t.x, t.y - 8, elc, 10, 40); }
        G.fx.text(e.x, e.y - 26, sk.name, elc, 1);
        G.audio.sfx('buff');
        break;
      }
      case 'proj': {
        const n = sk.count || 1;
        for (let i = 0; i < n; i++) {
          const a = n > 1 ? dir - sk.spread / 2 + (sk.spread * i) / (n - 1) : dir;
          shoot(e, a, { speed: sk.speed, mult, el: sk.el, kind: sk.proj, pierce: sk.pierce, explode: sk.explode, status: sk.status, power: pw, life: 1.2 });
        }
        e.swing = { t: 0, max: 0.15, dir, arc: 0 };
        G.audio.sfx(sk.el === 'feu' ? 'fire' : sk.el === 'glace' ? 'ice' : 'shoot');
        break;
      }
      case 'zone': {
        const p = tgt ? { x: tgt.x, y: tgt.y } : { x: e.x + Math.cos(dir) * 60, y: e.y + Math.sin(dir) * 60 };
        S0.gzones.push({ x: p.x, y: p.y, r: sk.radius, delay: sk.delay, ticks: sk.ticks, left: sk.ticks, every: sk.dur / sk.ticks, t: 0, src: e, mult, el: sk.el, opt, kind: id, life: sk.delay + sk.dur + 0.3 });
        G.audio.sfx('magic');
        break;
      }
      case 'chain': {
        let cur = e, hitSet = new Set(), pts = [{ x: e.x, y: e.y - 8 }];
        for (let i = 0; i < sk.jumps; i++) {
          const cand = foes(e).filter((t) => !hitSet.has(t));
          const nx = nearest(cand, cur, i === 0 ? 170 : 80);
          if (!nx) break;
          hitSet.add(nx); pts.push({ x: nx.x, y: nx.y - 6 });
          const target = nx;
          G.game.after(i * 0.06, () => hit(e, target, mult, sk.el, opt));
          cur = nx;
        }
        if (pts.length > 1) G.fx.bolt(pts, elc);
        G.audio.sfx('zap');
        if (pts.length === 1) return false;
        break;
      }
      case 'heal': {
        for (const t of friends(e)) { heal(t, t.mhp * mult + stat(e, 'mag') * 2); G.fx.burst(t.x, t.y - 8, '#9dffb0', 12, 40); G.fx.ring(t.x, t.y - 4, 16, '#9dffb0'); }
        G.audio.sfx('heal');
        break;
      }
      case 'healone': {
        const list = friends(e).filter((t) => t.hp < t.mhp);
        if (!list.length) return false;
        list.sort((a, b) => a.hp / a.mhp - b.hp / b.mhp);
        const t = list[0];
        heal(t, t.mhp * sk.mult + stat(e, 'mag') * 2);
        G.fx.burst(t.x, t.y - 8, '#9dffb0', 12, 40); G.fx.bolt([{ x: e.x, y: e.y - 8 }, { x: t.x, y: t.y - 8 }], '#c8ffd0');
        G.audio.sfx('heal');
        break;
      }
      case 'taunt': {
        for (const m of foes(e)) if (U.dist(e, m) < sk.radius) { m.taunt = { who: e, t: 5 }; m.state = 'chase'; }
        addBuff(e, sk.buff, sk.dur, id);
        G.fx.ring(e.x, e.y - 4, sk.radius, '#ff6a4a');
        G.fx.text(e.x, e.y - 24, 'Provocation !', '#ff9a6a', 0.9);
        G.audio.sfx('buff');
        break;
      }
    }
    return true;
  }

  // Lien d'Aube : attaque combinée de toute l'équipe (nouveauté par rapport à Inotia)
  function lienAttack() {
    const S0 = S(), h = S0.hero;
    if (S0.lien < 100 || !alive(h)) return false;
    S0.lien = 0;
    const team = S0.party.filter(alive);
    const el = D.CLASSES[S0.save.cls].element;
    const mult = 3 + team.length * 1.2;
    G.audio.sfx('lien');
    G.game.flash('#fff3b0');
    G.game.shake(6);
    G.ui.banner("LIEN D'AUBE !", 'Attaque combinée × ' + team.length);
    for (const a of team) { a.iframes = 1.2; G.fx.burst(a.x, a.y - 8, '#fff3b0', 20, 90); }
    for (let i = 0; i < 3; i++) {
      G.game.after(0.25 + i * 0.25, () => {
        G.fx.ring(h.x, h.y - 4, 100, D.ELEMENTS[el].color);
        G.fx.ring(h.x, h.y - 4, 60, '#ffffff');
        for (const m of S0.mobs.filter(alive)) if (U.dist(h, m) < 110) hit(h, m, mult / 3, el, { power: D.CLASSES[S0.save.cls].basic.power, critBonus: 20 });
      });
    }
    for (const a of team) heal(a, a.mhp * 0.3);
    return true;
  }

  // ================================================================ Mises à jour
  function tickCommon(e, dt) {
    e.hurtT = Math.max(0, e.hurtT - dt);
    if (e.iframes > 0) e.iframes -= dt;
    if (e.atkCd > 0) e.atkCd -= dt;
    if (e.swing) { e.swing.t += dt; if (e.swing.t >= e.swing.max) e.swing = null; }
    for (const b of e.buffs) b.t -= dt;
    if (e.buffs.length) {
      const reg = buffSum(e, 'regen');
      if (reg) heal(e, e.mhp * reg * dt, true);
      e.buffs = e.buffs.filter((b) => b.t > 0);
    }
    for (const k in e.st) {
      if (e.st[k] <= 0) continue;
      e.st[k] -= dt;
      if (k === 'burn' || k === 'poison') {
        e.dotAcc = (e.dotAcc || 0) + dt;
        if (e.dotAcc >= 0.5) {
          e.dotAcc = 0;
          const dmg = Math.max(1, Math.round((e.dotDmg || 2) * (e.team === 'ally' ? 0.6 : 1)));
          e.hp -= dmg; e.hurtT = 0.08;
          G.fx.text(e.x, e.y - 18, String(dmg), k === 'burn' ? '#ff9a3c' : '#9be86a', 0.8);
          if (e.hp <= 0 && !e.dead) kill(e, e);
        }
      }
    }
  }

  function moveToward(e, tx, ty, dt, speedMul = 1) {
    const a = Math.atan2(ty - e.y, tx - e.x);
    const sp = stat(e, 'spd') * speedMul * dt;
    const ox = e.x, oy = e.y;
    W.move(S().map, e, Math.cos(a) * sp, Math.sin(a) * sp);
    // Contournement simple si bloqué
    if (Math.abs(e.x - ox) + Math.abs(e.y - oy) < sp * 0.3) {
      const side = (e.sideStep = e.sideStep || (Math.random() < 0.5 ? 1 : -1));
      W.move(S().map, e, Math.cos(a + side * 1.57) * sp, Math.sin(a + side * 1.57) * sp);
    }
    e.dir = a;
    if (Math.abs(Math.cos(a)) > 0.2) e.faceX = Math.cos(a) >= 0 ? 1 : -1;
    e.moving = true;
  }

  function updateHero(h, dt, inp) {
    const S0 = S();
    tickCommon(h, dt);
    h.moving = false;
    h.lastHit += dt;
    if (h.rollCd > 0) h.rollCd -= dt;
    if (h.potCd > 0) h.potCd -= dt;
    for (const k in h.skillCd) if (h.skillCd[k] > 0) h.skillCd[k] -= dt;
    // Régénération
    const town = S0.zone.town;
    h.mp = Math.min(h.mmp, h.mp + h.mmp * (town ? 0.2 : 0.012) * dt);
    if (town || h.lastHit > 5) h.hp = Math.min(h.mhp, h.hp + h.mhp * (town ? 0.2 : 0.02) * dt);
    if (h.dead) return;
    if (h.st.stun > 0) return;

    // Charge (compétence de ruée)
    if (h.dash) {
      h.dash.t -= dt;
      W.move(S0.map, h, h.dash.vx * dt, h.dash.vy * dt);
      G.fx.trail(h);
      for (const m of foes(h)) if (!h.dash.hit.has(m) && U.dist(h, m) < 16 + m.r) { h.dash.hit.add(m); hit(h, m, h.dash.mult, h.dash.el, h.dash.opt); }
      if (h.dash.t <= 0) h.dash = null;
      return;
    }
    // Roulade d'esquive (nouveauté)
    if (h.roll) {
      h.roll.t -= dt;
      W.move(S0.map, h, h.roll.vx * dt, h.roll.vy * dt);
      if (Math.random() < 0.5) G.fx.trail(h);
      if (h.roll.t <= 0) h.roll = null;
      return;
    }
    if (inp.consume('dodge') && h.rollCd <= 0) {
      const a = inp.mag > 0.1 ? Math.atan2(inp.my, inp.mx) : h.dir;
      h.roll = { t: 0.28, vx: Math.cos(a) * 230, vy: Math.sin(a) * 230 };
      h.iframes = 0.38; h.rollCd = 0.8;
      G.audio.sfx('dodge');
      return;
    }

    // Compétences
    const skills = D.CLASSES[S0.save.cls].skills;
    for (let i = 0; i < 4; i++) {
      if (!inp.consume('skill' + i)) continue;
      const id = skills[i], rank = S0.save.skills[id] || 0;
      if (!rank) { G.ui.toast('Compétence non apprise (menu Compétences)'); continue; }
      if ((h.skillCd[id] || 0) > 0) continue;
      const sk = D.SKILLS[id];
      if (h.mp < sk.mp) { G.ui.toast('Pas assez de PM'); G.audio.sfx('ui'); continue; }
      if (castSkill(h, id, rank)) { h.mp -= sk.mp; h.skillCd[id] = sk.cd; }
    }
    if (inp.consume('lien')) { if (!lienAttack()) G.ui.toast("Jauge de Lien d'Aube incomplète"); }

    // Déplacement
    if (inp.mag > 0.1) {
      const sp = stat(h, 'spd') * Math.min(1, inp.mag) * dt;
      W.move(S0.map, h, inp.mx * sp, inp.my * sp);
      h.dir = Math.atan2(inp.my, inp.mx);
      if (Math.abs(inp.mx) > 0.15) h.faceX = inp.mx > 0 ? 1 : -1;
      h.moving = true;
    }

    // Attaque : cible automatique la plus proche (comme dans Inotia), approche automatique
    const wantAttack = inp.attack || (S0.auto && inp.mag <= 0.1);
    if (wantAttack && !S0.zone.town) {
      const range = h.basic.range;
      let t = h.target && alive(h.target) && U.dist(h, h.target) < 170 ? h.target : null;
      if (!t) t = nearest(foes(h), h, S0.auto ? 150 : 130, true);
      h.target = t;
      if (t) {
        const d = U.dist(h, t);
        if (d <= range + t.r + 2) { if (h.atkCd <= 0) basicAttack(h, t); }
        else if (inp.mag <= 0.1) moveToward(h, t.x, t.y, dt);
        if (S0.auto) autoSkills(h);
      } else if (inp.attack && h.atkCd <= 0 && !S0.auto) basicAttack(h, null);
    }
    if (S0.auto && h.hp < h.mhp * 0.3 && h.potCd <= 0) G.game.usePotion('potion_vie', true);
  }

  // Combat automatique (nouveauté) : utilise les compétences disponibles
  function autoSkills(h) {
    const S0 = S();
    const skills = D.CLASSES[S0.save.cls].skills;
    for (const id of skills) {
      const rank = S0.save.skills[id] || 0;
      const sk = D.SKILLS[id];
      if (!rank || (h.skillCd[id] || 0) > 0 || h.mp < sk.mp + 5) continue;
      if (sk.type === 'heal' && !S0.party.some((a) => alive(a) && a.hp < a.mhp * 0.6)) continue;
      if (castSkill(h, id, rank)) { h.mp -= sk.mp; h.skillCd[id] = sk.cd; return; }
    }
    if (S0.lien >= 100) lienAttack();
  }

  function updateAlly(a, dt) {
    const S0 = S(), h = S0.hero;
    if (a.dead) {
      a.reviveT -= dt;
      if (a.reviveT <= 0 && alive(h)) {
        a.dead = false; a.hp = Math.round(a.mhp * 0.5);
        const p = W.freeNear(S0.map, h.x, h.y, 1.5);
        a.x = p.x; a.y = p.y; a.st = {};
        G.fx.burst(a.x, a.y - 8, '#fff3b0', 16, 60);
        G.ui.toast(a.name + ' revient au combat !');
      }
      return;
    }
    tickCommon(a, dt);
    a.moving = false;
    if (a.skillCd > 0) a.skillCd -= dt;
    if (S0.zone.town || a.lastHit > 5) a.hp = Math.min(a.mhp, a.hp + a.mhp * (S0.zone.town ? 0.2 : 0.02) * dt);
    a.lastHit = (a.lastHit || 0) + dt;
    if (a.st.stun > 0 || !h) return;
    const dh = U.dist(a, h);
    if (dh > 240) { const p = W.freeNear(S0.map, h.x, h.y, 1.5); a.x = p.x; a.y = p.y; return; }

    const sk = D.SKILLS[a.skillId];
    // Soigneuse : priorité au soin
    if (a.ai === 'healer' && a.skillCd <= 0 && S0.party.some((p) => alive(p) && p.hp < p.mhp * 0.6)) {
      if (castSkill(a, a.skillId)) { a.skillCd = sk.cd; return; }
    }
    // Choix de la cible
    let target = null;
    const enemies = foes(a).filter((m) => U.dist(m, h) < 160 && (m.state !== 'idle' || U.dist(m, h) < 90));
    if (enemies.length) {
      if (a.ai === 'tank') target = enemies.find((m) => m.target === h) || nearest(enemies, h);
      else target = (h.target && alive(h.target) && enemies.includes(h.target)) ? h.target : nearest(enemies, a);
    }
    if (target) {
      const d = U.dist(a, target);
      if (a.skillCd <= 0 && sk.type !== 'healone' && d < (sk.radius || 120)) {
        if (castSkill(a, a.skillId)) { a.skillCd = sk.cd; return; }
      }
      const range = a.basic.range;
      if (a.basic.type === 'melee') {
        if (d > range + target.r) moveToward(a, target.x, target.y, dt);
        else if (a.atkCd <= 0) basicAttack(a, target);
      } else {
        if (d > range * 0.8 || !W.los(S0.map, a, target)) moveToward(a, target.x, target.y, dt);
        else if (d < 40) moveToward(a, a.x * 2 - target.x, a.y * 2 - target.y, dt, 0.7);
        if (d <= range && a.atkCd <= 0 && W.los(S0.map, a, target)) basicAttack(a, target);
      }
    } else {
      // Suivre le héros en formation
      const idx = S0.party.indexOf(a);
      const ang = h.dir + Math.PI + (idx === 1 ? 0.6 : -0.6);
      const fx = h.x + Math.cos(ang) * 20, fy = h.y + Math.sin(ang) * 20;
      if (Math.hypot(fx - a.x, fy - a.y) > 10) moveToward(a, fx, fy, dt, dh > 60 ? 1.3 : 1);
    }
  }

  function updateMob(m, dt) {
    const S0 = S();
    tickCommon(m, dt);
    m.moving = false;
    if (m.dead) return;
    m.anim += dt;
    if (m.st.stun > 0) { m.windup = 0; return; }
    if (m.taunt) { m.taunt.t -= dt; if (m.taunt.t <= 0 || !alive(m.taunt.who)) m.taunt = null; }
    if (m.aggroT > 0) m.aggroT -= dt;
    const d = m.def;
    // Cible
    const aggroR = m.boss ? 150 : m.state === 'chase' ? 170 : 85;
    let tgt = m.taunt ? m.taunt.who : null;
    if (!tgt) tgt = nearest(S0.party.filter(alive), m, aggroR, m.state !== 'chase');
    m.target = tgt;
    const homeD = U.dist(m, m.home);
    if (!m.boss && homeD > 280 && !(m.aggroT > 0)) { m.state = 'return'; }
    if (m.state === 'return') {
      moveToward(m, m.home.x, m.home.y, dt, 1.2);
      m.hp = Math.min(m.mhp, m.hp + m.mhp * 0.3 * dt);
      if (homeD < 20) m.state = 'idle';
      return;
    }
    if (!tgt) {
      m.state = 'idle';
      m.wanderT -= dt;
      if (m.wanderT <= 0) { m.wanderT = U.rand(2, 4); m.wp = W.freeNear(S0.map, m.home.x, m.home.y, 2); }
      if (m.wp && U.dist(m, m.wp) > 4) moveToward(m, m.wp.x, m.wp.y, dt, 0.4);
      return;
    }
    if (m.state === 'idle') {
      m.state = 'chase';
      // Alerte la meute proche
      for (const o of S0.mobs) if (!o.dead && o !== m && o.state === 'idle' && U.dist(o, m) < 70) o.state = 'chase';
    }
    if (m.boss) { if (updateBoss(m, tgt, dt)) return; }
    const dist = U.dist(m, tgt);
    if (d.ai === 'ranged') {
      const seen = W.los(S0.map, m, tgt);
      if (dist > 110 || !seen) moveToward(m, tgt.x, tgt.y, dt);
      else if (dist < 55) moveToward(m, m.x * 2 - tgt.x, m.y * 2 - tgt.y, dt, 0.6);
      if (seen && dist < 140 && m.atkCd <= 0) {
        m.atkCd = U.rand(1.5, 2.2);
        m.dir = U.angleTo(m, tgt); m.faceX = Math.cos(m.dir) >= 0 ? 1 : -1;
        shoot(m, m.dir, { speed: 120, mult: 1, el: m.el, kind: d.proj || 'orb', status: d.status, life: 1.6, power: 'atk' });
      }
      return;
    }
    // Mêlée avec temps de préparation (lisible, esquivable)
    const reach = m.r + tgt.r + 6;
    if (m.windup > 0) {
      m.windup -= dt;
      if (m.windup <= 0) {
        m.atkCd = U.rand(0.9, 1.4);
        m.swing = { t: 0, max: 0.18, dir: m.dir, arc: 1.6 };
        if (U.dist(m, tgt) < reach + 8) hit(m, tgt, 1, m.el, { power: 'atk', status: d.status });
      }
      return;
    }
    if (dist > reach) moveToward(m, tgt.x, tgt.y, dt);
    else if (m.atkCd <= 0) { m.windup = m.rank === 'elite' ? 0.45 : 0.32; m.dir = U.angleTo(m, tgt); m.faceX = Math.cos(m.dir) >= 0 ? 1 : -1; }
  }

  // ================================================================ Boss
  function updateBoss(m, tgt, dt) {
    const S0 = S(), b = m.boss, d = m.def;
    if (!b.active) {
      b.active = true;
      G.game.onBossAggro(m);
    }
    if (d.final && b.phase === 1 && m.hp < m.mhp * 0.5) {
      b.phase = 2; b.cd = 1;
      m.s.atk *= 1.2; m.s.spd *= 1.25;
      G.ui.banner('Morvane', '« Assez ! Contemplez le véritable Néant ! »');
      G.game.flash('#2a0040'); G.game.shake(8);
      G.audio.sfx('boss');
    } else if (!d.final && b.phase === 1 && m.hp < m.mhp * 0.5) {
      b.phase = 2; m.s.spd *= 1.15;
      G.fx.text(m.x, m.y - 40, 'ENRAGÉ !', '#ff3b3b', 1.4);
    }
    // Ruée en cours
    if (b.charge) {
      const c = b.charge;
      c.t -= dt;
      if (c.t > 0 && c.wind) return true;
      if (c.wind) { c.wind = false; c.t = 0.55; }
      W.move(S0.map, m, Math.cos(c.a) * 280 * dt, Math.sin(c.a) * 280 * dt);
      G.fx.trail(m);
      for (const p of S0.party.filter(alive)) if (!c.hit.has(p) && U.dist(p, m) < m.r + 10) { c.hit.add(p); hit(m, p, 1.6, m.el, { power: 'atk' }); }
      if (c.t <= 0) b.charge = null;
      return true;
    }
    b.cd -= dt;
    if (b.cd <= 0) {
      const pat = U.choice(d.patterns);
      b.cd = (b.phase === 2 ? 2.2 : 3.2) + U.rand(0, 1);
      const el = m.el, col = D.ELEMENTS[el].color;
      switch (pat) {
        case 'slam': {
          const targets = b.phase === 2 ? S0.party.filter(alive) : [tgt];
          for (const t of targets) S0.teles.push({ x: t.x, y: t.y, r: 34, t: 0, max: 1.0, src: m, mult: 1.7, el, col });
          G.audio.sfx('warn');
          break;
        }
        case 'nova':
          S0.teles.push({ x: m.x, y: m.y, r: 72, t: 0, max: 1.2, src: m, mult: 1.5, el, col, follow: m });
          G.audio.sfx('warn');
          break;
        case 'ring': {
          const n = b.phase === 2 ? 18 : 12;
          const off = Math.random();
          for (let i = 0; i < n; i++) shoot(m, off + (i / n) * Math.PI * 2, { speed: 95, mult: 0.9, el, kind: d.final ? 'shadow' : el === 'feu' ? 'fire' : el === 'glace' ? 'ice' : el === 'foudre' ? 'spark' : 'spore', life: 2.6, power: 'atk', r: 5 });
          if (b.phase === 2) G.game.after(0.5, () => { if (alive(m)) for (let i = 0; i < n; i++) shoot(m, off + ((i + 0.5) / n) * Math.PI * 2, { speed: 95, mult: 0.9, el, kind: 'shadow', life: 2.6, power: 'atk', r: 5 }); });
          G.audio.sfx('magic');
          break;
        }
        case 'summon': {
          const count = S0.mobs.filter((o) => !o.dead && o.summoned).length;
          if (count < 6) {
            for (let i = 0; i < 3; i++) {
              const p = W.freeNear(S0.map, m.x, m.y, 3);
              const s = makeMob(d.summon, Math.max(1, m.lvl - 3), p.x, p.y, { summoned: true });
              s.state = 'chase';
              S0.mobs.push(s);
              G.fx.burst(p.x, p.y - 6, col, 10, 50);
            }
            G.fx.text(m.x, m.y - 40, 'Invocation !', col, 1.1);
          }
          break;
        }
        case 'charge': {
          const a = U.angleTo(m, tgt);
          b.charge = { t: 0.7, wind: true, a, hit: new Set() };
          S0.teles.push({ line: true, x: m.x, y: m.y, a, len: 160, w: 22, t: 0, max: 0.7, col, noDmg: true });
          G.audio.sfx('warn');
          return true;
        }
      }
    }
    return false;
  }

  // ================================================================ Projectiles, zones et télégraphes
  function updateProjs(dt) {
    const S0 = S();
    for (const p of S0.projs) {
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (W.solidAt(S0.map, p.x, p.y + 6)) { p.life = 0; if (p.explode) explode(p); continue; }
      const targets = p.team === 'ally' ? S0.mobs : S0.party;
      for (const t of targets) {
        if (t.dead || p.hit.has(t)) continue;
        if (Math.abs(t.x - p.x) < t.r + p.r && Math.abs(t.y - 6 * (t.scale || 1) - p.y) < t.r + p.r + 4 * (t.scale || 1)) {
          p.hit.add(t);
          if (p.explode) { explode(p); p.life = 0; break; }
          hit(p.src, t, p.mult, p.el, { power: p.power, status: p.status });
          if (!p.pierce) { p.life = 0; break; }
        }
      }
      if (p.life <= 0 && p.explode && !p.exploded) explode(p);
    }
    S0.projs = S0.projs.filter((p) => p.life > 0);
  }

  function explode(p) {
    if (p.exploded) return;
    p.exploded = true;
    const S0 = S();
    G.fx.ring(p.x, p.y, p.explode, D.ELEMENTS[p.el].color);
    G.fx.burst(p.x, p.y, D.ELEMENTS[p.el].color, 14, 80);
    G.audio.sfx('fire');
    const targets = p.team === 'ally' ? S0.mobs : S0.party;
    for (const t of targets) if (!t.dead && Math.hypot(t.x - p.x, t.y - 4 - p.y) < p.explode + t.r) hit(p.src, t, p.mult, p.el, { power: p.power, status: p.status });
  }

  function updateZones(dt) {
    const S0 = S();
    for (const z of S0.gzones) {
      z.t += dt; z.life -= dt;
      if (z.t < z.delay) continue;
      z.acc = (z.acc || 0) + dt;
      if (z.left > 0 && (z.acc >= z.every || z.left === z.ticks)) {
        z.acc = 0; z.left--;
        const col = D.ELEMENTS[z.el].color;
        G.fx.burst(z.x + U.rand(-z.r / 2, z.r / 2), z.y + U.rand(-z.r / 2, z.r / 2), col, 8, 60);
        if (z.kind === 'pluie_meteores') G.fx.meteor(z.x + U.rand(-z.r * 0.6, z.r * 0.6), z.y + U.rand(-z.r * 0.6, z.r * 0.6));
        if (z.kind === 'jugement') { G.fx.pillar(z.x, z.y, z.r); G.game.shake(4); G.audio.sfx('slam'); }
        for (const m of S0.mobs) if (!m.dead && Math.hypot(m.x - z.x, m.y - z.y) < z.r + m.r) hit(z.src, m, z.mult, z.el, z.opt);
      }
    }
    S0.gzones = S0.gzones.filter((z) => z.life > 0);

    for (const t of S0.teles) {
      t.t += dt;
      if (t.follow) { t.x = t.follow.x; t.y = t.follow.y; }
      if (t.t >= t.max && !t.done) {
        t.done = true;
        if (t.noDmg) continue;
        G.fx.ring(t.x, t.y, t.r, t.col); G.fx.burst(t.x, t.y, t.col, 16, 90);
        G.audio.sfx('slam'); G.game.shake(4);
        if (alive(t.src)) for (const p of S0.party) if (!p.dead && Math.hypot(p.x - t.x, p.y - t.y) < t.r + p.r) hit(t.src, p, t.mult, t.el, { power: 'atk' });
      }
    }
    S0.teles = S0.teles.filter((t) => !t.done);
  }

  // Séparation douce entre entités pour éviter l'empilement
  function separate() {
    const S0 = S();
    const all = S0.party.concat(S0.mobs).filter(alive);
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const a = all[i], b = all[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const min = a.r + b.r;
      const d2 = dx * dx + dy * dy;
      if (d2 > 0.01 && d2 < min * min) {
        const d = Math.sqrt(d2), push = (min - d) * 0.25;
        const nx = dx / d, ny = dy / d;
        if (!a.boss && a.kind !== 'hero') W.move(S0.map, a, -nx * push, -ny * push);
        if (!b.boss && b.kind !== 'hero') W.move(S0.map, b, nx * push, ny * push);
      }
    }
  }

  return {
    heroStats, makeHero, refreshHero, allyStats, makeAlly, makeMob, stat, hit, heal, castSkill, lienAttack,
    updateHero, updateAlly, updateMob, updateProjs, updateZones, separate, alive, nearest, foes, skillMult, addBuff,
  };
})();
