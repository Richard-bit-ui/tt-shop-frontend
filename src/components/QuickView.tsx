import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingBag, X, ZoomIn } from 'lucide-react';
import { getProduct, specLine, useOptions } from '../lib/catalog';
import { useCart } from '../store/cart';
import { useUI } from '../store/ui';
import { OptionPicker, useOptionState } from './Options';
import { CompareToggle, StockLine, WishButton } from './ProductCard';
import { cx, Img, Price, QtyStepper, Tag, useLockBody } from './ui';

/* ================= Schnellansicht ================= */
export function QuickView() {
  const id = useUI((s) => s.quickView);
  const close = useUI((s) => s.setQuickView);
  const p = id ? getProduct(id) : undefined;
  const add = useCart((s) => s.add);
  const showAdded = useUI((s) => s.showAdded);
  const ready = useOptions();
  const { sel, setSel, errors, extra, validate } = useOptionState(p);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  useLockBody(!!p);
  useEffect(() => {
    setQty(1);
    setImg(0);
  }, [id]);
  useEffect(() => {
    if (!p) return;
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && close(null);
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [p, close]);

  const doAdd = () => {
    if (!p) return;
    const opts = validate();
    if (!opts) return;
    add(p.id, qty, { opts });
    close(null);
    showAdded({ id: p.id, qty, opts });
  };
  // Hauptoptionen in der Schnellansicht; Zusatzartikel/Services nur auf der Produktseite
  const groups = p?.options.filter((g) => g.required || g.kind === 'variant' || g.kind === 'size' || g.kind === 'handle') ?? [];
  const hidden = (p?.options.length ?? 0) - groups.length;

  return createPortal(
    <AnimatePresence>
      {p && (
        <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Schnellansicht ${p.title}`}>
          <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => close(null)} />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2 }}
            className="relative flex max-h-[92dvh] w-full max-w-[960px] flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[0_30px_100px_-20px_rgb(0_0_0/0.45)] sm:rounded-[28px]"
          >
            <button
              type="button"
              onClick={() => close(null)}
              aria-label="Schließen"
              className="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-black/[0.06] text-ink-2 transition-colors hover:bg-black/[0.1]"
            >
              <X size={18} />
            </button>
            <div className="grid min-h-0 flex-1 overflow-y-auto sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div className="p-3 sm:p-4">
                <div className="tile relative aspect-square rounded-[20px] p-[8%]">
                  <Img src={p.images[img] ?? p.images[0]} alt={p.title} className="size-full object-contain" />
                  {p.sale && <span className="absolute top-3 left-3 rounded-full bg-white px-2.5 py-1 text-[11.5px] leading-none font-semibold text-red shadow-sm">Sale</span>}
                </div>
                {p.images.length > 1 && (
                  <div className="mt-3 flex gap-2">
                    {p.images.map((src, i) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setImg(i)}
                        aria-label={`Bild ${i + 1}`}
                        className={cx('tile size-14 rounded-[10px] p-1 ring-offset-2', i === img ? 'ring-2 ring-info' : 'hover:ring-1 hover:ring-line-2')}
                      >
                        <Img thumb src={src} alt="" className="size-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col px-5 pt-2 pb-6 sm:px-7 sm:pt-8">
                <div className="text-[13px] font-semibold text-muted">{p.brand}</div>
                <h2 className="mt-1 pr-10 text-[26px] leading-[1.1] font-semibold tracking-[-0.025em]">{p.title}</h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {specLine(p).map((s) => (
                    <span key={s} className="inline-flex h-7 items-center rounded-full bg-panel px-3 text-[12.5px] font-medium text-ink-2">
                      {s}
                    </span>
                  ))}
                </div>
                <Price p={p} extra={extra} size="xl" className="mt-5" />
                <div className="text-[12px] text-muted">inkl. MwSt., zzgl. Versandkosten</div>
                <div className="mt-6 space-y-6">
                  {!ready && p.hasOptions && <div className="h-20 animate-pulse rounded-[14px] bg-panel" />}
                  {groups.map((g) => (
                    <OptionPicker key={g.name} g={g} sel={sel} setSel={setSel(g.name)} error={errors.includes(g.name)} />
                  ))}
                  {hidden > 0 && <p className="text-[12.5px] text-muted">Montage, Versiegelung und Zubehör-Optionen findest du auf der Produktseite.</p>}
                </div>
                <div className="mt-7 flex gap-2">
                  {!p.freight && <QtyStepper value={qty} onChange={(n) => setQty(Math.max(1, n))} />}
                  <button type="button" onClick={doAdd} className="btn btn-primary min-w-0 flex-1 px-5">
                    <ShoppingBag size={17} /> In den Warenkorb
                  </button>
                </div>
                {errors.length > 0 && <div className="mt-2 text-[13px] font-medium text-red">Bitte wähle: {errors.join(', ')}</div>}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <StockLine p={p} />
                  <div className="flex items-center gap-4">
                    <WishButton id={p.id} label />
                    <CompareToggle id={p.id} />
                  </div>
                </div>
                <Link to={`/p/${p.id}`} onClick={() => close(null)} className="link-arrow mt-auto pt-6 text-[15px]">
                  Alle Details & technischen Daten <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ================= Bild-Lightbox mit Zoom ================= */
export function Lightbox({ images, start, title, onClose }: { images: string[]; start: number; title: string; onClose: () => void }) {
  const [i, setI] = useState(start);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  useLockBody(true);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setI((x) => (x + 1) % images.length);
      if (e.key === 'ArrowLeft') setI((x) => (x - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [images.length, onClose]);
  useEffect(() => setZoom(false), [i]);
  return createPortal(
    <div className="fixed inset-0 z-[95] flex flex-col bg-white" role="dialog" aria-modal="true" aria-label={`Bilder: ${title}`}>
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
        <div className="min-w-0 truncate text-[14px] font-medium">
          {title}{' '}
          <span className="num text-muted">
            · {i + 1}/{images.length}
          </span>
        </div>
        <button type="button" onClick={onClose} className="icon-btn" aria-label="Schließen">
          <X size={22} />
        </button>
      </div>
      <div
        className={cx('relative min-h-0 flex-1 overflow-hidden', zoom ? 'cursor-zoom-out' : 'cursor-zoom-in')}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
          setZoom(!zoom);
        }}
        onMouseMove={(e) => {
          if (!zoom) return;
          const r = e.currentTarget.getBoundingClientRect();
          setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
        }}
      >
        <img
          src={images[i]}
          alt={`${title} – Bild ${i + 1}`}
          className="size-full object-contain p-4 transition-transform duration-200"
          style={{ transform: zoom ? 'scale(2.4)' : 'none', transformOrigin: origin }}
          draggable={false}
        />
        {!zoom && (
          <span className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded bg-ink/80 px-2.5 py-1 text-[12px] text-white">
            <ZoomIn size={13} /> Klicken zum Vergrößern
          </span>
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setI((i - 1 + images.length) % images.length);
              }}
              aria-label="Vorheriges Bild"
              className="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-white shadow-pop"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setI((i + 1) % images.length);
              }}
              aria-label="Nächstes Bild"
              className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-white shadow-pop"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex shrink-0 justify-center gap-2 border-t border-line p-3">
          {images.map((src, k) => (
            <button key={src} type="button" onClick={() => setI(k)} aria-label={`Bild ${k + 1}`} className={cx('size-14 rounded border-2 p-0.5', k === i ? 'border-ink' : 'border-line')}>
              <img src={src.replace(/\.webp$/, '-t.webp')} alt="" className="size-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
