// Génère les icônes PNG (PWA + Android) à partir de tools/icon.html
// Usage : servir la racine du dépôt sur http://localhost:8766 puis `node tools/make-icons.mjs`
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://localhost:8766/tools/icon.html');
const save = async (file, size, opts) => {
  const url = await p.evaluate(([s, o]) => drawIcon(s, o), [size, opts || {}]);
  writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
  console.log('écrit', file);
};
mkdirSync('www/icons', { recursive: true });
await save('www/icons/icon-192.png', 192);
await save('www/icons/icon-512.png', 512);
const dens = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
mkdirSync('android-res', { recursive: true });
for (const [d, s] of Object.entries(dens)) {
  mkdirSync(`android-res/mipmap-${d}`, { recursive: true });
  await save(`android-res/mipmap-${d}/ic_launcher.png`, s);
  await save(`android-res/mipmap-${d}/ic_launcher_round.png`, s);
}
await b.close();
