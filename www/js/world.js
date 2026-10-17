// Éclipsia — génération des cartes : village d'Aubeclair (fait main) et donjons procéduraux
'use strict';

G.world = (() => {
  // Codes de tuiles : 0 sol, 1 mur, 2 eau, 3 chemin, 4 bâtiment
  const SOLID = [false, true, true, false, true];

  function makeVillage() {
    const w = 40, h = 30;
    const tiles = new Uint8Array(w * h);
    const r = G.util.rng(42);
    const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < w && y < h) tiles[y * w + x] = t; };
    const rect = (x, y, rw, rh, t) => { for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) set(i, j, t); };
    // Bordure d'arbres
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (x < 2 || y < 2 || x >= w - 2 || y >= h - 2) set(x, y, 1);
    }
    // Chemins
    rect(2, 15, 36, 2, 3);
    rect(19, 3, 2, 25, 3);
    rect(21, 6, 14, 1, 3);
    rect(9, 13, 1, 3, 3); rect(31, 13, 1, 3, 3); rect(11, 17, 1, 6, 3);
    // Fontaine
    rect(18, 10, 4, 3, 2);
    // Bâtiments
    const buildings = [
      { x: 16, y: 1, w: 8, h: 4, roof: '#5a4ab8', wall: '#ece4d4', sign: 'TEMPLE' },
      { x: 28, y: 9, w: 7, h: 4, roof: '#2a8a6a', wall: '#e0d0b0', sign: 'BOUTIQUE' },
      { x: 6, y: 9, w: 7, h: 4, roof: '#7a3a2a', wall: '#a89a8a', sign: 'FORGE' },
      { x: 7, y: 18, w: 8, h: 4, roof: '#b5452b', wall: '#d8c8a8', sign: 'TAVERNE' },
      { x: 27, y: 19, w: 5, h: 3, roof: '#c86a2a', wall: '#e0d4bc' },
      { x: 33, y: 19, w: 4, h: 3, roof: '#8a5a9a', wall: '#e0d4bc' },
      { x: 3, y: 3, w: 5, h: 3, roof: '#c86a2a', wall: '#e0d4bc' },
    ];
    for (const b of buildings) rect(b.x, b.y, b.w, b.h, 4);
    // Arbres décoratifs
    const trees = [[5, 25], [6, 26], [24, 26], [33, 26], [36, 13], [14, 4], [26, 3], [27, 4], [3, 13], [15, 25], [35, 25], [24, 11]];
    for (const [x, y] of trees) set(x, y, 1);
    for (let k = 0; k < 10; k++) {
      const x = 3 + ((r() * 34) | 0), y = 3 + ((r() * 24) | 0);
      if (tiles[y * w + x] === 0 && Math.abs(x - 20) > 3 && Math.abs(y - 16) > 2) set(x, y, 1);
    }
    return {
      id: 'aubeclair', w, h, tiles, theme: 'village', seed: 42, buildings,
      start: { x: 20 * 16 + 8, y: 18 * 16 + 8 },
      portal: { x: 34 * 16 + 8, y: 5 * 16 + 8 },
    };
  }

  // Génère un donjon assez grand (on réessaie si la caverne obtenue est trop petite)
  function makeDungeon(zone, visit) {
    let best = null;
    for (let k = 0; k < 12; k++) {
      const m = tryDungeon(zone, zone.seed * 1000 + visit * 17 + k);
      if (!best || m.floor > best.floor) best = m;
      if (m.floor >= 1150 && m.maxDist >= 85) return m;
    }
    return best;
  }

  function tryDungeon(zone, seed) {
    const w = 64, h = 52;
    const r = G.util.rng(seed);
    let tiles = new Uint8Array(w * h);
    const idx = (x, y) => y * w + x;
    // Automate cellulaire
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      tiles[idx(x, y)] = x === 0 || y === 0 || x === w - 1 || y === h - 1 || r() < 0.43 ? 1 : 0;
    }
    const walls = (t, x, y) => {
      let n = 0;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        if (!i && !j) continue;
        const xx = x + i, yy = y + j;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h || t[idx(xx, yy)] === 1) n++;
      }
      return n;
    };
    for (let it = 0; it < 5; it++) {
      const nt = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const n = walls(tiles, x, y);
        nt[idx(x, y)] = x === 0 || y === 0 || x === w - 1 || y === h - 1 ? 1 : n >= 5 ? 1 : n <= 2 ? 0 : tiles[idx(x, y)];
      }
      tiles = nt;
    }
    // Plus grande région connexe
    const region = new Int32Array(w * h).fill(-1);
    let best = -1, bestSize = 0, rid = 0;
    for (let i = 0; i < w * h; i++) {
      if (tiles[i] !== 0 || region[i] !== -1) continue;
      const q = [i]; region[i] = rid; let size = 0;
      while (q.length) {
        const c = q.pop(); size++;
        const cx = c % w, cy = (c / w) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const ni = idx(nx, ny);
          if (tiles[ni] === 0 && region[ni] === -1) { region[ni] = rid; q.push(ni); }
        }
      }
      if (size > bestSize) { bestSize = size; best = rid; }
      rid++;
    }
    for (let i = 0; i < w * h; i++) if (tiles[i] === 0 && region[i] !== best) tiles[i] = 1;
    // Point de départ : case libre la plus proche du bord ouest
    let start = -1, sd = Infinity;
    for (let i = 0; i < w * h; i++) {
      if (tiles[i] !== 0) continue;
      const x = i % w, y = (i / w) | 0;
      const d = x * 2 + Math.abs(y - h / 2);
      if (d < sd) { sd = d; start = i; }
    }
    const bfs = (from) => {
      const d = new Int32Array(w * h).fill(-1);
      const q = [from]; d[from] = 0; let head = 0;
      while (head < q.length) {
        const c = q[head++];
        const cx = c % w, cy = (c / w) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const ni = idx(nx, ny);
          if (tiles[ni] !== 1 && d[ni] === -1) { d[ni] = d[c] + 1; q.push(ni); }
        }
      }
      return d;
    };
    let dist = bfs(start);
    let boss = start, bd = 0;
    for (let i = 0; i < w * h; i++) if (dist[i] > bd) { bd = dist[i]; boss = i; }
    // Arène du boss et clairière de départ
    const clear = (c, rad) => {
      const cx = c % w, cy = (c / w) | 0;
      for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) {
        const x = cx + i, y = cy + j;
        if (x > 0 && y > 0 && x < w - 1 && y < h - 1 && i * i + j * j <= rad * rad) tiles[idx(x, y)] = 0;
      }
    };
    clear(boss, 6); clear(start, 3);
    dist = bfs(start);
    // Groupes de monstres
    const spawns = [];
    const cand = [];
    for (let i = 0; i < w * h; i++) if (tiles[i] === 0 && dist[i] > 12) cand.push(i);
    for (let k = cand.length - 1; k > 0; k--) { const j = (r() * (k + 1)) | 0; [cand[k], cand[j]] = [cand[j], cand[k]]; }
    const bx = boss % w, by = (boss / w) | 0;
    for (const c of cand) {
      const x = c % w, y = (c / w) | 0;
      if ((x - bx) ** 2 + (y - by) ** 2 < 100) continue;
      if (spawns.some((s) => (s.tx - x) ** 2 + (s.ty - y) ** 2 < 49)) continue;
      spawns.push({ tx: x, ty: y, x: x * 16 + 8, y: y * 16 + 8, d: dist[c] });
      if (spawns.length >= 26) break;
    }
    const T = 16;
    return {
      id: zone.id, w, h, tiles, theme: zone.theme, seed,
      start: { x: (start % w) * T + 8, y: ((start / w) | 0) * T + 8 },
      boss: { x: bx * T + 8, y: by * T + 8 },
      portal: { x: (start % w) * T + 8, y: ((start / w) | 0) * T - 8 },
      spawns, maxDist: bd, floor: tiles.reduce((n, t) => n + (t === 0 ? 1 : 0), 0),
    };
  }

  function solidAt(map, px, py) {
    const tx = Math.floor(px / 16), ty = Math.floor(py / 16);
    if (tx < 0 || ty < 0 || tx >= map.w || ty >= map.h) return true;
    return SOLID[map.tiles[ty * map.w + tx]];
  }

  // Déplacement avec collisions (axes séparés, boîte englobante de rayon r)
  function move(map, e, dx, dy) {
    const r = e.r || 5;
    if (dx) {
      const nx = e.x + dx;
      const ex = nx + (dx > 0 ? r : -r);
      if (!solidAt(map, ex, e.y - r + 1) && !solidAt(map, ex, e.y + r - 1)) e.x = nx;
    }
    if (dy) {
      const ny = e.y + dy;
      const ey = ny + (dy > 0 ? r : -r);
      if (!solidAt(map, e.x - r + 1, ey) && !solidAt(map, e.x + r - 1, ey)) e.y = ny;
    }
  }

  // Ligne de vue simple (échantillonnage)
  function los(map, a, b) {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.ceil(d / 8);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (solidAt(map, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return false;
    }
    return true;
  }

  // Trouve une case libre proche (pour faire apparaître des entités)
  function freeNear(map, x, y, rad = 3) {
    for (let k = 0; k < 30; k++) {
      const nx = x + (Math.random() * 2 - 1) * rad * 16, ny = y + (Math.random() * 2 - 1) * rad * 16;
      if (!solidAt(map, nx, ny) && !solidAt(map, nx + 6, ny + 6) && !solidAt(map, nx - 6, ny - 6)) return { x: nx, y: ny };
    }
    return { x, y };
  }

  // Minimap avec brouillard de guerre
  function makeMinimap(map) {
    const c = document.createElement('canvas');
    c.width = map.w; c.height = map.h;
    const x = c.getContext('2d');
    const img = x.createImageData(map.w, map.h);
    map.explored = new Uint8Array(map.w * map.h);
    map.mini = { canvas: c, ctx: x, img };
    if (map.theme === 'village') { map.explored.fill(1); revealAll(map); }
  }
  const MM_COLORS = { 0: [90, 150, 90], 1: [30, 40, 35], 2: [60, 120, 200], 3: [190, 170, 120], 4: [150, 90, 70] };
  function revealAround(map, px, py, rad = 7) {
    const tx = (px / 16) | 0, ty = (py / 16) | 0;
    const d = map.mini.img.data;
    let changed = false;
    for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) {
      const x = tx + i, y = ty + j;
      if (x < 0 || y < 0 || x >= map.w || y >= map.h || i * i + j * j > rad * rad) continue;
      const k = y * map.w + x;
      if (map.explored[k]) continue;
      map.explored[k] = 1; changed = true;
      paintMini(map, d, k);
    }
    if (changed) map.mini.ctx.putImageData(map.mini.img, 0, 0);
  }
  function paintMini(map, d, k) {
    const t = map.tiles[k];
    const col = t === 0 && map.theme !== 'village' ? themeFloor(map.theme) : MM_COLORS[t];
    d[k * 4] = col[0]; d[k * 4 + 1] = col[1]; d[k * 4 + 2] = col[2]; d[k * 4 + 3] = t === 1 ? 160 : 230;
  }
  function revealAll(map) {
    const d = map.mini.img.data;
    for (let k = 0; k < map.w * map.h; k++) paintMini(map, d, k);
    map.mini.ctx.putImageData(map.mini.img, 0, 0);
  }
  function themeFloor(theme) {
    return { forest: [80, 140, 70], mine: [140, 115, 95], ice: [200, 225, 240], desert: [220, 190, 130], citadel: [110, 90, 140] }[theme] || [90, 150, 90];
  }

  return { makeVillage, makeDungeon, solidAt, move, los, freeNear, makeMinimap, revealAround };
})();
