import { useEffect } from 'react';
import { create } from 'zustand';
import raw from '../data/catalog.json';
import type { TableColor, TableConfig, TableKind } from '../three/tableSpec';

/**
 * Katalog-Fassade. Prototyp: statischer Auszug aus tt-shop.de (343 Artikel).
 * Live: OpenMage-REST (src/api/openmage.ts) liefert dieselbe Struktur.
 */

export type CatId = 'belaege' | 'hoelzer' | 'schlaeger' | 'baelle' | 'tische' | 'roboter' | 'schuhe' | 'bekleidung' | 'zubehoer';

export type OptionKind = 'variant' | 'handle' | 'size' | 'rubber' | 'assembly' | 'sealing' | 'addon' | 'choice';
export interface OptionValue {
  label: string;
  delta: number;
  color?: string;
  thickness?: string;
}
export interface OptionGroup {
  name: string;
  kind: OptionKind;
  required: boolean;
  values: OptionValue[];
}

export interface Specs {
  rubberType?: string;
  hardness?: number;
  hardnessScale?: string;
  hardnessClass?: string;
  thicknesses?: string[];
  colors?: string[];
  colorful?: boolean;
  material?: string;
  plies?: number;
  weight?: number;
  thickness?: number;
  class?: string;
  handles?: string[];
  playerType?: string;
  stars?: number;
  pack?: number;
  ballMaterial?: string;
  seam?: string;
  usage?: string;
  topMm?: number;
  ittf?: boolean;
  net?: boolean;
  playback?: boolean;
  weightKg?: number;
  tableColors?: string;
  shoeWeight?: number;
  sizes?: string[];
  origin?: string;
}

export interface Product {
  id: string;
  sku: string | null;
  title: string;
  tag: string | null;
  brand: string;
  series: string | null;
  cat: CatId;
  sub: string;
  price: number;
  oldPrice: number | null;
  sale: boolean;
  inStock: boolean;
  discontinued: boolean;
  delivery: string | null;
  images: string[];
  specs: Specs;
  /** Wird nach dem ersten Rendern aus options.json nachgeladen (siehe loadOptions) */
  options: OptionGroup[];
  hasOptions: boolean;
  hasRequired: boolean;
  hasVariants: boolean;
  /** 3D-Konfiguration für Platten in Standardgröße */
  table: (TableConfig & { colors: TableColor[] }) | null;
  unitPrice: string | null;
  freight: boolean;
}

/* ---------------- Format ---------------- */
const eur = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});
export const formatPrice = (n: number) => eur.format(n);
export const discountPct = (p: Pick<Product, 'price' | 'oldPrice'>) => (p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);
export const fmtNum = (n: number, d = 1) => n.toLocaleString('de-DE', { maximumFractionDigits: d });

