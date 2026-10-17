// Éclipsia — effets visuels : particules, anneaux, éclairs, textes flottants
'use strict';

G.fx = (() => {
  const U = G.util;
  let parts = [], texts = [], rings = [], arcs = [], bolts = [], meteors = [], pillars = [];

  function clear() { parts = []; texts = []; rings = []; arcs = []; bolts = []; meteors = []; pillars = []; }

  function burst(x, y, color, n = 6, speed = 50) {
    if (parts.length > 400) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * U.rand(0.3, 1);
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: U.rand(0.3, 0.6), max: 0.6, color, size: U.rand(1, 2.5) });
    }
  }
  function trail(e) {
    parts.push({ x: e.x + U.rand(-3, 3), y: e.y - U.rand(0, 10), vx: 0, vy: -8, life: 0.3, max: 0.3, color: 'rgba(255,255,255,0.7)', size: 2 });
  }
  function text(x, y, str, color = '#fff', size = 1) {
    texts.push({ x, y, str, color, size, life: 0.9, vy: -30 });
  }
  function ring(x, y, r, color) { rings.push({ x, y, r, color, life: 0.4, max: 0.4 }); }
  function arc(x, y, dir, a, r, color) { arcs.push({ x, y, dir, a, r, color, life: 0.25, max: 0.25 }); }
  function bolt(pts, color) {
    const jag = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      jag.push(a);
      for (let k = 1; k < 4; k++) jag.push({ x: U.lerp(a.x, b.x, k / 4) + U.rand(-5, 5), y: U.lerp(a.y, b.y, k / 4) + U.rand(-5, 5) });
    }
    jag.push(pts[pts.length - 1]);
    bolts.push({ pts: jag, color, life: 0.3, max: 0.3 });
  }
  function meteor(x, y) { meteors.push({ x, y, t: 0, max: 0.35 }); }
  function pillar(x, y, r) { pillars.push({ x, y, r, life: 0.6, max: 0.6 }); }

  function update(dt) {
    for (const p of parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; p.vx *= 0.96; }
    parts = parts.filter((p) => p.life > 0);
    for (const t of texts) { t.life -= dt; t.y += t.vy * dt; t.vy *= 0.92; }
    texts = texts.filter((t) => t.life > 0);
    for (const l of [rings, arcs, bolts, pillars]) for (const o of l) o.life -= dt;
    rings = rings.filter((o) => o.life > 0); arcs = arcs.filter((o) => o.life > 0);
    bolts = bolts.filter((o) => o.life > 0); pillars = pillars.filter((o) => o.life > 0);
    for (const m of meteors) {
      m.t += dt;
      if (m.t >= m.max && !m.done) { m.done = true; burst(m.x, m.y, '#ff7a2f', 10, 70); ring(m.x, m.y, 14, '#ffb03a'); }
    }
    meteors = meteors.filter((m) => !m.done);
  }

  function draw(ctx) {
    for (const r of rings) {
      const k = 1 - r.life / r.max;
      ctx.globalAlpha = r.life / r.max;
      ctx.strokeStyle = r.color; ctx.lineWidth = 3 * (1 - k) + 0.5;
      ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r * (0.4 + 0.6 * k), r.r * (0.4 + 0.6 * k) * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
    }
    for (const a of arcs) {
      ctx.globalAlpha = (a.life / a.max) * 0.8;
      ctx.fillStyle = a.color;
      ctx.beginPath(); ctx.moveTo(a.x, a.y);
      ctx.arc(a.x, a.y, a.r, a.dir - a.a / 2, a.dir + a.a / 2);
      ctx.closePath(); ctx.fill();
    }
    for (const p of pillars) {
      ctx.globalAlpha = p.life / p.max;
      const g = ctx.createLinearGradient(p.x, p.y - 120, p.x, p.y);
      g.addColorStop(0, 'rgba(255,243,176,0)'); g.addColorStop(1, 'rgba(255,243,176,0.9)');
      ctx.fillStyle = g;
      ctx.fillRect(p.x - p.r * 0.5, p.y - 120, p.r, 120);
      ctx.fillStyle = 'rgba(255,255,220,0.5)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    }
    for (const m of meteors) {
      const k = m.t / m.max;
      const mx = m.x + (1 - k) * 40, my = m.y - (1 - k) * 90;
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffb03a'; ctx.beginPath(); ctx.arc(mx, my, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,120,40,0.6)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + 14, my - 30); ctx.stroke();
    }
    for (const b of bolts) {
      ctx.globalAlpha = b.life / b.max;
      for (const [w, c] of [[4, b.color], [1.5, '#ffffff']]) {
        ctx.strokeStyle = c; ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(b.pts[0].x, b.pts[0].y);
        for (const p of b.pts) ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    }
    for (const p of parts) {
      ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawTexts(ctx) {
    ctx.textAlign = 'center';
    for (const t of texts) {
      ctx.globalAlpha = Math.min(1, t.life * 2);
      ctx.font = `bold ${Math.round(8 * t.size)}px "Trebuchet MS", sans-serif`;
      ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.strokeText(t.str, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  return { clear, burst, trail, text, ring, arc, bolt, meteor, pillar, update, draw, drawTexts };
})();
