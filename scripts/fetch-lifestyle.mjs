// Lädt lizenzfreie Lifestyle-Fotos (Unsplash-/Pexels-Lizenz: kommerziell frei, keine Namensnennung nötig)
// und speichert sie verkleinert als WebP unter public/img/lifestyle. Aufruf: node scripts/fetch-lifestyle.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'public', 'img', 'lifestyle');
const U = (id) => `https://images.unsplash.com/${id}?w=2400&q=85&auto=format&fit=crop`;
const P = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2400`;

export const PHOTOS = [
  { id: 'blue-table', url: U('photo-1511067007398-7e4b90cfa4bc'), source: 'Unsplash', author: 'Ivan Cortez', license: 'Unsplash License' },
  { id: 'table-hall', url: U('photo-1534158914592-062992fbe900'), source: 'Unsplash', author: 'Conor Samuel', license: 'Unsplash License' },
  { id: 'racket-close', url: U('photo-1609710228159-0fa9bd7c0827'), source: 'Unsplash', author: 'Lisa Keffer', license: 'Unsplash License' },
  { id: 'player', url: U('photo-1659303388076-de1535159d6c'), source: 'Unsplash', author: 'Unsplash', license: 'Unsplash License' },
  { id: 'paddles-ball', url: U('photo-1676827613262-5fba25cee5fd'), source: 'Unsplash', author: 'Unsplash', license: 'Unsplash License' },
  { id: 'serve', url: U('photo-1774755461355-5c576a2e6030'), source: 'Unsplash', author: 'Unsplash', license: 'Unsplash License' },
  { id: 'table-racket', url: U('photo-1708268418738-4863baa9cf72'), source: 'Unsplash', author: 'Unsplash', license: 'Unsplash License' },
  { id: 'apartment', url: P(4114728), source: 'Pexels', author: 'Pexels', license: 'Pexels License' },
  { id: 'home-couple', url: P(8933713), source: 'Pexels', author: 'Pexels', license: 'Pexels License' },
  { id: 'outdoor-match', url: P(31273673), source: 'Pexels', author: 'Pexels', license: 'Pexels License' },
  { id: 'action', url: P(40213147), source: 'Pexels', author: 'Pexels', license: 'Pexels License' },
  { id: 'flatlay', url: P(3846048), source: 'Pexels', author: 'Pexels', license: 'Pexels License' },
];

await mkdir(DIR, { recursive: true });
const ok = [];
for (const p of PHOTOS) {
  try {
    const r = await fetch(p.url);
    if (!r.ok) throw new Error(String(r.status));
    const buf = Buffer.from(await r.arrayBuffer());
    const img = sharp(buf).resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true });
    const meta = await img.metadata();
    await img.webp({ quality: 78 }).toFile(join(DIR, p.id + '.webp'));
    await sharp(buf)
      .resize({ width: 900 })
      .webp({ quality: 72 })
      .toFile(join(DIR, p.id + '-sm.webp'));
    ok.push({ ...p, file: `/img/lifestyle/${p.id}.webp`, small: `/img/lifestyle/${p.id}-sm.webp`, w: meta.width, h: meta.height });
    console.log('✔', p.id, meta.width + '×' + meta.height);
  } catch (e) {
    console.log('✘', p.id, e.message);
  }
}
await writeFile(join(ROOT, 'src', 'data', 'credits.json'), JSON.stringify(ok, null, 1));
