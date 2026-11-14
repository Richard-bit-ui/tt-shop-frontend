// Baut aus scripts/raw-catalog-v2.json (Ausschnitt des Live-Katalogs von tt-shop.de, 349 Artikel)
// die Daten für den Prototyp:
//   src/data/catalog.json  – Listen-/Filterdaten inkl. Varianten & technischer Daten (klein, sofort geladen)
//   src/data/details.json  – Beschreibungstexte & komplette Attributtabellen (lazy auf der Produktseite)
//   public/img/p/*.webp    – Produktbilder, max. 1200 px
//
// Herkunft: siehe scripts/collect-in-browser.js (Daten wurden normal im Browser auf tt-shop.de gelesen,
// Produktseiten liegen hinter einer Bot-Protection). Im Live-Betrieb: OpenMage-REST (src/api/openmage.ts).
//
// Aufruf: npm run import:shop

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MEDIA = 'https://www.tt-shop.de/media/catalog/product';
const IMG_DIR = join(ROOT, 'public', 'img', 'p');
const RAW_V3 = join(ROOT, 'scripts', 'raw-catalog-v3.json');
const RAW_V2 = join(ROOT, 'scripts', 'raw-catalog-v2.json');
const MAX_PX = 1200;

/** Belagart laut Kategoriezuordnung im Shop (Noppen, Anti, Glanti) – siehe rubber-types.json */
const TYPE_MAP = new Map();
try {
  const tm = JSON.parse(await readFile(join(ROOT, 'scripts', 'rubber-types.json'), 'utf8'));
  for (const [type, ids] of Object.entries(tm)) if (Array.isArray(ids)) ids.forEach((id) => TYPE_MAP.set(id, type));
} catch {}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  );

/* ---------------- Namen ---------------- */
const KEEP_UPPER = /^(ITTF|ABS|HD|SLP|VPS|ARC|FX|MK|EL|EL-S|SL|DHS|II|III|IV|V|VI|VII|VIII|XL|TT|SDL|NEO|ALC|ZLC|OFF|DEF|ALL|AGR|ACC|ZGR|MX-P|MX-S|MX-D|K3|K1|H|S|G1|DF|DT|TSP|OX|SC|R|W|ST|FL|AN)$/;
function tidyWord(w) {
  if (!/[A-ZÄÖÜ]{2,}/.test(w) || /[a-zäöü]/.test(w)) return w;
  if (KEEP_UPPER.test(w.replace(/[^A-Z0-9-]/g, ''))) return w;
  const core = w.replace(/[^A-ZÄÖÜ0-9-]/g, '');
  if (core.length <= 3 && !/^(PRO|MAX|NEW|ONE|TOP|FUN|AIR|SET|UND)$/.test(core)) return w;
  return w.charAt(0) + w.slice(1).toLowerCase();
}
function splitName(name) {
  const parts = name.split(/\s+-\s+/);
  const title = parts[0]
    .split(/\s+/)
    .map(tidyWord)
    .join(' ')
    .replace(/\s*\(Auslauf\)\s*/i, ' ')
    .trim();
  const tag =
    parts.length > 1
      ? parts
          .slice(1)
          .join(' – ')
          .replace(/\b([A-ZÄÖÜ]{3,})\b/g, (w) => w.charAt(0) + w.slice(1).toLowerCase())
      : null;
  return { title, tag, discontinued: /\(Auslauf\)/i.test(name) };
}