/* ---------------- Kategorien & Navigation ---------------- */
export interface SubCat {
  id: string;
  name: string;
}
export interface Category {
  id: CatId;
  name: string;
  singular: string;
  intro: string;
  subs: SubCat[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'belaege',
    name: 'Beläge',
    singular: 'Belag',
    intro: 'Noppen-innen-Beläge mit Tensor-, Hybrid- und klassischem Schwamm, Kurz-, Halblang- und Langnoppen sowie Anti. 15 % Rabatt ab zwei Belägen.',
    subs: [],
  },
  {
    id: 'hoelzer',
    name: 'Hölzer',
    singular: 'Holz',
    intro: 'Allholz-, Carbon-, ALC- und ZLC-Hölzer in allen Griffformen. 10 % Rabatt auf nicht reduzierte Hölzer, Montage ab 2,00 €.',
    subs: [
      { id: 'combi', name: 'Combi-Hölzer' },
      { id: 'penholder', name: 'Penholder' },
      { id: 'kinder', name: 'Kinderhölzer' },
    ],
  },
  {
    id: 'schlaeger',
    name: 'Schläger',
    singular: 'Schläger',
    intro: 'Vom Fachhändler montierte Profischläger, Fertigschläger, Sets und Kinderschläger.',
    subs: [
      { id: 'profi', name: 'Profischläger (montiert)' },
      { id: 'fertig', name: 'Fertigschläger' },
      { id: 'sets', name: 'Schläger-Sets' },
      { id: 'kinder', name: 'Kinderschläger' },
    ],
  },
  {
    id: 'baelle',
    name: 'Bälle',
    singular: 'Ball',
    intro: 'Wettkampf- und Trainingsbälle (Plastik 40+) in Klein- und Großpackungen.',
    subs: [
      { id: 'wettkampf', name: 'Wettkampfbälle' },
      { id: 'training', name: 'Trainingsbälle' },
    ],
  },
  {
    id: 'tische',
    name: 'Tische',
    singular: 'Tisch',
    intro: 'ITTF-Wettkampftische, Indoor- und Outdoor-Platten, Netze und Abdeckhüllen. Lieferung per Spedition.',
    subs: [
      { id: 'wettkampf', name: 'Wettkampftische (ITTF)' },
      { id: 'indoor', name: 'Indoor-Platten' },
      { id: 'outdoor', name: 'Outdoor-Platten' },
      { id: 'netze', name: 'Netze' },
      { id: 'huellen', name: 'Abdeckhüllen' },
    ],
  },
  {
    id: 'roboter',
    name: 'Roboter',
    singular: 'Roboter',
    intro: 'Ballroboter mit und ohne Ballrückführung, vom Tischroboter bis zur App-gesteuerten Ballmaschine.',
    subs: [],
  },
  {
    id: 'schuhe',
    name: 'Schuhe',
    singular: 'Schuh',
    intro: 'Hallenschuhe mit Grip für schnelle Beinarbeit, dazu Tischtennis-Socken.',
    subs: [
      { id: 'schuhe', name: 'Tischtennisschuhe' },
      { id: 'socken', name: 'Socken' },
    ],
  },
  {
    id: 'bekleidung',
    name: 'Bekleidung',
    singular: 'Artikel',
    intro: 'Trikots, Shorts, Röcke und Trainingsanzüge – auch als Vereinsausstattung mit Staffelpreisen.',
    subs: [
      { id: 'trikots', name: 'Trikots' },
      { id: 'shorts', name: 'Shorts & Röcke' },
      { id: 'anzuege', name: 'Trainingsanzüge' },
    ],
  },
  {
    id: 'zubehoer',
    name: 'Zubehör',
    singular: 'Artikel',
    intro: 'Kleber, Reiniger, Kantenband, Versiegelung, Hüllen, Taschen und Trainingshilfen.',
    subs: [
      { id: 'kleber', name: 'Kleber & Montage' },
      { id: 'reiniger', name: 'Reiniger' },
      { id: 'kantenbaender', name: 'Kantenbänder' },
      { id: 'versiegelung', name: 'Versiegelung' },
      { id: 'huellen', name: 'Schlägerhüllen' },
      { id: 'koffer', name: 'Schlägerkoffer' },
      { id: 'taschen', name: 'Sporttaschen' },
      { id: 'rucksaecke', name: 'Rucksäcke' },
      { id: 'handtuecher', name: 'Handtücher' },
      { id: 'training', name: 'Trainingshilfen' },
      { id: 'zaehlgeraete', name: 'Zählgeräte' },
      { id: 'umrandungen', name: 'Umrandungen' },
    ],
  },
];

export const getCategory = (id: string) => CATEGORIES.find((c) => c.id === id);
export const subName = (cat: string, sub: string) => getCategory(cat)?.subs.find((s) => s.id === sub)?.name;

/* ---------------- Produkte ---------------- */
type RawProduct = (typeof raw.products)[number];

