import { CATEGORIES, HARDNESS_CLASSES, RUBBER_TYPES, subName, type CatId, type Product } from './catalog';
import { SUIT_INFO, suitability } from './advice';

/**
 * Facettensuche wie bei großen Fachhändlern: Mehrfachauswahl (ODER innerhalb einer Facette,
 * UND zwischen Facetten), Bereichsfilter, Ja/Nein-Filter. Trefferzahlen werden „disjunktiv“
 * berechnet – jede Facette zählt so, als wäre sie selbst nicht aktiv.
 */

type Val = string | string[] | number | boolean | null | undefined;

export interface Facet {
  id: string;
  label: string;
  type: 'multi' | 'range' | 'bool';
  get: (p: Product) => Val;
  order?: readonly string[];
  unit?: string;
  step?: number;
  info?: string;
  swatch?: boolean;
  open?: boolean;
  format?: (v: string) => string;
}

const THICK_ORDER = ['OX', '0,5', '0,6', '0,8', '0,9', '1,0', '1,2', '1,3', '1,4', '1,5', '1,6', '1,7', '1,8', '1,9', '2,0', '2,1', '2,2', '2,3', 'max'];
const sizeSort = (a: string, b: string) => {
  const order = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '116', '128', '140', '152', '164', '176'];
  const ia = order.indexOf(a.toUpperCase());
  const ib = order.indexOf(b.toUpperCase());
  if (ia >= 0 && ib >= 0) return ia - ib;
  const na = parseFloat(a.replace(',', '.'));
  const nb = parseFloat(b.replace(',', '.'));
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  return a.localeCompare(b, 'de');
};

const level: Facet = {
  id: 'niveau',
  label: 'Spielniveau',
  type: 'multi',
  get: (p) => suitability(p)?.level,
  order: ['Einsteiger', 'Fortgeschrittene', 'Leistungsspieler', 'Spezialisten'],
  open: true,
  info: SUIT_INFO,
};
const suit: Facet = {
  id: 'eignung',
  label: 'Eignung',
  type: 'multi',
  get: (p) => suitability(p)?.code,
  order: ['AR', 'AR+', 'AR+ / OF-', 'AR / OF-', 'OF-', 'OF', 'OF+', 'OF / Block', 'Stör / Block', 'DEF', 'DEF / Stör'],
  info: SUIT_INFO,
};

const brand: Facet = { id: 'marke', label: 'Marke', type: 'multi', get: (p) => p.brand, open: true };
const price: Facet = { id: 'preis', label: 'Preis', type: 'range', get: (p) => p.price, unit: '€', step: 1, open: true };
const sale: Facet = { id: 'sale', label: 'Nur reduzierte Artikel', type: 'bool', get: (p) => p.sale };
const stock: Facet = { id: 'lager', label: 'Sofort lieferbar', type: 'bool', get: (p) => p.inStock };
const subFacet = (cat: CatId, label = 'Art'): Facet => ({ id: 'art', label, type: 'multi', get: (p) => subName(cat, p.sub) ?? null, open: true });