const BRANDS = [
  'Donic',
  'Tibhar',
  'Joola',
  'Sponeta',
  'Cornilleau',
  'Kettler',
  'Butterfly',
  'Stiga',
  'Xiom',
  'Victas',
  'Andro',
  'Gewo',
  'Yasaka',
  'Nittaku',
  'Mizuno',
  'Schildkröt',
  'DHS',
  'Palio',
  'Sanwei',
  'Sunflex',
  'Asics',
  'Dr. Neubauer',
  'Der Materialspezialist',
  'Sauer & Tröger',
  'Pimplepark',
  'Barna',
  'Avalox',
  'Hallmark',
  'Tibhar',
  'Nordlicht',
];
function brandOf(p, title) {
  const m = p.attrs['Marke'];
  const fix = { Tikotec: 'TT-Shop', Nein: null, 'Sauer und Tröger': 'Sauer & Tröger', 'Fit am Tisch': 'FIT am TISCH' };
  const b = m in fix ? fix[m] : m;
  if (/^Sauer (und|&) Tröger/i.test(title)) return 'Sauer & Tröger';
  return b || BRANDS.find((x) => title.toLowerCase().startsWith(x.toLowerCase())) || 'TT-Shop';
}
function seriesOf(title, brand) {
  const words = title
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/);
  const bw = brand.split(/\s+/).length;
  if (/^Sauer (und|&) Tröger/i.test(title)) return words[3] ?? null;
  const startsWithBrand = title.toLowerCase().startsWith(brand.toLowerCase());
  const w = startsWithBrand ? words[bw] : words[0];
  return w && /^[A-Za-zÄÖÜäöü]/.test(w) && w.length > 1 ? w.replace(/[^\wÄÖÜäöüß-]/g, '') : null;
}

/* ---------------- Belagtyp: Technologie bekannter Serien ---------------- */
const SERIES_TYPE = [
  [/^Tibhar (Evolution|Aurus|Genius|Quantum|Nimbus|Infinity|K1)/, 'Tensor'],
  [/^Tibhar Hybrid/, 'Hybrid'],
  [/^Tibhar (Vari Spin|Rapid|Sinus)/, 'Klassisch'],
  [/^Tibhar Grass/, 'Lange Noppen'],
  [/^Tibhar Speedy/, 'Kurze Noppen'],
  [/^Xiom (Vega|Omega|Jekyll|Opera|Dynamic)/, 'Tensor'],
  [/^Joola (Dynaryz|Rhyzen|Trinity|Tronix|Rhyzm|Maxxx|Golden Tango|Express)/, 'Tensor'],
  [/^Donic (Bluefire|Bluestorm|Acuda|Baracuda|Desto)/, 'Tensor'],
  [/^Donic Bluegrip/, 'Hybrid'],
  [/^Donic (Coppa(?! X)|Vario|Quattro)/, 'Klassisch'],
  [/^Donic Coppa X/, 'Tensor'],
  [/^Gewo (nanoFlex|Proton Neo)/i, 'Tensor'],
  [/^Palio CJ ?8000/, 'Klebrig'],
  [/^Sauer (und|&) Tröger Hellfire/, 'Lange Noppen'],
  [/^Andro (Rasanter|Hexer|Nuzn)/i, 'Tensor'],
  [/^Stiga DNA/, 'Tensor'],
  [/^Gewo (Nexxus|Hype|Codex)/, 'Tensor'],
  [/^Nittaku Fastarc/, 'Tensor'],
  [/^Yasaka Rakza/, 'Tensor'],
  [/^Yasaka Mark V/, 'Klassisch'],
  [/^DHS (Hurricane|Gold Arc)/, 'Klebrig'],
  [/^Butterfly (Tenergy|Dignics|Rozena|Glayzer)/, 'Tensor'],
  [/^Butterfly Sriver/, 'Klassisch'],
  [/^Donic Bluestar/, 'Hybrid'],
  [/^Victas VS? > \d/, 'Tensor'],
  [/^Gewo Neoflexx/, 'Tensor'],
  [/^Joola CWX/, 'Lange Noppen'],
];

const COLORS = ['rot', 'schwarz', 'blau', 'grün', 'pink', 'lila', 'violett', 'türkis', 'gelb', 'orange', 'weiß', 'grau', 'silber'];
const COLOR_NORM = { violett: 'lila' };

function thicknessRank(t) {
  if (/^OX$/i.test(t)) return 0;
  if (/max/i.test(t)) return 9;
  const v = parseFloat(t.replace(',', '.'));
  return Number.isFinite(v) ? v : 5;
}

/* ---------------- Optionen ---------------- */
function optionKind(name, cat) {
  const n = name.toLowerCase();
  if (/^variante|^version/.test(n) && cat === 'belaege') return 'variant';
  if (/versieg/.test(n)) return 'sealing';
  if (/griffform|verwendetes holz|^holz/.test(n)) return 'handle';
  if (/größe|groesse|size/.test(n)) return 'size';
  if (/roter belag|schwarzer belag|belag 1|belag 2/.test(n)) return 'rubber';
  if (/montage/.test(n)) return 'assembly';
  if (/versieg/.test(n)) return 'sealing';
  if (/dazu\?|sparset|equipment|wahl der bälle/.test(n)) return 'addon';
  return 'choice';
}

