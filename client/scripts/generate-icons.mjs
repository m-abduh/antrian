import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'logo');
const src = join(outDir, 'Tunggu.id.png');

const meta = await sharp(src).metadata();
const aspect = meta.width / meta.height;

mkdirSync(outDir, { recursive: true });

async function renderIcon(size, widthPct) {
  const targetW = Math.round(size * widthPct);
  const targetH = Math.round(targetW / aspect);
  const buffer = await sharp(src).resize(targetW, targetH).toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: buffer, top: Math.round((size - targetH) / 2), left: Math.round((size - targetW) / 2) }])
    .png()
    .toBuffer();
}

const targets = [
  { name: 'icon-512.png', size: 512, widthPct: 0.7 },
  { name: 'icon-192.png', size: 192, widthPct: 0.7 },
  { name: 'icon-maskable-512.png', size: 512, widthPct: 0.5 },
  { name: 'icon-maskable-192.png', size: 192, widthPct: 0.5 },
  { name: 'apple-touch-icon.png', size: 180, widthPct: 0.7 },
  { name: 'favicon.png', size: 48, widthPct: 0.85 },
];

for (const t of targets) {
  const buf = await renderIcon(t.size, t.widthPct);
  const file = join(outDir, t.name);
  await sharp(buf).toFile(file);
  const m = await sharp(buf).metadata();
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  let minX = m.width, minY = m.height, maxX = -1, maxY = -1;
  for (let y = 0; y < m.height; y++) {
    for (let x = 0; x < m.width; x++) {
      if (data[(y * m.width + x) * 4 + 3] > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const safe = m.width * 0.4;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const distFromCenter = Math.sqrt((cx - m.width / 2) ** 2 + (cy - m.height / 2) ** 2);
  console.log(
    `${t.name}: ${m.width}x${m.height} bbox=[${minX},${minY}]-[${maxX},${maxY}] contentW=${maxX - minX} (${((maxX - minX) / m.width * 100).toFixed(0)}%) centerDist=${distFromCenter.toFixed(1)} safeZoneRadius=${safe}`
  );
}

console.log('done');
