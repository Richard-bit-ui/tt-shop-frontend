import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, BookOpen, ChevronDown, LayoutGrid, List, Phone, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { fmtNum, formatPrice, getBrand, getCategory, inCat, products, RUBBER_TYPE_INFO, search, SHOP, subName, suggestQuery, thicknessRange, type CatId, type Product } from '../lib/catalog';
import { activeCount, applyFilters, FACETS, facetValues, rangeBounds, readState, SORTS, sortItems, writeState, type Facet, type FilterState, type SortKey } from '../lib/facets';
import { CompareToggle, ProductCard, StockLine } from '../components/ProductCard';
import { Breadcrumbs, ColorDot, cx, HardnessGauge, Img, InfoHint, Price, Sheet } from '../components/ui';
import { breadcrumbLd, useJsonLd, usePageMeta } from '../lib/seo';
import { BRAND_LOGOS } from '../lib/brandLogos';

/* ---------------- Listing auflösen ---------------- */
interface Listing {
  key: string;
  title: string;
  intro?: string;
  items: Product[];
  cat: CatId | null;
  sub?: string;
  crumbs: { to?: string; label: string }[];
}

const POPULAR = ['Tenergy', 'Dignics', 'Dynaryz', 'Vega', 'Rasanter', 'Viscaria', 'Outdoor', 'Robopro', 'Kleber', 'Hülle'];
function NoHits({ q }: { q: string }) {
  const fix = q ? suggestQuery(q) : null;
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="panel px-6 py-10">
        <div className="text-[17px] font-semibold">Keine Treffer für „{q}“</div>
        {fix && (
          <p className="mt-2 text-[15px]">
            Meintest du{' '}
            <Link to={`/suche?q=${encodeURIComponent(fix)}`} className="link font-semibold">
              {fix}
            </Link>
            ?
          </p>
        )}
        <ul className="mt-3 list-disc space-y-1 pl-5 text-[14px] text-ink-2">
          <li>Prüfe die Schreibweise oder nutze einen allgemeineren Begriff (z. B. „Tensor“ statt Modellname).</li>
          <li>Suche nach Marke, Serie oder Artikelnummer.</li>
          <li>Nicht alles ist online gelistet – frag uns: wir besorgen viele Artikel auf Anfrage.</li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href={SHOP.phoneHref} className="btn btn-dark btn-sm">
            <Phone size={14} /> {SHOP.phone}
          </a>
          <Link to="/berater" className="btn btn-outline btn-sm">
            <Sparkles size={14} /> Material-Berater
          </Link>
        </div>
      </div>
      <div>
        <div className="overline">Suchvorschläge</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {POPULAR.filter((t) => search(t, 1).length).map((t) => (
            <Link key={t} to={`/suche?q=${encodeURIComponent(t)}`} className="chip">
              {t}
            </Link>
          ))}
        </div>
        <div className="overline mt-6">Kategorien</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['belaege', 'hoelzer', 'schlaeger', 'tische', 'baelle', 'zubehoer'] as CatId[]).map((c) => (
            <Link key={c} to={`/c/${c}`} className="chip">
              {getCategory(c)?.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function useListing(mode?: 'search' | 'brand'): Listing | null {
  const { cat = '', sub, slug = '' } = useParams();
  const [sp] = useSearchParams();
  const qs = sp.get('q') || '';
  return useMemo(() => {
    if (mode === 'search') {
      return {
        key: `q:${qs}`,
        title: qs ? `Suchergebnisse für „${qs}“` : 'Suche',
        items: search(qs, 400),
        cat: null,
        crumbs: [{ to: '/', label: 'Startseite' }, { label: 'Suche' }],
      };
    }
    if (mode === 'brand') {
      const b = getBrand(slug);
      if (!b) return null;
      return {
        key: `b:${slug}`,
        title: b.name,
        intro: `${b.count} Artikel von ${b.name} – ${b.cats.map((c) => getCategory(c)?.name).join(', ')}.`,
        items: products.filter((p) => p.brand === b.name),
        cat: null,
        crumbs: [{ to: '/', label: 'Startseite' }, { to: '/marken', label: 'Marken' }, { label: b.name }],
      };
    }
    if (cat === 'sale') {
      return {
        key: 'sale',
        title: 'Sale & Angebote',
        intro: 'Reduzierte Artikel aus dem gesamten Sortiment – solange der Vorrat reicht.',
        items: products.filter((p) => p.sale),
        cat: null,
        crumbs: [{ to: '/', label: 'Startseite' }, { label: 'Sale' }],
      };
    }
    const c = getCategory(cat);
    if (!c) return null;
    if (sub) {
      const name = subName(c.id, sub);
      if (!name) return null;
      return {
        key: `${c.id}/${sub}`,
        title: name,
        intro: c.intro,
        items: inCat(c.id, sub),
        cat: c.id,
        sub,
        crumbs: [{ to: '/', label: 'Startseite' }, { to: `/c/${c.id}`, label: c.name }, { label: name }],
      };
    }
    return {
      key: c.id,
      title: c.name,
      intro: c.intro,
      items: inCat(c.id),
      cat: c.id,
      crumbs: [{ to: '/', label: 'Startseite' }, { label: c.name }],
    };
  }, [mode, cat, sub, slug, qs]);
}

/* ---------------- Filterbausteine ---------------- */
function RangeFacet({ f, items, value, onChange }: { f: Facet; items: Product[]; value?: [number | null, number | null]; onChange: (v: [number | null, number | null] | undefined) => void }) {
  const b = rangeBounds(items, f);
  const [lo, setLo] = useState<number | null>(value?.[0] ?? null);
  const [hi, setHi] = useState<number | null>(value?.[1] ?? null);
  useEffect(() => {
    setLo(value?.[0] ?? null);
    setHi(value?.[1] ?? null);
  }, [value]);
  if (!b) return <div className="text-[13px] text-muted">Keine Angaben vorhanden.</div>;
  const [min, max] = b;
  const step = f.step ?? 1;
  const commit = (a: number | null, z: number | null) => {
    const na = a === null || a <= min ? null : a;
    const nz = z === null || z >= max ? null : z;
    onChange(na === null && nz === null ? undefined : [na, nz]);
  };
  const a = lo ?? min;
  const z = hi ?? max;
  return (
    <div>
      <div className="relative h-5">
        <input
          aria-label={`${f.label} von`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={a}
          onChange={(e) => setLo(Math.min(+e.target.value, z))}
          onPointerUp={() => commit(lo, hi)}
          onKeyUp={() => commit(lo, hi)}
          className="range-input pointer-events-none absolute inset-x-0 top-1.5 bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto"
        />
        <input
          aria-label={`${f.label} bis`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={z}
          onChange={(e) => setHi(Math.max(+e.target.value, a))}
          onPointerUp={() => commit(lo, hi)}
          onKeyUp={() => commit(lo, hi)}
          className="range-input pointer-events-none absolute inset-x-0 top-1.5 bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto"
        />
        <div className="pointer-events-none absolute inset-x-0 top-[9px] -z-0 h-1.5 rounded-full bg-line" />
        <div
          className="pointer-events-none absolute top-[9px] h-1.5 rounded-full bg-ink"
          style={{
            left: `${((a - min) / (max - min)) * 100}%`,
            right: `${100 - ((z - min) / (max - min)) * 100}%`,
          }}
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        {[
          [a, (v: number) => commit(v, hi)],
          [z, (v: number) => commit(lo, v)],
        ].map(([v, set], i) => (
          <label key={i} className="flex h-10 flex-1 items-center rounded-[10px] bg-white px-3 text-[13.5px] ring-1 ring-line-2 focus-within:ring-2 focus-within:ring-info/40">
            <input
              type="number"
              inputMode="decimal"
              step={step}
              value={v as number}
              onChange={(e) => (i === 0 ? setLo(+e.target.value) : setHi(+e.target.value))}
              onBlur={(e) => (set as (n: number) => void)(+e.target.value)}
              className="num w-full bg-transparent outline-none"
              aria-label={i === 0 ? 'Minimum' : 'Maximum'}
            />
            <span className="text-muted">{f.unit}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function MultiFacet({ f, base, all, value, onChange }: { f: Facet; base: Product[]; all: Product[]; value: string[]; onChange: (v: string[] | undefined) => void }) {
  const counts = useMemo(() => new Map(facetValues(base, f).map((x) => [x.value, x.count])), [base, f]);
  const values = useMemo(() => facetValues(all, f), [all, f]);
  const [more, setMore] = useState(false);
  const [q, setQ] = useState('');
  const long = values.length > 8;
  const shown = values.filter((v) => !q || v.value.toLowerCase().includes(q.toLowerCase()));
  const list = more || q ? shown : shown.slice(0, 8);
  const toggle = (v: string) => {
    const next = value.includes(v) ? value.filter((x) => x !== v) : [...value, v];
    onChange(next.length ? next : undefined);
  };
  return (
    <div>
      {values.length > 12 && <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${f.label} suchen`} className="input mb-2 h-10 rounded-[10px] text-[13.5px]" />}
      <ul className={cx(f.swatch && 'grid grid-cols-2 gap-x-2')}>
        {list.map(({ value: v }) => {
          const n = counts.get(v) ?? 0;
          const on = value.includes(v);
          return (
            <li key={v}>
              <label className={cx('flex min-h-9 cursor-pointer items-center gap-3 py-1 text-[14px] text-ink-2 hover:text-ink', !n && !on && 'opacity-40')}>
                <input type="checkbox" checked={on} onChange={() => toggle(v)} disabled={!n && !on} className="check" />
                {f.swatch && <ColorDot color={v} size={14} />}
                <span className="flex-1 leading-tight">{f.format ? f.format(v) : v}</span>
                <span className="num text-[12px] text-subtle">{n}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {long && !q && (
        <button type="button" className="mt-1 text-[13px] font-medium text-info hover:underline" onClick={() => setMore(!more)}>
          {more ? 'Weniger anzeigen' : `Alle ${values.length} anzeigen`}
        </button>
      )}
    </div>
  );
}

function FilterPanel({ facets, all, st, set }: { facets: Facet[]; all: Product[]; st: FilterState; set: (s: FilterState) => void }) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  return (
    <div className="divide-y divide-line border-y border-line">
      {facets.map((f) => {
        const base = applyFilters(all, st, facets, f.id);
        if (f.type === 'multi' && facetValues(all, f).length < 2 && !(st[f.id] as string[] | undefined)?.length) return null;
        if (f.type === 'range' && !rangeBounds(all, f)) return null;
        const isOpen = closed[f.id] === undefined ? f.open !== false && (f.open || f.type !== 'multi') : !closed[f.id];
        const upd = (v: FilterState[string] | undefined) => {
          const next = { ...st };
          if (v === undefined) delete next[f.id];
          else next[f.id] = v;
          set(next);
        };
        if (f.type === 'bool') {
          const n = base.filter((p) => f.get(p) === true).length;
          if (!n && st[f.id] !== true) return null;
          return (
            <label key={f.id} className="flex min-h-11 cursor-pointer items-center gap-2.5 py-1.5 text-[14px]">
              <input type="checkbox" className="check" checked={st[f.id] === true} onChange={(e) => upd(e.target.checked ? true : undefined)} />
              <span className="flex-1 font-medium">{f.label}</span>
              <span className="num text-[12px] text-subtle">{n}</span>
            </label>
          );
        }
        const activeN = f.type === 'multi' ? ((st[f.id] as string[]) ?? []).length : st[f.id] ? 1 : 0;
        return (
          <div key={f.id} className="py-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setClosed({ ...closed, [f.id]: isOpen })}
                className="flex flex-1 items-center justify-between py-2.5 text-left text-[14px] font-semibold"
                aria-expanded={isOpen}
              >
                <span className="flex items-center gap-1.5">
                  {f.label}
                  {activeN > 0 && <span className="num grid size-[18px] place-items-center rounded-full bg-ink text-[10.5px] text-white">{activeN}</span>}
                </span>
                <ChevronDown size={17} className={cx('order-last text-muted transition-transform duration-200', isOpen && 'rotate-180')} />
              </button>
            </div>
            {f.info && isOpen && <p className="-mt-1 mb-2 text-[12px] leading-snug text-muted">{f.info}</p>}
            {isOpen && (
              <div className="pb-3">
                {f.type === 'multi' ? (
                  <MultiFacet f={f} base={base} all={all} value={(st[f.id] as string[]) ?? []} onChange={upd} />
                ) : (
                  <RangeFacet f={f} items={all} value={st[f.id] as [number | null, number | null] | undefined} onChange={upd} />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActiveChips({ facets, st, set }: { facets: Facet[]; st: FilterState; set: (s: FilterState) => void }) {
  const chips: { label: string; clear: () => void }[] = [];
  for (const f of facets) {
    const v = st[f.id];
    if (v === undefined) continue;
    const drop = (x?: string) => {
      const next = { ...st };
      if (x && Array.isArray(v)) {
        const rest = (v as string[]).filter((y) => y !== x);
        if (rest.length) next[f.id] = rest;
        else delete next[f.id];
      } else delete next[f.id];
      set(next);
    };
    if (f.type === 'multi')
      (v as string[]).forEach((x) =>
        chips.push({
          label: `${f.format ? f.format(x) : x}`,
          clear: () => drop(x),
        }),
      );
    else if (f.type === 'bool') chips.push({ label: f.label, clear: () => drop() });
    else {
      const [a, b] = v as [number | null, number | null];
      chips.push({
        label: `${f.label.replace(/ in .*/, '')}: ${a ?? '…'}–${b ?? '…'} ${f.unit ?? ''}`,
        clear: () => drop(),
      });
    }
  }
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <button key={c.label} type="button" onClick={c.clear} className="chip h-7 bg-panel pr-2 text-[12.5px] hover:bg-panel-2">
          {c.label} <X size={13} />
        </button>
      ))}
      <button type="button" onClick={() => set({})} className="px-1.5 text-[12.5px] font-medium text-info hover:underline">
        Alle Filter entfernen
      </button>
    </div>
  );
}

/* ---------------- Tabellenansicht ---------------- */
interface Col {
  label: string;
  sort?: SortKey;
  cell: (p: Product) => React.ReactNode;
  className?: string;
}

function columnsFor(cat: CatId | null): Col[] {
  const dash = <span className="text-subtle">–</span>;
  switch (cat) {
    case 'belaege':
      return [
        { label: 'Belagart', cell: (p) => p.specs.rubberType ?? dash },
        {
          label: 'Härte',
          sort: 'haerte-auf',
          cell: (p) =>
            p.specs.hardness ? (
              <div className="flex items-center gap-2">
                <span className="num w-11">{fmtNum(p.specs.hardness)}°</span>
                <div className="w-20">
                  <HardnessGauge value={p.specs.hardness} compact />
                </div>
              </div>
            ) : (
              (p.specs.hardnessClass ?? dash)
            ),
        },
        {
          label: 'Stärken',
          cell: (p) => thicknessRange(p.specs.thicknesses) ?? dash,
        },
        {
          label: 'Farben',
          cell: (p) =>
            p.specs.colors?.length ? (
              <span className="flex gap-1">
                {p.specs.colors.map((c) => (
                  <ColorDot key={c} color={c} />
                ))}
              </span>
            ) : (
              dash
            ),
        },
      ];
    case 'hoelzer':
      return [
        { label: 'Material', cell: (p) => p.specs.material ?? dash },
        {
          label: 'Furniere',
          cell: (p) => (p.specs.plies ? `${p.specs.plies}-lagig` : dash),
        },
        {
          label: 'Gewicht',
          sort: 'gewicht-auf',
          cell: (p) => (p.specs.weight ? <span className="num">{p.specs.weight} g</span> : dash),
        },
        { label: 'Klasse', cell: (p) => p.specs.class ?? dash },
        {
          label: 'Griffe',
          cell: (p) => p.specs.handles?.join(', ') ?? dash,
          className: 'max-w-[180px]',
        },
      ];
    case 'tische':
      return [
        {
          label: 'Einsatz',
          cell: (p) => p.specs.usage ?? subName('tische', p.sub) ?? dash,
        },
        {
          label: 'Platte',
          cell: (p) => (p.specs.topMm ? `${fmtNum(p.specs.topMm)} mm` : dash),
        },
        {
          label: 'ITTF',
          cell: (p) => (p.specs.ittf === undefined ? dash : p.specs.ittf ? 'Ja' : 'Nein'),
        },
        {
          label: 'Netz inkl.',
          cell: (p) => (p.specs.net === undefined ? dash : p.specs.net ? 'Ja' : 'Nein'),
        },
        {
          label: 'Gewicht',
          cell: (p) => (p.specs.weightKg ? `${fmtNum(p.specs.weightKg)} kg` : dash),
        },
      ];
    case 'baelle':
      return [
        {
          label: 'Qualität',
          cell: (p) => (p.specs.stars ? '★'.repeat(p.specs.stars) : dash),
        },
        {
          label: 'Packung',
          cell: (p) => (p.specs.pack ? `${p.specs.pack} Stk.` : dash),
        },
        { label: 'Material', cell: (p) => p.specs.ballMaterial ?? dash },
        {
          label: 'Pro Ball',
          cell: (p) => (p.specs.pack ? <span className="num">{formatPrice(p.price / p.specs.pack)}</span> : dash),
        },
      ];
    default:
      return [
        {
          label: 'Kategorie',
          cell: (p) => subName(p.cat, p.sub) ?? getCategory(p.cat)?.name,
        },
      ];
  }
}

function ListTable({ items, cat, sort, setSort }: { items: Product[]; cat: CatId | null; sort: SortKey; setSort: (s: SortKey) => void }) {
  const cols = columnsFor(cat);
  const head = (label: string, asc?: SortKey, desc?: SortKey) => {
    if (!asc) return label;
    const active = sort === asc || sort === desc;
    return (
      <button type="button" onClick={() => setSort(sort === asc && desc ? desc : asc)} className={cx('inline-flex items-center gap-1', active && 'text-ink')}>
        {label} {sort === asc ? <ArrowUp size={12} /> : sort === desc ? <ArrowDown size={12} /> : null}
      </button>
    );
  };
  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <table className="data-table min-w-[760px]">
        <thead>
          <tr>
            <th>{head('Artikel', 'name')}</th>
            {cols.map((c) => (
              <th key={c.label}>{head(c.label, c.sort, c.sort === 'haerte-auf' ? 'haerte-ab' : undefined)}</th>
            ))}
            <th className="text-right">{head('Preis', 'preis-auf', 'preis-ab')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <td>
                <Link to={`/p/${p.id}`} className="flex items-center gap-3">
                  <div className="size-14 shrink-0 tile rounded-[12px] p-1.5">
                    <Img thumb src={p.images[0]} alt="" className="size-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12.5px] text-muted">{p.brand}</div>
                    <div className="max-w-[260px] truncate font-medium hover:underline">{p.title}</div>
                    <StockLine p={p} className="mt-0.5" />
                  </div>
                </Link>
              </td>
              {cols.map((c) => (
                <td key={c.label} className={cx('text-[13.5px] text-ink-2', c.className)}>
                  {c.cell(p)}
                </td>
              ))}
              <td className="text-right">
                <Price p={p} size="sm" className="justify-end" />
              </td>
              <td>
                <CompareToggle id={p.id} compact className="size-8 border border-line-2" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Seite ---------------- */
const PAGE = 24;

export default function Category({ mode }: { mode?: 'search' | 'brand' }) {
  const L = useListing(mode);
  const [sp, setSp] = useSearchParams();
  const { pathname } = useLocation();
  const facets = useMemo(() => {
    const fs = L?.cat ? FACETS[L.cat] : FACETS.mixed;
    return L?.sub ? fs.filter((f) => f.id !== 'art' && f.id !== 'bauform') : fs;
  }, [L?.cat, L?.sub]);
  const st = useMemo(() => readState(sp, facets), [sp, facets]);
  const sort = (sp.get('sort') as SortKey) || 'relevanz';
  const view = sp.get('ansicht') === 'liste' ? 'liste' : 'raster';
  const update = (next: FilterState) => setSp(writeState(next, facets, sp), { replace: true });
  const setParam = (k: string, v: string | null) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v);
    else n.delete(k);
    setSp(n, { replace: true });
  };
  const filtered = useMemo(() => (L ? sortItems(applyFilters(L.items, st, facets), sort) : []), [L, st, facets, sort]);
  const [limit, setLimit] = useState(PAGE);
  useEffect(() => setLimit(PAGE), [pathname, sp.toString()]);
  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState<FilterState>({});
  const draftCount = useMemo(() => (L ? applyFilters(L.items, draft, facets).length : 0), [L, draft, facets]);
  const nActive = activeCount(st);
  usePageMeta(L ? (L.cat && !L.sub ? `Tischtennis ${L.title} kaufen` : L.title) : null, L?.intro);
  useJsonLd('ld-breadcrumb', L ? breadcrumbLd(L.crumbs) : null);

  if (!L) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="h1">Seite nicht gefunden.</h1>
        <Link to="/" className="btn btn-dark mt-6">
          Zur Startseite
        </Link>
      </div>
    );
  }

  const cat = L.cat ? getCategory(L.cat)! : null;
  const PRIMARY: Partial<Record<CatId, string>> = {
    belaege: 'typ',
    hoelzer: 'material',
    baelle: 'sterne',
    tische: 'einsatz',
    schuhe: 'groesse',
  };
  const primaryId = L.cat && !L.sub ? PRIMARY[L.cat] : L.cat === 'tische' ? 'einsatz' : L.cat === 'belaege' ? 'typ' : L.cat === 'hoelzer' ? 'material' : undefined;
  const primary = primaryId ? (facets.find((f) => f.id === primaryId) ?? null) : null;
  const guide = L.cat
    ? (
        {
          belaege: 'belagarten',
          hoelzer: 'holzaufbau',
          tische: 'tischtennisplatte-kaufen',
          baelle: 'tischtennisbaelle',
          zubehoer: 'kleben-und-pflege',
          schlaeger: 'materialregeln',
        } as Partial<Record<CatId, string>>
      )[L.cat]
    : undefined;
  const sorts = SORTS.filter((s) => !s.cats || (L.cat && s.cats.includes(L.cat)));
  const typeInfo = L.cat === 'belaege' && (st.typ as string[] | undefined)?.length === 1 ? RUBBER_TYPE_INFO[(st.typ as string[])[0]] : null;

  return (
    <div className="-mb-16 bg-panel pb-24">
      <div className="container-x">
        <Breadcrumbs items={L.crumbs} />

        <div className="flex flex-col gap-2 pt-2 pb-1 sm:pt-4">
          {mode === 'brand' && BRAND_LOGOS[L.title] && <img src={BRAND_LOGOS[L.title]} alt="" className="mb-3 h-12 w-auto max-w-[220px] object-contain object-left opacity-80" />}
          <h1 className="h1">{L.title}</h1>
          <p className="max-w-3xl text-[15px] leading-snug tracking-[-0.01em] text-muted sm:text-[19px] sm:tracking-[-0.012em]">
            <span className="num font-semibold text-ink">{L.items.length} Artikel.</span> {L.intro}
          </p>
        </div>

        {/* Unterkategorien */}
        {cat && !L.sub && cat.subs.length > 0 && (
          <div className="no-scrollbar -mx-4 mt-6 flex gap-3 overflow-x-auto px-4 py-2 sm:mx-0 sm:flex-wrap sm:px-0">
            {cat.subs.map((s) => {
              const first = inCat(cat.id, s.id)[0];
              return (
                <Link
                  key={s.id}
                  to={`/c/${cat.id}/${s.id}`}
                  className="flex h-16 shrink-0 items-center gap-3 rounded-[16px] bg-white pr-5 pl-2 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]"
                >
                  {first && (
                    <div className="size-12 rounded-[10px] bg-white p-0.5">
                      <Img thumb src={first.images[0]} alt="" className="size-full object-contain" />
                    </div>
                  )}
                  <span className="text-[14px] font-semibold tracking-[-0.01em]">{s.name}</span>
                  <span className="num text-[12px] text-subtle">{inCat(cat.id, s.id).length}</span>
                </Link>
              );
            })}
          </div>
        )}
        {cat && L.sub && (
          <div className="no-scrollbar -mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <Link to={`/c/${cat.id}`} className="chip">
              Alle {cat.name}
            </Link>
            {cat.subs.map((s) => (
              <Link key={s.id} to={`/c/${cat.id}/${s.id}`} className={cx('chip', s.id === L.sub && 'is-active')}>
                {s.name}
              </Link>
            ))}
          </div>
        )}

        {/* Schnellfilter Belagart */}
        {primary && (
          <div className="no-scrollbar -mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {facetValues(applyFilters(L.items, st, facets, primary.id), primary)
              .slice(0, 12)
              .map((v) => {
                const cur = (st[primary.id] as string[]) ?? [];
                const on = cur.includes(v.value);
                return (
                  <button
                    key={v.value}
                    type="button"
                    aria-pressed={on}
                    className="chip"
                    onClick={() =>
                      update({
                        ...st,
                        [primary.id]: on ? cur.filter((x) => x !== v.value) : [...cur, v.value],
                      })
                    }
                  >
                    {primary.format ? primary.format(v.value) : v.value} <span className={cx('num text-[11px]', on ? 'text-white/70' : 'text-subtle')}>{v.count}</span>
                  </button>
                );
              })}
          </div>
        )}
        {typeInfo && <div className="mt-3 max-w-3xl rounded-[14px] bg-white px-4 py-3 text-[14px] text-ink-2 shadow-[var(--shadow-card)]">{typeInfo}</div>}

        <div className="mt-6 grid gap-8 lg:grid-cols-[264px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-[calc(var(--hdr)+16px)] max-h-[calc(100vh-var(--hdr)-32px)] overflow-y-auto pr-2 [scrollbar-color:var(--color-line-2)_transparent] [scrollbar-width:thin]">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[17px] font-semibold tracking-[-0.015em]">Filter</span>
                {nActive > 0 && (
                  <button type="button" onClick={() => update({})} className="text-[12.5px] text-info hover:underline">
                    Zurücksetzen
                  </button>
                )}
              </div>
              <FilterPanel facets={facets} all={L.items} st={st} set={update} />
            </div>
          </aside>

          <div className="min-w-0">
            {/* Werkzeugleiste */}
            <div className="sticky top-[var(--hdr)] z-20 -mx-4 border-b border-black/[0.06] bg-panel/85 px-4 py-2.5 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline btn-sm lg:hidden"
                  onClick={() => {
                    setDraft(st);
                    setSheet(true);
                  }}
                >
                  <SlidersHorizontal size={15} /> Filter {nActive > 0 && <span className="num grid size-5 place-items-center rounded-full bg-ink text-[11px] text-white">{nActive}</span>}
                </button>
                <div className="num hidden text-[13.5px] text-muted sm:block">
                  <b className="text-ink">{filtered.length}</b> {filtered.length === 1 ? 'Artikel' : 'Artikel'}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <label className="flex items-center gap-2 text-[13px] text-muted">
                    <span className="hidden sm:inline">Sortieren:</span>
                    <select
                      value={sort}
                      onChange={(e) => setParam('sort', e.target.value === 'relevanz' ? null : e.target.value)}
                      className="select h-9 w-[132px] min-w-0 rounded-full bg-white text-[13px] text-ink sm:w-auto sm:max-w-[190px]"
                      aria-label="Sortierung"
                    >
                      {sorts.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex rounded-full bg-black/[0.06] p-0.5" role="group" aria-label="Ansicht">
                    <button
                      type="button"
                      aria-pressed={view === 'raster'}
                      onClick={() => setParam('ansicht', null)}
                      className={cx('grid size-8 place-items-center rounded-full transition-colors', view === 'raster' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink')}
                      aria-label="Rasteransicht"
                    >
                      <LayoutGrid size={16} />
                    </button>
                    <button
                      type="button"
                      aria-pressed={view === 'liste'}
                      onClick={() => setParam('ansicht', 'liste')}
                      className={cx('grid size-8 place-items-center rounded-full transition-colors', view === 'liste' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink')}
                      aria-label="Tabellenansicht mit technischen Daten"
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>
              {nActive > 0 && (
                <div className="mt-2">
                  <ActiveChips facets={facets} st={st} set={update} />
                </div>
              )}
            </div>

            {filtered.length === 0 && mode === 'search' && nActive === 0 ? (
              <NoHits q={sp.get('q') ?? ''} />
            ) : filtered.length === 0 ? (
              <div className="mt-6 rounded-[28px] bg-white px-6 py-14 text-center shadow-[var(--shadow-card)]">
                <div className="text-[16px] font-semibold">Keine Artikel für diese Filterkombination</div>
                <p className="mx-auto mt-1 max-w-md text-[14px] text-muted">Entferne einzelne Filter oder lass dich beraten: {SHOP.phone}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button type="button" className="btn btn-dark btn-sm" onClick={() => update({})}>
                    Filter zurücksetzen
                  </button>
                  <a href={SHOP.phoneHref} className="btn btn-outline btn-sm">
                    <Phone size={14} /> Anrufen
                  </a>
                </div>
              </div>
            ) : view === 'liste' ? (
              <div className="mt-4 overflow-hidden rounded-[18px] bg-white shadow-[var(--shadow-card)]">
                <ListTable items={filtered.slice(0, limit)} cat={L.cat} sort={sort} setSort={(s) => setParam('sort', s)} />
              </div>
            ) : (
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {filtered.slice(0, limit).map((p, i) => (
                  <li key={p.id} className="flex">
                    <ProductCard p={p} priority={i < 4} className="w-full" />
                  </li>
                ))}
              </ul>
            )}

            {filtered.length > limit && (
              <div className="mt-8 flex flex-col items-center gap-2">
                <div className="num text-[13px] text-muted">
                  {limit} von {filtered.length} Artikeln
                </div>
                <button type="button" className="btn btn-outline" onClick={() => setLimit(limit + PAGE)}>
                  Weitere {Math.min(PAGE, filtered.length - limit)} Artikel laden
                </button>
              </div>
            )}
            {(guide || L.cat === 'belaege' || L.cat === 'hoelzer') && (
              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {guide && (
                  <Link to={`/ratgeber/${guide}`} className="store-card flex items-start gap-3 p-5">
                    <BookOpen size={20} className="mt-0.5 shrink-0 text-muted" />
                    <span>
                      <span className="block text-[14.5px] font-semibold">Ratgeber lesen</span>
                      <span className="block text-[13px] text-muted">Fachwissen zu {L.title} – kompakt erklärt, mit Tabellen und Faustregeln.</span>
                    </span>
                  </Link>
                )}
                {(L.cat === 'belaege' || L.cat === 'hoelzer') && (
                  <Link to="/berater" className="flex items-start gap-3 rounded-[18px] bg-ink p-5 text-white">
                    <Sparkles size={20} className="mt-0.5 shrink-0 text-red" />
                    <span>
                      <span className="block text-[14.5px] font-semibold">Unsicher? Material-Berater</span>
                      <span className="block text-[13px] text-white/70">4 Fragen zu Niveau und Spielstil – wir empfehlen passende Artikel.</span>
                    </span>
                  </Link>
                )}
              </div>
            )}
            <p className="mt-8 text-[12px] text-muted">Alle Preise inkl. MwSt., zzgl. Versandkosten. UVP = unverbindliche Preisempfehlung des Herstellers.</p>
          </div>
        </div>
      </div>

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Filter"
        footer={
          <div className="flex gap-2">
            <button type="button" className="btn btn-outline shrink-0" onClick={() => setDraft({})}>
              Zurücksetzen
            </button>
            <button
              type="button"
              className="btn btn-dark min-w-0 flex-1"
              disabled={draftCount === 0}
              onClick={() => {
                update(draft);
                setSheet(false);
              }}
            >
              {draftCount} Artikel anzeigen
            </button>
          </div>
        }
      >
        <div className="py-3">
          <FilterPanel facets={facets} all={L.items} st={draft} set={setDraft} />
        </div>
      </Sheet>
    </div>
  );
}