function cleanGroupName(g) {
  return g
    .replace(/\?$/, '')
    .replace(/^Holzversieglung/, 'Holzversiegelung')
    .replace(/^Sparset zum optimalen Schlägerschutz \| /, '')
    .replace(/:\s*$/, '')
    .trim();
}

function parseGroups(p, title) {
  return (p.groups || []).map((g) => {
    const kind = optionKind(g.g, p.c);
    const raws = g.opts.map((o) => o.raw ?? o.label);
    // gemeinsames Präfix „Produktname, …“ entfernen
    const firsts = raws.map((r) => r.split(/,\s(?=[^\d])/)[0]);
    const shared = raws.length > 1 && firsts.every((f) => f === firsts[0]) && raws.every((r) => r.includes(', ')) ? firsts[0] : null;
    const values = g.opts.map((o, i) => {
      let label = raws[i];
      if (shared && label.startsWith(shared + ', ')) label = label.slice(shared.length + 2);
      else if (!shared && raws[i].toLowerCase().startsWith(title.toLowerCase() + ', ')) label = raws[i].slice(title.length + 2);
      label = label.replace(/(\d),\s(\d)/g, '$1,$2');
      const v = { label, delta: o.delta };
      if (kind === 'variant' || kind === 'rubber') {
        const c = COLORS.find((x) => new RegExp(`\\b${x}\\b`, 'i').test(label));
        if (c) v.color = COLOR_NORM[c] ?? c;
        const t = label.match(/(\d,\d{1,2})\s?mm|\bmax\b|\bOX\b|\b(\d,\d)\b/i);
        if (t) v.thickness = (t[1] || t[2] || t[0]).replace(/\s?mm/, '').replace(/^max$/i, 'max').replace(/^ox$/i, 'OX');
      }
      return v;
    });
    return { name: kind === 'choice' && /zielland/i.test(g.g) ? 'Lieferland' : cleanGroupName(g.g), kind, required: !!g.req || /\*$/.test(g.g), values };
  });
}

/* ---------------- Technische Daten ---------------- */
function hardnessClass(h) {
  if (h == null) return null;
  if (h <= 40) return 'Soft';
  if (h <= 44) return 'Medium-';
  if (h <= 47.5) return 'Medium';
  if (h <= 50) return 'Medium+';
  return 'Hard';
}