function tableConfig(p: RawProduct): Product['table'] {
  if (p.cat !== 'tische' || !['wettkampf', 'indoor', 'outdoor'].includes(p.sub) || /beton|midi|mini|rund/i.test(p.title)) return null;
  const s = p.specs as Specs;
  const kind: TableKind = p.sub === 'wettkampf' || s.ittf ? 'competition' : p.sub === 'outdoor' || s.usage === 'Outdoor' ? 'outdoor' : 'indoor';
  const f = (s.tableColors || '').toLowerCase();
  const colors: TableColor[] = [];
  if (f.includes('blau')) colors.push('blau');
  if (f.includes('grün')) colors.push('gruen');
  if (f.includes('anthrazit') || f.includes('grau')) colors.push('anthrazit');
  if (f.includes('schwarz')) colors.push('schwarz');
  if (!colors.length) colors.push('blau');
  return {
    kind,
    thicknessMm: s.topMm ?? (kind === 'outdoor' ? 6 : 25),
    color: colors[0],
    colors,
  };
}

function unitPriceOf(title: string, price: number): string | null {
  const ml = title.match(/(\d+(?:[.,]\d+)?)\s?ml\b/i);
  if (ml) return `${formatPrice(price / (parseFloat(ml[1].replace(',', '.')) / 1000))} / 1 l`;
  return null;
}

export const products: Product[] = raw.products.map((p) => ({
  ...(p as unknown as Omit<Product, 'table' | 'unitPrice' | 'freight' | 'options'>),
  options: [],
  table: tableConfig(p),
  unitPrice: unitPriceOf(p.title, p.price),
  freight: p.cat === 'tische' && ['wettkampf', 'indoor', 'outdoor'].includes(p.sub) && !/midi|mini/i.test(p.title),
}));

const byId = new Map(products.map((p) => [p.id, p]));

/* ---------------- Optionen nachladen ---------------- */
export const useOptionsReady = create<{ ready: boolean }>(() => ({
  ready: false,
}));
let loading: Promise<void> | null = null;
/** Lädt Varianten/Services (≈ 480 KB) asynchron nach – hält das Start-Bundle klein */
export function loadOptions(): Promise<void> {
  if (!loading) {
    loading = import('../data/options.json').then((m) => {
      const map = m.default as unknown as Record<string, OptionGroup[]>;
      for (const p of products) p.options = map[p.id] ?? [];
      useOptionsReady.setState({ ready: true });
    });
  }
  return loading;
}
/** Hook: stößt das Nachladen an und rendert neu, sobald Optionen verfügbar sind */
export function useOptions(): boolean {
  const ready = useOptionsReady((s) => s.ready);
  useEffect(() => {
    void loadOptions();
  }, []);
  return ready;
}
export const getProduct = (id: string) => byId.get(id);
export const inCat = (cat: CatId, sub?: string) => products.filter((p) => p.cat === cat && (!sub || p.sub === sub));

/* ---------------- Marken ---------------- */
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/&/g, 'und')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export interface Brand {
  name: string;
  slug: string;
  count: number;
  cats: CatId[];
}
export const BRANDS: Brand[] = [...new Set(products.map((p) => p.brand))]
  .map((name) => {
    const items = products.filter((p) => p.brand === name);
    return {
      name,
      slug: slugify(name),
      count: items.length,
      cats: [...new Set(items.map((p) => p.cat))],
    };
  })
  .sort((a, b) => b.count - a.count);
export const getBrand = (slug: string) => BRANDS.find((b) => b.slug === slug);
export const topBrands = (cat: CatId, n = 8) => {
  const m = new Map<string, number>();
  inCat(cat).forEach((p) => m.set(p.brand, (m.get(p.brand) || 0) + 1));
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
};
export const topSeries = (cat: CatId, n = 8) => {
  const m = new Map<string, number>();
  inCat(cat).forEach((p) => p.series && m.set(`${p.brand}|${p.series}`, (m.get(`${p.brand}|${p.series}`) || 0) + 1));
  return [...m.entries()]
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, count]) => {
      const [brand, series] = k.split('|');
      return { brand, series, count };
    });
};

