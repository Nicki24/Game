// Éclipsia — pixel-art procédural : gabarits de sprites, armes, tuiles, icônes
'use strict';

G.sprites = (() => {
  // Gabarits orientés vers la droite. Lettres = emplacements de palette, '.' = transparent.
  // o contour, s peau, h cheveux/casque, e yeux, a/b/c couleurs, d jambes, f bottes, l lumière
  const BODY = [
    '....oooo....',
    '...ohhhho...',
    '..ohhhhhho..',
    '..ohsssseo..',
    '..ohssssso..',
    '...osssso...',
    '..oaabbaao..',
    '.osaabbaaso.',
    '.osaabbaaso.',
    '..oaaccaao..',
    '..oaaaaaao..',
  ];
  const LEGS_A = ['..oddoddo...', '..oddoddo...', '..oddoddo...', '..offoffo...', '..ooo.ooo...'];
  const LEGS_B = ['..oddoddo...', '.oddo.oddo..', '.oddo..odo..', '.offo..ofo..', '.ooo...ooo..'];

  const TEMPLATES = {
    humanoid: { frames: [BODY.concat(LEGS_A), BODY.concat(LEGS_B)] },
    slime: { frames: [[
      '....oooo....',
      '..oollaaoo..',
      '.olaaaaaaao.',
      '.oaaaaaaaao.',
      'oaaaeaaeaaao',
      'oaaaeaaeaaao',
      'oaaaaaaaaaao',
      'obbbbbbbbbbo',
      '.oooooooooo.',
    ], [
      '............',
      '....oooo....',
      '..oollaaoo..',
      '.olaaaaaaao.',
      'oaaaeaaeaaao',
      'oaaaeaaeaaao',
      'oaaaaaaaaaao',
      'obbbbbbbbbbbo',
      'oooooooooooo',
    ]] },
    beast: { frames: [[
      '..........o.o...',
      '.........oaoao..',
      'o........oaaaao.',
      'ao.......oaaeaao',
      '.aoooooooaaaaabo',
      '.oaaaaaaaaaaooo.',
      '.oaaaaaaaaaao...',
      '.oacccccccaao...',
      '..oaao..oaao....',
      '..oaao..oaao....',
      '..oboo..oboo....',
    ], [
      '..........o.o...',
      '.........oaoao..',
      '.o.......oaaaao.',
      'oao......oaaeaao',
      '..aooooooaaaaabo',
      '.oaaaaaaaaaaooo.',
      '.oaaaaaaaaaao...',
      '.oacccccccaao...',
      '.oaao....oaao...',
      'oaao......oaao..',
      'obo........obo..',
    ]] },
    bat: { frames: [[
      'o.....oo.....o',
      'oa...oaao...ao',
      'oaa.oaeaeo.aao',
      'oaaaoaaaaoaaao',
      '.oaaaaaaaaaao.',
      '..oa.oaao.ao..',
      '...o..oo..o...',
    ], [
      '......oo......',
      '.....oaao.....',
      '....oaeaeo....',
      '..ooaaaaaaoo..',
      '.oaaaaaaaaaao.',
      'oaa.oaaaao.aao',
      'oa...oaao...ao',
      'o.....oo.....o',
    ]] },
    mushroom: { frames: [[
      '...oooooo...',
      '.ooaabaaaoo.',
      'oaabaaaabaao',
      'oaaaaabaaaao',
      'obaaaaaaabao',
      '.oooooooooo.',
      '...osssso...',
      '...oesseo...',
      '...osssso...',
      '..osssssso..',
      '..oooooooo..',
    ], [
      '............',
      '...oooooo...',
      '.ooaabaaaoo.',
      'oaabaaaabaao',
      'obaaaaaaabao',
      '.oooooooooo.',
      '...oesseo...',
      '...osssso...',
      '..osssssso..',
      '..oooooooo..',
      '............',
    ]] },
    golem: { frames: [[
      '....oooooo....',
      '...oaaaaaao...',
      '...oalaalao...',
      '...oaaaaaao...',
      '.oo.oooooo.oo.',
      'oaaoabbbbaoaao',
      'oaaoabllbaoaao',
      'oaaoabbbbaoaao',
      'oaaoaaaaaaoaao',
      '.oo.oaaaao.oo.',
      '....oaaaao....',
      '...oaao.oaao..',
      '...oaao.oaao..',
      '...oooo.oooo..',
    ], [
      '..............',
      '....oooooo....',
      '...oaaaaaao...',
      '...oalaalao...',
      '.oooaaaaaaooo.',
      'oaaooooooooaao',
      'oaaoabbbbaoaao',
      'oaaoabllbaoaao',
      'oaaoaaaaaaoaao',
      '.oo.oaaaao.oo.',
      '....oaaaao....',
      '..oaao..oaao..',
      '..oaao..oaao..',
      '..oooo..oooo..',
    ]] },
    ghost: { frames: [[
      '...oooooo...',
      '..oaaaaaao..',
      '.oaaaaaaaao.',
      '.oaeeaaeeao.',
      '.oaeeaaeeao.',
      '.oaaaaaaaao.',
      '.oaaaooaaao.',
      '.oaaaaaaaao.',
      '.oaaaaaaaao.',
      '.oabaabaabao',
      '.oa.oa.oa.o.',
      '..o..o..o...',
    ], [
      '...oooooo...',
      '..oaaaaaao..',
      '.oaaaaaaaao.',
      '.oaeeaaeeao.',
      '.oaeeaaeeao.',
      '.oaaaaaaaao.',
      '.oaaaooaaao.',
      '.oaaaaaaaao.',
      '.oaaaaaaaao.',
      'oabaabaabao.',
      '.o.ao.ao.ao.',
      '...o..o..o..',
    ]] },
    scorpion: { frames: [[
      '....ooo.........',
      '...oaaao........',
      '..oao..o........',
      '..oao...........',
      '...oaooooooooo..',
      '....oaaaaaaaaaoo',
      '....oaaabaabaaeo',
      '....oaaaaaaaaaoo',
      '.....o.o.o.o.oao',
      '.............oo.',
    ], [
      '...ooo..........',
      '..oaaao.........',
      '..oao.o.........',
      '..oao...........',
      '...oaooooooooo..',
      '....oaaaaaaaaaoo',
      '....oaaabaabaaeo',
      '....oaaaaaaaaaoo',
      '....o.o.o.o.o.oo',
      '.............oao',
    ]] },
    tree: { frames: [[
      '.....oooooo.....',
      '...ooaabaaaoo...',
      '..oaaaaaabaaao..',
      '.oabaaaaaaaabao.',
      '.oaaaaabaaaaaao.',
      '..ooaaaaaabaoo..',
      '....occcccco....',
      '..oo.ocllclo.oo.',
      '.occooccccccocco',
      '..oocccoocccoo..',
      '....occcccco....',
      '....occccccco...',
      '...occo..occo...',
      '..occo....occo..',
      '..ooo......ooo..',
    ], [
      '................',
      '.....oooooo.....',
      '...ooaabaaaoo...',
      '..oaaaaaabaaao..',
      '.oabaaaaaaaabao.',
      '.oaaaaabaaaaaao.',
      '..ooaaaaaabaoo..',
      'oo..ocllclo..oo.',
      '.occoocccccoocco',
      '..oocccoocccoo..',
      '....occcccco....',
      '....occccccco...',
      '...occo..occo...',
      '...occo..occo...',
      '...ooo....ooo...',
    ]] },
  };

  const DEFAULT_PAL = { o: '#140f1c', e: '#1a1a1a', l: '#ffffff', s: '#f0c8a0', h: '#4a3020', a: '#888', b: '#666', c: '#444', d: '#333', f: '#222' };
  const cache = new Map();

  function buildSprite(tpl, pal, frame, short) {
    let rows = TEMPLATES[tpl].frames[frame % TEMPLATES[tpl].frames.length];
    if (short && tpl === 'humanoid') rows = rows.filter((_, i) => i !== 9 && i !== 12);
    const w = Math.max(...rows.map((r) => r.length));
    const h = rows.length;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    const p = Object.assign({}, DEFAULT_PAL, pal);
    for (let j = 0; j < h; j++) {
      const row = rows[j];
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '.' || !p[ch]) continue;
        x.fillStyle = p[ch];
        x.fillRect(i, j, 1, 1);
      }
    }
    return c;
  }

  function get(tpl, pal, frame = 0, short = false) {
    const key = tpl + '|' + frame + '|' + (short ? 1 : 0) + '|' + JSON.stringify(pal);
    let c = cache.get(key);
    if (!c) { c = buildSprite(tpl, pal, frame, short); cache.set(key, c); }
    return c;
  }

  // Version « flash blanc » d'un sprite (quand il est touché)
  const flashCache = new Map();
  function flash(sprite) {
    let c = flashCache.get(sprite);
    if (!c) {
      c = document.createElement('canvas');
      c.width = sprite.width; c.height = sprite.height;
      const x = c.getContext('2d');
      x.drawImage(sprite, 0, 0);
      x.globalCompositeOperation = 'source-in';
      x.fillStyle = '#ffffff';
      x.fillRect(0, 0, c.width, c.height);
      flashCache.set(sprite, c);
    }
    return c;
  }

  // ---------------------------------------------------------------- Armes
  // Dessinées en vectoriel pour pouvoir pivoter pendant les attaques
  function drawWeapon(ctx, type, angle, s = 1, glow = null) {
    ctx.save();
    ctx.rotate(angle);
    ctx.lineCap = 'round';
    const line = (x1, y1, x2, y2, w, col) => {
      ctx.strokeStyle = col; ctx.lineWidth = w * s;
      ctx.beginPath(); ctx.moveTo(x1 * s, y1 * s); ctx.lineTo(x2 * s, y2 * s); ctx.stroke();
    };
    switch (type) {
      case 'epee':
        line(0, 0, 3, 0, 2, '#5a3a1a');
        line(3, -2.5, 3, 2.5, 1.5, '#c8a040');
        line(4, 0, 13, 0, 2, glow || '#dfe8f5');
        line(5, -0.4, 12, -0.4, 0.6, '#ffffff');
        break;
      case 'dague':
        line(0, 0, 2, 0, 1.5, '#3a2a1a');
        line(2, 0, 8, 0, 1.6, glow || '#c8c0e8');
        break;
      case 'baton':
        line(-3, 0, 12, 0, 1.6, '#7a4b22');
        ctx.fillStyle = glow || '#ff9a3c';
        ctx.beginPath(); ctx.arc(13 * s, 0, 2.4 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff6c8';
        ctx.beginPath(); ctx.arc(13.4 * s, -0.6 * s, 0.9 * s, 0, Math.PI * 2); ctx.fill();
        break;
      case 'arc':
        ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 1.6 * s;
        ctx.beginPath(); ctx.arc(1 * s, 0, 7 * s, -1.25, 1.25); ctx.stroke();
        ctx.strokeStyle = glow || '#eeeeee'; ctx.lineWidth = 0.5 * s;
        ctx.beginPath(); ctx.moveTo(1 * s + Math.cos(-1.25) * 7 * s, Math.sin(-1.25) * 7 * s);
        ctx.lineTo(1 * s + Math.cos(1.25) * 7 * s, Math.sin(1.25) * 7 * s); ctx.stroke();
        break;
      case 'masse':
        line(0, 0, 9, 0, 1.6, '#6a4a2a');
        ctx.fillStyle = glow || '#f1c40f';
        ctx.fillRect(8 * s, -3 * s, 5 * s, 6 * s);
        ctx.fillStyle = '#fff3b0'; ctx.fillRect(9 * s, -2 * s, 1.5 * s, 4 * s);
        break;
      case 'hache':
        line(0, 0, 10, 0, 1.8, '#5a3a1a');
        ctx.fillStyle = glow || '#b8c0cc';
        ctx.beginPath(); ctx.moveTo(7 * s, -1 * s); ctx.lineTo(12 * s, -5 * s); ctx.lineTo(12 * s, 5 * s); ctx.lineTo(7 * s, 1 * s); ctx.fill();
        break;
      case 'cle':
        line(0, 0, 9, 0, 1.8, '#c88a2a');
        ctx.strokeStyle = glow || '#3dd6d0'; ctx.lineWidth = 1.4 * s;
        ctx.beginPath(); ctx.arc(10.5 * s, 0, 2.2 * s, 0.6, Math.PI * 2 - 0.6); ctx.stroke();
        break;
      case 'pioche':
        line(0, 0, 9, 0, 1.6, '#6a4a2a');
        ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.6 * s;
        ctx.beginPath(); ctx.arc(9 * s, 4 * s, 5 * s, -2.2, -0.9); ctx.stroke();
        break;
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- Thèmes de tuiles
  const THEMES = {
    village: { floor: ['#4f9a45', '#4a9340', '#55a24a'], speck: '#6fbf5a', wall: 'tree', top: '#2f6e2f', top2: '#3f8a3a', face: '#24401f', deco: ['flower', 'grass'], bg: '#1f3d1c' },
    forest:  { floor: ['#3f7a3a', '#3a7236', '#44813e'], speck: '#5a9a4a', wall: 'tree', top: '#1f4f25', top2: '#2d6a30', face: '#16301a', deco: ['grass', 'mushroom', 'flower'], bg: '#0f2412' },
    mine:    { floor: ['#5a4a3e', '#54453a', '#604f42'], speck: '#6e5a4a', wall: 'block', top: '#3a302a', top2: '#4a3d34', face: '#231c18', ore: '#ff8a2a', deco: ['pebble', 'bone', 'ember'], bg: '#140f0c' },
    ice:     { floor: ['#cfe6f2', '#c6e0ee', '#d8ecf6'], speck: '#a8cfe6', wall: 'crystal', top: '#7fb8e0', top2: '#a8d8f8', face: '#4a7aa8', deco: ['snow', 'icecrack'], bg: '#2a4a68' },
    desert:  { floor: ['#d8b878', '#d0b070', '#e0c080'], speck: '#c09a5a', wall: 'block', top: '#a8844a', top2: '#c09a5a', face: '#7a5a2a', ore: '#4ad8ff', deco: ['pebble', 'bone', 'rune'], bg: '#5a4020' },
    citadel: { floor: ['#2a2236', '#262032', '#2e263c'], speck: '#3a3050', wall: 'block', top: '#14101e', top2: '#1e1830', face: '#0a0810', ore: '#b06bff', deco: ['rune', 'bone', 'crack'], bg: '#06040a', grid: true },
  };

  const T = 16; // taille d'une tuile en pixels logiques

  function renderMap(map) {
    const th = THEMES[map.theme];
    const c = document.createElement('canvas');
    c.width = map.w * T; c.height = map.h * T;
    const x = c.getContext('2d');
    const r = G.util.rng(map.seed * 7 + 3);
    const solid = (i, j) => i < 0 || j < 0 || i >= map.w || j >= map.h || map.tiles[j * map.w + i] !== 0;

    // Passe 1 : sol
    for (let j = 0; j < map.h; j++) {
      for (let i = 0; i < map.w; i++) {
        const px = i * T, py = j * T;
        const t = map.tiles[j * map.w + i];
        if (t === 3) { // chemin
          x.fillStyle = (i + j) % 2 ? '#b8a27a' : '#b09a72';
          x.fillRect(px, py, T, T);
          x.fillStyle = '#9a855e';
          if (r() < 0.5) x.fillRect(px + (r() * 14) | 0, py + (r() * 14) | 0, 2, 2);
          continue;
        }
        x.fillStyle = th.floor[(r() * th.floor.length) | 0];
        x.fillRect(px, py, T, T);
        x.fillStyle = th.speck;
        for (let k = 0; k < 3; k++) x.fillRect(px + ((r() * 15) | 0), py + ((r() * 15) | 0), 1, 1);
        if (th.grid) {
          x.fillStyle = 'rgba(0,0,0,0.25)';
          x.fillRect(px, py + T - 1, T, 1); x.fillRect(px + T - 1, py, 1, T);
        }
        if (t === 0 && r() < 0.07) drawDeco(x, th, choiceR(th.deco, r), px, py, r);
      }
    }
    // Passe 2 : murs (ordre de haut en bas pour un rendu 2.5D)
    for (let j = 0; j < map.h; j++) {
      for (let i = 0; i < map.w; i++) {
        if (map.tiles[j * map.w + i] !== 1) continue;
        const px = i * T, py = j * T;
        const faceBelow = !solid(i, j + 1);
        if (th.wall === 'tree') drawTree(x, th, px, py, r);
        else if (th.wall === 'crystal') drawCrystal(x, th, px, py, faceBelow, r);
        else drawBlock(x, th, px, py, faceBelow, r);
      }
    }
    // Eau (bassins)
    for (let j = 0; j < map.h; j++) {
      for (let i = 0; i < map.w; i++) {
        if (map.tiles[j * map.w + i] !== 2) continue;
        const px = i * T, py = j * T;
        x.fillStyle = '#2f7fc8'; x.fillRect(px, py, T, T);
        x.fillStyle = '#5aa8e8'; x.fillRect(px + 2 + ((r() * 8) | 0), py + 4 + ((r() * 8) | 0), 4, 1);
        if (solid(i, j - 1) && map.tiles[(j - 1) * map.w + i] !== 2) { x.fillStyle = '#8a8a9a'; x.fillRect(px, py, T, 3); }
      }
    }
    if (map.buildings) for (const b of map.buildings) drawBuilding(x, b);
    return c;
  }

  const choiceR = (arr, r) => arr[(r() * arr.length) | 0];

  function drawTree(x, th, px, py, r) {
    x.fillStyle = 'rgba(0,0,0,0.25)';
    x.beginPath(); x.ellipse(px + 8, py + 14, 7, 3, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#4a2f1a'; x.fillRect(px + 6, py + 8, 4, 7);
    x.fillStyle = th.face;
    x.beginPath(); x.arc(px + 8, py + 6, 9, 0, Math.PI * 2); x.fill();
    x.fillStyle = th.top;
    x.beginPath(); x.arc(px + 8, py + 5, 8, 0, Math.PI * 2); x.fill();
    x.fillStyle = th.top2;
    x.beginPath(); x.arc(px + 6, py + 3, 4.5, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.12)';
    x.fillRect(px + 4 + ((r() * 4) | 0), py + 1, 2, 2);
  }

  function drawBlock(x, th, px, py, faceBelow, r) {
    x.fillStyle = th.top; x.fillRect(px, py - 4, T, T);
    x.fillStyle = th.top2;
    x.fillRect(px + 1, py - 3, T - 2, 2);
    if (r() < 0.3) x.fillRect(px + ((r() * 12) | 0), py + ((r() * 8) | 0), 3, 2);
    if (th.ore && r() < 0.08) {
      x.fillStyle = th.ore; x.fillRect(px + 4 + ((r() * 8) | 0), py + ((r() * 6) | 0), 2, 2);
    }
    if (faceBelow) {
      x.fillStyle = th.face; x.fillRect(px, py + T - 4, T, 4);
      x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(px, py + T, T, 2);
      if (th.grid) { x.fillStyle = th.top2; x.fillRect(px + 2, py + T - 3, 3, 2); x.fillRect(px + 9, py + T - 3, 3, 2); }
    }
  }

  function drawCrystal(x, th, px, py, faceBelow, r) {
    x.fillStyle = th.face; x.fillRect(px, py - 2, T, T + 2);
    x.fillStyle = th.top;
    x.beginPath(); x.moveTo(px + 2, py + 14); x.lineTo(px + 5, py - 4); x.lineTo(px + 9, py + 14); x.fill();
    x.fillStyle = th.top2;
    x.beginPath(); x.moveTo(px + 7, py + 14); x.lineTo(px + 11, py - 1 - ((r() * 4) | 0)); x.lineTo(px + 15, py + 14); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.6)'; x.fillRect(px + 5, py + 1, 1, 6);
    if (faceBelow) { x.fillStyle = 'rgba(20,40,70,0.35)'; x.fillRect(px, py + T, T, 2); }
  }

  function drawDeco(x, th, kind, px, py, r) {
    const ox = px + 3 + ((r() * 9) | 0), oy = py + 3 + ((r() * 9) | 0);
    switch (kind) {
      case 'flower':
        x.fillStyle = choiceR(['#ff6a8a', '#ffd84a', '#ffffff', '#b07aff'], r);
        x.fillRect(ox, oy, 2, 2); x.fillRect(ox + 3, oy + 2, 2, 2);
        x.fillStyle = '#2f6e2f'; x.fillRect(ox + 1, oy + 2, 1, 2);
        break;
      case 'grass':
        x.fillStyle = 'rgba(30,70,25,0.8)';
        x.fillRect(ox, oy, 1, 3); x.fillRect(ox + 2, oy - 1, 1, 4); x.fillRect(ox + 4, oy + 1, 1, 2);
        break;
      case 'mushroom':
        x.fillStyle = '#c0392b'; x.fillRect(ox, oy, 4, 2);
        x.fillStyle = '#f6e7c8'; x.fillRect(ox + 1, oy + 2, 2, 2);
        break;
      case 'pebble':
        x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(ox, oy, 3, 2); x.fillRect(ox + 5, oy + 3, 2, 2);
        break;
      case 'bone':
        x.fillStyle = '#e8e0cc'; x.fillRect(ox, oy, 5, 1); x.fillRect(ox, oy - 1, 1, 3); x.fillRect(ox + 4, oy - 1, 1, 3);
        break;
      case 'ember':
        x.fillStyle = '#ff6a1a'; x.fillRect(ox, oy, 2, 1); x.fillStyle = '#ffd23a'; x.fillRect(ox + 1, oy, 1, 1);
        break;
      case 'snow':
        x.fillStyle = '#ffffff'; x.fillRect(ox, oy, 3, 2); x.fillRect(ox + 1, oy - 1, 2, 1);
        break;
      case 'icecrack':
        x.fillStyle = '#8ab8d8'; x.fillRect(ox, oy, 4, 1); x.fillRect(ox + 3, oy + 1, 1, 3);
        break;
      case 'rune':
        x.fillStyle = th.ore || '#ffd84a'; x.globalAlpha = 0.5;
        x.fillRect(ox, oy, 5, 1); x.fillRect(ox + 2, oy - 2, 1, 5); x.globalAlpha = 1;
        break;
      case 'crack':
        x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(ox, oy, 5, 1); x.fillRect(ox + 4, oy + 1, 1, 3);
        break;
    }
  }

  function drawBuilding(x, b) {
    const px = b.x * T, py = b.y * T, w = b.w * T, h = b.h * T;
    // Mur avant
    x.fillStyle = b.wall || '#d8c8a8'; x.fillRect(px, py + h * 0.45, w, h * 0.55);
    x.fillStyle = 'rgba(0,0,0,0.12)';
    for (let k = 0; k < w; k += 8) x.fillRect(px + k, py + h * 0.45, 1, h * 0.55);
    // Toit
    x.fillStyle = b.roof || '#b5452b';
    x.beginPath(); x.moveTo(px - 4, py + h * 0.5); x.lineTo(px + w / 2, py - 6); x.lineTo(px + w + 4, py + h * 0.5); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.15)';
    x.beginPath(); x.moveTo(px - 4, py + h * 0.5); x.lineTo(px + w / 2, py - 6); x.lineTo(px + w / 2, py + h * 0.5); x.fill();
    // Porte et fenêtres
    x.fillStyle = '#4a2f1a'; x.fillRect(px + w / 2 - 5, py + h - 14, 10, 14);
    x.fillStyle = '#ffd86a';
    x.fillRect(px + 6, py + h - 16, 7, 6); x.fillRect(px + w - 13, py + h - 16, 7, 6);
    // Enseigne
    if (b.sign) {
      x.fillStyle = '#5a3a1a'; x.fillRect(px + w / 2 - 14, py + h * 0.45 + 2, 28, 9);
      x.fillStyle = '#ffe9b0'; x.font = 'bold 7px monospace'; x.textAlign = 'center';
      x.fillText(b.sign, px + w / 2, py + h * 0.45 + 9);
    }
  }

  // ---------------------------------------------------------------- Icônes d'objets (pour les menus)
  const iconCache = new Map();
  function itemIcon(kind, color, extra) {
    const key = kind + color + (extra || '');
    if (iconCache.has(key)) return iconCache.get(key);
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.translate(16, 16);
    if (['epee', 'baton', 'arc', 'masse'].includes(kind)) {
      x.scale(1.6, 1.6); x.translate(-6, 0);
      drawWeapon(x, kind, kind === 'arc' ? 0 : -0.8, 1, extra);
    } else if (kind === 'armor') {
      x.fillStyle = color;
      x.fillRect(-9, -8, 18, 16); x.fillRect(-13, -8, 4, 8); x.fillRect(9, -8, 4, 8);
      x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(-1, -8, 2, 16);
      x.fillStyle = 'rgba(255,255,255,0.3)'; x.fillRect(-8, -7, 5, 3);
    } else if (kind === 'helm') {
      x.fillStyle = color;
      x.beginPath(); x.arc(0, 2, 10, Math.PI, 0); x.fill(); x.fillRect(-10, 2, 20, 5);
      x.fillStyle = '#1a1220'; x.fillRect(-6, 3, 12, 2);
      x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(-6, -5, 4, 3);
    } else if (kind === 'ring') {
      x.strokeStyle = color; x.lineWidth = 3;
      x.beginPath(); x.arc(0, 3, 8, 0, Math.PI * 2); x.stroke();
      x.fillStyle = extra || '#ff4d6d'; x.fillRect(-3, -10, 6, 6);
      x.fillStyle = '#ffffff'; x.fillRect(-2, -9, 2, 2);
    } else if (kind === 'potion') {
      x.fillStyle = '#d8d8e8'; x.fillRect(-3, -12, 6, 5);
      x.fillStyle = '#8a5a2a'; x.fillRect(-3, -14, 6, 3);
      x.fillStyle = color; x.beginPath(); x.arc(0, 3, 9, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(-5, -2, 3, 4);
    } else if (kind === 'scroll') {
      x.fillStyle = color; x.fillRect(-10, -8, 20, 16);
      x.fillStyle = '#8a6a3a'; x.fillRect(-12, -10, 4, 20); x.fillRect(8, -10, 4, 20);
      x.fillStyle = '#5a3a1a'; x.fillRect(-6, -4, 12, 1); x.fillRect(-6, 0, 10, 1); x.fillRect(-6, 4, 8, 1);
    } else if (kind === 'star') {
      x.fillStyle = color;
      x.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 5 : 12;
        x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      x.fill();
    }
    const url = c.toDataURL();
    iconCache.set(key, url);
    return url;
  }

  // Portrait (tête agrandie) pour l'interface
  const portraitCache = new Map();
  function portrait(tpl, pal, short) {
    const key = tpl + JSON.stringify(pal) + short;
    if (portraitCache.has(key)) return portraitCache.get(key);
    const spr = get(tpl, pal, 0, short);
    const c = document.createElement('canvas');
    c.width = 48; c.height = 48;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    const sc = tpl === 'humanoid' ? 5 : 3.5;
    x.drawImage(spr, 24 - (spr.width * sc) / 2, tpl === 'humanoid' ? 2 : 24 - (spr.height * sc) / 2, spr.width * sc, spr.height * sc);
    const url = c.toDataURL();
    portraitCache.set(key, url);
    return url;
  }

  return { TEMPLATES, get, flash, drawWeapon, THEMES, renderMap, T, itemIcon, portrait };
})();
