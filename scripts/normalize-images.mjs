/**
 * Produktbilder vereinheitlichen (wie bei großen Shops): weißen Rand abschneiden, Motiv auf eine
 * quadratische, weiße Fläche mit gleichem Abstand setzen. Dadurch wirken alle Produkte im Raster
 * gleich groß und sauber zentriert. Fotos ohne weißen Hintergrund bleiben unverändert.
 *
 *   node scripts/normalize-images.mjs            – alle Bilder in public/img/p
 *   Originale werden einmalig nach img-original/ gesichert.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const DIR = 'public/img/p';
const BACKUP = 'img-original';
const FULL = 1200;
const THUMB = 480;
const FILL = 0.84; // Anteil der Fläche, den das Motiv maximal einnimmt
const MAX_UPSCALE = 1.6;

const isWhite = (r, g, b) => r > 238 && g > 238 && b > 238;

async function cornersWhite(buf) {
  const { data, info } = await sharp(buf).flatten({ background: '#ffffff' }).resize(64, 64, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => {
    const i = (y * info.width + x) * info.channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const pts = [
    [0, 0],
    [63, 0],
    [0, 63],
    [63, 63],
    [31, 0],
    [0, 31],
    [63, 31],
    [31, 63],
  ];
  return pts.filter(([x, y]) => isWhite(...px(x, y))).length >= 6;
}

async function normalize(srcBuf) {
  const flat = await sharp(srcBuf).flatten({ background: '#ffffff' }).toBuffer();
  if (!(await cornersWhite(flat))) return null; // Foto mit Hintergrund → unverändert lassen
  let trimmed;
  try {
    trimmed = await sharp(flat).trim({ background: '#ffffff', threshold: 14 }).toBuffer({ resolveWithObject: true });
  } catch {
    return null;
  }
  const { width: w, height: h } = trimmed.info;
  if (!w || !h) return null;
  const box = FULL * FILL;
  const scale = Math.min(box / w, box / h, MAX_UPSCALE);
  const nw = Math.max(1, Math.round(w * scale));
  const nh = Math.max(1, Math.round(h * scale));
  const content = await sharp(trimmed.data).resize(nw, nh, { kernel: 'lanczos3' }).toBuffer();
  return sharp({ create: { width: FULL, height: FULL, channels: 3, background: '#ffffff' } })
    .composite([{ input: content, left: Math.round((FULL - nw) / 2), top: Math.round((FULL - nh) / 2) }])
    .webp({ quality: 82 })
    .toBuffer();
}

async function main() {
  await fs.mkdir(BACKUP, { recursive: true });
  const files = (await fs.readdir(DIR)).filter((f) => f.endsWith('.webp') && !f.endsWith('-t.webp'));
  let done = 0;
  let skipped = 0;
  for (const f of files) {
    const abs = path.join(DIR, f);
    const bak = path.join(BACKUP, f);
    // immer vom Original ausgehen (idempotent)
    try {
      await fs.access(bak);
    } catch {
      await fs.copyFile(abs, bak);
    }
    const src = await fs.readFile(bak);
    const out = await normalize(src);
    if (!out) {
      skipped++;
      continue;
    }
    await fs.writeFile(abs, out);
    // über fs schreiben: libvips scheitert unter Windows an langen Pfaden
    await fs.writeFile(path.join(DIR, f.replace(/\.webp$/, '-t.webp')), await sharp(out).resize(THUMB, THUMB).webp({ quality: 78 }).toBuffer());
    done++;
    if (done % 200 === 0) console.log(`${done} Bilder vereinheitlicht …`);
  }
  console.log(`Fertig: ${done} vereinheitlicht, ${skipped} Fotos unverändert (von ${files.length}).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