/* ---------------- Spezifikationen (Anzeige, Vergleich) ---------------- */
export const COLOR_HEX: Record<string, string> = {
  rot: '#d7141e',
  schwarz: '#151515',
  blau: '#1b5fc1',
  grün: '#1a9a4b',
  pink: '#ec4f9a',
  lila: '#7b3fbf',
  türkis: '#16a6b0',
  gelb: '#f2c200',
  orange: '#f07d14',
  weiß: '#ffffff',
  grau: '#8a8f96',
};

export const HARDNESS_CLASSES = ['Soft', 'Medium-', 'Medium', 'Medium+', 'Hard'] as const;
export const RUBBER_TYPES = ['Tensor', 'Hybrid', 'Klebrig', 'Klassisch', 'Kurze Noppen', 'Halblange Noppen', 'Lange Noppen', 'Anti', 'Glanti'] as const;
export const RUBBER_TYPE_INFO: Record<string, string> = {
  Tensor: 'Vorgespannter Schwamm mit eingebautem Katapult – Tempo und Spin für modernes Topspinspiel.',
  Hybrid: 'Griffiges, leicht klebriges Obergummi auf Tensor-Schwamm – viel Rotation und Kontrolle am Tisch.',
  Klebrig: 'Klebriges Obergummi nach chinesischem Vorbild – maximale Rotation, braucht eigene Beschleunigung.',
  Klassisch: 'Klassischer Noppen-innen-Belag ohne Tensoreffekt – viel Kontrolle und Ballgefühl.',
  'Kurze Noppen': 'Noppen außen, kurz – direktes, schnelles Blockspiel, wenig spinanfällig.',
  'Halblange Noppen': 'Zwischen Kurz- und Langnoppe – störend, mit mehr Eigenkontrolle als Langnoppen.',
  'Lange Noppen': 'Lange Noppen außen – Rotationsumkehr für Abwehr- und Störspiel.',
  Anti: 'Glattes, rotationsunempfindliches Obergummi – neutralisiert gegnerischen Spin.',
  Glanti: 'Besonders glattes Anti mit minimaler Reibung – maximale Rotationsumkehr für Block- und Störspiel.',
};

export function thicknessRange(t?: string[]) {
  if (!t?.length) return null;
  return t.length === 1 ? t[0] : `${t[0]} – ${t[t.length - 1]}`;
}

export interface SpecRow {
  label: string;
  value: (p: Product) => string | null;
  hint?: string;
}

const yes = (b?: boolean) => (b === undefined ? null : b ? 'Ja' : 'Nein');

