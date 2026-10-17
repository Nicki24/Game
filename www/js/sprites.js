// Éclipsia — graphismes 2D vectoriels : personnages animés, monstres, décors, portraits, icônes
'use strict';

G.sprites = (() => {
  const OL = '#1c1428';            // couleur de contour
  const DEF = { s: '#f0c8a0', h: '#4a3020', a: '#888888', b: '#666666', c: '#444444', d: '#333333', f: '#222222', e: '#1a1a1a', l: '#ffffff' };
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- Outils de couleur
  function shade(hex, k) {
    // k < 0 assombrit, k > 0 éclaircit
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    const n = parseInt(c, 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const t = k < 0 ? 0 : 255, p = Math.abs(k);
    r = Math.round(r + (t - r) * p); g = Math.round(g + (t - g) * p); b = Math.round(b + (t - b) * p);
    return `rgb(${r},${g},${b})`;
  }
  function fillStroke(x, fill, lw = 0.7) {
    x.fillStyle = fill; x.fill();
    if (lw) { x.lineWidth = lw; x.strokeStyle = OL; x.stroke(); }
  }
  function rrect(x, px, py, w, h, r) {
    x.beginPath();
    if (x.roundRect) x.roundRect(px, py, w, h, r);
    else { x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); }
  }
  function ellipse(x, cx, cy, rx, ry, rot = 0) { x.beginPath(); x.ellipse(cx, cy, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); }
  function circle(x, cx, cy, r) { x.beginPath(); x.arc(cx, cy, Math.max(0.01, r), 0, TAU); }
  function limb(x, x1, y1, x2, y2, w, col) {
    x.lineCap = 'round';
    x.strokeStyle = OL; x.lineWidth = w + 1.2;
    x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
    x.strokeStyle = col; x.lineWidth = w;
    x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
  }

  // ================================================================ Personnages (humanoïdes)
  // Repère local : pieds en (0,0), personnage tourné vers la droite.
  // Renvoie la position de la main avant (pour l'arme) et le sommet du personnage.
  function drawHumanoid(x, e, t, armAngle) {
    const p = Object.assign({}, DEF, e.pal);
    const L = e.look || {};
    const short = !!e.short;
    const ph = t * 11;
    const walk = e.moving ? Math.sin(ph) : 0;
    const bob = e.moving ? Math.abs(Math.cos(ph)) * 0.7 : Math.sin(t * 2.2) * 0.3;
    const legH = short ? 4.6 : 6.6, torsoH = short ? 6 : 7.6, R = 6.3;
    const hipY = -legH - bob * 0.3, shY = hipY - torsoH, cx = 0.6, cy = shY - R + 1.6 - bob * 0.5;

    // Cape (derrière)
    if (L.cape) {
      x.beginPath(); x.moveTo(-3.5, shY + 0.5); x.quadraticCurveTo(-9 - walk, hipY + 2, -6.5 - walk * 1.5, 0.2); x.lineTo(2, -0.5); x.lineTo(2, shY + 1);
      x.closePath(); fillStroke(x, p.b);
    }
    // Cheveux longs (derrière le corps)
    if (L.hair === 'long') {
      x.beginPath(); x.moveTo(cx - R + 0.5, cy - 1); x.quadraticCurveTo(cx - R - 1.8, shY + 4, cx - R + 1.5, shY + 6.5);
      x.lineTo(cx + 0.5, shY + 4.5); x.lineTo(cx + 1, cy); x.closePath(); fillStroke(x, p.h);
    }
    if (L.hair === 'pony') {
      x.beginPath(); x.moveTo(cx - R + 1, cy - 3); x.quadraticCurveTo(cx - R - 5 - walk, cy, cx - R - 2.5 - walk * 1.2, shY + 5);
      x.quadraticCurveTo(cx - R + 0.5, cy + 2, cx - R + 2, cy - 1); x.closePath(); fillStroke(x, p.h);
    }
    // Bras arrière
    const bsx = -2.2, bsy = shY + 1.8, ba = 1.9 + walk * 0.7;
    limb(x, bsx, bsy, bsx + Math.cos(ba) * 4.6, bsy + Math.sin(ba) * 4.6, 2.3, shade(p.a, -0.25));
    circle(x, bsx + Math.cos(ba) * 5, bsy + Math.sin(ba) * 5, 1.25); fillStroke(x, shade(p.s, -0.12), 0.5);
    // Jambes
    const leg = (lx, dark) => {
      const col = dark ? shade(p.d, -0.25) : p.d;
      rrect(x, lx - 1.45, hipY - 0.5, 2.9, legH + 0.5, 1.2); fillStroke(x, col);
      rrect(x, lx - 1.6, -2.1, 3.6, 2.4, 1.1); fillStroke(x, dark ? shade(p.f, -0.25) : p.f);
    };
    leg(-1.2 - walk * 1.9, true);
    leg(1.4 + walk * 1.9, false);
    // Torse
    rrect(x, -4.3, shY, 8.6, torsoH + 0.8, 2.6); fillStroke(x, p.a);
    x.save(); rrect(x, -4.3, shY, 8.6, torsoH + 0.8, 2.6); x.clip();
    x.fillStyle = shade(p.a, -0.22); x.fillRect(-4.3, shY, 2.6, torsoH + 1);          // ombre (dos)
    x.fillStyle = p.b; x.fillRect(0, shY, 2.4, torsoH + 1);                            // bande d'accent
    x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(2.6, shY + 0.6, 1.2, torsoH - 2); // reflet
    x.fillStyle = p.c; x.fillRect(-4.3, hipY - 1.7, 8.6, 1.7);                          // ceinture
    x.restore();
    x.fillStyle = p.b; x.fillRect(0.6, hipY - 1.6, 1.4, 1.4);                          // boucle
    if (L.shoulder) { ellipse(x, 1.5, shY + 1, 2.6, 1.7); fillStroke(x, shade(p.b, 0.1)); }

    // Tête
    const top = drawHead(x, p, L, cx, cy, R, t);

    // Bras avant (tient l'arme)
    const fa = armAngle != null ? armAngle : 1.25 - walk * 0.6;
    const fsx = 1.8, fsy = shY + 2;
    const hx = fsx + Math.cos(fa) * 5, hy = fsy + Math.sin(fa) * 5;
    limb(x, fsx, fsy, hx, hy, 2.4, p.a);
    circle(x, hx, hy, 1.35); fillStroke(x, p.s, 0.5);
    return { hx, hy, top };
  }

  function drawHead(x, p, L, cx, cy, R, t) {
    const eye = L.eye || p.e;
    // Oreilles
    if (L.ears === 'elf') { x.beginPath(); x.moveTo(cx - 3, cy); x.lineTo(cx - 9.5, cy - 4.5); x.lineTo(cx - 2.5, cy + 2.5); x.closePath(); fillStroke(x, p.s); }
    if (L.ears === 'goblin') { x.beginPath(); x.moveTo(cx - 3, cy - 1); x.lineTo(cx - 11, cy - 3); x.lineTo(cx - 3, cy + 3); x.closePath(); fillStroke(x, p.s); }
    // Visage
    circle(x, cx, cy, R); fillStroke(x, p.s, 0.8);
    x.save(); circle(x, cx, cy, R); x.clip();
    x.fillStyle = 'rgba(0,0,0,0.10)'; circle(x, cx - R * 0.9, cy + R * 0.3, R * 0.8); x.fill();
    x.restore();
    // Yeux (vue de trois-quarts)
    const ey = cy + 0.9;
    for (const [ex, k] of [[cx + R * 0.18, 0.85], [cx + R * 0.66, 1]]) {
      if (L.glow) { x.fillStyle = eye; x.globalAlpha = 0.35; circle(x, ex, ey, 1.9 * k); x.fill(); x.globalAlpha = 1; }
      ellipse(x, ex, ey, 0.95 * k, 1.35 * k); x.fillStyle = L.glow ? eye : '#ffffff'; x.fill();
      if (!L.glow) { ellipse(x, ex + 0.15, ey + 0.15, 0.72 * k, 1.05 * k); x.fillStyle = eye; x.fill(); ellipse(x, ex + 0.2, ey + 0.25, 0.38 * k, 0.6 * k); x.fillStyle = '#120c18'; x.fill(); }
      circle(x, ex - 0.2, ey - 0.45, 0.3 * k); x.fillStyle = '#ffffff'; x.fill();
    }
    // Sourcils, bouche, joues
    x.strokeStyle = shade(p.h, -0.3); x.lineWidth = 0.55; x.lineCap = 'round';
    x.beginPath(); x.moveTo(cx + R * 0.02, ey - 2.1); x.lineTo(cx + R * 0.36, ey - 2.3); x.moveTo(cx + R * 0.52, ey - 2.3); x.lineTo(cx + R * 0.86, ey - 2.0); x.stroke();
    if (!L.mask && !L.beard && L.hair !== 'wraps') {
      x.strokeStyle = '#7a3a34'; x.lineWidth = 0.5;
      x.beginPath(); x.arc(cx + R * 0.48, cy + 3, 0.9, 0.2, Math.PI - 0.2); x.stroke();
      x.fillStyle = 'rgba(255,110,120,0.35)'; circle(x, cx + R * 0.82, cy + 2.6, 0.95); x.fill();
    }
    if (L.scar) { x.strokeStyle = '#a0504a'; x.lineWidth = 0.4; x.beginPath(); x.moveTo(cx + R * 0.75, cy - 1.6); x.lineTo(cx + R * 0.55, cy + 0.6); x.stroke(); }
    if (L.mustache) { x.beginPath(); x.moveTo(cx + R * 0.2, cy + 2.6); x.quadraticCurveTo(cx + R * 0.5, cy + 1.6, cx + R * 0.95, cy + 2.8); x.quadraticCurveTo(cx + R * 0.5, cy + 3.2, cx + R * 0.2, cy + 2.6); fillStroke(x, p.h, 0.4); }
    if (L.beard) {
      x.beginPath(); x.moveTo(cx - R * 0.35, cy + 0.8); x.quadraticCurveTo(cx - R * 0.2, cy + R + 4, cx + R * 0.45, cy + R + 3.5);
      x.quadraticCurveTo(cx + R * 1.05, cy + R * 0.8, cx + R * 0.95, cy + 1.5); x.quadraticCurveTo(cx + R * 0.5, cy + 2.2, cx - R * 0.35, cy + 0.8); fillStroke(x, p.h);
    }
    if (L.mask) { x.beginPath(); x.moveTo(cx - R * 0.2, cy + 1.9); x.lineTo(cx + R + 0.3, cy + 1.6); x.lineTo(cx + R * 0.6, cy + R * 0.95); x.lineTo(cx - R * 0.2, cy + R * 0.8); x.closePath(); fillStroke(x, p.c, 0.5); }
    // Cheveux / coiffes
    let top = cy - R - 1;
    const hair = L.hair || 'short';
    const cap = (extra = 0) => {
      x.beginPath();
      x.arc(cx, cy, R + 0.6 + extra, Math.PI * 0.82, Math.PI * 2.02);
      x.quadraticCurveTo(cx + R * 0.5, cy - R * 0.25, cx + R * 0.05, cy - R * 0.38);
      x.quadraticCurveTo(cx - R * 0.2, cy - R * 0.1, cx - R * 0.55, cy + R * 0.55);
      x.closePath(); fillStroke(x, p.h);
      x.strokeStyle = 'rgba(255,255,255,0.3)'; x.lineWidth = 0.6;
      x.beginPath(); x.arc(cx, cy, R - 0.6, Math.PI * 1.25, Math.PI * 1.55); x.stroke();
    };
    if (hair === 'wraps') {
      x.strokeStyle = shade(p.s, -0.3); x.lineWidth = 0.5;
      for (let i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(cx - R, cy + i * 1.8 - 1); x.lineTo(cx + R, cy + i * 1.8 + 1); x.stroke(); }
    } else if (hair === 'helm') {
      x.beginPath(); x.arc(cx, cy, R + 0.9, Math.PI * 0.95, Math.PI * 2.05); x.lineTo(cx + R + 0.9, cy - 0.5); x.lineTo(cx - R - 0.9, cy - 0.5); x.closePath();
      fillStroke(x, p.h);
      x.fillStyle = 'rgba(255,255,255,0.35)'; ellipse(x, cx - 1, cy - R * 0.55, 2.2, 1.1); x.fill();
      rrect(x, cx - R - 1, cy - 1.4, R * 2 + 2, 1.6, 0.6); fillStroke(x, shade(p.h, -0.25), 0.5);
      rrect(x, cx + R * 0.38, cy - 1, 1.2, 4, 0.5); fillStroke(x, shade(p.h, -0.25), 0.4);
      x.beginPath(); x.moveTo(cx - 1, cy - R - 0.5); x.quadraticCurveTo(cx - 6, cy - R - 5, cx - 9, cy - R + 1); x.lineWidth = 1.6; x.strokeStyle = p.b; x.stroke();
      top -= 2;
    } else if (hair !== 'bald') {
      cap(hair === 'wild' ? 1.2 : 0);
      if (hair === 'spiky' || hair === 'wild') {
        for (let i = 0; i < 4; i++) {
          const a = Math.PI * (1.1 + i * 0.25);
          const bx = cx + Math.cos(a) * R, by = cy + Math.sin(a) * R;
          x.beginPath(); x.moveTo(bx - 1.6, by + 0.6); x.lineTo(cx + Math.cos(a) * (R + 3.4), cy + Math.sin(a) * (R + 3.4)); x.lineTo(bx + 1.6, by + 0.8); x.closePath(); fillStroke(x, p.h, 0.5);
        }
        top -= 2.5;
      }
      if (hair === 'bun') { circle(x, cx - R * 0.55, cy - R * 0.85, 2.6); fillStroke(x, p.h); top -= 1.5; }
      if (hair === 'twin') {
        for (const s of [-1, 1]) { ellipse(x, cx + s * (R + 1.2) - 0.6, cy + 1.5, 1.8, 3); fillStroke(x, p.h); }
        x.fillStyle = p.b; circle(x, cx - R - 0.5, cy - 1.2, 0.9); x.fill();
      }
    } else {
      x.fillStyle = 'rgba(255,255,255,0.35)'; ellipse(x, cx - 1.5, cy - R * 0.6, 2, 1); x.fill();
    }
    // Accessoires
    if (L.circlet) {
      x.strokeStyle = '#ffd84a'; x.lineWidth = 0.8;
      x.beginPath(); x.arc(cx, cy + 1.2, R + 0.2, Math.PI * 1.12, Math.PI * 1.9); x.stroke();
      x.fillStyle = L.eye || '#ff4d6d'; circle(x, cx + R * 0.35, cy - R * 0.68, 0.9); x.fill();
    }
    if (L.bandana) { x.beginPath(); x.arc(cx, cy, R + 0.8, Math.PI * 1.05, Math.PI * 1.95); x.lineTo(cx + R * 0.8, cy - R * 0.25); x.lineTo(cx - R * 0.9, cy - R * 0.1); x.closePath(); fillStroke(x, p.b, 0.5); }
    if (L.goggles) {
      x.strokeStyle = '#5a3a1a'; x.lineWidth = 1.1; x.beginPath(); x.arc(cx, cy + 1, R + 0.3, Math.PI * 1.08, Math.PI * 1.98); x.stroke();
      for (const gx of [cx + R * 0.1, cx + R * 0.68]) { circle(x, gx, cy - R * 0.5, 1.5); fillStroke(x, p.b, 0.6); x.fillStyle = 'rgba(255,255,255,0.6)'; circle(x, gx - 0.4, cy - R * 0.5 - 0.4, 0.45); x.fill(); }
    }
    if (L.feather) { x.beginPath(); x.moveTo(cx - R * 0.6, cy - R * 0.7); x.quadraticCurveTo(cx - R - 4, cy - R - 4, cx - R - 5, cy - R - 1); x.quadraticCurveTo(cx - R - 1, cy - R * 0.5, cx - R * 0.6, cy - R * 0.7); fillStroke(x, p.b, 0.5); }
    if (L.hat === 'wizard') {
      x.beginPath(); x.moveTo(cx - R - 0.5, cy - R * 0.55); x.quadraticCurveTo(cx - 1, cy - R - 9, cx - 5.5, cy - R - 11.5);
      x.quadraticCurveTo(cx + 1.5, cy - R - 6, cx + R + 0.8, cy - R * 0.5); x.closePath(); fillStroke(x, p.a);
      ellipse(x, cx, cy - R * 0.5, R + 3.2, 1.6); fillStroke(x, shade(p.a, -0.15));
      x.strokeStyle = p.b; x.lineWidth = 1; x.beginPath(); x.moveTo(cx - R + 0.5, cy - R * 0.78); x.quadraticCurveTo(cx, cy - R * 1.05, cx + R - 0.5, cy - R * 0.75); x.stroke();
      x.fillStyle = '#ffe9a0'; circle(x, cx - 5.5, cy - R - 11.5, 0.9); x.fill();
      top = cy - R - 12;
    }
    if (L.crown) {
      x.beginPath(); const by = cy - R + 0.5;
      x.moveTo(cx - 5, by); x.lineTo(cx - 5.5, by - 5); x.lineTo(cx - 2.5, by - 2.5); x.lineTo(cx, by - 6.5); x.lineTo(cx + 2.5, by - 2.5); x.lineTo(cx + 5.5, by - 5); x.lineTo(cx + 5, by); x.closePath();
      fillStroke(x, '#ffd84a', 0.6);
      x.fillStyle = '#ff2b6b'; circle(x, cx, by - 1.6, 0.9); x.fill();
      top = by - 7;
    }
    return top;
  }

  // ================================================================ Monstres
  function drawMonster(x, e, t) {
    const p = Object.assign({}, DEF, e.pal);
    const mv = e.moving ? Math.sin(t * 10) : 0;
    switch (e.tpl) {
      case 'slime': {
        const sq = Math.sin(t * 5) * 0.12 + (e.moving ? Math.abs(mv) * 0.15 : 0);
        const w = 7.5 * (1 + sq), h = 8 * (1 - sq);
        x.beginPath(); x.moveTo(-w, 0); x.quadraticCurveTo(-w - 0.5, -h * 0.9, 0, -h); x.quadraticCurveTo(w + 0.5, -h * 0.9, w, 0); x.closePath();
        const g = x.createRadialGradient(-2, -h * 0.75, 0.5, 0, -h * 0.4, w * 1.3);
        g.addColorStop(0, p.l); g.addColorStop(0.35, p.a); g.addColorStop(1, p.b);
        fillStroke(x, g, 0.8);
        for (const ex of [1, 4.2]) { ellipse(x, ex, -h * 0.5, 1.1, 1.6); x.fillStyle = '#fff'; x.fill(); ellipse(x, ex + 0.3, -h * 0.47, 0.6, 1); x.fillStyle = p.e; x.fill(); }
        x.strokeStyle = p.e; x.lineWidth = 0.5; x.beginPath(); x.arc(2.8, -h * 0.28, 1, 0.3, Math.PI - 0.3); x.stroke();
        x.fillStyle = 'rgba(255,255,255,0.6)'; ellipse(x, -3, -h * 0.72, 1.5, 0.9, -0.5); x.fill();
        return -h - 1;
      }
      case 'beast': {
        const legs = [[-5, -0.6], [-2.5, 0.6], [3, -0.6], [5.2, 0.6]];
        for (const [lx, k] of legs) limb(x, lx, -5, lx + mv * 2 * k, -0.6, 2, k < 0 ? shade(p.a, -0.25) : p.a);
        x.beginPath(); x.moveTo(-7, -7); x.quadraticCurveTo(-12, -9 + mv, -11.5, -12.5 + mv); x.lineWidth = 2.6; x.strokeStyle = OL; x.stroke(); x.lineWidth = 1.6; x.strokeStyle = p.a; x.stroke();
        ellipse(x, -0.5, -6.8, 8, 4.6); fillStroke(x, p.a);
        ellipse(x, 0, -4.8, 5.5, 2.2); x.fillStyle = p.c; x.fill();
        // tête
        x.beginPath(); x.moveTo(5.5, -12.5); x.lineTo(6.2, -16.5); x.lineTo(8.5, -12.8); x.closePath(); fillStroke(x, shade(p.a, -0.15), 0.6);
        circle(x, 7.5, -10, 4.2); fillStroke(x, p.a);
        ellipse(x, 11, -8.8, 3, 2); fillStroke(x, p.c, 0.6);
        circle(x, 13.6, -9.2, 0.9); x.fillStyle = p.b; x.fill();
        x.beginPath(); x.moveTo(7.8, -13); x.lineTo(9, -16.8); x.lineTo(10.5, -12.6); x.closePath(); fillStroke(x, p.a, 0.6);
        ellipse(x, 9, -10.6, 0.9, 1.1); x.fillStyle = p.e; x.fill();
        x.fillStyle = '#fff'; circle(x, 8.8, -11, 0.3); x.fill();
        x.fillStyle = '#fff'; x.beginPath(); x.moveTo(11.5, -7.4); x.lineTo(12, -6.3); x.lineTo(12.5, -7.4); x.fill();
        return -17;
      }
      case 'bat': {
        const f = Math.sin(t * 16);
        for (const s of [-1, 1]) {
          x.beginPath(); x.moveTo(0, -10);
          x.quadraticCurveTo(s * 6, -16 - f * 5, s * 11, -12 - f * 6); x.lineTo(s * 8.5, -9 - f * 2); x.lineTo(s * 6, -10.5 - f); x.lineTo(s * 3.5, -7.5);
          x.closePath(); fillStroke(x, s < 0 ? shade(p.a, -0.25) : p.a);
        }
        circle(x, 0, -9.5, 3.6); fillStroke(x, p.a);
        for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 1.2, -12.5); x.lineTo(s * 2.5, -15); x.lineTo(s * 2.8, -11.8); fillStroke(x, p.a, 0.5); }
        for (const s of [-1, 1]) { circle(x, s * 1.3 + 0.5, -10, 0.85); x.fillStyle = p.e; x.fill(); }
        x.fillStyle = '#fff'; x.beginPath(); x.moveTo(0.2, -7.6); x.lineTo(0.7, -6.5); x.lineTo(1.2, -7.6); x.fill();
        return -18;
      }
      case 'mushroom': {
        const sq = e.moving ? Math.abs(mv) * 0.6 : Math.sin(t * 3) * 0.3;
        rrect(x, -3.5 + mv * 0.5, -1.6, 2.6, 1.8, 0.8); fillStroke(x, shade(p.s, -0.3), 0.5);
        rrect(x, 1 - mv * 0.5, -1.6, 2.6, 1.8, 0.8); fillStroke(x, shade(p.s, -0.3), 0.5);
        rrect(x, -3.6, -8 + sq, 7.2, 7.5, 3); fillStroke(x, p.s);
        for (const ex of [-0.5, 2]) { ellipse(x, ex, -4.6 + sq, 0.8, 1.1); x.fillStyle = p.e; x.fill(); }
        x.beginPath(); x.moveTo(-9, -7 + sq); x.quadraticCurveTo(-8.5, -16 + sq, 0, -16 + sq); x.quadraticCurveTo(8.5, -16 + sq, 9, -7 + sq);
        x.quadraticCurveTo(0, -5 + sq, -9, -7 + sq); x.closePath();
        const g = x.createLinearGradient(0, -16, 0, -6); g.addColorStop(0, shade(p.a, 0.2)); g.addColorStop(1, shade(p.a, -0.2));
        fillStroke(x, g);
        x.fillStyle = p.b;
        for (const [sx, sy, r] of [[-4.5, -11, 1.6], [1, -13.5, 1.3], [4.8, -10, 1.4], [-0.5, -9.5, 0.9]]) { circle(x, sx, sy + sq, r); x.fill(); }
        return -17;
      }
      case 'golem': {
        const glow = (gx, gy, r) => { const g = x.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, p.l); g.addColorStop(0.5, p.b); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; circle(x, gx, gy, r); x.fill(); };
        rrect(x, -5.5 - mv, -5, 4, 5.2, 1.5); fillStroke(x, shade(p.a, -0.25));
        rrect(x, 1.5 + mv, -5, 4, 5.2, 1.5); fillStroke(x, p.a);
        rrect(x, -10.5, -15 - mv * 0.4, 4.5, 8, 2); fillStroke(x, shade(p.a, -0.25));
        rrect(x, -6.5, -16, 13, 12, 3.5); fillStroke(x, p.a);
        x.strokeStyle = p.b; x.lineWidth = 0.6; x.beginPath(); x.moveTo(-4, -14); x.lineTo(-2, -11); x.lineTo(-3.5, -8); x.moveTo(4, -6); x.lineTo(2.5, -9); x.stroke();
        glow(0.5, -10, 4.5); circle(x, 0.5, -10, 1.6); x.fillStyle = p.l; x.fill();
        rrect(x, -4, -21.5, 9, 6.5, 2.5); fillStroke(x, shade(p.a, 0.08));
        for (const ex of [-1, 2.8]) { glow(ex, -18.5, 2); rrect(x, ex - 1, -19, 2, 1.1, 0.4); x.fillStyle = p.l; x.fill(); }
        rrect(x, 6, -15 + mv * 0.4, 4.5, 8, 2); fillStroke(x, p.a);
        return -22;
      }
      case 'ghost': {
        const w = Math.sin(t * 4);
        x.globalAlpha = 0.9;
        x.beginPath(); x.moveTo(-6, -9); x.arc(0, -10, 6, Math.PI, 0);
        x.lineTo(6, -2);
        for (let i = 0; i < 4; i++) { const xx = 6 - (i + 0.5) * 3; x.quadraticCurveTo(xx + 0.5, 1 + ((i + (w > 0 ? 1 : 0)) % 2) * 2, xx - 1.5, -2); }
        x.closePath();
        const g = x.createLinearGradient(0, -16, 0, 1); g.addColorStop(0, p.a); g.addColorStop(1, p.b);
        fillStroke(x, g, 0.7);
        x.globalAlpha = 1;
        for (const ex of [-0.3, 3.2]) { ellipse(x, ex, -10.5, 1.2, 1.8); x.fillStyle = p.e; x.fill(); x.fillStyle = '#fff'; circle(x, ex - 0.3, -11.2, 0.4); x.fill(); }
        ellipse(x, 1.6, -6.8, 1.1, 1.4); x.fillStyle = p.e; x.fill();
        x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = 0.7; x.beginPath(); x.arc(0, -10, 4.6, Math.PI * 1.15, Math.PI * 1.45); x.stroke();
        return -17;
      }
      case 'scorpion': {
        for (let i = 0; i < 3; i++) for (const s of [-1, 1]) limb(x, -3 + i * 3, -3, -4 + i * 3 + mv * s, 0, 0.9, shade(p.a, -0.3));
        // queue
        const segs = [[-6, -5, 2.6], [-8.5, -8.5, 2.3], [-8.5, -12.5, 2.1], [-5.5, -15.5, 1.9]];
        for (const [sx, sy, r] of segs) { circle(x, sx, sy + mv * 0.4, r); fillStroke(x, p.a, 0.6); }
        x.beginPath(); x.moveTo(-4, -16 + mv * 0.4); x.lineTo(-0.5, -14 + mv * 0.4); x.lineTo(-3.4, -13 + mv * 0.4); x.closePath(); fillStroke(x, p.b, 0.6);
        ellipse(x, 0, -3.8, 6.5, 3.2); fillStroke(x, p.a);
        x.strokeStyle = shade(p.a, -0.3); x.lineWidth = 0.5; x.beginPath(); x.moveTo(-2, -6.5); x.lineTo(-2, -1.5); x.moveTo(1.5, -6.8); x.lineTo(1.5, -1.2); x.stroke();
        circle(x, 6, -4.6, 2.6); fillStroke(x, p.a);
        for (const s of [-1, 1]) {
          limb(x, 7, -4 + s, 10, -6 + s * 2.5, 1.2, p.a);
          x.beginPath(); x.arc(11.2, -6 + s * 2.5, 1.8, s > 0 ? 0.6 : -2.5, s > 0 ? 3.6 : 0.6); fillStroke(x, p.b, 0.5);
        }
        for (const ex of [6.6, 7.8]) { circle(x, ex, -5.8, 0.55); x.fillStyle = p.e; x.fill(); }
        return -18;
      }
      case 'tree': {
        for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 2, -6); x.quadraticCurveTo(s * 6, -3 + mv * s, s * 7 + mv * s, 0); x.lineWidth = 2.8; x.strokeStyle = OL; x.stroke(); x.lineWidth = 2; x.strokeStyle = p.c; x.stroke(); }
        rrect(x, -4, -15, 8, 11, 2.5); fillStroke(x, p.c);
        x.strokeStyle = shade(p.c, -0.3); x.lineWidth = 0.5; x.beginPath(); x.moveTo(-2, -14); x.lineTo(-2.5, -6); x.moveTo(2.4, -13); x.lineTo(2, -7); x.stroke();
        for (const ex of [-1.2, 2]) { circle(x, ex, -11, 1); x.fillStyle = p.l; x.fill(); }
        x.strokeStyle = OL; x.lineWidth = 0.6; x.beginPath(); x.moveTo(-1.5, -8); x.lineTo(0, -8.8); x.lineTo(1.5, -8); x.stroke();
        for (const s of [-1, 1]) limb(x, s * 3.5, -12, s * 8 - mv, -15 + mv * s, 1.6, p.c);
        const leaves = [[-5, -18, 5], [4, -19, 5.5], [0, -23, 6], [-7, -14, 3.5], [7.5, -15, 3.5]];
        for (const [lx, ly, r] of leaves) { circle(x, lx, ly, r); fillStroke(x, p.a); }
        x.fillStyle = p.b;
        for (const [lx, ly, r] of leaves) { circle(x, lx - r * 0.3, ly - r * 0.3, r * 0.45); x.fill(); }
        return -29;
      }
    }
    return -16;
  }

  // Hauteur approximative (pour placer barres de vie et noms)
  function drawEntity(x, e, t, armAngle) {
    if (e.tpl === 'humanoid') return drawHumanoid(x, e, t, armAngle);
    return { top: drawMonster(x, e, t) };
  }

  // ---------------------------------------------------------------- Armes (vectorielles, pivotent pendant les attaques)
  function drawWeapon(ctx, type, angle, s = 1, glow = null) {
    ctx.save();
    ctx.rotate(angle);
    ctx.lineCap = 'round';
    const line = (x1, y1, x2, y2, w, col) => {
      ctx.strokeStyle = OL; ctx.lineWidth = (w + 0.9) * s;
      ctx.beginPath(); ctx.moveTo(x1 * s, y1 * s); ctx.lineTo(x2 * s, y2 * s); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = w * s;
      ctx.beginPath(); ctx.moveTo(x1 * s, y1 * s); ctx.lineTo(x2 * s, y2 * s); ctx.stroke();
    };
    if (glow) { ctx.fillStyle = glow; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.ellipse(9 * s, 0, 8 * s, 3 * s, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    switch (type) {
      case 'epee':
        line(-1, 0, 3, 0, 1.8, '#5a3a1a');
        line(3, -2.6, 3, 2.6, 1.4, '#d8a840');
        ctx.beginPath(); ctx.moveTo(4 * s, -1.2 * s); ctx.lineTo(13 * s, -0.8 * s); ctx.lineTo(15 * s, 0); ctx.lineTo(13 * s, 0.8 * s); ctx.lineTo(4 * s, 1.2 * s); ctx.closePath();
        ctx.fillStyle = glow || '#dfe8f5'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 0.6 * s; ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.5 * s; ctx.beginPath(); ctx.moveTo(5 * s, -0.3 * s); ctx.lineTo(13 * s, -0.2 * s); ctx.stroke();
        break;
      case 'dague':
        line(0, 0, 2, 0, 1.4, '#3a2a1a');
        line(2, -1.6, 2, 1.6, 1, '#b08aff');
        ctx.beginPath(); ctx.moveTo(2.5 * s, -0.9 * s); ctx.lineTo(9 * s, 0); ctx.lineTo(2.5 * s, 0.9 * s); ctx.closePath();
        ctx.fillStyle = glow || '#c8c0e8'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 0.5 * s; ctx.stroke();
        break;
      case 'baton': {
        line(-3, 0, 12, 0, 1.5, '#7a4b22');
        const g = ctx.createRadialGradient(13.5 * s, -0.5 * s, 0, 13.5 * s, 0, 3.2 * s);
        g.addColorStop(0, '#fff6c8'); g.addColorStop(0.5, glow || '#ff9a3c'); g.addColorStop(1, glow || '#c0392b');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(13.5 * s, 0, 2.6 * s, 0, TAU); ctx.fill();
        ctx.strokeStyle = OL; ctx.lineWidth = 0.5 * s; ctx.stroke();
        break;
      }
      case 'arc':
        ctx.strokeStyle = OL; ctx.lineWidth = 2.4 * s;
        ctx.beginPath(); ctx.arc(1 * s, 0, 7 * s, -1.25, 1.25); ctx.stroke();
        ctx.strokeStyle = '#a06a32'; ctx.lineWidth = 1.5 * s;
        ctx.beginPath(); ctx.arc(1 * s, 0, 7 * s, -1.25, 1.25); ctx.stroke();
        ctx.strokeStyle = glow || '#eeeeee'; ctx.lineWidth = 0.45 * s;
        ctx.beginPath(); ctx.moveTo(1 * s + Math.cos(-1.25) * 7 * s, Math.sin(-1.25) * 7 * s);
        ctx.lineTo(1 * s + Math.cos(1.25) * 7 * s, Math.sin(1.25) * 7 * s); ctx.stroke();
        break;
      case 'masse':
        line(0, 0, 9, 0, 1.5, '#6a4a2a');
        rrect(ctx, 8 * s, -3 * s, 5.5 * s, 6 * s, 1.5 * s);
        ctx.fillStyle = glow || '#f1c40f'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 0.6 * s; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(9 * s, -2 * s, 1.4 * s, 4 * s);
        break;
      case 'hache':
        line(0, 0, 10, 0, 1.7, '#5a3a1a');
        ctx.beginPath(); ctx.moveTo(7 * s, -1 * s); ctx.quadraticCurveTo(11 * s, -6 * s, 13 * s, -5 * s); ctx.quadraticCurveTo(11 * s, 0, 13 * s, 5 * s); ctx.quadraticCurveTo(11 * s, 6 * s, 7 * s, 1 * s); ctx.closePath();
        ctx.fillStyle = glow || '#c0c8d4'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 0.6 * s; ctx.stroke();
        break;
      case 'cle':
        line(0, 0, 9, 0, 1.7, '#c88a2a');
        ctx.strokeStyle = OL; ctx.lineWidth = 2.2 * s; ctx.beginPath(); ctx.arc(10.5 * s, 0, 2.2 * s, 0.6, TAU - 0.6); ctx.stroke();
        ctx.strokeStyle = glow || '#3dd6d0'; ctx.lineWidth = 1.3 * s; ctx.beginPath(); ctx.arc(10.5 * s, 0, 2.2 * s, 0.6, TAU - 0.6); ctx.stroke();
        break;
      case 'pioche':
        line(0, 0, 9, 0, 1.5, '#6a4a2a');
        ctx.strokeStyle = OL; ctx.lineWidth = 2.4 * s; ctx.beginPath(); ctx.arc(9 * s, 4 * s, 5 * s, -2.2, -0.9); ctx.stroke();
        ctx.strokeStyle = '#a8b0b8'; ctx.lineWidth = 1.4 * s; ctx.beginPath(); ctx.arc(9 * s, 4 * s, 5 * s, -2.2, -0.9); ctx.stroke();
        break;
    }
    ctx.restore();
  }

  // ================================================================ Décors
  const THEMES = {
    village: { floor: '#5aa64c', floor2: '#4b9442', blade: '#3f8538', flowers: true, wall: 'tree', top: '#2f7a34', top2: '#4ea04a', face: '#1f5226', deco: ['flower', 'grass', 'grass', 'stone'], bg: '#1f3d1c' },
    forest:  { floor: '#3f7f3c', floor2: '#346c33', blade: '#2c5e2c', flowers: true, wall: 'tree', top: '#1f5a2a', top2: '#2f7a38', face: '#143a1a', deco: ['grass', 'mushroom', 'flower', 'grass'], bg: '#0f2412' },
    mine:    { floor: '#6a5646', floor2: '#5a4a3c', blade: '#4a3c30', wall: 'block', top: '#3e332c', top2: '#56483d', face: '#261e19', ore: '#ff8a2a', deco: ['stone', 'bone', 'ember'], bg: '#140f0c' },
    ice:     { floor: '#d6ebf5', floor2: '#bfdcec', blade: '#a8cde3', wall: 'crystal', top: '#86c0e6', top2: '#c4e6fb', face: '#4a7aa8', deco: ['snow', 'icecrack', 'stone'], bg: '#2a4a68' },
    desert:  { floor: '#e2c487', floor2: '#d2b072', blade: '#c09a5a', wall: 'block', top: '#b08a50', top2: '#d0aa6a', face: '#7a5a2a', ore: '#4ad8ff', deco: ['stone', 'bone', 'rune'], bg: '#5a4020' },
    citadel: { floor: '#2e2640', floor2: '#262036', blade: '#3a3050', wall: 'block', top: '#191424', top2: '#2a2238', face: '#0c0a12', ore: '#b06bff', deco: ['rune', 'bone', 'crack'], bg: '#06040a', grid: true },
  };

  const T = 16;      // taille d'une tuile (unités logiques)
  const RES = 2;     // résolution interne des cartes (netteté sur mobile)

  function renderMap(map) {
    const th = THEMES[map.theme];
    const c = document.createElement('canvas');
    c.width = map.w * T * RES; c.height = map.h * T * RES;
    const x = c.getContext('2d');
    x.scale(RES, RES);
    const r = G.util.rng(map.seed * 7 + 3);
    const at = (i, j) => (i < 0 || j < 0 || i >= map.w || j >= map.h ? 1 : map.tiles[j * map.w + i]);
    const W = map.w * T, H = map.h * T;

    // Sol : couleur de base + taches douces + brins d'herbe
    x.fillStyle = th.floor; x.fillRect(0, 0, W, H);
    for (let k = 0; k < map.w * map.h * 0.6; k++) {
      x.globalAlpha = 0.25 + r() * 0.3;
      x.fillStyle = r() < 0.5 ? th.floor2 : shade(th.floor, 0.08);
      ellipse(x, r() * W, r() * H, 6 + r() * 14, 4 + r() * 8); x.fill();
    }
    x.globalAlpha = 1;
    if (th.grid) {
      for (let j = 0; j < map.h; j++) for (let i = 0; i < map.w; i++) {
        x.fillStyle = (i + j) % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.08)';
        rrect(x, i * T + 0.5, j * T + 0.5, T - 1, T - 1, 2); x.fill();
      }
    }
    // Chemins
    for (let j = 0; j < map.h; j++) for (let i = 0; i < map.w; i++) {
      if (at(i, j) !== 3) continue;
      x.fillStyle = '#c4ab80';
      rrect(x, i * T - 1, j * T - 1, T + 2, T + 2, 5); x.fill();
    }
    for (let j = 0; j < map.h; j++) for (let i = 0; i < map.w; i++) {
      if (at(i, j) !== 3) continue;
      for (let k = 0; k < 2; k++) {
        x.fillStyle = r() < 0.5 ? '#b09670' : '#d8c29a';
        ellipse(x, i * T + 2 + r() * 12, j * T + 2 + r() * 12, 1.5 + r() * 1.5, 1 + r()); x.fill();
      }
    }
    // Décorations au sol
    for (let j = 0; j < map.h; j++) for (let i = 0; i < map.w; i++) {
      if (at(i, j) !== 0) continue;
      if (r() < 0.35) {
        x.strokeStyle = th.blade; x.lineWidth = 0.7; x.lineCap = 'round';
        const gx = i * T + r() * 14, gy = j * T + 4 + r() * 10;
        x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx - 1, gy - 3); x.moveTo(gx + 1, gy); x.lineTo(gx + 1.5, gy - 3.5); x.stroke();
      }
      if (r() < 0.08) drawDeco(x, th, th.deco[(r() * th.deco.length) | 0], i * T, j * T, r);
    }
    // Eau
    for (let j = 0; j < map.h; j++) for (let i = 0; i < map.w; i++) {
      if (at(i, j) !== 2) continue;
      const px = i * T, py = j * T;
      const g = x.createLinearGradient(0, py, 0, py + T); g.addColorStop(0, '#3a8fd8'); g.addColorStop(1, '#2a6fb8');
      x.fillStyle = g; x.fillRect(px, py, T, T);
      x.strokeStyle = 'rgba(255,255,255,0.45)'; x.lineWidth = 0.8;
      x.beginPath(); const wy = py + 5 + r() * 6; x.moveTo(px + 2, wy); x.quadraticCurveTo(px + 6, wy - 2, px + 10, wy); x.stroke();
      if (at(i, j - 1) !== 2) { x.fillStyle = '#9a9aac'; rrect(x, px - 0.5, py - 1, T + 1, 3.5, 1.5); x.fill(); x.fillStyle = '#c0c0d0'; x.fillRect(px, py - 1, T, 1); }
      if (at(i, j + 1) !== 2) { x.fillStyle = '#7a7a8c'; x.fillRect(px, py + T - 2, T, 2); }
    }
    // Murs (de haut en bas pour la profondeur)
    for (let j = 0; j < map.h; j++) for (let i = 0; i < map.w; i++) {
      if (at(i, j) !== 1) continue;
      const px = i * T, py = j * T;
      const faceBelow = at(i, j + 1) === 0 || at(i, j + 1) === 3;
      if (th.wall === 'tree') drawTree(x, th, px, py, r);
      else if (th.wall === 'crystal') drawCrystal(x, th, px, py, faceBelow, r);
      else drawBlock(x, th, px, py, faceBelow, r, at(i - 1, j) === 1, at(i + 1, j) === 1, at(i, j - 1) === 1);
    }
    if (map.buildings) for (const b of map.buildings) drawBuilding(x, b);
    return c;
  }

  function drawTree(x, th, px, py, r) {
    const cx = px + 8 + (r() - 0.5) * 3, cy = py + 4 + (r() - 0.5) * 2, R = 8.5 + r() * 2;
    x.fillStyle = 'rgba(0,0,0,0.22)'; ellipse(x, px + 8, py + 14, 8, 3); x.fill();
    x.fillStyle = '#5a3a20'; rrect(x, px + 6, py + 7, 4, 8, 1.5); x.fill();
    x.fillStyle = th.face; circle(x, cx, cy + 1.5, R); x.fill();
    const g = x.createRadialGradient(cx - 3, cy - 4, 1, cx, cy, R);
    g.addColorStop(0, th.top2); g.addColorStop(1, th.top);
    x.fillStyle = g; circle(x, cx, cy, R - 0.8); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.12)';
    circle(x, cx - 3, cy - 3.5, R * 0.35); x.fill();
    x.fillStyle = 'rgba(0,0,0,0.12)';
    circle(x, cx + 3, cy + 3, R * 0.4); x.fill();
  }

  function drawBlock(x, th, px, py, faceBelow, r, left, right, up) {
    const g = x.createLinearGradient(0, py - 4, 0, py + 12);
    g.addColorStop(0, th.top2); g.addColorStop(1, th.top);
    x.fillStyle = g;
    rrect(x, px - (left ? 1 : 0), py - 4 - (up ? 1 : 0), T + (left ? 1 : 0) + (right ? 1 : 0), T + (up ? 1 : 0), 3);
    x.fill();
    if (r() < 0.35) { x.fillStyle = 'rgba(255,255,255,0.1)'; ellipse(x, px + 3 + r() * 10, py + r() * 8, 2.5, 1.3); x.fill(); }
    if (r() < 0.25) { x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 0.6; x.beginPath(); const sx = px + 3 + r() * 8; x.moveTo(sx, py - 2); x.lineTo(sx + 2, py + 3); x.lineTo(sx + 1, py + 6); x.stroke(); }
    if (th.ore && r() < 0.1) {
      const ox = px + 4 + r() * 8, oy = py + r() * 6;
      const og = x.createRadialGradient(ox, oy, 0, ox, oy, 3); og.addColorStop(0, '#ffffff'); og.addColorStop(0.4, th.ore); og.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = og; circle(x, ox, oy, 3); x.fill();
    }
    if (faceBelow) {
      const fg = x.createLinearGradient(0, py + T - 5, 0, py + T);
      fg.addColorStop(0, th.face); fg.addColorStop(1, shade(th.face, -0.3));
      x.fillStyle = fg; rrect(x, px, py + T - 5, T, 5, 1.5); x.fill();
      x.fillStyle = 'rgba(0,0,0,0.25)'; ellipse(x, px + 8, py + T + 1, 9, 2); x.fill();
      if (th.grid) { x.fillStyle = th.ore; x.globalAlpha = 0.5; x.fillRect(px + 7, py + T - 4, 2, 3); x.globalAlpha = 1; }
    }
  }

  function drawCrystal(x, th, px, py, faceBelow, r) {
    x.fillStyle = th.face; rrect(x, px - 0.5, py - 2, T + 1, T + 2, 2); x.fill();
    const shard = (bx, w, h, c1, c2) => {
      const g = x.createLinearGradient(bx, py + 14 - h, bx + w, py + 14);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      x.fillStyle = g; x.beginPath(); x.moveTo(bx, py + 14); x.lineTo(bx + w / 2, py + 14 - h); x.lineTo(bx + w, py + 14); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 0.5; x.beginPath(); x.moveTo(bx + w / 2, py + 14 - h); x.lineTo(bx + w / 2 - 0.5, py + 12); x.stroke();
    };
    shard(px + 1, 8, 15 + r() * 3, '#e8f8ff', th.top);
    shard(px + 7, 8, 11 + r() * 5, th.top2, th.face);
    if (faceBelow) { x.fillStyle = 'rgba(20,40,70,0.3)'; ellipse(x, px + 8, py + T + 1, 9, 2); x.fill(); }
  }

  function drawDeco(x, th, kind, px, py, r) {
    const ox = px + 3 + r() * 9, oy = py + 4 + r() * 9;
    switch (kind) {
      case 'flower': {
        const col = ['#ff6a8a', '#ffd84a', '#ffffff', '#b07aff', '#ff9a3c'][(r() * 5) | 0];
        for (let k = 0; k < 5; k++) { const a = k * 1.26; x.fillStyle = col; circle(x, ox + Math.cos(a) * 1.3, oy + Math.sin(a) * 1.3, 1); x.fill(); }
        x.fillStyle = '#ffe9a0'; circle(x, ox, oy, 0.7); x.fill();
        break;
      }
      case 'grass':
        x.strokeStyle = shade(th.blade, -0.1); x.lineWidth = 0.8; x.lineCap = 'round';
        x.beginPath(); for (let k = 0; k < 4; k++) { x.moveTo(ox + k * 1.2, oy); x.quadraticCurveTo(ox + k * 1.2 - 0.5, oy - 2, ox + k * 1.4 - 1, oy - 3.5 - r() * 2); } x.stroke();
        break;
      case 'mushroom':
        x.fillStyle = '#f6e7c8'; rrect(x, ox - 0.7, oy - 1, 1.4, 2.5, 0.5); x.fill();
        x.fillStyle = '#d0392b'; x.beginPath(); x.arc(ox, oy - 1, 2.2, Math.PI, 0); x.fill();
        x.fillStyle = '#fff'; circle(x, ox - 0.7, oy - 2, 0.4); x.fill();
        break;
      case 'stone':
        x.fillStyle = 'rgba(0,0,0,0.18)'; ellipse(x, ox, oy + 1, 3, 1.2); x.fill();
        x.fillStyle = shade(th.floor, -0.25); ellipse(x, ox, oy, 2.6, 1.8); x.fill();
        x.fillStyle = 'rgba(255,255,255,0.25)'; ellipse(x, ox - 0.8, oy - 0.6, 1, 0.6); x.fill();
        break;
      case 'bone':
        x.strokeStyle = '#ece4d0'; x.lineWidth = 1; x.lineCap = 'round';
        x.beginPath(); x.moveTo(ox - 2.5, oy); x.lineTo(ox + 2.5, oy - 1); x.stroke();
        x.fillStyle = '#ece4d0'; for (const [bx, by] of [[-2.8, -0.4], [-2.6, 0.6], [2.8, -1.4], [2.6, -0.4]]) { circle(x, ox + bx, oy + by, 0.7); x.fill(); }
        break;
      case 'ember': {
        const g = x.createRadialGradient(ox, oy, 0, ox, oy, 2.5); g.addColorStop(0, '#ffe14a'); g.addColorStop(0.5, '#ff6a1a'); g.addColorStop(1, 'rgba(255,60,0,0)');
        x.fillStyle = g; circle(x, ox, oy, 2.5); x.fill();
        break;
      }
      case 'snow':
        x.fillStyle = '#ffffff'; ellipse(x, ox, oy, 3, 1.4); x.fill(); ellipse(x, ox + 1.5, oy - 0.8, 1.6, 1); x.fill();
        break;
      case 'icecrack':
        x.strokeStyle = '#8ab8d8'; x.lineWidth = 0.5;
        x.beginPath(); x.moveTo(ox - 3, oy); x.lineTo(ox, oy - 1); x.lineTo(ox + 2, oy + 2); x.moveTo(ox, oy - 1); x.lineTo(ox + 1, oy - 3); x.stroke();
        break;
      case 'rune':
        x.strokeStyle = th.ore || '#ffd84a'; x.globalAlpha = 0.5; x.lineWidth = 0.6;
        circle(x, ox, oy, 2.5); x.stroke(); x.beginPath(); x.moveTo(ox, oy - 2.5); x.lineTo(ox, oy + 2.5); x.moveTo(ox - 2, oy); x.lineTo(ox + 2, oy); x.stroke();
        x.globalAlpha = 1;
        break;
      case 'crack':
        x.strokeStyle = 'rgba(0,0,0,0.5)'; x.lineWidth = 0.6;
        x.beginPath(); x.moveTo(ox - 3, oy); x.lineTo(ox, oy + 0.5); x.lineTo(ox + 1, oy + 3); x.stroke();
        break;
    }
  }

  function drawBuilding(x, b) {
    const px = b.x * T, py = b.y * T, w = b.w * T, h = b.h * T;
    const wy = py + h * 0.42;
    x.fillStyle = 'rgba(0,0,0,0.25)'; ellipse(x, px + w / 2, py + h + 1, w / 2 + 4, 4); x.fill();
    // Mur à colombages
    const g = x.createLinearGradient(0, wy, 0, py + h); g.addColorStop(0, b.wall || '#e0d0b0'); g.addColorStop(1, shade(b.wall || '#e0d0b0', -0.15));
    x.fillStyle = g; rrect(x, px, wy, w, py + h - wy, 2); x.fill();
    x.strokeStyle = '#6a4a2a'; x.lineWidth = 1.4;
    x.strokeRect(px + 0.7, wy + 0.7, w - 1.4, py + h - wy - 1.4);
    for (let k = 1; k < b.w; k++) { x.beginPath(); x.moveTo(px + k * T, wy); x.lineTo(px + k * T, py + h); x.stroke(); }
    // Toit
    const roof = b.roof || '#b5452b';
    x.beginPath(); x.moveTo(px - 5, wy + 3); x.lineTo(px + w / 2, py - 8); x.lineTo(px + w + 5, wy + 3); x.closePath();
    const rg = x.createLinearGradient(px, py - 8, px + w, wy); rg.addColorStop(0, shade(roof, 0.15)); rg.addColorStop(1, shade(roof, -0.2));
    x.fillStyle = rg; x.fill(); x.strokeStyle = shade(roof, -0.45); x.lineWidth = 1; x.stroke();
    x.strokeStyle = 'rgba(0,0,0,0.18)'; x.lineWidth = 0.7;
    for (let k = 1; k < 5; k++) {
      const yy = py - 8 + (wy + 3 - (py - 8)) * k / 5, half = (w / 2 + 5) * k / 5;
      x.beginPath(); x.moveTo(px + w / 2 - half, yy); x.lineTo(px + w / 2 + half, yy); x.stroke();
    }
    // Porte, fenêtres, enseigne
    x.fillStyle = '#5a3a1e'; rrect(x, px + w / 2 - 5, py + h - 13, 10, 13, 4); x.fill();
    x.fillStyle = '#ffd84a'; circle(x, px + w / 2 + 2.5, py + h - 6, 0.8); x.fill();
    for (const wx of [px + 5, px + w - 13]) {
      const wg = x.createLinearGradient(0, py + h - 16, 0, py + h - 9); wg.addColorStop(0, '#fff3b0'); wg.addColorStop(1, '#ffb84a');
      x.fillStyle = wg; rrect(x, wx, py + h - 16, 8, 7, 1.5); x.fill();
      x.strokeStyle = '#6a4a2a'; x.lineWidth = 0.8; x.stroke(); x.beginPath(); x.moveTo(wx + 4, py + h - 16); x.lineTo(wx + 4, py + h - 9); x.stroke();
    }
    if (b.sign) {
      x.fillStyle = '#6a4424'; rrect(x, px + w / 2 - 16, wy + 2, 32, 10, 2); x.fill();
      x.strokeStyle = '#3a2410'; x.lineWidth = 0.8; x.stroke();
      x.fillStyle = '#ffe9b0'; x.font = 'bold 6.5px "Trebuchet MS", sans-serif'; x.textAlign = 'center';
      x.fillText(b.sign, px + w / 2, wy + 9.3);
    }
  }

  // ================================================================ Portraits illustrés (dialogues, HUD, menus)
  const portraitCache = new Map();
  function portrait(tpl, pal, short, look, size = 200) {
    const key = tpl + JSON.stringify(pal) + short + JSON.stringify(look || {}) + size;
    if (portraitCache.has(key)) return portraitCache.get(key);
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const x = c.getContext('2d');
    x.scale(size / 100, size / 100);
    if (tpl === 'humanoid') drawFace(x, Object.assign({}, DEF, pal), look || {}, short);
    else {
      const bg = x.createRadialGradient(50, 45, 5, 50, 50, 70); bg.addColorStop(0, '#4a3a6a'); bg.addColorStop(1, '#140c24');
      x.fillStyle = bg; x.fillRect(0, 0, 100, 100);
      // Cadrage : centre et hauteur approximatifs de chaque gabarit
      const [fx, fy, fh] = { slime: [0, -5, 13], beast: [1, -8.5, 20], bat: [0, -11, 14], mushroom: [0, -8.5, 19], golem: [0, -11, 24], ghost: [0, -8, 19], scorpion: [3, -8, 20], tree: [0, -14, 31] }[tpl] || [0, -8, 18];
      const k = 66 / fh;
      x.translate(50 - fx * k, 52 - fy * k); x.scale(k, k);
      x.lineJoin = 'round';
      drawMonster(x, { tpl, pal, anim: 0 }, 0.6);
    }
    const url = c.toDataURL();
    portraitCache.set(key, url);
    return url;
  }

  // Visage détaillé en buste (repère 100×100)
  function drawFace(x, p, L, short) {
    const eye = L.eye || p.e;
    const skin = p.s, hairC = p.h;
    const bg = x.createRadialGradient(50, 40, 5, 50, 50, 75);
    bg.addColorStop(0, shade(L.glow ? '#5a1a3a' : eye, 0.55)); bg.addColorStop(1, shade(L.glow ? '#0a0610' : eye, -0.65));
    x.fillStyle = bg; x.fillRect(0, 0, 100, 100);
    const cx = 50, cy = 47;
    // Cheveux arrière
    if (['long', 'pony', 'twin', 'bun'].includes(L.hair)) {
      x.beginPath();
      if (L.hair === 'long') { x.moveTo(22, 40); x.quadraticCurveTo(14, 82, 24, 100); x.lineTo(76, 100); x.quadraticCurveTo(86, 82, 78, 40); x.closePath(); }
      else { x.arc(cx, cy - 6, 30, Math.PI * 0.9, Math.PI * 2.1); x.closePath(); }
      fillStroke(x, shade(hairC, -0.12), 1.2);
    }
    if (L.hair === 'pony') { x.beginPath(); x.moveTo(68, 22); x.quadraticCurveTo(98, 30, 88, 78); x.quadraticCurveTo(80, 50, 70, 36); x.closePath(); fillStroke(x, hairC, 1.2); }
    if (L.hair === 'twin') for (const s of [-1, 1]) { ellipse(x, cx + s * 34, cy + 12, 9, 18, s * 0.2); fillStroke(x, hairC, 1.2); }
    if (L.cape) { x.beginPath(); x.moveTo(8, 100); x.lineTo(16, 66); x.lineTo(84, 66); x.lineTo(92, 100); x.closePath(); fillStroke(x, p.b, 1.2); }
    // Cou et épaules
    rrect(x, cx - 8, cy + 18, 16, 16, 4); fillStroke(x, shade(skin, -0.12), 1.2);
    x.beginPath(); x.moveTo(12, 100); x.quadraticCurveTo(14, 72, 38, 68); x.lineTo(62, 68); x.quadraticCurveTo(86, 72, 88, 100); x.closePath();
    const cg = x.createLinearGradient(0, 68, 0, 100); cg.addColorStop(0, shade(p.a, 0.1)); cg.addColorStop(1, shade(p.a, -0.25));
    fillStroke(x, cg, 1.2);
    x.beginPath(); x.moveTo(38, 68); x.lineTo(50, 84); x.lineTo(62, 68); x.closePath(); fillStroke(x, p.b, 1);
    if (L.shoulder) for (const s of [-1, 1]) { ellipse(x, cx + s * 30, 76, 14, 8, s * -0.3); const sg = x.createLinearGradient(0, 68, 0, 84); sg.addColorStop(0, '#e8eef8'); sg.addColorStop(1, shade(p.b, -0.2)); fillStroke(x, sg, 1.2); }
    // Oreilles
    if (L.ears === 'elf' || L.ears === 'goblin') {
      for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 24, cy - 2); x.lineTo(cx + s * (L.ears === 'elf' ? 44 : 48), cy - 18); x.lineTo(cx + s * 24, cy + 10); x.closePath(); fillStroke(x, skin, 1.2); }
    } else for (const s of [-1, 1]) { ellipse(x, cx + s * 26, cy + 3, 4.5, 7); fillStroke(x, shade(skin, -0.05), 1.2); }
    // Visage
    x.beginPath();
    x.moveTo(cx - 25, cy - 8);
    x.quadraticCurveTo(cx - 26, cy + 16, cx - 12, cy + 26);
    x.quadraticCurveTo(cx, cy + 32, cx + 12, cy + 26);
    x.quadraticCurveTo(cx + 26, cy + 16, cx + 25, cy - 8);
    x.quadraticCurveTo(cx + 24, cy - 32, cx, cy - 32);
    x.quadraticCurveTo(cx - 24, cy - 32, cx - 25, cy - 8);
    x.closePath();
    const fg = x.createRadialGradient(cx - 6, cy - 6, 4, cx, cy + 4, 34);
    fg.addColorStop(0, shade(skin, 0.12)); fg.addColorStop(1, shade(skin, -0.12));
    fillStroke(x, fg, 1.3);
    if (L.wrinkles) { x.strokeStyle = shade(skin, -0.3); x.lineWidth = 0.8; x.beginPath(); x.moveTo(cx - 16, cy + 12); x.quadraticCurveTo(cx - 12, cy + 16, cx - 14, cy + 20); x.moveTo(cx + 16, cy + 12); x.quadraticCurveTo(cx + 12, cy + 16, cx + 14, cy + 20); x.stroke(); }
    // Yeux
    const ey = cy + 1;
    for (const s of [-1, 1]) {
      const ex = cx + s * 11;
      if (L.glow) {
        const gg = x.createRadialGradient(ex, ey, 0, ex, ey, 10); gg.addColorStop(0, eye); gg.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = gg; circle(x, ex, ey, 10); x.fill();
        ellipse(x, ex, ey, 6, 3.4, s * -0.15); x.fillStyle = '#fff6f6'; x.fill();
        ellipse(x, ex, ey, 3.6, 3.2); x.fillStyle = eye; x.fill();
      } else {
        x.beginPath(); x.moveTo(ex - 7, ey + 0.5); x.quadraticCurveTo(ex, ey - 8, ex + 7, ey + 0.5); x.quadraticCurveTo(ex, ey + 6, ex - 7, ey + 0.5); x.closePath();
        x.fillStyle = '#ffffff'; x.fill();
        x.save(); x.clip();
        const ig = x.createRadialGradient(ex, ey, 0.5, ex, ey - 0.5, 5.2); ig.addColorStop(0, shade(eye, 0.45)); ig.addColorStop(0.6, eye); ig.addColorStop(1, shade(eye, -0.45));
        x.fillStyle = ig; circle(x, ex + s * -0.5, ey - 0.4, 5); x.fill();
        x.fillStyle = '#120c18'; circle(x, ex + s * -0.5, ey - 0.3, 2.3); x.fill();
        x.restore();
        x.fillStyle = '#ffffff'; circle(x, ex - 1.6, ey - 2.6, 1.5); x.fill(); circle(x, ex + 1.8, ey + 1.6, 0.7); x.fill();
        x.strokeStyle = '#1c1428'; x.lineWidth = 1.8; x.lineCap = 'round';
        x.beginPath(); x.moveTo(ex - 7.5, ey + 0.8); x.quadraticCurveTo(ex, ey - 8.4, ex + 7.5, ey + 0.2); x.stroke();
      }
      // Sourcils
      x.strokeStyle = shade(hairC === '#e8e8ff' ? '#a8a0c8' : hairC, -0.25); x.lineWidth = 2.2;
      x.beginPath(); x.moveTo(ex - 6, ey - 10 + (L.glow ? s * -2 : 0)); x.quadraticCurveTo(ex, ey - 13, ex + 6, ey - 10 + (L.glow ? s * 2 : 0)); x.stroke();
    }
    // Nez, joues, bouche
    x.strokeStyle = shade(skin, -0.3); x.lineWidth = 1; x.beginPath(); x.moveTo(cx + 1, cy + 7); x.quadraticCurveTo(cx + 3, cy + 12, cx - 1, cy + 12.5); x.stroke();
    if (!L.glow) { x.fillStyle = 'rgba(255,110,120,0.25)'; ellipse(x, cx - 15, cy + 12, 5, 3); x.fill(); ellipse(x, cx + 15, cy + 12, 5, 3); x.fill(); }
    if (!L.beard && !L.mask && L.hair !== 'wraps') {
      x.strokeStyle = L.glow ? '#4a1030' : '#9a4a44'; x.lineWidth = 1.5;
      x.beginPath();
      if (L.glow) { x.moveTo(cx - 6, cy + 19); x.quadraticCurveTo(cx, cy + 16.5, cx + 7, cy + 18); }
      else { x.moveTo(cx - 6, cy + 17.5); x.quadraticCurveTo(cx, cy + 21.5, cx + 6, cy + 17.5); }
      x.stroke();
    }
    if (L.scar) { x.strokeStyle = '#b0605a'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(cx + 14, cy - 10); x.lineTo(cx + 9, cy + 8); x.stroke(); }
    if (L.mustache) {
      x.beginPath(); x.moveTo(cx, cy + 14.5); x.quadraticCurveTo(cx - 8, cy + 12, cx - 14, cy + 18); x.quadraticCurveTo(cx - 6, cy + 17, cx, cy + 16.5);
      x.quadraticCurveTo(cx + 6, cy + 17, cx + 14, cy + 18); x.quadraticCurveTo(cx + 8, cy + 12, cx, cy + 14.5); fillStroke(x, hairC, 1);
    }
    if (L.beard) {
      x.beginPath(); x.moveTo(cx - 25, cy + 2); x.quadraticCurveTo(cx - 26, cy + 30, cx, cy + 44); x.quadraticCurveTo(cx + 26, cy + 30, cx + 25, cy + 2);
      x.quadraticCurveTo(cx + 18, cy + 16, cx + 8, cy + 14); x.quadraticCurveTo(cx, cy + 20, cx - 8, cy + 14); x.quadraticCurveTo(cx - 18, cy + 16, cx - 25, cy + 2); x.closePath();
      fillStroke(x, hairC, 1.2);
      x.strokeStyle = shade(hairC, -0.3); x.lineWidth = 0.8;
      for (let k = -2; k <= 2; k++) { x.beginPath(); x.moveTo(cx + k * 6, cy + 22); x.quadraticCurveTo(cx + k * 5, cy + 30, cx + k * 3, cy + 36); x.stroke(); }
      x.beginPath(); x.moveTo(cx - 5, cy + 19.5); x.quadraticCurveTo(cx, cy + 21, cx + 5, cy + 19.5); x.strokeStyle = '#6a2a24'; x.lineWidth = 1.4; x.stroke();
    }
    if (L.mask) {
      x.beginPath(); x.moveTo(cx - 26, cy + 6); x.quadraticCurveTo(cx, cy + 9, cx + 26, cy + 6); x.quadraticCurveTo(cx + 24, cy + 26, cx, cy + 32); x.quadraticCurveTo(cx - 24, cy + 26, cx - 26, cy + 6); x.closePath();
      fillStroke(x, p.c, 1.2);
      x.strokeStyle = p.b; x.lineWidth = 1; x.beginPath(); x.moveTo(cx - 20, cy + 12); x.quadraticCurveTo(cx, cy + 14, cx + 20, cy + 12); x.stroke();
    }
    if (L.hair === 'wraps') {
      x.strokeStyle = shade(skin, -0.28); x.lineWidth = 1.2;
      for (let k = -4; k <= 5; k++) { x.beginPath(); x.moveTo(cx - 27, cy + k * 6 - 4); x.quadraticCurveTo(cx, cy + k * 6 + 2, cx + 27, cy + k * 6 - 6); x.stroke(); }
    }
    // Cheveux avant / coiffes
    const hair = L.hair || 'short';
    const hg = x.createLinearGradient(0, cy - 36, 0, cy);
    hg.addColorStop(0, shade(hairC, 0.18)); hg.addColorStop(1, shade(hairC, -0.15));
    if (hair === 'helm') {
      x.beginPath(); x.moveTo(cx - 29, cy - 2); x.quadraticCurveTo(cx - 30, cy - 38, cx, cy - 40); x.quadraticCurveTo(cx + 30, cy - 38, cx + 29, cy - 2);
      x.lineTo(cx + 24, cy - 6); x.lineTo(cx - 24, cy - 6); x.closePath();
      const mg = x.createLinearGradient(cx - 30, 0, cx + 30, 0); mg.addColorStop(0, shade(hairC, -0.3)); mg.addColorStop(0.4, shade(hairC, 0.35)); mg.addColorStop(1, shade(hairC, -0.35));
      fillStroke(x, mg, 1.3);
      rrect(x, cx - 29, cy - 10, 58, 6, 2); fillStroke(x, shade(hairC, -0.2), 1);
      rrect(x, cx - 2.5, cy - 9, 5, 18, 2); fillStroke(x, shade(hairC, -0.15), 1);
      x.beginPath(); x.moveTo(cx, cy - 40); x.quadraticCurveTo(cx - 20, cy - 58, cx - 38, cy - 40); x.lineWidth = 6; x.strokeStyle = p.b; x.stroke();
    } else if (hair !== 'bald' && hair !== 'wraps') {
      x.beginPath();
      x.moveTo(cx - 27, cy + 2);
      x.quadraticCurveTo(cx - 32, cy - 40, cx + 2, cy - 38);
      x.quadraticCurveTo(cx + 32, cy - 38, cx + 27, cy + 2);
      // frange
      if (hair === 'long' || hair === 'twin') { x.quadraticCurveTo(cx + 22, cy - 14, cx + 4, cy - 20); x.quadraticCurveTo(cx - 2, cy - 12, cx - 6, cy - 20); x.quadraticCurveTo(cx - 20, cy - 14, cx - 27, cy + 2); }
      else if (hair === 'spiky' || hair === 'wild') {
        x.lineTo(cx + 18, cy - 14); x.lineTo(cx + 12, cy - 8); x.lineTo(cx + 6, cy - 18); x.lineTo(cx - 2, cy - 10); x.lineTo(cx - 8, cy - 19); x.lineTo(cx - 16, cy - 10); x.lineTo(cx - 20, cy - 16); x.closePath();
      } else { x.quadraticCurveTo(cx + 18, cy - 20, cx - 6, cy - 16); x.quadraticCurveTo(cx - 18, cy - 12, cx - 27, cy + 2); }
      fillStroke(x, hg, 1.3);
      if (hair === 'spiky' || hair === 'wild') {
        for (let k = 0; k < 6; k++) {
          const a = Math.PI * (1.05 + k * 0.18), r0 = 30, r1 = hair === 'wild' ? 44 : 41;
          x.beginPath(); x.moveTo(cx + Math.cos(a - 0.12) * r0, cy - 6 + Math.sin(a - 0.12) * r0); x.lineTo(cx + Math.cos(a) * r1, cy - 6 + Math.sin(a) * r1); x.lineTo(cx + Math.cos(a + 0.12) * r0, cy - 6 + Math.sin(a + 0.12) * r0); x.closePath();
          fillStroke(x, hg, 1.1);
        }
      }
      if (hair === 'bun') { circle(x, cx, cy - 42, 10); fillStroke(x, hg, 1.2); }
      x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 2.2; x.lineCap = 'round';
      x.beginPath(); x.arc(cx - 2, cy - 4, 30, Math.PI * 1.22, Math.PI * 1.42); x.stroke();
    } else if (hair === 'bald') {
      x.fillStyle = 'rgba(255,255,255,0.3)'; ellipse(x, cx - 8, cy - 24, 7, 3.5, -0.3); x.fill();
    }
    // Accessoires
    if (L.bandana) { x.beginPath(); x.moveTo(cx - 28, cy - 8); x.quadraticCurveTo(cx, cy - 22, cx + 28, cy - 8); x.lineTo(cx + 27, cy - 16); x.quadraticCurveTo(cx, cy - 30, cx - 27, cy - 16); x.closePath(); fillStroke(x, p.b, 1.2); }
    if (L.circlet) {
      x.strokeStyle = '#ffd84a'; x.lineWidth = 2.4; x.beginPath(); x.moveTo(cx - 25, cy - 14); x.quadraticCurveTo(cx, cy - 24, cx + 25, cy - 14); x.stroke();
      x.fillStyle = eye; x.beginPath(); x.moveTo(cx, cy - 25); x.lineTo(cx + 3.5, cy - 20); x.lineTo(cx, cy - 15.5); x.lineTo(cx - 3.5, cy - 20); x.closePath(); x.fill();
      x.strokeStyle = '#b8892a'; x.lineWidth = 1; x.stroke();
    }
    if (L.goggles) {
      x.strokeStyle = '#5a3a1a'; x.lineWidth = 4; x.beginPath(); x.moveTo(cx - 28, cy - 14); x.quadraticCurveTo(cx, cy - 26, cx + 28, cy - 14); x.stroke();
      for (const s of [-1, 1]) {
        circle(x, cx + s * 11, cy - 20, 7.5); fillStroke(x, '#c88a2a', 1.2);
        const lg = x.createRadialGradient(cx + s * 11 - 2, cy - 22, 0.5, cx + s * 11, cy - 20, 6); lg.addColorStop(0, '#ffffff'); lg.addColorStop(0.4, p.b); lg.addColorStop(1, shade(p.b, -0.4));
        x.fillStyle = lg; circle(x, cx + s * 11, cy - 20, 5.5); x.fill();
      }
    }
    if (L.feather) { x.beginPath(); x.moveTo(cx + 22, cy - 22); x.quadraticCurveTo(cx + 46, cy - 46, cx + 40, cy - 20); x.quadraticCurveTo(cx + 34, cy - 26, cx + 22, cy - 22); fillStroke(x, p.b, 1); }
    if (L.hat === 'wizard') {
      x.beginPath(); x.moveTo(cx - 34, cy - 18); x.quadraticCurveTo(cx - 6, cy - 50, cx - 22, cy - 72); x.quadraticCurveTo(cx + 14, cy - 52, cx + 34, cy - 18); x.closePath();
      const wg = x.createLinearGradient(cx - 30, 0, cx + 30, 0); wg.addColorStop(0, shade(p.a, -0.3)); wg.addColorStop(0.5, shade(p.a, 0.15)); wg.addColorStop(1, shade(p.a, -0.3));
      fillStroke(x, wg, 1.3);
      ellipse(x, cx, cy - 18, 42, 7); fillStroke(x, shade(p.a, -0.1), 1.3);
      x.strokeStyle = p.b; x.lineWidth = 4; x.beginPath(); x.moveTo(cx - 28, cy - 26); x.quadraticCurveTo(cx, cy - 32, cx + 28, cy - 26); x.stroke();
      x.fillStyle = '#ffe9a0'; circle(x, cx + 8, cy - 40, 2.5); x.fill(); circle(x, cx - 12, cy - 50, 1.6); x.fill();
    }
    if (L.crown) {
      x.beginPath(); const by = cy - 30;
      x.moveTo(cx - 24, by + 6); x.lineTo(cx - 26, by - 16); x.lineTo(cx - 13, by - 4); x.lineTo(cx, by - 24); x.lineTo(cx + 13, by - 4); x.lineTo(cx + 26, by - 16); x.lineTo(cx + 24, by + 6); x.closePath();
      const kg = x.createLinearGradient(0, by - 24, 0, by + 6); kg.addColorStop(0, '#fff3b0'); kg.addColorStop(1, '#c8902a');
      fillStroke(x, kg, 1.3);
      x.fillStyle = '#ff2b6b'; circle(x, cx, by - 3, 3); x.fill(); x.fillStyle = '#6a2bff'; circle(x, cx - 15, by - 1, 2); x.fill(); circle(x, cx + 15, by - 1, 2); x.fill();
    }
    // Cadre doux
    const vg = x.createRadialGradient(50, 50, 40, 50, 50, 72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    x.fillStyle = vg; x.fillRect(0, 0, 100, 100);
  }

  // ================================================================ Icônes d'objets
  const iconCache = new Map();
  function itemIcon(kind, color, extra) {
    const key = kind + color + (extra || '');
    if (iconCache.has(key)) return iconCache.get(key);
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const x = c.getContext('2d');
    x.scale(2, 2); x.translate(16, 16);
    x.lineJoin = 'round';
    if (['epee', 'baton', 'arc', 'masse'].includes(kind)) {
      x.scale(1.5, 1.5); x.translate(-6, kind === 'arc' ? 0 : 3);
      drawWeapon(x, kind, kind === 'arc' ? 0 : -0.8, 1, extra);
    } else if (kind === 'armor') {
      x.beginPath(); x.moveTo(-12, -6); x.lineTo(-6, -10); x.quadraticCurveTo(0, -6, 6, -10); x.lineTo(12, -6); x.lineTo(9, 0); x.lineTo(8, 11); x.lineTo(-8, 11); x.lineTo(-9, 0); x.closePath();
      const g = x.createLinearGradient(-12, 0, 12, 0); g.addColorStop(0, shade(color, -0.3)); g.addColorStop(0.45, shade(color, 0.3)); g.addColorStop(1, shade(color, -0.3));
      fillStroke(x, g, 1);
      x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, -6); x.lineTo(0, 11); x.stroke();
    } else if (kind === 'helm') {
      x.beginPath(); x.moveTo(-11, 6); x.quadraticCurveTo(-12, -11, 0, -11); x.quadraticCurveTo(12, -11, 11, 6); x.closePath();
      const g = x.createLinearGradient(-11, 0, 11, 0); g.addColorStop(0, shade(color, -0.3)); g.addColorStop(0.4, shade(color, 0.35)); g.addColorStop(1, shade(color, -0.3));
      fillStroke(x, g, 1);
      rrect(x, -8, -1, 16, 3, 1); x.fillStyle = '#1c1428'; x.fill();
      x.strokeStyle = shade(color, 0.2); x.lineWidth = 2.5; x.beginPath(); x.moveTo(0, -11); x.quadraticCurveTo(-6, -16, -12, -12); x.stroke();
    } else if (kind === 'ring') {
      x.strokeStyle = OL; x.lineWidth = 4.5; circle(x, 0, 4, 8); x.stroke();
      x.strokeStyle = color; x.lineWidth = 3; circle(x, 0, 4, 8); x.stroke();
      const g = x.createRadialGradient(-1, -9, 0, 0, -7, 5); g.addColorStop(0, '#fff'); g.addColorStop(0.4, extra || '#ff4d6d'); g.addColorStop(1, shade(extra || '#ff4d6d', -0.4));
      x.beginPath(); x.moveTo(0, -12); x.lineTo(5, -6); x.lineTo(0, -1); x.lineTo(-5, -6); x.closePath(); fillStroke(x, g, 1);
    } else if (kind === 'potion') {
      rrect(x, -3, -13, 6, 6, 1); fillStroke(x, '#d8d8e8', 1);
      rrect(x, -3.5, -15, 7, 3, 1); fillStroke(x, '#8a5a2a', 1);
      circle(x, 0, 3, 10);
      const g = x.createRadialGradient(-3, 0, 1, 0, 3, 10); g.addColorStop(0, shade(color, 0.4)); g.addColorStop(1, shade(color, -0.3));
      fillStroke(x, g, 1);
      x.fillStyle = 'rgba(255,255,255,0.55)'; ellipse(x, -4, -1, 2.5, 3.5, -0.4); x.fill();
    } else if (kind === 'scroll') {
      rrect(x, -10, -9, 20, 18, 2); fillStroke(x, color, 1);
      for (const sx of [-12, 8]) { rrect(x, sx, -11, 4, 22, 2); fillStroke(x, '#8a6a3a', 1); }
      x.strokeStyle = '#5a3a1a'; x.lineWidth = 1; for (const ly of [-4, 0, 4]) { x.beginPath(); x.moveTo(-6, ly); x.lineTo(5, ly); x.stroke(); }
    } else if (kind === 'star') {
      x.beginPath();
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 5 : 12; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      x.closePath(); fillStroke(x, color, 1);
    }
    const url = c.toDataURL();
    iconCache.set(key, url);
    return url;
  }

  return { drawEntity, drawHumanoid, drawMonster, drawWeapon, THEMES, renderMap, T, RES, itemIcon, portrait, shade };
})();
