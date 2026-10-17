// Éclipsia — sons et musiques synthétisés en temps réel (Web Audio, aucun fichier audio)
'use strict';

G.audio = (() => {
  let ctx = null, master = null, musicGain = null, sfxGain = null;
  let musicOn = true, sfxOn = true;
  let musicTimer = null, currentTrack = -1, step = 0;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.6; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = musicOn ? 0.22 : 0; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = sfxOn ? 0.7 : 0; sfxGain.connect(master);
  }

  function tone(freq, dur, type = 'square', vol = 0.3, slide = 0, out = sfxGain, when = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + dur + 0.02);
  }

  let noiseBuf = null;
  function noise(dur, vol = 0.3, filter = 1200, when = 0) {
    if (!ctx) return;
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ctx.currentTime + when;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfxGain);
    s.start(t); s.stop(t + dur);
  }

  const last = {};
  function sfx(name) {
    if (!ctx || !sfxOn) return;
    // Limite la répétition d'un même son dans la même frame
    const now = performance.now();
    if (last[name] && now - last[name] < 45) return;
    last[name] = now;
    switch (name) {
      case 'swing': noise(0.08, 0.18, 2500); tone(300, 0.06, 'triangle', 0.08, -150); break;
      case 'hit': noise(0.07, 0.25, 900); tone(140, 0.08, 'square', 0.12, -60); break;
      case 'crit': noise(0.1, 0.3, 1600); tone(520, 0.12, 'square', 0.12, 300); break;
      case 'shoot': tone(700, 0.08, 'triangle', 0.12, -400); break;
      case 'magic': tone(420, 0.25, 'sine', 0.2, 500); tone(630, 0.2, 'triangle', 0.08, 300, sfxGain, 0.04); break;
      case 'fire': noise(0.35, 0.3, 700); tone(160, 0.3, 'sawtooth', 0.08, -80); break;
      case 'ice': tone(1200, 0.2, 'sine', 0.15, -600); tone(1800, 0.15, 'triangle', 0.06, -900); break;
      case 'zap': tone(900, 0.12, 'sawtooth', 0.1, -700); noise(0.1, 0.12, 4000); break;
      case 'heal': [523, 659, 784].forEach((f, i) => tone(f, 0.3, 'sine', 0.12, 0, sfxGain, i * 0.07)); break;
      case 'buff': [392, 523, 659, 784].forEach((f, i) => tone(f, 0.22, 'triangle', 0.1, 0, sfxGain, i * 0.05)); break;
      case 'dodge': noise(0.15, 0.15, 3000); break;
      case 'hurt': tone(200, 0.15, 'square', 0.15, -120); break;
      case 'die': tone(300, 0.4, 'sawtooth', 0.12, -250); break;
      case 'coin': tone(988, 0.06, 'square', 0.08); tone(1319, 0.12, 'square', 0.08, 0, sfxGain, 0.06); break;
      case 'loot': tone(660, 0.1, 'triangle', 0.12); tone(990, 0.15, 'triangle', 0.12, 0, sfxGain, 0.08); break;
      case 'levelup': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.25, 'square', 0.08, 0, sfxGain, i * 0.08)); break;
      case 'ui': tone(880, 0.04, 'square', 0.05); break;
      case 'boss': tone(80, 1.2, 'sawtooth', 0.2, -30); noise(1, 0.15, 300); break;
      case 'slam': noise(0.4, 0.4, 400); tone(70, 0.4, 'sine', 0.3, -30); break;
      case 'warn': tone(440, 0.1, 'square', 0.06); break;
      case 'lien': [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, 'sawtooth', 0.06, 0, sfxGain, i * 0.04)); noise(0.8, 0.3, 1500, 0.25); break;
      case 'forge_ok': tone(1200, 0.08, 'square', 0.1); tone(1600, 0.3, 'triangle', 0.12, 0, sfxGain, 0.1); break;
      case 'forge_ko': tone(300, 0.3, 'sawtooth', 0.1, -150); break;
      case 'portal': tone(200, 0.8, 'sine', 0.2, 600); break;
    }
  }

  // ---------------------------------------------------------------- Musique procédurale
  // Chaque piste : gamme, tempo, progression d'accords, timbre
  const TRACKS = [
    { bpm: 92, scale: [0, 2, 4, 7, 9], root: 60, chords: [0, 5, 3, 4], wave: 'triangle', mood: 0.6 },  // Aubeclair, paisible
    { bpm: 110, scale: [0, 2, 3, 7, 8], root: 57, chords: [0, 3, 4, 3], wave: 'triangle', mood: 0.75 }, // Forêt
    { bpm: 120, scale: [0, 1, 4, 5, 7], root: 52, chords: [0, 1, 0, 5], wave: 'sawtooth', mood: 0.8 }, // Mines
    { bpm: 84, scale: [0, 2, 3, 7, 10], root: 64, chords: [0, 5, 3, 2], wave: 'sine', mood: 0.5 },      // Glace
    { bpm: 116, scale: [0, 1, 4, 5, 8], root: 55, chords: [0, 1, 5, 4], wave: 'square', mood: 0.7 },    // Désert
    { bpm: 132, scale: [0, 1, 3, 6, 7], root: 50, chords: [0, 1, 6, 5], wave: 'sawtooth', mood: 0.9 }, // Citadelle
    { bpm: 150, scale: [0, 1, 3, 6, 7], root: 45, chords: [0, 1, 0, 6], wave: 'sawtooth', mood: 1 },    // Boss
  ];
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  function playMusic(idx) {
    if (idx === currentTrack) return;
    stopMusic();
    if (!ctx || idx < 0) return;
    currentTrack = idx;
    const tr = TRACKS[idx];
    const stepDur = 60 / tr.bpm / 2;
    step = 0;
    const r = G.util.rng(idx * 991 + 7);
    const melody = [];
    for (let i = 0; i < 32; i++) melody.push(r() < tr.mood ? tr.scale[(r() * tr.scale.length) | 0] + (r() < 0.25 ? 12 : 0) : null);
    musicTimer = setInterval(() => {
      if (!musicOn || !ctx) return;
      const bar = Math.floor(step / 8) % tr.chords.length;
      const chordRoot = tr.root - 12 + tr.chords[bar];
      if (step % 8 === 0) {
        tone(midi(chordRoot), stepDur * 7, 'triangle', 0.18, 0, musicGain);
        tone(midi(chordRoot + 7), stepDur * 7, 'sine', 0.08, 0, musicGain);
      }
      if (step % 2 === 0) tone(midi(chordRoot + 12 + (step % 4 ? 7 : 0)), stepDur * 0.9, 'sine', 0.07, 0, musicGain);
      const n = melody[step % 32];
      if (n !== null) tone(midi(tr.root + n + tr.chords[bar] % 5), stepDur * 1.6, tr.wave, tr.wave === 'sawtooth' || tr.wave === 'square' ? 0.035 : 0.09, 0, musicGain);
      if (idx >= 2 && step % 4 === 2) noise(0.05, 0.05, 6000);
      step++;
    }, stepDur * 1000);
  }

  function stopMusic() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
    currentTrack = -1;
  }

  function setMusic(on) { musicOn = on; if (musicGain) musicGain.gain.value = on ? 0.22 : 0; }
  function setSfx(on) { sfxOn = on; if (sfxGain) sfxGain.gain.value = on ? 0.7 : 0; }

  return { init, sfx, playMusic, stopMusic, setMusic, setSfx, get musicOn() { return musicOn; }, get sfxOn() { return sfxOn; }, get track() { return currentTrack; } };
})();