export const SPEC_ROWS: Record<CatId, SpecRow[]> = {
  belaege: [
    { label: 'Belagart', value: (p) => p.specs.rubberType ?? null },
    {
      label: 'Schwammhärte',
      value: (p) => (p.specs.hardness ? `${fmtNum(p.specs.hardness)}°${p.specs.hardnessScale ? ' ' + p.specs.hardnessScale : ''}` : null),
      hint: 'Herstellerangabe; Skalen unterscheiden sich je nach Hersteller (EUR/CHN/JPN).',
    },
    { label: 'Härteklasse', value: (p) => p.specs.hardnessClass ?? null },
    {
      label: 'Schwammstärken',
      value: (p) => p.specs.thicknesses?.map((t) => (t === 'max' || t === 'OX' ? t : `${t} mm`)).join(', ') ?? null,
    },
    { label: 'Farben', value: (p) => p.specs.colors?.join(', ') ?? null },
    {
      label: 'Serie',
      value: (p) => (p.series ? `${p.brand} ${p.series}` : null),
    },
    { label: 'Spielertyp', value: (p) => p.specs.playerType ?? null },
    { label: 'Herstellungsland', value: (p) => p.specs.origin ?? null },
  ],
  hoelzer: [
    { label: 'Material', value: (p) => p.specs.material ?? null },
    {
      label: 'Furniere',
      value: (p) => (p.specs.plies ? `${p.specs.plies}-lagig` : null),
    },
    {
      label: 'Gewicht',
      value: (p) => (p.specs.weight ? `ca. ${p.specs.weight} g` : null),
    },
    {
      label: 'Blattdicke',
      value: (p) => (p.specs.thickness ? `${fmtNum(p.specs.thickness)} mm` : null),
    },
    { label: 'Klasse', value: (p) => p.specs.class ?? null },
    { label: 'Griffformen', value: (p) => p.specs.handles?.join(', ') ?? null },
    { label: 'Spielertyp', value: (p) => p.specs.playerType ?? null },
    {
      label: 'Serie',
      value: (p) => (p.series ? `${p.brand} ${p.series}` : null),
    },
  ],
  schlaeger: [
    { label: 'Art', value: (p) => subName('schlaeger', p.sub) ?? null },
    {
      label: 'Holz',
      value: (p) => p.options.find((o) => o.kind === 'handle')?.values[0]?.label.replace(/,\s*(konkav|gerade|anatomisch).*$/, '') ?? null,
    },
    {
      label: 'Belagstärken',
      value: (p) => [...new Set(p.options.filter((o) => o.kind === 'rubber').flatMap((o) => o.values.map((v) => v.thickness).filter(Boolean)))].join(', ') || null,
    },
    { label: 'Spielertyp', value: (p) => p.specs.playerType ?? null },
    {
      label: 'Montage',
      value: (p) => (p.options.some((o) => o.kind === 'assembly') ? 'inkl. Kantenband' : null),
    },
  ],
  baelle: [
    { label: 'Einsatz', value: (p) => subName('baelle', p.sub) ?? null },
    {
      label: 'Qualität',
      value: (p) => (p.specs.stars ? '★'.repeat(p.specs.stars) : null),
    },
    { label: 'Material', value: (p) => p.specs.ballMaterial ?? null },
    { label: 'Naht', value: (p) => p.specs.seam ?? null },
    {
      label: 'Packung',
      value: (p) => (p.specs.pack ? `${p.specs.pack} Stück` : null),
    },
    {
      label: 'Preis pro Ball',
      value: (p) => (p.specs.pack ? formatPrice(p.price / p.specs.pack) : null),
    },
  ],
  tische: [
    {
      label: 'Einsatz',
      value: (p) => p.specs.usage ?? subName('tische', p.sub) ?? null,
    },
    {
      label: 'Plattenstärke',
      value: (p) => (p.specs.topMm ? `${fmtNum(p.specs.topMm)} mm` : null),
    },
    { label: 'ITTF-Zulassung', value: (p) => yes(p.specs.ittf) },
    { label: 'Netz inklusive', value: (p) => yes(p.specs.net) },
    { label: 'Playback', value: (p) => yes(p.specs.playback) },
    {
      label: 'Gewicht',
      value: (p) => (p.specs.weightKg ? `${fmtNum(p.specs.weightKg)} kg` : null),
    },
    { label: 'Farbe', value: (p) => p.specs.tableColors || null },
  ],
  roboter: [],
  schuhe: [
    {
      label: 'Gewicht (Gr. 42)',
      value: (p) => (p.specs.shoeWeight ? `${p.specs.shoeWeight} g` : null),
    },
    {
      label: 'Größen',
      value: (p) => (p.specs.sizes?.length ? `${p.specs.sizes[0]} – ${p.specs.sizes[p.specs.sizes.length - 1]}` : null),
    },
  ],
  bekleidung: [{ label: 'Größen', value: (p) => p.specs.sizes?.join(', ') ?? null }],
  zubehoer: [{ label: 'Art', value: (p) => subName('zubehoer', p.sub) ?? null }],
};