function deriveSpecs(p, title, options) {
  const s = { ...p.spec };
  const text = (p.paras || []).join(' ');
  if (p.c === 'belaege') {
    const known = SERIES_TYPE.find(([re]) => re.test(title));
    // Serien-Wissen nur nutzen, um unsichere Einstufungen zu korrigieren (z. B. „Klassisch“ ohne Stichwort im Text)
    if (known && !(known[1] === 'Tensor' && (s.rubberType === 'Hybrid' || s.rubberType === 'Klebrig'))) s.rubberType = known[1];
    if (/(Pro H|Asia H|Europe H|Hybrid)/.test(title) && s.rubberType === 'Tensor') s.rubberType = 'Hybrid';
    if (/^Der Materialspezialist|^Dr\. Neubauer|^Pimplepark/.test(title) && s.rubberType === 'Klassisch') s.rubberType = p.sub === 'kurze-noppen' ? 'Kurze Noppen' : s.rubberType;
    const th = title.match(/\b(\d{2}(?:[.,]\d)?)\b(?!\s?(?:er|mm))/);
    if (!s.hardness && th) {
      const v = parseFloat(th[1].replace(',', '.'));
      if (v >= 35 && v <= 60) s.hardness = v;
    }
    const mapped = TYPE_MAP.get(p.id);
    if (mapped === 'Noppen innen') {
      if (!['Tensor', 'Hybrid', 'Klebrig'].includes(s.rubberType)) s.rubberType = 'Klassisch';
    } else if (mapped) s.rubberType = mapped;
    s.hardnessClass = hardnessClass(s.hardness);
    const variant = options.find((o) => o.kind === 'variant');
    const colors = [...new Set((variant?.values ?? []).map((v) => v.color).filter(Boolean))];
    const fallbackColors = (p.attrs['Farben'] || '')
      .split(/,\s*/)
      .map((c) => c.trim().toLowerCase())
      .filter((c) => COLORS.includes(c));
    s.colors = colors.length ? colors : fallbackColors;
    s.thicknesses = [...new Set((variant?.values ?? []).map((v) => v.thickness).filter(Boolean))].sort((a, b) => thicknessRank(a) - thicknessRank(b));
    s.colorful = s.colors.some((c) => !['rot', 'schwarz'].includes(c));
  }
  if (p.c === 'hoelzer' || (p.c === 'schlaeger' && p.sub === 'profi')) {
    if (/\bALC\b|Arylat/i.test(title)) s.material = 'ALC';
    if (/\bZLC\b|Zylon/i.test(title)) s.material = 'ZLC';
    if (/Carbon|Dotec Carbon|Senso Carbon|Karbon/i.test(title)) s.material = 'Carbon';
    if (/Balsa/i.test(title)) s.material = 'Balsa';
    const cls = title.match(/\b(OFF\+|OFF-|OFF|ALL\+|ALL|DEF)\b/);
    if (cls) s.class = cls[1];
    if (!s.class && /Defense|Defplay|Def\b|Powerdefense|Defensiv/i.test(title)) s.class = 'DEF';
    if (!s.plies) {
      const m = text.match(/(fünf|sieben|drei|5|7|3)\s?-?\s?(?:lagig|schichtig|Furnier|Schichten|Lagen)/i);
      if (m) s.plies = { fünf: 5, sieben: 7, drei: 3 }[m[1].toLowerCase()] ?? +m[1];
    }
    if (s.material === 'Allholz' && !s.plies && /\b5\b/.test(title)) s.plies = 5;
    s.handles = (p.attrs['Griffformen'] || '').split(/,\s*/).filter(Boolean);
  }
  if (p.c === 'tische') {
    const a = p.attrs;
    s.usage = a['Verwendungsort'] || (p.sub === 'outdoor' ? 'Outdoor' : p.sub === 'netze' || p.sub === 'huellen' ? null : 'Indoor');
    const mm = parseFloat((a['Plattenstärke'] || '').replace(',', '.'));
    if (Number.isFinite(mm)) s.topMm = mm;
    if (a['ITTF Zulassung']) s.ittf = a['ITTF Zulassung'] === 'Ja';
    if (a['Netz im Preis dabei']) s.net = a['Netz im Preis dabei'] === 'Ja';
    if (a['Playback-Stellung']) s.playback = a['Playback-Stellung'] === 'Ja';
    const kg = (a['Gewicht netto (ohne Verpackung)'] || '').match(/(\d+[.,]?\d*)/);
    if (kg) s.weightKg = parseFloat(kg[1].replace(',', '.'));
    s.tableColors = (a['Farben'] || '').toLowerCase();
  }
  if (p.c === 'schuhe') {
    const g = (p.attrs['Gewicht in Größe 42'] || '').match(/(\d{3})/);
    if (g) s.shoeWeight = +g[1];
  }
  const sizeGroup = options.find((o) => o.kind === 'size');
  if (sizeGroup) {
    // „weiß/blau, Größe 40,5 (ausgelaufen)“ → „40,5“ (Ausführung steckt in der Option selbst)
    const sz = sizeGroup.values.map((v) => {
      const i = v.label.lastIndexOf(', ');
      return (i > 0 ? v.label.slice(i + 2) : v.label)
        .replace(/^(Größe|Gr\.)\s*/i, '')
        .replace(/\s*\([^)]*\)\s*$/, '')
        .trim();
    });
    s.sizes = [...new Set(sz)];
  } else if (p.attrs['Kleidungsgrößen']) s.sizes = p.attrs['Kleidungsgrößen'].split(/,\s*/);
  if (p.attrs['Herstellungsland'] && p.attrs['Herstellungsland'] !== 'Nein') s.origin = p.attrs['Herstellungsland'];
  if (s.playerType) s.playerType = s.playerType.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
  for (const k of Object.keys(s)) if (s[k] == null || (Array.isArray(s[k]) && !s[k].length) || s[k] === '') delete s[k];
  return s;
}

