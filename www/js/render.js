// Éclipsia — rendu du monde : carte, entités, projectiles, éclairage jour/nuit
'use strict';

G.render = (() => {
  const D = G.data, U = G.util, SP = G.sprites;
  let canvas, ctx, zoom = 1, VW = 400, VH = 230, dpr = 1;
  const cam = { x: 0, y: 0 };
  const flashCache = new WeakMap();
  function flashed(e, k) {
    let m = flashCache.get(e.pal);
    if (!m) { m = {}; flashCache.set(e.pal, m); }
    if (!m[k]) {
      const pal = {};
      for (const c in e.pal) pal[c] = SP.shade(e.pal[c], k);
      pal.s = SP.shade(e.pal.s || '#f0c8a0', k);
      m[k] = pal;
    }
    return Object.assign({}, e, { pal: m[k] });
  }

  function init(c) {
    canvas = c;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    // Hauteur logique adaptée : plus de champ de vision en paysage
    VH = h > w ? 260 : 200;
    zoom = canvas.height / VH;
    VW = canvas.width / zoom;
  }

  function drawEntity(e, isHero) {
    const scale = e.scale || 1;
    const t = e.anim || 0;
    const float = e.def && e.def.fly ? -4 + Math.sin(t * 4) * 1.5 : 0;
    const w = (e.tpl === 'humanoid' ? 12 : 16) * scale;
    // Ombre
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(e.x, e.y + 0.5, w * 0.45, 2.6 * scale, 0, 0, Math.PI * 2); ctx.fill();
    if (isHero) {
      ctx.strokeStyle = 'rgba(255,216,74,0.75)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(e.x, e.y + 0.5, 8.5, 3.6, 0, 0, Math.PI * 2); ctx.stroke();
    }
    if (e.rank === 'elite' || e.boss) {
      ctx.fillStyle = e.boss ? 'rgba(255,40,80,0.2)' : 'rgba(255,200,60,0.18)';
      ctx.beginPath(); ctx.ellipse(e.x, e.y, w * 0.6, 5 * scale, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (e.boss && e.boss.phase === 2) {
      const g = ctx.createRadialGradient(e.x, e.y - 12 * scale, 2, e.x, e.y - 12 * scale, 20 * scale);
      g.addColorStop(0, 'rgba(160,40,255,0.35)'); g.addColorStop(1, 'rgba(160,40,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y - 12 * scale, 20 * scale + Math.sin(t * 6) * 2, 0, Math.PI * 2); ctx.fill();
    }
    const flip = e.faceX < 0;
    // Angle de l'arme dans le repère du personnage
    let armAngle = null, wAng = null;
    if (e.weapon && e.tpl === 'humanoid') {
      if (e.swing) {
        const k = e.swing.t / e.swing.max;
        wAng = e.swing.arc ? e.swing.dir - e.swing.arc / 2 + e.swing.arc * k : e.swing.dir;
      } else if (e.weapon === 'arc') wAng = e.faceX > 0 ? 0 : Math.PI;
      else wAng = e.faceX > 0 ? -0.9 : Math.PI + 0.9;
      const local = flip ? Math.PI - wAng : wAng;
      armAngle = e.swing ? local : (e.weapon === 'arc' ? 0.2 : 1.0);
    }
    ctx.save();
    ctx.translate(e.x, e.y + float);
    ctx.scale(flip ? -scale : scale, scale);
    if (e.iframes > 0 && e.kind === 'hero') ctx.globalAlpha = 0.55;
    // Flash quand le personnage est touché ou prépare une attaque : palette éclaircie (pas de ctx.filter, trop lent)
    const hurt = e.hurtT > 0 ? 0.65 : (e.windup > 0 && Math.floor(e.windup * 20) % 2 === 0) ? 0.35 : 0;
    ctx.lineJoin = 'round';
    const res = G.sprites.drawEntity(ctx, hurt ? flashed(e, hurt) : e, t, armAngle);
    if (res.hx != null && wAng != null) {
      ctx.save(); ctx.translate(res.hx, res.hy);
      const glow = e.kind === 'hero' && G.state.save.equip.weapon && G.state.save.equip.weapon.el ? D.ELEMENTS[G.state.save.equip.weapon.el].color : null;
      SP.drawWeapon(ctx, e.weapon, flip ? Math.PI - wAng : wAng, e.short ? 0.85 : 1, glow);
      ctx.restore();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    const y0 = e.y + float + res.top * scale;
    if (e.st.slow > 0 || e.st.poison > 0 || e.st.burn > 0) {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = e.st.slow > 0 ? '#7fd8ff' : e.st.poison > 0 ? '#7ddc52' : '#ff7a2f';
      ctx.beginPath(); ctx.ellipse(e.x, (y0 + e.y) / 2, w * 0.55, (e.y - y0) * 0.55, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // Étourdissement
    if (e.st.stun > 0) {
      ctx.fillStyle = '#ffe04a';
      for (let i = 0; i < 3; i++) {
        const a = t * 5 + i * 2.1;
        ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * 6, y0 - 2 + Math.sin(a) * 2, 1.2, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Barres de vie
    if (e.kind === 'mob' && !e.boss && e.hp < e.mhp) bar(e.x - 10, y0 - 4, 20, e.hp / e.mhp, e.rank === 'elite' ? '#ffb02a' : '#ff4d4d');
    if (e.kind === 'ally') bar(e.x - 8, y0 - 3, 16, e.hp / e.mhp, '#5ee87a');
    if (e.kind === 'mob' && e.rank === 'elite' && e.hp < e.mhp) {
      ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd84a';
      ctx.fillText('Élite Niv.' + e.lvl, e.x, y0 - 6);
    }
    e.drawTop = y0;
  }

  function bar(x, y, w, k, col) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(x - 0.5, y - 0.5, w + 1, 3);
    ctx.fillStyle = col; ctx.fillRect(x, y, w * U.clamp(k, 0, 1), 2);
  }

  function drawProj(p) {
    const col = D.ELEMENTS[p.el] ? D.ELEMENTS[p.el].color : '#fff';
    switch (p.kind) {
      case 'arrow':
        ctx.strokeStyle = '#e8d8b0'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(p.x - Math.cos(p.ang) * 7, p.y - Math.sin(p.ang) * 7); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.fillStyle = p.el !== 'phys' ? col : '#ffffff'; ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
        break;
      case 'ice':
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang);
        ctx.fillStyle = '#bff0ff'; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -2.5); ctx.lineTo(-6, 0); ctx.lineTo(-4, 2.5); ctx.fill();
        ctx.restore();
        break;
      case 'spark':
        ctx.fillStyle = '#fff36a';
        ctx.fillRect(p.x - 2 + U.rand(-1, 1), p.y - 2 + U.rand(-1, 1), 4, 4);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
        break;
      default: {
        const c = { fire: '#ff7a2f', spore: '#9be86a', shadow: '#b06bff', light: '#fff3b0', orb: col }[p.kind] || col;
        ctx.fillStyle = c; ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.75, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
        if (p.kind === 'fire' && Math.random() < 0.5) G.fx.burst(p.x, p.y, '#ffb03a', 1, 15);
      }
    }
  }

  function drawPortal(p, t, label, active = true) {
    const pulse = Math.sin(t * 3) * 1.5;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 6, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(p.x, p.y - 6, 1, p.x, p.y - 6, 14 + pulse);
    g.addColorStop(0, active ? '#ffffff' : '#888');
    g.addColorStop(0.4, active ? '#7fe0ff' : '#666');
    g.addColorStop(1, 'rgba(80,120,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(p.x, p.y - 6, 10 + pulse, 14 + pulse, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c8a24a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(p.x, p.y - 6, 10, 14, 0, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const a = t * 2 + i * 2.1;
      ctx.fillStyle = '#e8fbff'; ctx.fillRect(p.x + Math.cos(a) * 7 - 0.5, p.y - 6 + Math.sin(a) * 10, 1.5, 1.5);
    }
    if (label) label3d(label, p.x, p.y - 24, '#bfefff');
  }

  function label3d(str, x, y, col = '#fff') {
    ctx.font = 'bold 7px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.strokeText(str, x, y);
    ctx.fillStyle = col; ctx.fillText(str, x, y);
  }

  function drawDrop(d, t) {
    const bob = Math.sin(t * 4 + d.x) * 1.5;
    if (d.type === 'gold') {
      ctx.fillStyle = '#b8860b'; ctx.beginPath(); ctx.arc(d.x, d.y - 3 + bob, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(d.x - 0.5, d.y - 3.5 + bob, 2, 0, Math.PI * 2); ctx.fill();
    } else if (d.type === 'item') {
      const col = D.RARITIES[d.item.rarity].color;
      ctx.fillStyle = col; ctx.globalAlpha = 0.3; ctx.fillRect(d.x - 2, d.y - 22, 4, 22); ctx.globalAlpha = 1;
      ctx.fillStyle = col; ctx.fillRect(d.x - 3, d.y - 6 + bob, 6, 6);
      ctx.fillStyle = '#fff'; ctx.fillRect(d.x - 2, d.y - 5 + bob, 2, 2);
    } else if (d.type === 'cons') {
      ctx.fillStyle = D.CONSUMABLES[d.id].color; ctx.beginPath(); ctx.arc(d.x, d.y - 3 + bob, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ddd'; ctx.fillRect(d.x - 1, d.y - 8 + bob, 2, 2);
    } else if (d.type === 'star') {
      ctx.fillStyle = '#9fe8ff'; ctx.save(); ctx.translate(d.x, d.y - 4 + bob); ctx.rotate(t * 2);
      ctx.fillRect(-2.5, -0.8, 5, 1.6); ctx.fillRect(-0.8, -2.5, 1.6, 5); ctx.restore();
    }
  }

  function draw(dt) {
    const S = G.state;
    const h = S.hero;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    const th = SP.THEMES[S.map.theme];
    ctx.fillStyle = th.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const mw = S.map.w * 16, mh = S.map.h * 16;
    const tx = h ? h.x : mw / 2, ty = h ? h.y - 8 : mh / 2;
    // Caméra centrée sur le héros (marge autorisée hors carte pour ne jamais le cacher sous les boutons)
    cam.x = U.clamp(tx - VW / 2, -VW * 0.3, mw - VW * 0.7);
    cam.y = U.clamp(ty - VH / 2, -VH * 0.3, mh - VH * 0.7);
    const sh = S.shakeT > 0 ? S.shakeAmp : 0;
    const ox = Math.round((cam.x + U.rand(-sh, sh)) * zoom) / zoom, oy = Math.round((cam.y + U.rand(-sh, sh)) * zoom) / zoom;
    ctx.setTransform(zoom, 0, 0, zoom, -ox * zoom, -oy * zoom);
    ctx.imageSmoothingEnabled = true;

    // Carte (uniquement la portion visible)
    const RS = SP.RES;
    const sx = Math.max(0, Math.floor(ox)), sy = Math.max(0, Math.floor(oy));
    const sw = Math.min(S.mapCanvas.width / RS - sx, Math.ceil(VW) + 2), shh = Math.min(S.mapCanvas.height / RS - sy, Math.ceil(VH) + 2);
    ctx.imageSmoothingEnabled = true;
    if (sw > 0 && shh > 0) ctx.drawImage(S.mapCanvas, sx * RS, sy * RS, sw * RS, shh * RS, sx, sy, sw, shh);

    const t = S.time;
    // Zones au sol
    for (const z of S.gzones) {
      const col = D.ELEMENTS[z.el].color;
      ctx.globalAlpha = z.t < z.delay ? 0.25 + 0.25 * Math.sin(t * 20) : 0.3;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.8; ctx.strokeStyle = col; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // Télégraphes des boss
    for (const tl of S.teles) {
      const k = tl.t / tl.max;
      if (tl.line) {
        ctx.save(); ctx.translate(tl.x, tl.y); ctx.rotate(tl.a);
        ctx.fillStyle = 'rgba(255,40,40,0.22)'; ctx.fillRect(0, -tl.w / 2, tl.len, tl.w);
        ctx.fillStyle = 'rgba(255,60,60,0.45)'; ctx.fillRect(0, -tl.w / 2, tl.len * k, tl.w);
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(255,30,30,0.18)';
        ctx.beginPath(); ctx.ellipse(tl.x, tl.y, tl.r, tl.r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,60,40,0.4)';
        ctx.beginPath(); ctx.ellipse(tl.x, tl.y, tl.r * k, tl.r * 0.7 * k, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,90,60,0.9)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(tl.x, tl.y, tl.r, tl.r * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
    // Portails
    if (S.map.portal) drawPortal(S.map.portal, t, S.zone.town ? 'Portail des Vents' : 'Retour au village');
    if (S.bossPortal) drawPortal(S.bossPortal, t, 'Retour au village');
    for (const d of S.drops) if (d.x > ox - 20 && d.x < ox + VW + 20 && d.y > oy - 30 && d.y < oy + VH + 20) drawDrop(d, t);

    // Entités triées par profondeur
    // On ne dessine que ce qui est visible à l'écran
    const vis = (e, m = 40) => e.x > ox - m && e.x < ox + VW + m && e.y > oy - m && e.y < oy + VH + m * 1.5;
    const list = [];
    for (const n of S.npcs) if (vis(n)) list.push(n);
    for (const p of S.party) if (!p.dead && vis(p)) list.push(p);
    for (const m of S.mobs) if (!m.dead && vis(m, 40 * (m.scale || 1))) list.push(m);
    list.sort((a, b) => a.y - b.y);
    for (const e of list) {
      if (e.isNpc) {
        drawEntity(e, false);
        label3d(e.name, e.x, e.drawTop - 3, '#ffe9b0');
        const mk = G.game.npcMarker(e.nid);
        if (mk) {
          const by = e.drawTop - 14 + Math.sin(t * 5) * 1.5;
          ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
          ctx.lineWidth = 2.5; ctx.strokeStyle = '#000'; ctx.strokeText(mk, e.x, by);
          ctx.fillStyle = mk === '?' ? '#6dff8a' : '#ffd84a'; ctx.fillText(mk, e.x, by);
        }
      } else drawEntity(e, e === h);
    }
    for (const p of S.projs) if (vis(p)) drawProj(p);
    G.fx.draw(ctx);

    // Éclairage jour / nuit
    const dark = G.game.darkness();
    if (dark > 0.02) {
      // Obscurité : un seul dégradé radial centré sur le héros (léger pour les téléphones)
      const lx = h ? h.x : ox + VW / 2, ly = h ? h.y - 6 : oy + VH / 2;
      const g = ctx.createRadialGradient(lx, ly, 18, lx, ly, 110);
      g.addColorStop(0, 'rgba(8,10,40,0)');
      g.addColorStop(0.55, `rgba(8,10,40,${dark * 0.55})`);
      g.addColorStop(1, `rgba(8,10,40,${dark})`);
      ctx.fillStyle = g;
      ctx.fillRect(ox - 2, oy - 2, VW + 4, VH + 4);
    }
    G.fx.drawTexts(ctx);

    // Flash plein écran
    if (S.flashT > 0) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = Math.min(0.7, S.flashT * 2);
      ctx.fillStyle = S.flashCol; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }
  }

  return { init, draw, resize, cam, get VW() { return VW; }, get VH() { return VH; } };
})();