/** Kurzzeile für Produktkarten, z. B. „Tensor · 47,5° · 1,8 – max“ */
export function specLine(p: Product): string[] {
  const s = p.specs;
  switch (p.cat) {
    case 'belaege':
      return [s.rubberType, s.hardness ? `${fmtNum(s.hardness)}°` : s.hardnessClass, thicknessRange(s.thicknesses)].filter(Boolean) as string[];
    case 'hoelzer':
      return [s.material, s.plies ? `${s.plies}-lagig` : null, s.weight ? `${s.weight} g` : null, s.class].filter(Boolean) as string[];
    case 'tische':
      return [s.usage, s.topMm ? `${fmtNum(s.topMm)} mm` : null, s.ittf ? 'ITTF' : null].filter(Boolean) as string[];
    case 'baelle':
      return [s.stars ? '★'.repeat(s.stars) : null, s.pack ? `${s.pack} Stk.` : null, s.ballMaterial].filter(Boolean) as string[];
    case 'schlaeger':
      return [subName('schlaeger', p.sub), s.playerType].filter(Boolean) as string[];
    case 'schuhe':
      return [s.shoeWeight ? `${s.shoeWeight} g` : null, s.sizes?.length ? `Gr. ${s.sizes[0]}–${s.sizes[s.sizes.length - 1]}` : null].filter(Boolean) as string[];
    default:
      return [subName(p.cat, p.sub)].filter(Boolean) as string[];
  }
}

/* ---------------- Suche ---------------- */
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^\w\s.,°-]/g, ' ');

const SYNONYMS: Record<string, string[]> = {
  platte: ['tische'],
  tisch: ['tische'],
  belag: ['belaege'],
  holz: ['hoelzer'],
  ball: ['baelle'],
  schuh: ['schuhe'],
  noppe: ['noppen'],
  langnoppe: ['lange noppen'],
  kurznoppe: ['kurze noppen'],
};