/* ---------------- Bilder ---------------- */
/** 480-px-Vorschaubild für Karten, Listen, Suche und Warenkorb */
async function ensureThumb(abs) {
  const t = abs.replace(/\.webp$/, '-t.webp');
  if (await exists(t)) return;
  try {
    await sharp(abs).resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true }).webp({ quality: 74 }).toFile(t);
  } catch {}
}

async function download(path, file) {
  const abs = join(IMG_DIR, file);
  if (await exists(abs)) {
    await ensureThumb(abs);
    return true;
  }
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(MEDIA + path);
      if (r.status === 404) return false;
      if (r.ok && (r.headers.get('content-type') || '').startsWith('image/')) {
        const buf = Buffer.from(await r.arrayBuffer());
        await sharp(buf).resize({ width: MAX_PX, height: MAX_PX, fit: 'inside', withoutEnlargement: true }).flatten({ background: '#ffffff' }).webp({ quality: 78 }).toFile(abs);
        await ensureThumb(abs);
        return true;
      }
    } catch {}
    await sleep(600 * (i + 1));
  }
  return false;
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) await fn(items[i++]);
    }),
  );
}

async function main() {
  await mkdir(IMG_DIR, { recursive: true });
  const raw = JSON.parse(await readFile((await exists(RAW_V3)) ? RAW_V3 : RAW_V2, 'utf8'));
  const products = [];
  const details = {};
  let done = 0;

  await pool(raw, 8, async (p) => {
    const images = [];
    for (const [n, path] of p.img.entries()) {
      const file = `${p.id}-${n}.webp`;
      if (await download(path, file)) images.push('/img/p/' + file);
    }
    if (++done % 25 === 0) process.stdout.write(`${done} `);
    if (!images.length || !p.p) return;
    const { title, tag, discontinued } = splitName(p.n);
    const brand = brandOf(p, title);
    const options = parseGroups(p, title);
    const specs = deriveSpecs(p, title, options);
    const { Lieferzeit, Marke, ...attrs } = p.attrs;
    products.push({
      id: p.id,
      sku: p.sku,
      title,
      tag,
      brand,
      series: ['belaege', 'hoelzer'].includes(p.c) ? seriesOf(title, brand) : null,
      cat: p.c,
      sub: p.sub,
      price: p.p,
      oldPrice: p.o,
      sale: p.s || !!p.o,
      inStock: p.st,
      discontinued,
      delivery: Lieferzeit || null,
      images,
      specs,
      options,
    });
    details[p.id] = {
      short: p.sh,
      paragraphs: (p.paras || []).map((t) => (t.length >= 515 && t.lastIndexOf('. ') > 200 ? t.slice(0, t.lastIndexOf('. ') + 1) : t)),
      headings: p.heads,
      bullets: p.bul,
      attrs: Object.fromEntries(Object.entries(attrs).filter(([, v]) => v && v !== 'Nein' && v !== 'Keine Angabe')),
    };
  });

  const order = new Map(raw.map((p, i) => [p.id, i]));
  products.sort((a, b) => order.get(a.id) - order.get(b.id));
  // Optionen (Varianten, Services, Zusatzartikel) separat – werden erst nach dem ersten Rendern nachgeladen
  const options = Object.fromEntries(products.filter((p) => p.options.length).map((p) => [p.id, p.options]));
  const core = products.map(({ options: o, ...rest }) => ({ ...rest, hasOptions: o.length > 0, hasRequired: o.some((g) => g.required), hasVariants: o.some((g) => g.kind === 'variant') }));
  await writeFile(join(ROOT, 'src', 'data', 'catalog.json'), JSON.stringify({ importedAt: new Date().toISOString(), source: 'https://www.tt-shop.de', products: core }));
  await writeFile(join(ROOT, 'src', 'data', 'options.json'), JSON.stringify(options));
  await writeFile(join(ROOT, 'src', 'data', 'details.json'), JSON.stringify(details));
  console.log(`\n✔ ${products.length} Produkte → src/data/catalog.json + details.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
