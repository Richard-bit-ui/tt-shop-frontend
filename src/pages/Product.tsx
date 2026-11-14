import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Box, Check, Link2, MessageCircle, Phone, RotateCcw, ScanLine, Share2, ShieldCheck, ShoppingBag, Truck, Wrench, ZoomIn } from 'lucide-react';
import { easierAlternatives, pairPrice, SUIT_INFO, suitability } from '../lib/advice';
import { Lightbox } from '../components/QuickView';
import {
  crossSell,
  fmtNum,
  formatPrice,
  getCategory,
  getProduct,
  products,
  related,
  useOptions,
  RUBBER_TYPE_INFO,
  sameSeries,
  SHOP,
  slugify,
  SPEC_ROWS,
  subName,
  thicknessRange,
  type Product as P,
} from '../lib/catalog';
import { deliveryWindow, fmtDuration, useCutoff } from '../lib/delivery';
import { useCart } from '../store/cart';
import { OptionPicker, useOptionState } from '../components/Options';
import { useSaved, useUI } from '../store/ui';
import { openChat } from '../store/chat';
import { CompareToggle, ProductRail, WishButton } from '../components/ProductCard';
import { Breadcrumbs, ColorDot, cx, HardnessGauge, Img, InfoHint, PaymentBadges, Price, QtyStepper, SectionHead, Tag, thicknessLabel } from '../components/ui';
import { ARSheet, LazyScene, Segmented, TableScene, FOLD_OPTIONS } from '../three/Controls';
import { TABLE_COLORS, type FoldMode, type TableColor } from '../three/tableSpec';
import { breadcrumbLd, productLd, useJsonLd, usePageMeta } from '../lib/seo';

/* ---------------- Details (lazy) ---------------- */
interface Details {
  short?: string;
  paragraphs?: string[];
  headings?: string[];
  bullets?: string[];
  attrs?: Record<string, string>;
}
let detailsCache: Record<string, Details> | null = null;
function useDetails(id: string): Details | null {
  const [d, setD] = useState<Details | null>(detailsCache?.[id] ?? null);
  useEffect(() => {
    let alive = true;
    if (detailsCache) setD(detailsCache[id] ?? {});
    else
      import('../data/details.json').then((m) => {
        detailsCache = m.default as Record<string, Details>;
        if (alive) setD(detailsCache[id] ?? {});
      });
    return () => {
      alive = false;
    };
  }, [id]);
  return d;
}