const index = products.map((p) => {
  const hay = norm(
    [
      p.title,
      p.tag,
      p.brand,
      p.series,
      getCategory(p.cat)?.name,
      p.cat,
      subName(p.cat, p.sub),
      p.specs.rubberType,
      p.specs.material,
      p.specs.class,
      p.specs.usage,
      p.sku,
      p.specs.hardness ? `${p.specs.hardness}°` : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
  // ohne Leer-/Bindestriche, damit „malin“ auch „Ma Lin“ findet
  return { p, hay, compact: hay.replace(/[\s-]+/g, '') };
});

export function search(q: string, limit = 60): Product[] {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const scored: { p: Product; s: number }[] = [];
  for (const entry of index) {
    const { p, hay } = entry;
    let s = 0;
    let all = true;
    for (const t of terms) {
      const variants = [t, ...(SYNONYMS[t] ?? []), t.replace(/(en|e|n|s)$/, '')];
      const hit = variants.find((v) => v.length > 1 && hay.includes(v)) ?? (t.length > 3 && entry.compact.includes(t) ? t : undefined);
      if (!hit) {
        all = false;
        break;
      }
      // Treffer am Wortanfang (z. B. „Anti“) vor Wortteilen („Avanti“)
      s += hay.startsWith(hit) ? 3 : hay.includes(` ${hit}`) ? 2 : 1;
    }
    if (all) scored.push({ p, s: s + (norm(p.title).includes(norm(q)) ? 5 : 0) });
  }
  return scored
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.p);
}

/* ---------------- Tippfehler-Toleranz: „Meintest du …?“ ---------------- */
let vocab: string[] | null = null;
function lev(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}
/** Schlägt eine korrigierte Suchanfrage vor, wenn die Suche nichts findet (z. B. „tenegy“ → „tenergy“). */
export function suggestQuery(q: string): string | null {
  vocab ??= [...new Set(index.flatMap(({ hay }) => hay.split(/[^a-z0-9äöüß+]+/)).filter((w) => w.length >= 3))];
  const terms = norm(q).split(/\s+/).filter(Boolean);
  let changed = false;
  const fixed = terms.map((t) => {
    if (t.length < 4 || vocab!.includes(t)) return t;
    const max = t.length > 7 ? 2 : 1;
    let best: string | null = null;
    let bestD = max + 1;
    for (const w of vocab!) {
      const d = lev(t, w, max);
      if (d < bestD) {
        bestD = d;
        best = w;
      }
    }
    if (best) {
      changed = true;
      return best;
    }
    return t;
  });
  if (!changed) return null;
  const next = fixed.join(' ');
  return search(next, 1).length ? next : null;
}

/* ---------------- Empfehlungen ---------------- */
export const pickProducts = (ids: string[]) => ids.map((id) => byId.get(id)).filter(Boolean) as Product[];

export function related(p: Product, n = 10): Product[] {
  return products
    .filter((x) => x.id !== p.id && x.cat === p.cat && x.sub === p.sub)
    .sort((a, b) => Number(b.series === p.series && b.brand === p.brand) - Number(a.series === p.series && a.brand === p.brand) || Math.abs(a.price - p.price) - Math.abs(b.price - p.price))
    .slice(0, n);
}

export function sameSeries(p: Product): Product[] {
  if (!p.series) return [];
  return products.filter((x) => x.cat === p.cat && x.brand === p.brand && x.series === p.series).sort((a, b) => (a.specs.hardness ?? 999) - (b.specs.hardness ?? 999));
}

const SUB_PICKS: Record<string, string[]> = {
  belaege: ['kleber', 'kantenbaender', 'reiniger'],
  hoelzer: ['versiegelung', 'kantenbaender', 'huellen'],
  schlaeger: ['huellen', 'reiniger', 'koffer'],
  tische: ['training', 'umrandungen', 'zaehlgeraete'],
  baelle: ['training'],
  roboter: ['training'],
  schuhe: ['taschen', 'handtuecher'],
  bekleidung: ['handtuecher', 'taschen', 'rucksaecke'],
  zubehoer: ['reiniger', 'huellen'],
};

export function crossSell(p: Product, n = 8): Product[] {
  const subs = SUB_PICKS[p.cat] ?? [];
  const out: Product[] = [];
  for (const s of subs) out.push(...products.filter((x) => x.cat === 'zubehoer' && x.sub === s).slice(0, 3));
  if (p.cat === 'tische' || p.cat === 'roboter') out.push(...inCat('baelle', 'training').slice(0, 3));
  if (p.cat === 'hoelzer')
    out.unshift(
      ...inCat('belaege')
        .filter((x) => x.specs.rubberType === 'Tensor')
        .slice(0, 3),
    );
  if (p.cat === 'belaege') out.unshift(...inCat('hoelzer').slice(0, 2));
  return [...new Map(out.filter((x) => x.id !== p.id).map((x) => [x.id, x])).values()].slice(0, n);
}

export const featured = {
  rubbers: () =>
    inCat('belaege')
      .filter((p) => p.specs.rubberType === 'Tensor' || p.specs.rubberType === 'Hybrid')
      .slice(0, 12),
  blades: () => inCat('hoelzer').slice(0, 12),
  rackets: () => inCat('schlaeger', 'profi').slice(0, 10),
  sale: () => products.filter((p) => p.sale).slice(0, 12),
  tables: () => products.filter((p) => p.table).slice(0, 10),
};

export const SHOP = {
  freeShippingFrom: 69,
  shippingFee: 5.9,
  phone: '03504 6079933',
  phoneHref: 'tel:+4935046079933',
  email: 'info@tt-shop.de',
  hours: 'Mo–Fr 08–15 Uhr',
  rating: { value: 4.84, count: '4.100', label: 'Hervorragend' },
  address: ['Tikotec UG (haftungsbeschränkt)', 'Niedertorstraße 12', '01744 Dippoldiswalde'],
} as const;

/** Spieler-Schläger aus dem Sortiment ("Profischläger <Name>") */
export const PRO_RACKETS = products.filter((p) => /^Profischläger /.test(p.title));