export const FACETS: Record<CatId | 'mixed', Facet[]> = {
  belaege: [
    {
      id: 'typ',
      label: 'Belagart',
      type: 'multi',
      get: (p) => p.specs.rubberType,
      order: RUBBER_TYPES,
      open: true,
      info: 'Tensor = Katapult, Hybrid = griffig + Tensor, Noppen außen für Stör- und Abwehrspiel.',
    },
    {
      id: 'haerte',
      label: 'Härteklasse',
      type: 'multi',
      get: (p) => p.specs.hardnessClass,
      order: HARDNESS_CLASSES,
      open: true,
      info: 'Soft ≤ 40° · Medium- 41–44° · Medium 45–47,5° · Medium+ 48–50° · Hard > 50° (Herstellerangaben, EUR-Skala)',
    },
    { id: 'grad', label: 'Schwammhärte in °', type: 'range', get: (p) => p.specs.hardness, unit: '°', step: 0.5, open: true },
    { id: 'staerke', label: 'Schwammstärke', type: 'multi', get: (p) => p.specs.thicknesses, order: THICK_ORDER, open: true, format: (v) => (v === 'max' || v === 'OX' ? v : `${v} mm`) },
    { id: 'farbe', label: 'Farbe', type: 'multi', get: (p) => p.specs.colors, swatch: true, order: ['rot', 'schwarz', 'blau', 'grün', 'pink', 'lila'], open: true },
    level,
    suit,
    brand,
    { id: 'serie', label: 'Serie', type: 'multi', get: (p) => (p.series ? `${p.brand} ${p.series}` : null) },
    { id: 'spieler', label: 'Spielertyp', type: 'multi', get: (p) => p.specs.playerType },
    price,
    sale,
    stock,
  ],
  hoelzer: [
    { id: 'material', label: 'Material', type: 'multi', get: (p) => p.specs.material, order: ['Allholz', 'Carbon', 'ALC', 'ZLC', 'Balsa'], open: true },
    { id: 'griff', label: 'Griffform', type: 'multi', get: (p) => p.specs.handles, order: ['konkav', 'gerade', 'anatomisch', 'penholder', 'Rechtshänder', 'Linkshänder'], open: true },
    { id: 'furniere', label: 'Furniere', type: 'multi', get: (p) => (p.specs.plies ? `${p.specs.plies}-lagig` : null) },
    { id: 'klasse', label: 'Klasse', type: 'multi', get: (p) => p.specs.class, order: ['OFF+', 'OFF', 'OFF-', 'ALL+', 'ALL', 'DEF'] },
    { id: 'gewicht', label: 'Gewicht in g', type: 'range', get: (p) => p.specs.weight, unit: 'g', step: 1 },
    { id: 'bauform', label: 'Bauform', type: 'multi', get: (p) => subName('hoelzer', p.sub) ?? 'Shakehand', open: true },
    level,
    suit,
    brand,
    { id: 'serie', label: 'Serie', type: 'multi', get: (p) => (p.series ? `${p.brand} ${p.series}` : null) },
    price,
    sale,
    stock,
  ],
  schlaeger: [subFacet('schlaeger'), { id: 'spieler', label: 'Spielertyp', type: 'multi', get: (p) => p.specs.playerType, open: true }, brand, price, sale, stock],
  baelle: [
    subFacet('baelle', 'Einsatz'),
    { id: 'sterne', label: 'Qualität', type: 'multi', get: (p) => (p.specs.stars ? '★'.repeat(p.specs.stars) : null), order: ['★★★', '★★', '★'], open: true },
    {
      id: 'packung',
      label: 'Packungsgröße',
      type: 'multi',
      get: (p) => (!p.specs.pack ? null : p.specs.pack <= 6 ? 'bis 6 Stück' : p.specs.pack <= 48 ? '7–48 Stück' : 'ab 49 Stück'),
      order: ['bis 6 Stück', '7–48 Stück', 'ab 49 Stück'],
      open: true,
    },
    { id: 'material', label: 'Material', type: 'multi', get: (p) => p.specs.ballMaterial },
    { id: 'naht', label: 'Naht', type: 'multi', get: (p) => p.specs.seam },
    brand,
    price,
    sale,
  ],
  tische: [
    subFacet('tische'),
    { id: 'einsatz', label: 'Einsatzort', type: 'multi', get: (p) => p.specs.usage, open: true },
    { id: 'platte', label: 'Plattenstärke in mm', type: 'range', get: (p) => p.specs.topMm, unit: 'mm', step: 1, open: true },
    { id: 'ittf', label: 'ITTF-zugelassen', type: 'bool', get: (p) => p.specs.ittf },
    { id: 'netz', label: 'Netz inklusive', type: 'bool', get: (p) => p.specs.net },
    { id: 'playback', label: 'Playback-Stellung', type: 'bool', get: (p) => p.specs.playback },
    brand,
    price,
    sale,
  ],
  roboter: [brand, price, sale, stock],
  schuhe: [subFacet('schuhe'), { id: 'groesse', label: 'Größe', type: 'multi', get: (p) => p.specs.sizes, open: true }, brand, price, sale],
  bekleidung: [subFacet('bekleidung'), { id: 'groesse', label: 'Größe', type: 'multi', get: (p) => p.specs.sizes, open: true }, brand, price, sale],
  zubehoer: [subFacet('zubehoer'), brand, price, sale, stock],
  mixed: [{ id: 'kategorie', label: 'Kategorie', type: 'multi', get: (p) => CATEGORIES.find((c) => c.id === p.cat)?.name, open: true }, brand, price, sale, stock],
};

export type FilterState = Record<string, string[] | [number | null, number | null] | boolean>;

export function readState(sp: URLSearchParams, facets: Facet[]): FilterState {
  const st: FilterState = {};
  for (const f of facets) {
    const v = sp.get(f.id);
    if (!v) continue;
    if (f.type === 'multi') st[f.id] = v.split('~').filter(Boolean);
    else if (f.type === 'bool') st[f.id] = v === '1';
    else {
      const [a, b] = v.split('_');
      st[f.id] = [a ? +a : null, b ? +b : null];
    }
  }
  return st;
}

