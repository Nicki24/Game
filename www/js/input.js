// Éclipsia — contrôles : joystick virtuel tactile, boutons et clavier
'use strict';

G.input = (() => {
  const st = { mx: 0, my: 0, mag: 0, attack: false };
  const presses = new Set();
  const keys = new Set();
  let joy = { id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
  let attackPointers = new Set();
  let keyAttack = false;
  const R = 46; // rayon du joystick en px

  function press(k) { presses.add(k); }
  function consume(k) { if (presses.has(k)) { presses.delete(k); return true; } return false; }
  function clearPresses() { presses.clear(); }

  function init() {
    const zone = document.getElementById('joy-zone');
    const base = document.getElementById('joy-base');
    const knob = document.getElementById('joy-knob');
    const place = (x, y) => { base.style.left = x - R + 'px'; base.style.top = y - R + 'px'; };
    zone.addEventListener('pointerdown', (e) => {
      if (joy.id !== null) return;
      e.preventDefault();
      G.audio.init();
      joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 };
      place(e.clientX, e.clientY);
      base.classList.add('active');
      knob.style.transform = 'translate(0px,0px)';
      zone.setPointerCapture && zone.setPointerCapture(e.pointerId);
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== joy.id) return;
      let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy;
      const d = Math.hypot(dx, dy);
      if (d > R) {
        // Le joystick suit le doigt s'il dépasse le rayon
        joy.ox += (dx / d) * (d - R); joy.oy += (dy / d) * (d - R);
        place(joy.ox, joy.oy);
        dx = e.clientX - joy.ox; dy = e.clientY - joy.oy;
      }
      joy.dx = dx / R; joy.dy = dy / R;
      knob.style.transform = `translate(${dx}px,${dy}px)`;
    });
    const end = (e) => {
      if (e.pointerId !== joy.id) return;
      joy = { id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
      base.classList.remove('active');
      base.style.left = ''; base.style.top = '';
      knob.style.transform = 'translate(0px,0px)';
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);

    // Boutons
    document.querySelectorAll('[data-btn]').forEach((b) => {
      const k = b.dataset.btn;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        G.audio.init();
        b.classList.add('pressed');
        if (k === 'attack') attackPointers.add(e.pointerId);
        else press(k);
      });
      const up = (e) => {
        b.classList.remove('pressed');
        if (k === 'attack') attackPointers.delete(e.pointerId);
      };
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
      b.addEventListener('pointerleave', up);
    });

    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      G.audio.init();
      const k = e.key.toLowerCase();
      keys.add(k);
      const map = { '1': 'skill0', '2': 'skill1', '3': 'skill2', '4': 'skill3', 'k': 'dodge', 'shift': 'dodge', 'l': 'lien', 'r': 'potion_vie', 'e': 'potion_mana',
        'escape': 'menu', 'm': 'menu', 'i': 'menu', 'f': 'interact', 'enter': 'confirm', 't': 'auto' };
      if (map[k]) { press(map[k]); e.preventDefault(); }
      if (k === 'j' || k === ' ') { keyAttack = true; press('interact_or_attack'); e.preventDefault(); }
      if (k.startsWith('arrow')) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      keys.delete(k);
      if (k === 'j' || k === ' ') keyAttack = false;
    });
    window.addEventListener('blur', () => { keys.clear(); keyAttack = false; attackPointers.clear(); });
  }

  function update() {
    let kx = 0, ky = 0;
    if (keys.has('arrowleft') || keys.has('a') || keys.has('q')) kx -= 1;
    if (keys.has('arrowright') || keys.has('d')) kx += 1;
    if (keys.has('arrowup') || keys.has('w') || keys.has('z')) ky -= 1;
    if (keys.has('arrowdown') || keys.has('s')) ky += 1;
    let mx = joy.dx, my = joy.dy;
    if (kx || ky) { const n = Math.hypot(kx, ky); mx = kx / n; my = ky / n; }
    let mag = Math.hypot(mx, my);
    if (mag < 0.18) { mx = 0; my = 0; mag = 0; }
    else if (mag > 1) { mx /= mag; my /= mag; mag = 1; }
    st.mx = mx; st.my = my; st.mag = mag;
    st.attack = attackPointers.size > 0 || keyAttack;
  }

  function reset() { attackPointers.clear(); keyAttack = false; presses.clear(); }

  return Object.assign(st, { init, update, consume, press, clearPresses, reset });
})();
