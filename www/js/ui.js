// Éclipsia — interface : HUD, dialogues, menus, boutique, forge, taverne, écrans
'use strict';

G.ui = (() => {
  const D = G.data, U = G.util, I = G.items;
  const $ = (id) => document.getElementById(id);
  const esc = U.esc;
  let els = {};
  let dlg = null, menuState = null, mini = null, hudT = 0;
  const SKILL_ICONS = {
    tranche_foudre: '⚡', tourbillon: '🌀', charge_orage: '💨', cri_titan: '🦁',
    boule_braise: '🔥', lance_givre: '❄️', pluie_meteores: '☄️', chaine_eclairs: '🌩️',
    tir_percant: '🏹', volee: '🎯', piege_ombre: '🕸️', danse_vent: '🍃',
    frappe_sacree: '✨', priere_aube: '💖', jugement: '🌟', egide: '🛡️',
  };
  const S = () => G.state;

  function init() {
    for (const id of ['hud', 'hud-portrait', 'hud-name', 'hud-hp', 'hud-hp-t', 'hud-mp', 'hud-mp-t', 'hud-xp', 'hud-party', 'hud-buffs', 'hud-zone', 'minimap', 'hud-day', 'hud-gold',
      'combo', 'bossbar', 'boss-name', 'boss-hp', 'attack-label', 'lien-fill', 'btn-lien', 'pot-hp-n', 'pot-mp-n', 'btn-auto', 'btn-interact', 'toasts', 'banner',
      'dialog', 'dlg-portrait', 'dlg-name', 'dlg-text', 'dlg-choices', 'dlg-next', 'menu', 'screen', 'modal']) els[id] = $(id);
    mini = els.minimap.getContext('2d');
    els.dialog.addEventListener('pointerdown', (e) => { e.stopPropagation(); advanceDialog(); });
    window.addEventListener('keydown', (e) => {
      if (dlg && (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'j')) { e.preventDefault(); advanceDialog(); }
      else if (e.key === 'Escape' && !els.menu.classList.contains('hidden')) closeMenu();
    });
  }

  function showHUD(on) { els.hud.classList.toggle('hidden', !on); }

  // ================================================================ HUD
  let lastVals = {};
  function setText(el, key, v) { if (lastVals[key] !== v) { lastVals[key] = v; el.textContent = v; } }
  function setW(el, key, k) { const v = Math.round(U.clamp(k, 0, 1) * 1000) / 10 + '%'; if (lastVals[key] !== v) { lastVals[key] = v; el.style.width = v; } }

  function update(dt) {
    const st = S();
    if (dlg && dlg.typing) {
      dlg.shown = Math.min(dlg.full.length, dlg.shown + dt * 60);
      els['dlg-text'].textContent = dlg.full.slice(0, Math.floor(dlg.shown));
      if (dlg.shown >= dlg.full.length) { dlg.typing = false; finishLine(); }
    }
    if (st.mode !== 'play' && st.mode !== 'dying') return;
    const h = st.hero, s = st.save;
    if (!h) return;
    setW(els['hud-hp'], 'hp', h.hp / h.mhp); setText(els['hud-hp-t'], 'hpt', `${Math.ceil(h.hp)} / ${h.mhp}`);
    setW(els['hud-mp'], 'mp', h.mp / h.mmp); setText(els['hud-mp-t'], 'mpt', `${Math.floor(h.mp)} / ${h.mmp}`);
    setW(els['hud-xp'], 'xp', s.lvl >= 30 ? 1 : s.xp / G.game.xpNeed(s.lvl));
    setText(els['hud-name'], 'name', `${s.name} — Niv. ${s.lvl}`);
    setText(els['hud-gold'], 'gold', U.fmt(s.gold) + ' or');
    setText(els['hud-day'], 'day', G.game.isNight() ? '☾ Nuit' : '☀ Jour');
    setText(els['hud-zone'], 'zone', st.zone.name);
    setText(els['pot-hp-n'], 'php', String(s.cons.potion_vie));
    setText(els['pot-mp-n'], 'pmp', String(s.cons.potion_mana));
    const lh = Math.round(st.lien) + '%';
    if (lastVals.lien !== lh) { lastVals.lien = lh; els['lien-fill'].style.height = lh; }
    els['btn-lien'].classList.toggle('ready', st.lien >= 100);
    els['btn-auto'].classList.toggle('on', st.auto);
    // Bouton d'interaction contextuel
    const it = st.interactTarget;
    const town = st.zone.town;
    els['btn-interact'].classList.toggle('hidden', !it || town);
    if (it) setText(els['btn-interact'], 'it', it.label);
    const al = town ? (it ? it.label : '…') : '⚔';
    if (lastVals.al !== al) { lastVals.al = al; els['attack-label'].textContent = al; els['attack-label'].classList.toggle('txt', town); }
    // Combo
    if (st.combo >= 5) { setText(els.combo, 'combo', `COMBO ×${st.combo}  +${Math.min(st.combo, 30)}%`); els.combo.style.opacity = 1; }
    else els.combo.style.opacity = 0;
    // Compétences
    const skills = D.CLASSES[s.cls].skills;
    for (let i = 0; i < 4; i++) {
      const id = skills[i], b = $('sk' + i);
      const rank = s.skills[id] || 0, cd = h.skillCd[id] || 0;
      const key = `sk${i}`;
      const v = `${rank}|${Math.ceil(cd)}|${h.mp >= D.SKILLS[id].mp}`;
      if (lastVals[key] !== v) {
        lastVals[key] = v;
        b.classList.toggle('locked', !rank);
        b.classList.toggle('nomp', h.mp < D.SKILLS[id].mp);
        b.style.borderColor = D.ELEMENTS[D.SKILLS[id].el].color;
        b.innerHTML = `<span class="ico">${SKILL_ICONS[id]}</span><span class="cost">${D.SKILLS[id].mp}</span>` + (cd > 0 ? `<span class="cd">${Math.ceil(cd)}</span>` : '') + (!rank ? `<span class="cd" style="font-size:9px">Niv.${D.SKILLS[id].lvl}</span>` : '');
      }
    }
    hudT -= dt;
    if (hudT <= 0) { hudT = 0.25; updateParty(); updateBuffs(); }
    drawMinimap();
    if (st.boss && !els.bossbar.classList.contains('hidden')) setW(els['boss-hp'], 'boss', st.boss.hp / st.boss.mhp);
  }

  function updateParty() {
    const st = S();
    els['hud-portrait'].src = G.sprites.portrait('humanoid', D.CLASSES[st.save.cls].pal, false, D.CLASSES[st.save.cls].look);
    const html = st.party.filter((p) => p.kind === 'ally').map((a) => {
      const c = D.COMPANIONS[a.cid];
      return `<div class="pm ${a.dead ? 'dead' : ''}"><img src="${G.sprites.portrait('humanoid', c.pal, c.short, c.look)}"><div style="flex:1"><div class="n">${esc(a.name)} ${a.dead ? '(' + Math.ceil(a.reviveT) + 's)' : ''}</div><div class="bar hp"><i style="width:${(a.hp / a.mhp) * 100}%"></i></div></div></div>`;
    }).join('');
    if (lastVals.party !== html) { lastVals.party = html; els['hud-party'].innerHTML = html; }
  }
  function updateBuffs() {
    const h = S().hero;
    const html = h.buffs.map((b) => `<span class="buff">${esc(D.SKILLS[b.tag] ? D.SKILLS[b.tag].name : b.tag)} ${Math.ceil(b.t)}s</span>`).join('')
      + (S().auto ? '<span class="buff" style="background:#2a3a6a;border-color:#8ab8ff">AUTO</span>' : '')
      + (G.game.isNight() && !S().zone.town ? '<span class="buff" style="background:#2a1a4a;border-color:#b06bff">Nuit : monstres +20%, XP +25%</span>' : '');
    if (lastVals.buffs !== html) { lastVals.buffs = html; els['hud-buffs'].innerHTML = html; }
  }

  let miniMap = null;
  function setMinimap(map) { miniMap = map; }
  function drawMinimap() {
    const st = S(), map = miniMap;
    if (!map || !map.mini) return;
    const c = els.minimap, w = c.width, h = c.height;
    const sc = map.theme === 'village' ? 2.4 : 2;
    const hx = st.hero.x / 16, hy = st.hero.y / 16;
    const ox = U.clamp(hx - w / sc / 2, 0, Math.max(0, map.w - w / sc)), oy = U.clamp(hy - h / sc / 2, 0, Math.max(0, map.h - h / sc));
    mini.imageSmoothingEnabled = false;
    mini.fillStyle = '#05030a'; mini.fillRect(0, 0, w, h);
    mini.drawImage(map.mini.canvas, -ox * sc, -oy * sc, map.w * sc, map.h * sc);
    const dot = (x, y, col, r = 1.5) => { mini.fillStyle = col; mini.fillRect((x / 16 - ox) * sc - r, (y / 16 - oy) * sc - r, r * 2, r * 2); };
    const seen = (e) => map.explored[((e.y / 16) | 0) * map.w + ((e.x / 16) | 0)];
    for (const m of st.mobs) if (!m.dead && seen(m)) dot(m.x, m.y, m.boss ? '#ff2b6b' : '#ff6a4a', m.boss ? 2.5 : 1.2);
    if (st.boss && !st.boss.dead && !seen(st.boss) && st.save.visits[st.zone.id] > 0) dot(st.boss.x, st.boss.y, '#ff2b6b55', 2.5);
    for (const n of st.npcs) dot(n.x, n.y, '#ffd84a', 1.5);
    if (map.portal) dot(map.portal.x, map.portal.y, '#7fe0ff', 2.2);
    if (st.bossPortal) dot(st.bossPortal.x, st.bossPortal.y, '#7fe0ff', 2.2);
    for (const p of st.party) if (!p.dead && p !== st.hero) dot(p.x, p.y, '#6dff8a', 1.3);
    dot(st.hero.x, st.hero.y, '#ffffff', 2);
  }

  // ================================================================ Notifications
  function toast(msg, color) {
    const d = document.createElement('div');
    d.className = 'toast';
    d.textContent = msg;
    if (color) d.style.color = color === 'gold' ? '#ffd84a' : color;
    els.toasts.appendChild(d);
    while (els.toasts.children.length > 4) els.toasts.firstChild.remove();
    setTimeout(() => d.remove(), 3000);
  }
  function banner(title, sub) {
    const b = els.banner;
    b.querySelector('.b-title').textContent = title;
    b.querySelector('.b-sub').textContent = sub || '';
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  }
  function bossBar(m) {
    els.bossbar.classList.toggle('hidden', !m);
    if (m) els['boss-name'].textContent = m.name + ' — Niv. ' + m.lvl;
  }

  // ================================================================ Dialogues
  function dialog(lines, onEnd, choices) {
    dlg = { lines, i: -1, onEnd, choices };
    els.dialog.classList.remove('hidden');
    G.input.reset();
    nextLine();
  }
  function nextLine() {
    dlg.i++;
    if (dlg.i >= dlg.lines.length) { closeDialog(); return; }
    const l = dlg.lines[dlg.i];
    els['dlg-name'].textContent = l.name || '';
    els['dlg-portrait'].style.visibility = l.portrait ? 'visible' : 'hidden';
    if (l.portrait) els['dlg-portrait'].src = l.portrait;
    els['dlg-choices'].innerHTML = '';
    els['dlg-next'].style.display = 'none';
    dlg.full = l.text; dlg.shown = 0; dlg.typing = true;
  }
  function finishLine() {
    els['dlg-text'].textContent = dlg.full;
    const last = dlg.i === dlg.lines.length - 1;
    if (last && dlg.choices) {
      els['dlg-choices'].innerHTML = dlg.choices.map((c, i) => `<button class="b small ${i === 0 ? 'gold' : ''}" data-i="${i}">${esc(c.label)}</button>`).join('');
      els['dlg-choices'].querySelectorAll('button').forEach((b) => b.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        const c = dlg.choices[+b.dataset.i];
        closeDialog(true);
        G.audio.sfx('ui');
        c.fn && c.fn();
      }));
    } else els['dlg-next'].style.display = 'block';
  }
  function advanceDialog() {
    if (!dlg) return;
    if (dlg.typing) { dlg.typing = false; dlg.shown = dlg.full.length; finishLine(); return; }
    if (dlg.i === dlg.lines.length - 1 && dlg.choices) return;
    G.audio.sfx('ui');
    nextLine();
  }
  function closeDialog(skipEnd) {
    const end = dlg && dlg.onEnd;
    dlg = null;
    els.dialog.classList.add('hidden');
    G.input.reset();
    if (!skipEnd && end) end();
  }

  function isBlocking() {
    return !!dlg || !els.menu.classList.contains('hidden') || !els.modal.classList.contains('hidden') || !els.screen.classList.contains('hidden');
  }

  function confirm(msg, yes, no) {
    const m = els.modal;
    m.innerHTML = `<div class="panel small"><div class="p-body" style="text-align:center"><p style="font-size:14px">${esc(msg)}</p><div class="actions" style="justify-content:center"><button class="b gold" data-a="y">Oui</button><button class="b" data-a="n">Non</button></div></div></div>`;
    m.classList.remove('hidden');
    m.querySelector('[data-a=y]').onclick = () => { m.classList.add('hidden'); G.input.reset(); yes && yes(); };
    m.querySelector('[data-a=n]').onclick = () => { m.classList.add('hidden'); G.input.reset(); no && no(); };
  }

  // ================================================================ Panneaux génériques
  function openPanel(title, tabs, current, render) {
    menuState = { title, tabs, current, render, sel: null };
    els.menu.classList.remove('hidden');
    G.input.reset();
    G.audio.sfx('ui');
    drawPanel();
  }
  function drawPanel() {
    const ms = menuState;
    const s = S().save;
    const tabs = ms.tabs.map((t) => `<div class="tab ${t[0] === ms.current ? 'on' : ''}" data-tab="${t[0]}">${t[1]}</div>`).join('');
    const body = ms.render(ms.current);
    els.menu.innerHTML = `<div class="panel"><div class="p-head"><div class="p-title">${esc(ms.title)}</div><div class="tabs">${tabs}</div><button class="close" data-close>✕</button></div>
      <div class="p-body">${body}</div>
      <div class="p-foot"><span>Or : <b>${U.fmt(s.gold)}</b></span><span>Éclats d'étoile : <b>${s.stars}</b></span><span>Points de compétence : <b>${s.sp}</b></span><span>Inventaire : <b>${s.inv.length}/40</b></span></div></div>`;
    els.menu.querySelectorAll('[data-tab]').forEach((t) => t.onclick = () => { ms.current = t.dataset.tab; ms.sel = null; G.audio.sfx('ui'); drawPanel(); });
    els.menu.querySelector('[data-close]').onclick = closeMenu;
    els.menu.querySelectorAll('[data-act]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); ACTIONS[b.dataset.act](b.dataset.arg); });
  }
  function rerender() { if (menuState) { const sc = els.menu.querySelector('.p-body'); const top = sc ? sc.scrollTop : 0; drawPanel(); const sc2 = els.menu.querySelector('.p-body'); if (sc2) sc2.scrollTop = top; } }
  function closeMenu() {
    els.menu.classList.add('hidden');
    menuState = null;
    G.input.reset();
    G.game.save();
  }

  // ================================================================ Objets : rendu commun
  function iconHtml(it, cls = 'ic') {
    if (!it) return `<div class="${cls}" style="border-color:#444"></div>`;
    const col = D.RARITIES[it.rarity].color;
    return `<div class="${cls}" style="border-color:${col}"><img src="${I.icon(it)}">${it.plus ? `<span class="plus">+${it.plus}</span>` : ''}</div>`;
  }
  function statLines(it, cmp) {
    const st = I.stats(it), cs = cmp ? I.stats(cmp) : {};
    const keys = new Set([...Object.keys(st), ...Object.keys(cs)]);
    let out = '';
    for (const k of keys) {
      const v = st[k] || 0, d = v - (cs[k] || 0);
      const suf = k === 'crit' || k === 'spd' ? '%' : '';
      out += `<div class="stat-line"><span>${D.STAT_NAMES[k]}</span><span>${v ? '+' + v + suf : '—'} ${cmp && d ? `<span class="${d > 0 ? 'diff-up' : 'diff-down'}">(${d > 0 ? '+' : ''}${d})</span>` : ''}</span></div>`;
    }
    return out;
  }
  function detailHtml(it, where, extraActions = '') {
    const s = S().save;
    const R = D.RARITIES[it.rarity];
    const eq = where === 'inv' ? s.equip[it.slot] : null;
    return `<div class="detail"><div class="t" style="color:${R.color}">${esc(I.displayName(it))}</div>
      <div class="muted">${R.name} · ${D.SLOTS[it.slot]} · Niveau ${it.lvl}${it.el ? ` · <span style="color:${D.ELEMENTS[it.el].color}">${D.ELEMENTS[it.el].icon} Enchantement ${D.ELEMENTS[it.el].name}</span>` : ''}</div>
      <div style="margin-top:6px">${statLines(it, eq)}</div>
      ${eq ? `<div class="muted" style="margin-top:4px">Comparé à : ${esc(I.displayName(eq))}</div>` : ''}
      ${it.el ? `<div class="muted">Vos attaques de base infligent des dégâts de ${D.ELEMENTS[it.el].name}.</div>` : ''}
      <div class="muted">Valeur : ${I.price(it)} or</div>
      <div class="actions">${extraActions}</div></div>`;
  }
  function heroStatsHtml() {
    const h = S().hero, C = G.combat;
    const row = (n, v) => `<div>${n} <b>${v}</b></div>`;
    return `<div class="statsbox">${row('PV', h.mhp)}${row('PM', h.mmp)}${row('Attaque', Math.round(C.stat(h, 'atk')))}${row('Magie', Math.round(C.stat(h, 'mag')))}${row('Défense', Math.round(C.stat(h, 'def')))}${row('Critique', Math.round(C.stat(h, 'crit')) + '%')}${row('Vitesse', Math.round(C.stat(h, 'spd')))}${row('Classe', D.CLASSES[S().save.cls].name)}</div>`;
  }

  // ================================================================ Menu principal
  function openMenu(tab = 'equip') {
    openPanel('Menu', [['equip', 'Équipement'], ['skills', 'Compétences'], ['quests', 'Quêtes'], ['team', 'Équipe'], ['best', 'Bestiaire'], ['opts', 'Options']], tab, renderMenu);
  }
  function renderMenu(tab) {
    const st = S(), s = st.save, ms = menuState;
    if (tab === 'equip') {
      const slots = Object.keys(D.SLOTS).map((sl) => {
        const it = s.equip[sl];
        const sel = ms.sel && ms.sel.w === 'eq' && ms.sel.k === sl;
        return `<div class="slot ${sel ? 'sel' : ''}" data-act="selEq" data-arg="${sl}">${iconHtml(it)}<div class="nm">${it ? `<span style="color:${D.RARITIES[it.rarity].color}">${esc(I.displayName(it))}</span>` : `<span class="muted">${D.SLOTS[sl]} : vide</span>`}</div></div>`;
      }).join('');
      const cells = [];
      for (let i = 0; i < 40; i++) {
        const it = s.inv[i];
        const up = it && I.score(it) > I.score(s.equip[it.slot]);
        cells.push(it ? `<div class="cell ${ms.sel && ms.sel.w === 'inv' && ms.sel.k == i ? 'sel' : ''}" style="border-color:${D.RARITIES[it.rarity].color}" data-act="selInv" data-arg="${i}"><img src="${I.icon(it)}">${it.plus ? `<span class="plus">+${it.plus}</span>` : ''}${up ? '<span class="up">▲</span>' : ''}</div>` : '<div class="cell" style="opacity:.35"></div>');
      }
      let det = '';
      if (ms.sel) {
        const it = ms.sel.w === 'eq' ? s.equip[ms.sel.k] : s.inv[ms.sel.k];
        if (it) det = ms.sel.w === 'eq'
          ? detailHtml(it, 'eq', it.slot !== 'weapon' ? `<button class="b small" data-act="unequip" data-arg="${it.slot}">Retirer</button>` : '')
          : detailHtml(it, 'inv', `<button class="b small gold" data-act="equip" data-arg="${ms.sel.k}">Équiper</button><button class="b small" data-act="salvage" data-arg="${ms.sel.k}">Recycler (+${I.salvageValue(it)} ✦)</button>`);
      }
      const cons = Object.keys(D.CONSUMABLES).map((id) => `<div class="row" style="padding:5px"><div class="ic" style="border-color:${D.CONSUMABLES[id].color}"><img src="${G.sprites.itemIcon(id === 'parchemin' ? 'scroll' : 'potion', D.CONSUMABLES[id].color)}"></div><div class="grow"><div class="ttl">${D.CONSUMABLES[id].name} × ${s.cons[id]}</div><div class="sub">${D.CONSUMABLES[id].desc}</div></div><button class="b small" data-act="use" data-arg="${id}" ${s.cons[id] ? '' : 'disabled'}>Utiliser</button></div>`).join('');
      return `<div class="cols"><div class="col"><div class="h">Équipé</div><div class="equip-grid">${slots}</div>${heroStatsHtml()}<div class="h" style="margin-top:10px">Consommables</div>${cons}</div>
        <div class="col"><div class="h">Sac <button class="b small" data-act="sort" style="float:right">Trier</button></div><div class="inv-grid">${cells.join('')}</div>${det || '<p class="muted">Touchez un objet pour voir ses détails. ▲ = meilleur que l\'équipement actuel.</p>'}</div></div>`;
    }
    if (tab === 'skills') {
      const c = D.CLASSES[s.cls];
      const rows = c.skills.map((id) => {
        const sk = D.SKILLS[id], r = s.skills[id] || 0;
        const can = s.sp > 0 && r < 5 && s.lvl >= sk.lvl;
        const ranks = [1, 2, 3, 4, 5].map((k) => `<i class="${k <= r ? 'on' : ''}"></i>`).join('');
        const info = sk.mult ? `Puissance : ${Math.round(G.combat.skillMult(sk, Math.max(1, r)) * 100)}%${sk.type === 'heal' ? ' des PV' : ''}` : sk.buff ? 'Bonus : ' + Object.keys(sk.buff).map((k) => `${k === 'regen' ? 'Régén.' : D.STAT_NAMES[k]} +${Math.round((sk.buff[k] + (k === 'crit' ? 0 : (sk.per || 0) * (Math.max(1, r) - 1))) * (k === 'crit' ? 1 : 100))}%`).join(', ') : '';
        return `<div class="row"><div class="skill-ico" style="background:${D.ELEMENTS[sk.el].color}33;border-color:${D.ELEMENTS[sk.el].color}">${SKILL_ICONS[id]}</div><div class="grow"><div class="ttl">${sk.name} <span class="rank">${ranks}</span></div>
          <div class="sub">${sk.desc}<br>${info} · ${sk.mp} PM · Recharge ${sk.cd}s · ${D.ELEMENTS[sk.el].icon} ${D.ELEMENTS[sk.el].name}${s.lvl < sk.lvl ? ` · <b style="color:#ff8a8a">Requiert niveau ${sk.lvl}</b>` : ''}</div></div>
          <button class="b small ${can ? 'gold' : ''}" data-act="learn" data-arg="${id}" ${can ? '' : 'disabled'}>${r ? 'Améliorer' : 'Apprendre'}</button></div>`;
      }).join('');
      return `<p class="muted">Vous gagnez 1 point de compétence par niveau. Chaque compétence monte jusqu'au rang 5. Le <b style="color:#ffd84a">Lien d'Aube</b> se remplit en combattant : déclenchez-le pour une attaque combinée de toute l'équipe !</p>${rows}`;
    }
    if (tab === 'quests') {
      const ids = Object.keys(s.quests);
      const act = ids.filter((id) => s.quests[id].st !== 'done');
      const done = ids.filter((id) => s.quests[id].st === 'done');
      const row = (id) => {
        const q = D.QUESTS[id], qs = s.quests[id];
        const state = qs.st === 'ready' ? `<span class="qprog">✔ À rendre à ${D.NPCS[q.giver].name}</span>` : qs.st === 'done' ? '<span class="muted">Terminée</span>' : `<span class="qprog">${G.game.progressText(id)}</span>`;
        return `<div class="row"><div class="skill-ico" style="background:${q.main ? '#ffd84a33' : '#ffffff10'}">${q.main ? '★' : '!'}</div><div class="grow"><div class="ttl">${q.name} ${q.main ? '<span class="tag">Principale</span>' : ''}</div><div class="sub">${q.desc}</div>${state}</div></div>`;
      };
      return (act.length ? act.map(row).join('') : '<p class="muted">Aucune quête en cours. Parlez aux habitants d\'Aubeclair (marqueur <b style="color:#ffd84a">!</b>).</p>') + (done.length ? '<div class="h" style="margin-top:10px">Terminées</div>' + done.map(row).join('') : '');
    }
    if (tab === 'team') {
      const rows = st.party.map((p) => {
        const isHero = p.kind === 'hero';
        const pal = isHero ? D.CLASSES[s.cls].pal : D.COMPANIONS[p.cid].pal;
        const sub = isHero ? D.CLASSES[s.cls].name : `${D.COMPANIONS[p.cid].role} · Rang ${s.ranks[p.cid] || 0}/5 · Compétence : ${D.SKILLS[p.skillId].name}`;
        return `<div class="row"><img class="portrait" src="${G.sprites.portrait('humanoid', pal, !isHero && D.COMPANIONS[p.cid].short, isHero ? D.CLASSES[s.cls].look : D.COMPANIONS[p.cid].look)}"><div class="grow"><div class="ttl">${esc(isHero ? s.name : D.COMPANIONS[p.cid].name)} — Niv. ${s.lvl}</div><div class="sub">${sub}<br>PV ${Math.ceil(p.hp)}/${p.mhp} · Att ${Math.round(p.s.atk)} · Mag ${Math.round(p.s.mag)} · Déf ${Math.round(p.s.def)} · Crit ${Math.round(p.s.crit)}%</div></div></div>`;
      }).join('');
      return rows + '<p class="muted">Recrutez et changez vos compagnons à la Taverne de l\'Étoile Filante (Mère Garance). Ils montent de niveau avec vous et peuvent être entraînés (rangs). S\'ils tombent, ils reviennent au combat après 15 secondes.</p>';
    }
    if (tab === 'best') {
      const cards = Object.keys(D.MONSTERS).map((id) => {
        const m = D.MONSTERS[id], k = s.bestiary[id] || 0;
        if (!k) return `<div class="best unknown"><div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:20px">?</div><div>???<br><span class="muted">Non découvert</span></div></div>`;
        const weak = Object.keys(D.ELEMENTS).filter((e) => D.elementMod(e, m.el) > 1).map((e) => D.ELEMENTS[e].icon + ' ' + D.ELEMENTS[e].name).join(', ') || '—';
        return `<div class="best"><img src="${G.sprites.portrait(m.tpl, m.pal, m.small, m.look)}"><div><b style="color:${m.rank === 'boss' ? '#ff6a8a' : m.rank === 'elite' ? '#ffd84a' : '#fff'}">${esc(m.name)}</b><br>${D.ELEMENTS[m.el].icon} ${D.ELEMENTS[m.el].name} · Vaincus : ${k}<br><span class="muted">Faible : ${weak}</span></div></div>`;
      }).join('');
      const found = Object.keys(D.MONSTERS).filter((id) => s.bestiary[id]).length;
      return `<p class="muted">Créatures découvertes : ${found}/${Object.keys(D.MONSTERS).length}. Cycle élémentaire : 🔥 Feu > 🌿 Nature > ⚡ Foudre > ❄ Glace > 🔥 Feu · ☀ Lumière ⇄ ☾ Ombre (dégâts ×1,5).</p><div class="best-grid">${cards}</div>`;
    }
    if (tab === 'opts') {
      const t = Math.floor(s.playTime);
      return `<div class="opt"><span>Musique</span><button class="b small" data-act="music">${s.settings.music ? 'Activée' : 'Coupée'}</button></div>
        <div class="opt"><span>Effets sonores</span><button class="b small" data-act="sfx">${s.settings.sfx ? 'Activés' : 'Coupés'}</button></div>
        <div class="opt"><span>Combat automatique</span><button class="b small" data-act="auto">${st.auto ? 'Activé' : 'Désactivé'}</button></div>
        <div class="opt"><span>Sauvegarde (automatique)</span><button class="b small" data-act="save">Sauvegarder maintenant</button></div>
        <div class="opt"><span>Temps de jeu : ${Math.floor(t / 3600)}h ${Math.floor((t % 3600) / 60)}min · Monstres vaincus : ${s.kills}</span></div>
        <div class="opt"><span>Retour à l'écran titre</span><button class="b small" data-act="title">Quitter</button></div>
        <div class="opt"><span>Effacer la sauvegarde</span><button class="b small red" data-act="wipe">Effacer</button></div>
        <div class="h" style="margin-top:10px">Commandes clavier (PC)</div>
        <div class="keys"><kbd>ZQSD</kbd>/<kbd>WASD</kbd>/<kbd>Flèches</kbd> bouger · <kbd>J</kbd>/<kbd>Espace</kbd> attaquer · <kbd>1</kbd>-<kbd>4</kbd> compétences · <kbd>K</kbd>/<kbd>Maj</kbd> esquive · <kbd>L</kbd> Lien d'Aube · <kbd>R</kbd> potion de vie · <kbd>E</kbd> potion de mana · <kbd>F</kbd> parler · <kbd>T</kbd> auto · <kbd>M</kbd>/<kbd>Échap</kbd> menu</div>`;
    }
    return '';
  }

  // ================================================================ Boutique
  function openShop() {
    const s = S().save;
    if (!S().shopStock || S().shopLvl !== s.lvl) {
      S().shopLvl = s.lvl;
      S().shopStock = [0, 1, 2, 3].map((i) => {
        const it = I.generate(s.lvl, { slot: ['weapon', 'armor', 'helm', 'ring'][i], rarity: U.weighted([[0, 50], [1, 38], [2, 12]]) });
        return { it, price: I.price(it) * 4 };
      });
    }
    openPanel('Boutique d\'Orvin', [['buy', 'Acheter'], ['sell', 'Vendre']], 'buy', renderShop);
  }
  function renderShop(tab) {
    const st = S(), s = st.save, ms = menuState;
    if (tab === 'buy') {
      const cons = Object.keys(D.CONSUMABLES).map((id) => { const c = D.CONSUMABLES[id]; return `<div class="row"><div class="ic" style="border-color:${c.color}"><img src="${G.sprites.itemIcon(id === 'parchemin' ? 'scroll' : 'potion', c.color)}"></div><div class="grow"><div class="ttl">${c.name} <span class="muted">(possédé : ${s.cons[id]})</span></div><div class="sub">${c.desc}</div></div><button class="b small gold" data-act="buy" data-arg="${id}" ${s.gold >= c.price ? '' : 'disabled'}>${c.price} or</button></div>`; }).join('');
      const gear = st.shopStock.map((g, i) => g.it ? `<div class="row">${iconHtml(g.it)}<div class="grow"><div class="ttl" style="color:${D.RARITIES[g.it.rarity].color}">${esc(I.displayName(g.it))}</div><div class="sub">${D.SLOTS[g.it.slot]} · Niv. ${g.it.lvl} · ${Object.entries(I.stats(g.it)).map(([k, v]) => D.STAT_NAMES[k] + ' +' + v).join(', ')}</div></div><button class="b small gold" data-act="buyItem" data-arg="${i}" ${s.gold >= g.price ? '' : 'disabled'}>${g.price} or</button></div>` : '').join('');
      return `<div class="h">Consommables</div>${cons}<div class="h" style="margin-top:10px">Équipement du jour</div>${gear || '<p class="muted">Tout est vendu ! Revenez quand vous aurez progressé.</p>'}`;
    }
    const cells = s.inv.map((it, i) => `<div class="cell ${ms.sel === i ? 'sel' : ''}" style="border-color:${D.RARITIES[it.rarity].color}" data-act="selSell" data-arg="${i}"><img src="${I.icon(it)}">${it.plus ? `<span class="plus">+${it.plus}</span>` : ''}</div>`).join('');
    const it = ms.sel != null ? s.inv[ms.sel] : null;
    return `<div class="actions" style="margin:0 0 8px"><button class="b small" data-act="sellCommon">Vendre tous les objets Communs</button></div><div class="inv-grid">${cells || '<p class="muted">Votre sac est vide.</p>'}</div>${it ? detailHtml(it, 'inv', `<button class="b small gold" data-act="sell" data-arg="${ms.sel}">Vendre (${I.price(it)} or)</button>`) : ''}`;
  }

  // ================================================================ Forge
  function openForge() { openPanel('Forge de Tilda', [['up', 'Renforcer'], ['salv', 'Recycler']], 'up', renderForge); }
  function allItems() {
    const s = S().save;
    const out = [];
    for (const sl in s.equip) if (s.equip[sl]) out.push({ it: s.equip[sl], key: 'eq:' + sl, eq: true });
    s.inv.forEach((it, i) => out.push({ it, key: 'inv:' + i }));
    return out;
  }
  function itemByKey(k) {
    const s = S().save;
    if (!k) return null;
    const [w, a] = k.split(':');
    return w === 'eq' ? s.equip[a] : s.inv[+a];
  }
  function renderForge(tab) {
    const ms = menuState;
    const list = tab === 'up' ? allItems() : allItems().filter((x) => !x.eq);
    const cells = list.map((x) => `<div class="cell ${ms.sel === x.key ? 'sel' : ''}" style="border-color:${D.RARITIES[x.it.rarity].color}" data-act="selForge" data-arg="${x.key}"><img src="${I.icon(x.it)}">${x.it.plus ? `<span class="plus">+${x.it.plus}</span>` : ''}${x.eq ? '<span class="up" style="color:#ffd84a">E</span>' : ''}</div>`).join('');
    const it = itemByKey(ms.sel);
    let det = '';
    if (it && tab === 'up') {
      const c = I.forgeCost(it);
      const next = Object.assign({}, it, { plus: it.plus + 1 });
      det = `<div class="detail"><div class="t" style="color:${D.RARITIES[it.rarity].color}">${esc(I.displayName(it))}</div>
        ${it.plus >= 10 ? '<p>Niveau maximum atteint !</p>' : `<div class="muted">Après renforcement (+${it.plus + 1}) :</div>${statLines(next, it)}
        <div style="margin-top:6px">Coût : <b style="color:#ffd84a">${c.gold} or</b> + <b style="color:#9fe8ff">${c.stars} Éclat(s) d'étoile</b> · Chance de succès : <b>${c.chance}%</b></div>
        <div class="muted">En cas d'échec, l'objet n'est jamais détruit (contrairement aux forges classiques !).</div>
        <div class="actions"><button class="b gold" data-act="forge">⚒ Renforcer</button></div>`}</div>`;
    } else if (it) {
      det = detailHtml(it, 'inv', `<button class="b small gold" data-act="salvageForge">Recycler (+${I.salvageValue(it)} ✦)</button>`);
    }
    return `<p class="muted">${tab === 'up' ? "Renforcez votre équipement jusqu'à +10 avec de l'or et des Éclats d'étoile (butin des monstres d'élite et des boss)." : "Recyclez l'équipement inutile pour obtenir des Éclats d'étoile."}</p><div class="inv-grid">${cells || '<p class="muted">Aucun objet.</p>'}</div>${det}`;
  }

  // ================================================================ Taverne
  function openTavern() { openPanel("Taverne de l'Étoile Filante", [['merc', 'Mercenaires']], 'merc', renderTavern); }
  function renderTavern() {
    const s = S().save;
    return '<p class="muted">Recrutez jusqu\'à 2 compagnons actifs. Ils grandissent avec vous et peuvent être entraînés (rang +10% stats chacun, max 5).</p>' + Object.keys(D.COMPANIONS).map((cid) => {
      const c = D.COMPANIONS[cid];
      const has = s.recruited.includes(cid), inParty = s.party.includes(cid);
      const locked = s.mainDone < c.unlock;
      let btn;
      if (locked) btn = `<button class="b small" disabled>Après la quête ${c.unlock}</button>`;
      else if (!has) btn = `<button class="b small gold" data-act="recruit" data-arg="${cid}" ${s.gold >= c.cost ? '' : 'disabled'}>Recruter (${c.cost} or)</button>`;
      else btn = `<button class="b small ${inParty ? 'red' : 'green'}" data-act="party" data-arg="${cid}">${inParty ? 'Renvoyer' : "Dans l'équipe"}</button>` + ((s.ranks[cid] || 0) < 5 ? `<button class="b small" data-act="train" data-arg="${cid}">Entraîner (${G.game.trainCost(cid)} or)</button>` : '<span class="tag">Rang max</span>');
      const st = G.combat.allyStats(cid);
      return `<div class="row"><img class="portrait" src="${G.sprites.portrait('humanoid', c.pal, c.short, c.look)}"><div class="grow"><div class="ttl">${esc(c.name)} ${inParty ? '<span class="tag" style="background:#3aa85a">En équipe</span>' : ''}</div>
        <div class="sub"><span class="tag">${c.race}</span><span class="tag">${c.role}</span> Rang ${s.ranks[cid] || 0}/5<br>${c.desc}<br>PV ${st.hp} · Att ${st.atk} · Mag ${st.mag} · Déf ${st.def} · Compétence : ${D.SKILLS[c.skill].name}</div></div><div style="display:flex;flex-direction:column;gap:4px">${btn}</div></div>`;
    }).join('');
  }

  // ================================================================ Portail des Vents
  function openPortal() { openPanel('Portail des Vents', [['go', 'Destinations']], 'go', renderPortal); }
  function renderPortal() {
    const s = S().save;
    return '<p class="muted">Choisissez votre destination. Les donjons changent de forme à chaque visite et les monstres réapparaissent.</p>' + D.ZONES.slice(1).map((z, k) => {
      const i = k + 1, ok = G.game.zoneUnlocked(i);
      const done = s.quests['m' + i] && s.quests['m' + i].st === 'done';
      return `<div class="row"><div class="skill-ico" style="background:${ok ? '#7fe0ff33' : '#0006'}">${['🌲', '⛏️', '🧊', '🏜️', '🏰'][k]}</div><div class="grow"><div class="ttl">${z.name} ${done ? '<span class="tag" style="background:#3aa85a">Fragment obtenu</span>' : ''}</div><div class="sub">${z.sub} · Boss : ${D.MONSTERS[z.boss].name} · ${D.ELEMENTS[D.MONSTERS[z.boss].el].icon} ${D.ELEMENTS[D.MONSTERS[z.boss].el].name}</div></div>
        <button class="b small ${ok ? 'gold' : ''}" data-act="travel" data-arg="${i}" ${ok ? '' : 'disabled'}>${ok ? 'Voyager' : '🔒 Verrouillé'}</button></div>`;
    }).join('');
  }

  // ================================================================ Actions des boutons de menu
  const ACTIONS = {
    selEq: (k) => { menuState.sel = { w: 'eq', k }; rerender(); },
    selInv: (k) => { menuState.sel = { w: 'inv', k: +k }; rerender(); },
    equip: (k) => { G.game.equip(S().save.inv[+k]); menuState.sel = null; rerender(); },
    unequip: (sl) => { G.game.unequip(sl); menuState.sel = null; rerender(); },
    salvage: (k) => {
      const it = S().save.inv[+k];
      const go = () => { G.game.salvage(it); menuState.sel = null; rerender(); };
      if (it.rarity >= 2 || it.plus) confirm(`Recycler ${I.displayName(it)} ?`, go); else go();
    },
    sort: () => { S().save.inv.sort((a, b) => b.rarity - a.rarity || a.slot.localeCompare(b.slot) || b.lvl - a.lvl); menuState.sel = null; rerender(); },
    use: (id) => { G.game.usePotion(id); if (id === 'parchemin') closeMenu(); else rerender(); },
    learn: (id) => { G.game.learnSkill(id); rerender(); },
    music: () => { const s = S().save; s.settings.music = !s.settings.music; G.audio.setMusic(s.settings.music); if (s.settings.music) { G.audio.init(); G.audio.playMusic(S().zone.music); } rerender(); },
    sfx: () => { const s = S().save; s.settings.sfx = !s.settings.sfx; G.audio.setSfx(s.settings.sfx); rerender(); },
    auto: () => { G.game.toggleAuto(); rerender(); },
    save: () => { G.game.save(); toast('Partie sauvegardée'); },
    title: () => { G.game.save(); closeMenu(); location.reload(); },
    wipe: () => confirm('Effacer définitivement la sauvegarde ?', () => { G.game.wipe(); location.reload(); }),
    buy: (id) => { G.game.buy(id); rerender(); },
    buyItem: (i) => { const g = S().shopStock[+i]; if (g && G.game.buyItem(g.it, g.price)) { S().shopStock[+i] = { it: null }; } rerender(); },
    selSell: (i) => { menuState.sel = +i; rerender(); },
    sell: (i) => { G.game.sell(S().save.inv[+i]); menuState.sel = null; rerender(); },
    sellCommon: () => { const s = S().save; const list = s.inv.filter((it) => it.rarity === 0 && !it.plus); list.forEach((it) => G.game.sell(it)); toast(list.length + ' objet(s) vendu(s)'); menuState.sel = null; rerender(); },
    selForge: (k) => { menuState.sel = k; rerender(); },
    forge: () => { const it = itemByKey(menuState.sel); if (!it) return; const r = G.game.forge(it); toast(r.msg, r.ok ? '#6dff8a' : '#ff8a8a'); rerender(); },
    salvageForge: () => { const it = itemByKey(menuState.sel); if (!it) return; const go = () => { G.game.salvage(it); menuState.sel = null; rerender(); }; if (it.rarity >= 2 || it.plus) confirm(`Recycler ${I.displayName(it)} ?`, go); else go(); },
    recruit: (cid) => { if (G.game.recruit(cid)) { toast(D.COMPANIONS[cid].name + ' rejoint votre cause !', 'gold'); closeMenu(); dialog([{ name: D.COMPANIONS[cid].name, text: D.COMPANIONS[cid].hello, portrait: facePortrait(cid) }], openTavern); return; } rerender(); },
    party: (cid) => { G.game.toggleParty(cid); rerender(); },
    train: (cid) => { if (G.game.train(cid)) toast(D.COMPANIONS[cid].name + ' devient plus fort !', 'gold'); rerender(); },
    travel: (i) => { closeMenu(); G.game.enterZone(+i); },
  };

  // Portrait illustré d'un personnage ('hero', id de PNJ ou de compagnon)
  function facePortrait(id) {
    if (id === 'hero') { const c = D.CLASSES[S().save.cls]; return G.sprites.portrait('humanoid', c.pal, false, c.look); }
    const n = D.NPCS[id] || D.COMPANIONS[id];
    return G.sprites.portrait('humanoid', n.pal, n.small || n.short, n.look);
  }

  // ================================================================ Écrans
  function screen(html) {
    els.screen.onclick = null;
    els.screen.innerHTML = '<div class="stars-bg"></div>' + html;
    els.screen.classList.remove('hidden');
  }
  function hideScreen() { els.screen.classList.add('hidden'); els.screen.innerHTML = ''; }

  function showTitle() {
    showHUD(false);
    const has = G.game.hasSave() && G.game.load();
    const s = has ? S().save : null;
    screen(`<div class="title-wrap"><div class="eclipse"></div><div class="logo">ÉCLIPSIA</div><div class="subtitle">Les Gardiens de l'Aube</div>
      <div class="menu-btns">${has ? `<button class="b gold" id="t-cont">Continuer<br><small style="font-weight:normal">${esc(s.name)} · ${D.CLASSES[s.cls].name} · Niv. ${s.lvl}</small></button>` : ''}
      <button class="b ${has ? '' : 'gold'}" id="t-new">Nouvelle partie</button><button class="b" id="t-help">Comment jouer</button></div>
      <div class="version">v1.0 · RPG d'action · Jouable hors ligne</div></div>`);
    if (has) $('t-cont').onclick = () => { G.audio.init(); hideScreen(); G.game.startPlaying(); };
    $('t-new').onclick = () => { G.audio.init(); if (has) confirm('Une sauvegarde existe déjà. Commencer une nouvelle partie l\'écrasera. Continuer ?', showCreate); else showCreate(); };
    $('t-help').onclick = showHelp;
  }

  function showHelp() {
    screen(`<div class="story" style="text-align:left;max-width:680px"><div class="h" style="font-size:20px;text-align:center">Comment jouer</div>
      <p style="font-size:14px;min-height:0;font-family:inherit;line-height:1.6">
      🕹️ <b>Joystick</b> (moitié gauche de l'écran) : se déplacer.<br>
      ⚔️ <b>Attaque</b> : maintenez pour attaquer l'ennemi le plus proche — votre héros s'en approche tout seul.<br>
      ⚡ <b>4 compétences</b> autour du bouton d'attaque. Améliorez-les dans Menu → Compétences.<br>
      ⤿ <b>Esquive</b> : roulade avec invincibilité. Esquivez les zones rouges des boss !<br>
      🌅 <b>LIEN</b> : quand la jauge est pleine, toute l'équipe déclenche une attaque combinée dévastatrice.<br>
      🤖 <b>AUTO</b> : combat automatique (attaques, compétences et potions).<br>
      ♥ ✦ <b>Potions</b> de vie (soigne toute l'équipe) et de mana.<br>
      🔥 <b>Éléments</b> : Feu > Nature > Foudre > Glace > Feu, Lumière ⇄ Ombre. Les faiblesses font ×1,5 dégâts.<br>
      🌙 <b>Nuit</b> : monstres plus forts, mais +25% d'expérience.<br>
      ⚒️ <b>Forge</b> : renforcez votre équipement jusqu'à +10. Un échec ne détruit jamais l'objet.<br>
      💾 Sauvegarde automatique.</p><div style="text-align:center"><button class="b gold" id="h-back">Retour</button></div></div>`);
    $('h-back').onclick = showTitle;
  }

  function showCreate() {
    let cls = 'tempete';
    const max = { hp: 135, mp: 95, atk: 12, mag: 15, def: 10, spd: 72 };
    const cards = Object.keys(D.CLASSES).map((id) => {
      const c = D.CLASSES[id];
      const bar = (k, n) => `<span>${n}</span><span class="m"><i style="width:${(c.base[k] / max[k]) * 100}%"></i></span>`;
      return `<div class="class-card ${id === cls ? 'sel' : ''}" data-cls="${id}"><img src="${G.sprites.portrait('humanoid', c.pal, false, c.look)}"><div class="cn">${c.name}</div><div class="ct">${c.title} · ${D.ELEMENTS[c.element].icon}</div><div class="cd">${c.desc}</div>
        <div class="mini-stats">${bar('hp', 'PV')}${bar('mp', 'PM')}${bar('atk', 'Att.')}${bar('mag', 'Mag.')}${bar('def', 'Déf.')}${bar('spd', 'Vit.')}</div></div>`;
    }).join('');
    screen(`<div class="create"><div class="h" style="font-size:22px;text-align:center">Créer votre Gardien</div>
      <div style="text-align:center"><input id="c-name" maxlength="14" placeholder="Nom du héros" value="Gardien"></div>
      <div class="class-grid">${cards}</div><div style="text-align:center"><button class="b gold" id="c-go" style="min-width:220px">Commencer l'aventure</button> <button class="b" id="c-back">Retour</button></div></div>`);
    els.screen.querySelectorAll('.class-card').forEach((c) => c.onclick = () => {
      cls = c.dataset.cls;
      els.screen.querySelectorAll('.class-card').forEach((x) => x.classList.toggle('sel', x === c));
      G.audio.sfx('ui');
    });
    $('c-back').onclick = showTitle;
    $('c-go').onclick = () => {
      const name = ($('c-name').value || 'Gardien').trim().slice(0, 14) || 'Gardien';
      G.game.newSave(name, cls);
      G.game.save();
      showStory(D.INTRO, () => {
        hideScreen();
        G.game.startPlaying();
        const sel = facePortrait('selene');
        setTimeout(() => dialog([
          { name: 'Séléné (télépathie)', text: "Bienvenue à Aubeclair, Gardien ! Utilise le joystick à gauche de l'écran pour te déplacer.", portrait: sel },
          { name: 'Séléné (télépathie)', text: "Approche-toi des habitants et touche le gros bouton pour leur parler. Le « ! » signale une quête.", portrait: sel },
          { name: 'Séléné (télépathie)', text: "Rejoins-moi devant le temple, au nord du village.", portrait: sel },
        ]), 2600);
      });
    };
  }

  function showStory(lines, done, final) {
    let i = 0;
    const draw = () => {
      screen(`<div class="story"><p>${esc(lines[i])}</p><div class="hint">Touchez pour continuer</div>${final && i === lines.length - 1 ? final : ''}<div style="margin-top:14px"><button class="b small" id="st-skip">Passer</button></div></div>`);
      $('st-skip').onclick = (e) => { e.stopPropagation(); done(); };
      els.screen.onclick = () => { i++; G.audio.sfx('ui'); if (i >= lines.length) { els.screen.onclick = null; done(); } else draw(); };
    };
    G.audio.playMusic(0);
    draw();
  }

  function showDead() {
    screen(`<div class="title-wrap"><div class="dead-title">Vous êtes tombé au combat…</div><p class="muted">La lumière de l'Oracle vous ramène à Aubeclair. Vous perdez 10% de votre or.</p><button class="b gold" id="d-go">Se relever</button></div>`);
    $('d-go').onclick = () => { hideScreen(); G.game.respawn(); };
  }

  function showEnding() {
    const s = S().save;
    G.audio.playMusic(0);
    showStory(D.ENDING, () => {
      const t = Math.floor(s.playTime);
      screen(`<div class="title-wrap"><div class="eclipse" style="background:radial-gradient(#fff3b0,#ffb03a)"></div><div class="logo" style="font-size:38px">FIN</div><div class="subtitle">Merci d'avoir joué à Éclipsia !</div>
        <p>${esc(s.name)} · ${D.CLASSES[s.cls].name} · Niveau ${s.lvl}<br>Temps de jeu : ${Math.floor(t / 3600)}h ${Math.floor((t % 3600) / 60)}min · Monstres vaincus : ${s.kills}</p>
        <div class="credits">Univers, histoire, personnages, graphismes 2D, portraits et musiques générés par le code : créés pour ce projet.<br>Inspiré par l'esprit des RPG d'action mobiles comme Inotia.</div>
        <button class="b gold" id="e-go" style="margin-top:12px">Continuer l'aventure</button></div>`);
      $('e-go').onclick = () => { hideScreen(); G.game.enterZone(0); };
    });
  }

  return {
    init, showHUD, update, toast, banner, bossBar, dialog, isBlocking, confirm, openMenu, closeMenu, openShop, openForge, openTavern, openPortal,
    showTitle, showDead, showEnding, setMinimap, facePortrait,
  };
})();
