import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, GitCompareArrows, Heart } from 'lucide-react';
import { formatPrice, specLine, type Product } from '../lib/catalog';
import { pairPrice, suitability } from '../lib/advice';
import { useSaved, useUI } from '../store/ui';
import { ColorDot, cx, Img, Price } from './ui';

export function WishButton({ id, className, size = 17, label }: { id: string; className?: string; size?: number; label?: boolean }) {
  const on = useSaved((s) => s.wishlist.includes(id));
  const toggle = useSaved((s) => s.toggleWish);
  const notify = useUI((s) => s.notify);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label ? undefined : on ? 'Von der Merkliste entfernen' : 'Auf die Merkliste'}
      title={on ? 'Von der Merkliste entfernen' : 'Auf die Merkliste'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        notify(toggle(id) ? 'Auf der Merkliste gespeichert' : 'Von der Merkliste entfernt');
      }}
      className={cx('inline-flex items-center justify-center gap-1.5 transition-colors', className)}
    >
      <Heart size={size} strokeWidth={1.75} className={cx('transition-transform active:scale-90', on ? 'fill-red text-red' : 'text-ink-2')} />
      {label && <span className="text-[13.5px]">{on ? 'Gemerkt' : 'Merken'}</span>}
    </button>
  );
}

/** Vergleichen-Schalter: als Text-Button (Produktseite, Schnellansicht) oder als runder Icon-Button (Karten, Tabelle) */
export function CompareToggle({ id, className, compact }: { id: string; className?: string; compact?: boolean }) {
  const on = useSaved((s) => s.compare.includes(id));
  const toggle = useSaved((s) => s.toggleCompare);
  const notify = useUI((s) => s.notify);
  const click = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const r = toggle(id);
    if (r === 'full') notify('Maximal 4 Artikel je Kategorie vergleichen');
    else notify(on ? 'Aus dem Vergleich entfernt' : 'Zum Vergleich hinzugefügt');
  };
  if (compact) {
    return (
      <button
        type="button"
        data-compare={id}
        aria-pressed={on}
        aria-label={on ? 'Aus dem Produktvergleich entfernen' : 'Zum Produktvergleich hinzufügen'}
        title={on ? 'Im Vergleich' : 'Vergleichen'}
        onClick={click}
        className={cx('grid place-items-center rounded-full transition-colors', on ? 'bg-ink text-white' : 'text-ink-2 hover:text-ink', className)}
      >
        {on ? <Check size={15} strokeWidth={2.4} /> : <GitCompareArrows size={15} strokeWidth={1.75} />}
      </button>
    );
  }
  return (
    <button
      type="button"
      data-compare={id}
      aria-pressed={on}
      onClick={click}
      className={cx('inline-flex items-center gap-1.5 text-[13.5px] transition-colors', on ? 'text-ink' : 'text-ink-2 hover:text-ink', className)}
    >
      {on ? <Check size={16} strokeWidth={2.4} className="text-ok" /> : <GitCompareArrows size={16} strokeWidth={1.75} />}
      {on ? 'Im Vergleich' : 'Vergleichen'}
    </button>
  );
}

export function StockLine({ p, className }: { p: Product; className?: string }) {
  return (
    <div className={cx('flex items-center gap-1.5 text-[12px]', className)}>
      <span className={cx('size-1.5 shrink-0 rounded-full', p.inStock ? 'bg-ok' : 'bg-warn')} />
      <span className={cx('truncate', p.inStock ? 'text-ok' : 'text-warn')}>{p.inStock ? (p.freight ? 'Lieferbar, Spedition' : 'Auf Lager') : 'In 2–5 Tagen versandfertig'}</span>
    </div>
  );
}

/**
 * Produktkarte im Store-Stil: weiße Karte, Produkt auf hellgrauer Bildfläche, ruhige Typografie.
 * Merken und Vergleichen sitzen auf dem Bild, die Schnellansicht erscheint am Desktop beim Überfahren.
 */