/* ---------------- Galerie (+ 3D für Platten) ---------------- */
function Gallery({ p, show3d, setShow3d, onAR }: { p: P; show3d: boolean; setShow3d: (b: boolean) => void; onAR: () => void }) {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [mode, setMode] = useState<FoldMode>('play');
  const [color, setColor] = useState<TableColor>(p.table?.color ?? 'blau');
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => setIdx(0), [p.id]);
  const select = (i: number) => {
    setShow3d(false);
    setIdx(i);
    row.current?.scrollTo({
      left: i * row.current.clientWidth,
      behavior: 'smooth',
    });
  };
  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {/* Thumbnails (nur bei mehreren Ansichten) */}
      <div className={cx('no-scrollbar flex gap-2 overflow-x-auto md:max-h-[560px] md:w-[72px] md:shrink-0 md:flex-col md:overflow-y-auto', p.images.length < 2 && !p.table && 'hidden')}>
        {p.images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => select(i)}
            aria-label={`Bild ${i + 1}`}
            className={cx('tile size-16 shrink-0 rounded-[12px] p-1.5 ring-offset-2 transition-shadow md:size-[72px]', !show3d && i === idx ? 'ring-2 ring-info' : 'hover:ring-1 hover:ring-line-2')}
          >
            <Img thumb src={src} alt="" className="size-full object-contain" />
          </button>
        ))}
        {p.table && (
          <button
            type="button"
            onClick={() => setShow3d(true)}
            className={cx(
              'flex size-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[12px] bg-panel text-[11px] font-semibold ring-offset-2 md:size-[72px]',
              show3d ? 'ring-2 ring-info' : 'hover:ring-1 hover:ring-line-2',
            )}
          >
            <Box size={20} /> 3D
          </button>
        )}
      </div>
      {/* Hauptbild */}
      <div className="relative min-w-0 flex-1">
        {show3d && p.table ? (
          <div className="relative aspect-square overflow-hidden rounded-[22px] bg-gradient-to-b from-white to-panel md:aspect-[5/4]">
            <LazyScene>
              <TableScene config={{ ...p.table, color }} mode={mode} showDims className="absolute inset-0" />
            </LazyScene>
            <div className="absolute inset-x-3 top-3 flex flex-wrap items-center justify-between gap-2">
              <Segmented value={mode} onChange={setMode} options={FOLD_OPTIONS} className="bg-white/95 shadow-sm" />
              {p.table.colors.length > 1 && (
                <div className="flex gap-1.5 rounded-full bg-white/95 p-1.5 shadow-sm">
                  {p.table.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={TABLE_COLORS[c].label}
                      aria-pressed={c === color}
                      onClick={() => setColor(c)}
                      className={cx('size-6 rounded-full ring-2', c === color ? 'ring-ink' : 'ring-transparent')}
                      style={{ background: TABLE_COLORS[c].hex }}
                    />
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={onAR} className="btn btn-dark btn-sm absolute right-3 bottom-3">
              <ScanLine size={15} /> In deinem Raum (AR)
            </button>
            <div className="absolute bottom-3 left-3 text-[12px] text-muted">Ziehen zum Drehen · Maßstab 1:1</div>
          </div>
        ) : (
          <>
            <div
              ref={row}
              onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
              className="tile no-scrollbar flex aspect-square snap-x snap-mandatory overflow-x-auto rounded-[22px] md:aspect-[5/4]"
            >
              {p.images.map((src, i) => (
                <button key={src} type="button" onClick={() => setLightbox(i)} aria-label={`Bild ${i + 1} vergrößern`} className="h-full w-full shrink-0 snap-center cursor-zoom-in p-[9%]">
                  <Img src={src} alt={`${p.title} – Bild ${i + 1}`} eager={i === 0} className="size-full object-contain" />
                </button>
              ))}
            </div>
            <div className="absolute top-3 left-3 flex flex-col items-start gap-1">
              {p.sale && <span className="rounded-full bg-white px-2.5 py-1 text-[12px] leading-none font-semibold text-red shadow-sm">Sale</span>}
              {p.discontinued && <span className="rounded-full bg-white px-2.5 py-1 text-[12px] leading-none font-semibold text-muted shadow-sm">Auslaufmodell</span>}
            </div>
            {p.images.length > 1 && (
              <div className="num absolute right-3 bottom-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[12px] font-medium shadow-sm md:hidden">
                {idx + 1}/{p.images.length}
              </div>
            )}
            <button
              type="button"
              onClick={() => setLightbox(idx)}
              className="absolute right-3 bottom-3 hidden items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[12px] font-medium shadow-sm backdrop-blur md:flex"
            >
              <ZoomIn size={14} /> Vergrößern
            </button>
            {lightbox !== null && <Lightbox images={p.images} start={lightbox} title={p.title} onClose={() => setLightbox(null)} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- Highlights: große Zahlen, nur aus vorhandenen Daten ---------------- */
function Highlights({ p }: { p: P }) {
  const s = p.specs;
  const items: { big: string; label: string; note?: string }[] = [];
  if (s.rubberType) items.push({ big: s.rubberType, label: 'Belagart', note: RUBBER_TYPE_INFO[s.rubberType]?.split('.')[0] });
  if (s.hardness) items.push({ big: `${fmtNum(s.hardness)}°`, label: `Schwammhärte${s.hardnessClass ? ` · ${s.hardnessClass}` : ''}`, note: 'Herstellerangabe' });
  if (s.thicknesses?.length) items.push({ big: thicknessRange(s.thicknesses) ?? '', label: s.thicknesses.length > 1 ? `${s.thicknesses.length} Schwammstärken` : 'Schwammstärke' });
  if (s.colors?.length) items.push({ big: String(s.colors.length), label: s.colors.length === 1 ? 'Farbe' : 'Farben', note: s.colors.join(', ') });
  if (s.material) items.push({ big: s.material, label: 'Material' });
  if (s.plies) items.push({ big: String(s.plies), label: 'Furniere' });
  if (s.weight) items.push({ big: `${s.weight} g`, label: 'Gewicht', note: 'Herstellerangabe' });
  if (s.class) items.push({ big: s.class, label: 'Holzklasse' });
  if (s.topMm) items.push({ big: `${fmtNum(s.topMm)} mm`, label: 'Plattenstärke' });
  if (s.stars) items.push({ big: '★'.repeat(s.stars), label: 'Qualität' });
  if (s.ittf) items.push({ big: 'ITTF', label: 'zugelassen' });
  const list = items.filter((x) => x.big).slice(0, 4);
  if (list.length < 2) return null;
  return (
    <section className="band mt-14" aria-labelledby="hl-title">
      <div className="container-x">
        <h2 id="hl-title" className="h2">
          Die Highlights. <span className="text-muted">Auf einen Blick.</span>
        </h2>
        <div className={cx('mt-7 grid gap-4', list.length === 2 ? 'sm:grid-cols-2' : list.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4')}>
          {list.map((h) => (
            <div key={h.label} className="rounded-[22px] bg-white p-6 shadow-[var(--shadow-card)] sm:p-7">
              <div className="num truncate text-[40px] leading-none font-semibold tracking-[-0.04em] sm:text-[48px]">{h.big}</div>
              <div className="mt-3 text-[16px] font-semibold tracking-[-0.01em]">{h.label}</div>
              {h.note && <div className="mt-1 line-clamp-2 text-[13px] text-muted">{h.note}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Datenblatt ---------------- */
function SpecSheet({ p, d }: { p: P; d: Details | null }) {
  const rows = SPEC_ROWS[p.cat].map((r) => ({ label: r.label, value: r.value(p), hint: r.hint })).filter((r) => r.value);
  const known = new Set([
    'Farben',
    'Marke',
    'Herstellungsland',
    'Griffformen',
    'Verwendungsort',
    'Plattenstärke',
    'ITTF Zulassung',
    'Netz im Preis dabei',
    'Playback-Stellung',
    'Gewicht netto (ohne Verpackung)',
    'Furinieraufbau',
    'Kleidungsgrößen',
  ]);
  const extra = Object.entries(d?.attrs ?? {}).filter(([k]) => !known.has(k));
  const variant = p.options.find((o) => o.kind === 'variant');
  const colors = [...new Set(variant?.values.map((v) => v.color).filter(Boolean))] as string[];
  const thick = [...new Set(variant?.values.map((v) => v.thickness).filter(Boolean))] as string[];
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <table className="data-table">
        <tbody>
          <tr>
            <td className="w-[42%] text-muted">Hersteller</td>
            <td className="font-medium">
              <Link to={`/marke/${slugify(p.brand)}`} className="link">
                {p.brand}
              </Link>
            </td>
          </tr>
          {p.sku && (
            <tr>
              <td className="text-muted">Artikelnummer</td>
              <td className="num font-medium">{p.sku}</td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="text-muted">
                <span className="inline-flex items-center gap-1.5">
                  {r.label} {r.hint && <InfoHint text={r.hint} />}
                </span>
              </td>
              <td className="font-medium">{r.value}</td>
            </tr>
          ))}
          {extra.map(([k, v]) => (
            <tr key={k}>
              <td className="text-muted">{k}</td>
              <td className="font-medium">{v}</td>
            </tr>
          ))}
          <tr>
            <td className="text-muted">Lieferzeit</td>
            <td className="font-medium">{p.delivery ?? (p.inStock ? '2–3 Werktage' : '3–6 Werktage')}</td>
          </tr>
        </tbody>
      </table>
      <div className="space-y-4">
        {p.specs.hardness && (
          <div className="card p-4">
            <div className="flex items-baseline justify-between">
              <div className="text-[14px] font-semibold">Schwammhärte</div>
              <div className="num text-[20px] font-bold">
                {fmtNum(p.specs.hardness)}° <span className="text-[13px] font-medium text-muted">{p.specs.hardnessClass}</span>
              </div>
            </div>
            <div className="mt-3">
              <HardnessGauge value={p.specs.hardness} />
            </div>
            <p className="mt-3 text-[12px] leading-snug text-muted">
              Herstellerangabe. Weichere Schwämme = mehr Kontrolle und Ballgefühl, härtere = mehr Tempo und Durchschlag bei hoher Schlaggeschwindigkeit.
            </p>
          </div>
        )}
        {p.specs.rubberType && RUBBER_TYPE_INFO[p.specs.rubberType] && (
          <div className="card p-4">
            <div className="text-[14px] font-semibold">Belagart: {p.specs.rubberType}</div>
            <p className="mt-1 text-[13px] leading-snug text-ink-2">{RUBBER_TYPE_INFO[p.specs.rubberType]}</p>
            <Link to={`/c/belaege?typ=${encodeURIComponent(p.specs.rubberType)}`} className="link mt-2 inline-block text-[13px]">
              Alle {p.specs.rubberType}-Beläge
            </Link>
          </div>
        )}
        {colors.length > 0 && thick.length > 0 && (
          <div className="card overflow-hidden">
            <div className="border-b border-line px-4 py-2.5 text-[14px] font-semibold">Lieferbare Varianten</div>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-panel">
                  <th className="px-3 py-2 text-left font-medium text-muted">Stärke</th>
                  {colors.map((c) => (
                    <th key={c} className="px-2 py-2 font-medium text-muted capitalize">
                      <span className="inline-flex items-center gap-1.5">
                        <ColorDot color={c} size={10} /> {c}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {thick.map((t) => (
                  <tr key={t} className="border-t border-line">
                    <td className="num px-3 py-2 font-medium">{thicknessLabel(t)}</td>
                    {colors.map((c) => (
                      <td key={c} className="px-2 py-2 text-center">
                        {variant!.values.some((v) => v.color === c && v.thickness === t) ? <Check size={15} className="mx-auto text-ok" strokeWidth={3} /> : <span className="text-subtle">–</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {p.specs.handles && p.specs.handles.length > 0 && (
          <div className="card p-4">
            <div className="text-[14px] font-semibold">Griffformen</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.specs.handles.map((h) => (
                <Tag key={h}>{h}</Tag>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Passend dazu (Montagezubehör, regelbasiert – keine Bestelldaten) ---------------- */
function Together({ p, validate, extra }: { p: P; validate: () => import('../store/cart').LineOption[] | null; extra: number }) {
  const add = useCart((s) => s.add);
  const notify = useUI((s) => s.notify);
  const picks = useMemo(() => {
    const first = (sub: string, prefer?: RegExp) => {
      const pool = products.filter((x) => x.cat === 'zubehoer' && x.sub === sub && !x.hasRequired);
      return (prefer && pool.find((x) => prefer.test(x.title))) || pool[0];
    };
    const list =
      p.cat === 'belaege'
        ? [first('kleber', /kleber|clipper|glue|chack/i), first('kantenbaender'), first('reiniger', /reiniger|cleaner|schaum/i)]
        : [first('versiegelung'), first('kantenbaender'), first('huellen')];
    return list.filter(Boolean) as P[];
  }, [p]);
  const [on, setOn] = useState<Record<string, boolean>>({});
  useEffect(() => setOn(Object.fromEntries(picks.map((x) => [x.id, true]))), [picks]);
  if (!picks.length || (p.cat !== 'belaege' && p.cat !== 'hoelzer')) return null;
  const total = p.price + extra + picks.filter((x) => on[x.id]).reduce((n, x) => n + x.price, 0);
  const addAll = () => {
    const opts = validate();
    if (!opts) {
      notify('Bitte zuerst Ausführung wählen');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    add(p.id, 1, { opts });
    picks.filter((x) => on[x.id]).forEach((x) => add(x.id, 1));
    notify(`${1 + picks.filter((x) => on[x.id]).length} Artikel in den Warenkorb gelegt`);
  };
  return (
    <section className="container-x mt-10">
      <div className="rounded-[22px] bg-panel p-5 sm:p-6">
        <div className="text-[22px] font-semibold tracking-[-0.02em]">
          Passend dazu. <span className="text-muted">{p.cat === 'belaege' || p.cat === 'hoelzer' || p.cat === 'schlaeger' ? 'Für Montage und Pflege.' : 'Zubehör für diesen Artikel.'}</span>
        </div>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center">
          <ul className="flex flex-1 flex-col divide-y divide-line lg:flex-row lg:flex-wrap lg:items-center lg:gap-2 lg:divide-y-0">
            <li className="flex items-center gap-3 py-2 lg:w-[150px] lg:flex-col lg:py-0 lg:text-center">
              <span className="size-4 shrink-0 lg:hidden" />
              <div className="size-14 shrink-0 tile rounded-[12px] p-1.5 lg:size-20">
                <Img thumb src={p.images[0]} alt="" className="size-full object-contain" />
              </div>
              <div className="min-w-0 flex-1 lg:flex-none">
                <div className="line-clamp-2 text-[13px] font-medium">Dieser Artikel: {p.title}</div>
                <div className="num text-[13px]">{formatPrice(p.price + extra)}</div>
              </div>
            </li>
            {picks.map((x) => (
              <li key={x.id} className={cx('flex items-center gap-3 py-2 lg:gap-2 lg:py-0', !on[x.id] && 'opacity-50')}>
                <span className="hidden text-[20px] text-subtle lg:inline">+</span>
                <label className="flex flex-1 cursor-pointer items-center gap-3 lg:w-[150px] lg:flex-none lg:flex-col lg:text-center">
                  <input type="checkbox" checked={!!on[x.id]} onChange={(e) => setOn({ ...on, [x.id]: e.target.checked })} className="check lg:order-first" aria-label={`${x.title} mitbestellen`} />
                  <div className="size-14 shrink-0 tile rounded-[12px] p-1.5 lg:size-20">
                    <Img thumb src={x.images[0]} alt="" className="size-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1 lg:flex-none">
                    <div className="line-clamp-2 text-[13px] font-medium">{x.title}</div>
                    <div className="num text-[13px]">{formatPrice(x.price)}</div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
          <div className="shrink-0 rounded-md bg-panel p-4 lg:w-64">
            <div className="text-[13px] text-muted">Gesamtpreis</div>
            <div className="num text-[22px] font-bold">{formatPrice(total)}</div>
            <button type="button" onClick={addAll} className="btn btn-dark mt-2 w-full">
              Alle in den Warenkorb
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Einordnung & Teilen ---------------- */
function SuitBox({ p }: { p: P }) {
  const s = suitability(p)!;
  const alts = s.level === 'Leistungsspieler' || s.code === 'OF' ? easierAlternatives(p) : [];
  return (
    <div className="mt-5 rounded-[16px] bg-panel p-4 text-[13.5px]">
      <div className="flex items-center gap-2">
        <span className="rounded-[6px] bg-ink px-1.5 py-0.5 text-[11.5px] leading-none font-semibold text-white">{s.code}</span>
        <span className="font-semibold">{s.style}</span>
        <span className="ml-auto">
          <InfoHint text={SUIT_INFO} />
        </span>
      </div>
      <div className="mt-1.5 text-ink-2">
        Empfohlen für <b>{s.level}</b> · {s.note}
      </div>
      {alts.length > 0 && (
        <div className="mt-2 text-[12.5px] text-muted">
          Mehr Kontrolle gesucht?{' '}
          {alts.map((a, i) => (
            <span key={a.id}>
              {i > 0 && ', '}
              <Link to={`/p/${a.id}`} className="link">
                {a.title}
              </Link>
              {a.specs.hardness ? ` (${fmtNum(a.specs.hardness)}°)` : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ShareButton({ title }: { title: string }) {
  const notify = useUI((s) => s.notify);
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard?.writeText(url);
    notify('Link kopiert');
  };
  return (
    <button type="button" onClick={share} className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink">
      {typeof navigator !== 'undefined' && 'share' in navigator ? <Share2 size={16} /> : <Link2 size={16} />} Teilen
    </button>
  );
}

function SeriesTable({ p }: { p: P }) {
  const list = sameSeries(p);
  if (list.length < 2) return null;
  return (
    <section id="serie" className="mt-12 scroll-mt-12">
      <SectionHead title={`${p.brand} ${p.series} im Vergleich`} sub={`${list.length} Modelle dieser Serie bei uns`} />
      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table className="data-table min-w-[640px]">
          <thead>
            <tr>
              <th>Modell</th>
              {p.cat === 'belaege' ? (
                <>
                  <th>Belagart</th>
                  <th>Eignung</th>
                  <th>Härte</th>
                  <th>Stärken</th>
                </>
              ) : (
                <>
                  <th>Material</th>
                  <th>Furniere</th>
                  <th>Gewicht</th>
                </>
              )}
              <th className="text-right">Preis</th>
            </tr>
          </thead>
          <tbody>
            {list.map((x) => (
              <tr key={x.id} className={cx(x.id === p.id && 'bg-info-soft/60')}>
                <td>
                  <Link to={`/p/${x.id}`} className="flex items-center gap-2.5 font-medium hover:underline">
                    <div className="size-10 shrink-0 tile rounded-[10px] p-1">
                      <Img thumb src={x.images[0]} alt="" className="size-full object-contain" />
                    </div>
                    {x.title}
                    {x.id === p.id && <Tag tone="info">Dieser Artikel</Tag>}
                  </Link>
                </td>
                {p.cat === 'belaege' ? (
                  <>
                    <td>{x.specs.rubberType ?? '–'}</td>
                    <td className="whitespace-nowrap">{suitability(x) ? <span className="tag bg-ink text-white">{suitability(x)!.code}</span> : '–'}</td>
                    <td>
                      {x.specs.hardness ? (
                        <div className="flex items-center gap-2">
                          <span className="num w-11">{fmtNum(x.specs.hardness)}°</span>
                          <div className="w-24">
                            <HardnessGauge value={x.specs.hardness} compact />
                          </div>
                        </div>
                      ) : (
                        (x.specs.hardnessClass ?? '–')
                      )}
                    </td>
                    <td>{thicknessRange(x.specs.thicknesses) ?? '–'}</td>
                  </>
                ) : (
                  <>
                    <td>{x.specs.material ?? '–'}</td>
                    <td>{x.specs.plies ? `${x.specs.plies}-lagig` : '–'}</td>
                    <td className="num">{x.specs.weight ? `${x.specs.weight} g` : '–'}</td>
                  </>
                )}
                <td className="text-right">
                  <Price p={x} size="sm" className="justify-end" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecentlyViewed({ exclude }: { exclude: string }) {
  const recent = useSaved((s) => s.recent);
  const items = recent
    .filter((id) => id !== exclude)
    .map((id) => getProduct(id))
    .filter(Boolean) as P[];
  if (items.length < 2) return null;
  return (
    <section className="mt-12">
      <SectionHead title="Zuletzt angesehen" />
      <ProductRail items={items.slice(0, 10)} />
    </section>
  );
}

/* ---------------- Seite ---------------- */
function CutoffHint({ fallback }: { fallback: string }) {
  const left = useCutoff();
  if (left === null) return <div className="text-[12px] text-muted">{fallback}</div>;
  return (
    <div className="text-[12px] text-ink-2">
      <span className="num font-semibold text-ok">Noch {fmtDuration(left)}</span> bestellen – dann zählt heute als erster Werktag.
    </div>
  );
}

export default function Product() {
  const { id = '' } = useParams();
  const [sp] = useSearchParams();
  const p = getProduct(id);
  const d = useDetails(id);
  const optionsReady = useOptions();
  const add = useCart((s) => s.add);
  const showAdded = useUI((s) => s.showAdded);
  const viewed = useSaved((s) => s.viewed);
  const [qty, setQty] = useState(1);
  const { sel, setSel, errors, extra, validate } = useOptionState(p);
  const [show3d, setShow3d] = useState(sp.get('view') === '3d');
  const [ar, setAr] = useState(sp.get('ar') === '1');
  const [sticky, setSticky] = useState(false);
  const buyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!p) return;
    viewed(p.id);
    setQty(1);
  }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSticky(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [p?.id]);

  const delivery = useMemo(() => (p ? deliveryWindow(p) : null), [p]);
  const xsell = useMemo(() => (p ? crossSell(p) : []), [p]);
  const rel = useMemo(() => (p ? related(p) : []), [p]);
  usePageMeta(
    p ? `${p.title}${p.brand && !p.title.startsWith(p.brand) ? ` von ${p.brand}` : ''} kaufen` : null,
    d?.short || (p ? `${p.title} – ${[p.specs.rubberType, p.specs.material].filter(Boolean).join(', ')} beim Tischtennis-Fachhändler.` : undefined),
    p?.images[0],
  );
  useJsonLd('ld-product', p ? productLd(p) : null);
  useJsonLd('ld-breadcrumb', p ? breadcrumbLd([{ to: '/', label: 'Startseite' }, { to: `/c/${p.cat}`, label: getCategory(p.cat)?.name ?? '' }, { label: p.title }]) : null);

  if (!p || !delivery) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="h1">Artikel nicht gefunden.</h1>
        <Link to="/" className="btn btn-dark mt-6">
          Zur Startseite
        </Link>
      </div>
    );
  }

  const cat = getCategory(p.cat)!;
  const groups = p.options;
  const doAdd = () => {
    const opts = validate();
    if (!opts) {
      buyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    add(p.id, qty, { opts });
    showAdded({ id: p.id, qty, opts });
  };
  const chips = [
    p.specs.rubberType,
    p.specs.hardness ? `${fmtNum(p.specs.hardness)}° ${p.specs.hardnessClass ?? ''}` : null,
    p.specs.material,
    p.specs.plies ? `${p.specs.plies}-lagig` : null,
    p.specs.weight ? `${p.specs.weight} g` : null,
    p.specs.class,
    p.specs.usage,
    p.specs.topMm ? `${fmtNum(p.specs.topMm)} mm Platte` : null,
    p.specs.ittf ? 'ITTF-zugelassen' : null,
    p.specs.stars ? '★'.repeat(p.specs.stars) : null,
    p.specs.playerType,
  ].filter(Boolean) as string[];
  const suit = suitability(p);
  const pair = pairPrice(p);
  const promo =
    p.cat === 'belaege' && !p.sale ? '15 % Rabatt ab zwei Belägen – automatisch im Warenkorb.' : p.cat === 'hoelzer' && !p.sale ? '10 % Rabatt auf dieses Holz – automatisch im Warenkorb.' : null;
  const sections = [
    { id: 'daten', label: 'Technische Daten' },
    { id: 'beschreibung', label: 'Beschreibung' },
    ...(sameSeries(p).length > 1 ? [{ id: 'serie', label: 'Serienvergleich' }] : []),
    ...(xsell.length ? [{ id: 'zubehoer', label: 'Zubehör' }] : []),
  ];

  return (
    <div className="pb-24">
      <div className="container-x">
        <Breadcrumbs
          items={[
            { to: '/', label: 'Startseite' },
            { to: `/c/${p.cat}`, label: cat.name },
            ...(subName(p.cat, p.sub) ? [{ to: `/c/${p.cat}/${p.sub}`, label: subName(p.cat, p.sub)! }] : []),
            { label: p.title },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-10">
          <div className="min-w-0 lg:sticky lg:top-[calc(var(--hdr)+24px)] lg:self-start">
            <Gallery p={p} show3d={show3d} setShow3d={setShow3d} onAR={() => setAr(true)} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[13px] font-semibold">
              {p.sale && <span className="text-red">Sale</span>}
              {p.discontinued && <span className="text-warn">Auslaufmodell</span>}
              <Link to={`/marke/${slugify(p.brand)}`} className="text-muted hover:text-ink">
                {p.brand}
              </Link>
            </div>
            <h1 className="mt-1 text-[30px] leading-[1.08] font-semibold tracking-[-0.03em] sm:text-[40px]">{p.title}</h1>
            {p.tag && <div className="mt-1.5 text-[17px] tracking-[-0.01em] text-muted">{p.tag}</div>}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
              {p.sku && <span className="num">Art.-Nr. {p.sku}</span>}
              <a href="#daten" className="link">
                Technische Daten
              </a>
            </div>
            {chips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {chips.map((c) => (
                  <span key={c} className="inline-flex h-7 items-center rounded-full bg-panel px-3 text-[12.5px] font-medium text-ink-2">
                    {c}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6">
              <Price p={p} size="xl" extra={extra} />
              <div className="mt-1 text-[12.5px] text-muted">
                inkl. MwSt., zzgl.{' '}
                <Link to="/service" className="link">
                  Versandkosten
                </Link>
                {extra > 0 && ` · inkl. Optionen ${formatPrice(extra)}`}
                {p.unitPrice && <span className="block">Grundpreis: {p.unitPrice}</span>}
              </div>
              {pair && (
                <div className="num mt-1 text-[13.5px] font-semibold text-red-dark">
                  {pair.label} <span className="font-normal text-muted">(z. B. für Vor- und Rückhand)</span>
                </div>
              )}
              {promo && <p className="mt-2 text-[13.5px] font-medium text-red-dark">{promo}</p>}
              {suit && <SuitBox p={p} />}
            </div>

            <div ref={buyRef} className="mt-7 space-y-7">
              {!optionsReady && p.hasOptions && (
                <div className="space-y-2" aria-busy="true">
                  <div className="h-5 w-40 animate-pulse rounded-full bg-panel" />
                  <div className="h-14 animate-pulse rounded-[12px] bg-panel" />
                </div>
              )}
              {groups.map((g) => (
                <OptionPicker key={g.name} g={g} sel={sel} setSel={setSel(g.name)} error={errors.includes(g.name)} />
              ))}
              {errors.length > 0 && (
                <div className="flex items-center gap-2 text-[13px] font-medium text-red">
                  <AlertCircle size={16} /> Bitte wähle: {errors.join(', ')}
                </div>
              )}
              <div className="flex items-stretch gap-2">
                {!p.freight && <QtyStepper value={qty} onChange={(n) => setQty(Math.max(1, n))} />}
                <button type="button" onClick={doAdd} className="btn btn-primary btn-lg min-w-0 flex-1 px-5">
                  <ShoppingBag size={18} /> In den Warenkorb
                </button>
              </div>
              {(p.cat === 'belaege' || p.cat === 'hoelzer') && (
                <Link to={p.cat === 'hoelzer' ? `/konfigurator?holz=${p.id}` : `/konfigurator?vh=${p.id}`} className="btn btn-outline w-full">
                  <Wrench size={16} /> {p.cat === 'hoelzer' ? 'Mit diesem Holz Schläger zusammenstellen' : 'Im Schläger-Konfigurator verwenden'}
                </Link>
              )}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <WishButton id={p.id} label className="text-ink-2 hover:text-ink" />
                <ShareButton title={p.title} />
                <CompareToggle id={p.id} />
              </div>
            </div>

            <div className="mt-7 divide-y divide-black/[0.06] rounded-[18px] bg-panel text-[13.5px]">
              <div className="flex gap-3 p-4">
                <span className={cx('mt-1.5 size-2.5 shrink-0 rounded-full', p.inStock ? 'bg-ok' : 'bg-warn')} />
                <div>
                  <div className={cx('font-semibold', p.inStock ? 'text-ok' : 'text-warn')}>{p.inStock ? (p.freight ? 'Lieferbar' : 'Auf Lager') : 'Versandfertig in 2–5 Werktagen'}</div>
                  <div className="text-ink-2">
                    Lieferung voraussichtlich <b>{delivery.label}</b> · {delivery.method}
                  </div>
                  <CutoffHint fallback={delivery.hint} />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4">
                <Truck size={17} className="shrink-0 text-muted" />
                {p.freight ? 'Kostenlose Lieferung per Spedition innerhalb Deutschlands' : `Versandkostenfrei ab ${formatPrice(SHOP.freeShippingFrom)}, sonst ${formatPrice(SHOP.shippingFee)}`}
              </div>
              {(p.cat === 'hoelzer' || p.cat === 'belaege') && (
                <Link to="/konfigurator" className="flex items-center gap-3 p-4 hover:bg-black/[0.03]">
                  <Wrench size={17} className="shrink-0 text-red" />
                  <span>
                    <b>Montage-Service:</b> {p.cat === 'belaege' ? 'auf dein Holz montiert' : 'Beläge aufziehen'} inkl. Kantenband für 2,00 € – <span className="link">zum Schläger-Konfigurator</span>
                  </span>
                </Link>
              )}
              <div className="flex items-center gap-3 p-4">
                <RotateCcw size={17} className="shrink-0 text-muted" /> 14 Tage Widerrufsrecht
              </div>
              <div className="flex items-center gap-3 p-4">
                <ShieldCheck size={17} className="shrink-0 text-muted" /> Trusted Shops Käuferschutz · {SHOP.rating.value.toLocaleString('de-DE')}/5
              </div>
            </div>
            <div className="mt-4 rounded-[18px] border border-line p-4">
              <div className="text-[15px] font-semibold tracking-[-0.01em]">Hilfe beim Einkauf.</div>
              <p className="mt-0.5 text-[13.5px] text-muted">Fragen zu Härte, Stärke oder Kombination? Frag unseren Assistenten oder ruf uns an.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => openChat(`Ich habe eine Frage zu ${p.title}.`)} className="btn btn-ghost btn-sm">
                  <MessageCircle size={15} /> Assistent fragen
                </button>
                <a href={SHOP.phoneHref} className="btn btn-ghost btn-sm">
                  <Phone size={15} /> {SHOP.phone}
                </a>
              </div>
            </div>
            <PaymentBadges className="mt-4" />
          </div>
        </div>
      </div>

      <Highlights p={p} />

      <Together p={p} validate={validate} extra={extra} />

      {/* Abschnitts-Navigation mit festem Kaufen-Button (wie die lokale Navigation bei Apple) */}
      <div className="sticky top-[var(--hdr)] z-20 mt-10 border-y border-black/[0.06] bg-white/85 backdrop-blur-xl">
        <div className="container-x flex items-center gap-4">
          <div className="hidden min-w-0 shrink text-[15px] font-semibold tracking-[-0.01em] lg:block lg:max-w-[280px] lg:truncate">{p.title}</div>
          <nav className="no-scrollbar flex min-w-0 flex-1 gap-6 overflow-x-auto lg:justify-end">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="shrink-0 py-3.5 text-[13.5px] text-ink-2 hover:text-ink">
                {s.label}
              </a>
            ))}
          </nav>
          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <Price p={p} extra={extra} size="sm" />
            <button type="button" onClick={doAdd} className="btn btn-blue btn-sm h-8 px-4">
              Kaufen
            </button>
          </div>
        </div>
      </div>

      <div className="container-x">
        <section id="daten" className="mt-8 scroll-mt-12">
          <SectionHead title="Technische Daten" sub="Werte laut Hersteller bzw. Produktdatenblatt" />
          <SpecSheet p={p} d={d} />
        </section>

        <section id="beschreibung" className="mt-12 scroll-mt-12">
          <SectionHead title="Beschreibung" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-ink-2">
              {!d && <div className="h-24 animate-pulse rounded bg-panel" />}
              {d?.short && <p className="font-medium text-ink">{d.short}</p>}
              {d?.paragraphs?.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
              {d?.bullets && d.bullets.length > 0 && (
                <ul className="list-disc space-y-1 pl-5">
                  {d.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="h-fit rounded-[22px] bg-panel p-6 text-[14px]">
              <div className="text-[17px] font-semibold tracking-[-0.015em]">Beratung vom Fachhändler.</div>
              <p className="mt-1 text-ink-2">Unsicher bei Härte, Stärke oder Kombination? Wir beraten dich persönlich – auch zu Vereinskonditionen.</p>
              <a href={SHOP.phoneHref} className="btn btn-dark btn-sm mt-3">
                <Phone size={14} /> {SHOP.phone}
              </a>
            </div>
          </div>
        </section>

        <SeriesTable p={p} />

        {xsell.length > 0 && (
          <section id="zubehoer" className="mt-12 scroll-mt-12">
            <SectionHead title="Passendes Zubehör" />
            <ProductRail items={xsell} />
          </section>
        )}
        <RecentlyViewed exclude={p.id} />
        {rel.length > 0 && (
          <section className="mt-12">
            <SectionHead
              title="Ähnliche Artikel"
              action={
                <Link to={`/c/${p.cat}${subName(p.cat, p.sub) ? '/' + p.sub : ''}`} className="link text-[14px]">
                  Alle anzeigen
                </Link>
              }
            />
            <ProductRail items={rel} />
          </section>
        )}
      </div>

      {/* Sticky-Kaufleiste */}
      <AnimatePresence>
        {sticky && (
          <motion.div
            initial={{ y: 90 }}
            animate={{ y: 0 }}
            exit={{ y: 90 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/85 shadow-bar backdrop-blur-xl lg:hidden"
          >
            <div className="container-x flex items-center gap-3 py-2.5">
              <div className="tile hidden size-11 shrink-0 rounded-[10px] p-0.5 sm:block">
                <Img thumb src={p.images[0]} alt="" className="size-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-medium">{p.title}</div>
                <Price p={p} extra={extra} size="sm" />
              </div>
              <button type="button" onClick={doAdd} className="btn btn-primary h-11 shrink-0 px-5">
                <ShoppingBag size={17} /> <span className="hidden sm:inline">In den Warenkorb</span>
                <span className="sm:hidden">Kaufen</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {p.table && ar && (
        <LazyScene>
          <ARSheet open={ar} onClose={() => setAr(false)} kind={p.table.kind} color={p.table.color} title={p.title} sharePath={`/p/${p.id}?ar=1`} />
        </LazyScene>
      )}
    </div>
  );
}