export function writeState(st: FilterState, facets: Facet[], keep: URLSearchParams): URLSearchParams {
  const sp = new URLSearchParams();
  for (const k of ['q', 'sort', 'ansicht']) if (keep.get(k)) sp.set(k, keep.get(k)!);
  for (const f of facets) {
    const v = st[f.id];
    if (v === undefined) continue;
    if (f.type === 'multi' && Array.isArray(v) && v.length) sp.set(f.id, (v as string[]).join('~'));
    if (f.type === 'bool' && v === true) sp.set(f.id, '1');
    if (f.type === 'range' && Array.isArray(v) && (v[0] !== null || v[1] !== null)) sp.set(f.id, `${v[0] ?? ''}_${v[1] ?? ''}`);
  }
  return sp;
}

const asArr = (v: Val): string[] => (Array.isArray(v) ? v : v === null || v === undefined || v === '' ? [] : [String(v)]);

function matches(p: Product, f: Facet, v: FilterState[string]): boolean {
  const pv = f.get(p);
  if (f.type === 'multi') {
    const sel = v as string[];
    return !sel.length || asArr(pv).some((x) => sel.includes(x));
  }
  if (f.type === 'bool') return v !== true || pv === true;
  const [lo, hi] = v as [number | null, number | null];
  if (lo === null && hi === null) return true;
  if (typeof pv !== 'number') return false;
  return (lo === null || pv >= lo) && (hi === null || pv <= hi);
}

export function applyFilters(items: Product[], st: FilterState, facets: Facet[], except?: string): Product[] {
  const active = facets.filter((f) => f.id !== except && st[f.id] !== undefined);
  if (!active.length) return items;
  return items.filter((p) => active.every((f) => matches(p, f, st[f.id])));
}

export function facetValues(items: Product[], f: Facet): { value: string; count: number }[] {
  const m = new Map<string, number>();
  for (const p of items) for (const v of asArr(f.get(p))) m.set(v, (m.get(v) || 0) + 1);
  const arr = [...m.entries()].map(([value, count]) => ({ value, count }));
  if (f.order) {
    const o = f.order;
    return arr.sort((a, b) => (o.indexOf(a.value) < 0 ? 99 : o.indexOf(a.value)) - (o.indexOf(b.value) < 0 ? 99 : o.indexOf(b.value)));
  }
  if (f.id === 'groesse') return arr.sort((a, b) => sizeSort(a.value, b.value));
  return arr.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'de'));
}

export function rangeBounds(items: Product[], f: Facet): [number, number] | null {
  const vals = items.map((p) => f.get(p)).filter((v): v is number => typeof v === 'number');
  if (vals.length < 2) return null;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return min === max ? null : [Math.floor(min), Math.ceil(max)];
}

export function activeCount(st: FilterState): number {
  return Object.values(st).reduce<number>((n, v) => n + (Array.isArray(v) ? (typeof v[0] === 'string' ? v.length : v[0] !== null || v[1] !== null ? 1 : 0) : v ? 1 : 0), 0);
}

export type SortKey = 'relevanz' | 'preis-auf' | 'preis-ab' | 'name' | 'rabatt' | 'haerte-auf' | 'haerte-ab' | 'gewicht-auf';
export const SORTS: { id: SortKey; label: string; cats?: CatId[] }[] = [
  { id: 'relevanz', label: 'Empfehlung' },
  { id: 'preis-auf', label: 'Preis aufsteigend' },
  { id: 'preis-ab', label: 'Preis absteigend' },
  { id: 'rabatt', label: 'Höchster Rabatt' },
  { id: 'name', label: 'Name A–Z' },
  { id: 'haerte-auf', label: 'Härte aufsteigend', cats: ['belaege'] },
  { id: 'haerte-ab', label: 'Härte absteigend', cats: ['belaege'] },
  { id: 'gewicht-auf', label: 'Gewicht aufsteigend', cats: ['hoelzer'] },
];

export function sortItems(items: Product[], key: SortKey): Product[] {
  const nz = (v?: number) => v ?? Infinity;
  const fns: Partial<Record<SortKey, (a: Product, b: Product) => number>> = {
    'preis-auf': (a, b) => a.price - b.price,
    'preis-ab': (a, b) => b.price - a.price,
    name: (a, b) => a.title.localeCompare(b.title, 'de'),
    rabatt: (a, b) => (b.oldPrice ? 1 - b.price / b.oldPrice : 0) - (a.oldPrice ? 1 - a.price / a.oldPrice : 0) || Number(b.sale) - Number(a.sale),
    'haerte-auf': (a, b) => nz(a.specs.hardness) - nz(b.specs.hardness),
    'haerte-ab': (a, b) => (b.specs.hardness ?? -1) - (a.specs.hardness ?? -1),
    'gewicht-auf': (a, b) => nz(a.specs.weight) - nz(b.specs.weight),
  };
  const fn = fns[key];
  return fn ? [...items].sort(fn) : items;
}