export function ProductCard({ p, priority, className }: { p: Product; priority?: boolean; className?: string }) {
  const specs = specLine(p);
  const suit = suitability(p);
  const pair = pairPrice(p);
  const openQuick = useUI((s) => s.setQuickView);
  const inCompare = useSaved((s) => s.compare.includes(p.id));
  return (
    <div className={cx('store-card group flex flex-col', className)}>
      <div className="relative m-2 mb-0 overflow-hidden rounded-[14px] bg-[#f5f5f7]">
        <Link to={`/p/${p.id}`} className="block aspect-square p-[9%]" tabIndex={-1} aria-hidden="true">
          <Img thumb src={p.images[0]} alt="" eager={priority} className="size-full object-contain mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-[1.04]" />
        </Link>
        {(p.sale || p.discontinued) && (
          <span className={cx('absolute top-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[11.5px] leading-none font-semibold shadow-sm', p.sale ? 'text-red' : 'text-muted')}>
            {p.sale ? 'Sale' : 'Auslauf'}
          </span>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          <WishButton id={p.id} size={16} className="size-8 rounded-full bg-white/95 shadow-sm hover:bg-white" />
          <CompareToggle
            id={p.id}
            compact
            className={cx('size-8 bg-white/95 shadow-sm', inCompare ? '!bg-ink' : 'hidden lg:grid lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100 lg:focus-visible:opacity-100')}
          />
        </div>
        <button
          type="button"
          onClick={() => openQuick(p.id)}
          aria-label={`Schnellansicht: ${p.title}`}
          className="absolute inset-x-3 bottom-3 hidden h-9 translate-y-1 items-center justify-center rounded-full bg-white/95 text-[13px] font-medium text-ink opacity-0 shadow-sm backdrop-blur transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 lg:flex"
        >
          Schnellansicht
        </button>
      </div>
      <div className="flex flex-1 flex-col px-3.5 pt-3 pb-4 sm:px-4">
        <div className="flex h-5 items-center gap-1">
          {p.cat === 'belaege' && p.specs.colors?.map((c) => <ColorDot key={c} color={c} size={10} />)}
          {p.cat === 'belaege' && p.specs.thicknesses && (
            <span className="ml-1 truncate text-[11.5px] text-muted">
              {p.specs.thicknesses.length} {p.specs.thicknesses.length === 1 ? 'Stärke' : 'Stärken'}
            </span>
          )}
          {suit && (
            <span
              className="ml-auto shrink-0 rounded-[6px] bg-panel px-1.5 py-0.5 text-[11px] leading-none font-semibold text-ink-2"
              title={`TT-Shop-Einordnung (abgeleitet): ${suit.style} · ${suit.level}`}
            >
              {suit.code}
            </span>
          )}
        </div>
        <Link to={`/p/${p.id}`} className="mt-2 line-clamp-2 min-h-[2.6em] text-[15px] leading-[1.3] font-semibold tracking-[-0.012em] transition-colors hover:text-info">
          {p.title}
        </Link>
        {specs.length > 0 && <div className="mt-1 truncate text-[12.5px] text-muted">{specs.slice(0, 3).join(' · ')}</div>}
        <div className="mt-auto pt-3">
          <Price p={p} size="md" />
          {pair && <div className="num mt-0.5 truncate text-[12px] text-red-dark">ab 2 Stk. je {formatPrice(pair.each)}</div>}
          {p.unitPrice && <div className="truncate text-[11px] text-muted">{p.unitPrice}</div>}
          <StockLine p={p} className="mt-2" />
        </div>
      </div>
    </div>
  );
}

/** Horizontale Produktreihe im Store-Stil: läuft rechts über den Rand hinaus, Pfeile unter der Reihe */
export function ProductRail({ items, className }: { items: Product[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };
  useEffect(update, [items.length]);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * Math.max(300, ref.current.clientWidth * 0.75), behavior: 'smooth' });
  return (
    <div className={cx('relative', className)}>
      <div ref={ref} onScroll={update} className="snap-row -mx-4 scroll-px-4 px-4 py-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 rail-bleed" style={{ marginTop: '-1rem', marginBottom: '-0.5rem' }}>
        {items.map((p, i) => (
          <ProductCard key={p.id} p={p} priority={i < 2} className="w-[64vw] max-w-[300px] shrink-0 sm:w-[38vw] md:w-[29vw] lg:w-[286px] xl:w-[300px]" />
        ))}
      </div>
      {items.length > 3 && (
        <div className="mt-3 hidden justify-end gap-2.5 md:flex">
          <button
            type="button"
            onClick={() => scroll(-1)}
            disabled={edge.start}
            aria-label="Zurück"
            className="grid size-9 place-items-center rounded-full bg-black/[0.06] text-ink transition-colors hover:bg-black/[0.1] disabled:opacity-35"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            disabled={edge.end}
            aria-label="Weiter"
            className="grid size-9 place-items-center rounded-full bg-black/[0.06] text-ink transition-colors hover:bg-black/[0.1] disabled:opacity-35"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
