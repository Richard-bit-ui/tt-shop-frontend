import { useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronRight, Info, Minus, Plus, Star, X } from 'lucide-react';
import { COLOR_HEX, discountPct, formatPrice, type Product } from '../lib/catalog';

import { asset } from '../lib/asset';
export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

/* ---------- Bild mit Fade-in ---------- */
/** Produktbilder gibt es zusätzlich als 480-px-Vorschau (…-t.webp) */
export const toThumb = (src: string) => (src.startsWith(asset('/img/p/')) && src.endsWith('.webp') && !src.endsWith('-t.webp') ? src.replace(/\.webp$/, '-t.webp') : src);

export function Img({ src, alt, className, eager, thumb }: { src: string; alt: string; className?: string; eager?: boolean; thumb?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [fallback, setFallback] = useState(false);
  return (
    <img
      src={thumb && !fallback ? toThumb(src) : src}
      onError={() => thumb && !fallback && setFallback(true)}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : undefined}
      draggable={false}
      onLoad={() => setLoaded(true)}
      ref={(el) => {
        if (el?.complete && el.naturalWidth) setLoaded(true);
      }}
      data-loaded={loaded}
      className={cx(!eager && 'img-fade', className)}
    />
  );
}

export function Logo({ className, invert }: { className?: string; invert?: boolean }) {
  return (
    <img
      src={asset('/brand/tt-shop-logo.png')}
      alt="TT-Shop – Der Tischtennis Shop"
      width={235}
      height={61}
      className={cx('h-[26px] w-auto md:h-[28px]', invert && 'brightness-0 invert', className)}
    />
  );
}

/* ---------- Preis ---------- */
export function Price({ p, size = 'md', className, extra = 0 }: { p: Pick<Product, 'price' | 'oldPrice'>; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string; extra?: number }) {
  const pct = discountPct(p);
  const cls = { sm: 'text-[14px]', md: 'text-[16px]', lg: 'text-[20px]', xl: 'text-[28px]' }[size];
  return (
    <div className={cx('price flex flex-wrap items-baseline gap-x-2', className)}>
      <span className={cx('font-bold tracking-tight', cls, p.oldPrice ? 'text-red' : 'text-ink')}>{formatPrice(p.price + extra)}</span>
      {p.oldPrice && (
        <>
          <span className={cx('text-muted line-through', size === 'sm' ? 'text-[12px]' : 'text-[13px]')}>UVP {formatPrice(p.oldPrice)}</span>
          {pct > 0 && <span className="tag bg-red-soft text-red-dark">−{pct} %</span>}
        </>
      )}
    </div>
  );
}

export function Tag({ children, tone = 'grey', className }: { children: ReactNode; tone?: 'grey' | 'red' | 'dark' | 'ok' | 'info' | 'warn'; className?: string }) {
  const tones = { grey: 'bg-panel-2 text-ink-2', red: 'bg-red text-white', dark: 'bg-ink text-white', ok: 'bg-ok-soft text-ok', info: 'bg-info-soft text-info', warn: 'bg-warn-soft text-warn' };
  return <span className={cx('tag', tones[tone], className)}>{children}</span>;
}

/* ---------- Belagfarben ---------- */
export function ColorDot({ color, size = 12 }: { color: string; size?: number }) {
  return <span title={color} className="inline-block shrink-0 rounded-full ring-1 ring-black/15" style={{ width: size, height: size, background: COLOR_HEX[color] ?? '#ccc' }} />;
}

/* ---------- Härte-Skala ---------- */
export function HardnessGauge({ value, compact }: { value: number; compact?: boolean }) {
  const min = 30;
  const max = 58;
  const pos = (v: number) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  return (
    <div className={cx('w-full', compact && 'max-w-[160px]')}>
      <div className="relative h-2 rounded-full bg-gradient-to-r from-[#d8e7f6] via-[#8ea6bf] to-[#2b2e33]">
        <span className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-red shadow" style={{ left: `${pos(value)}%` }} />
      </div>
      {!compact && (
        <div className="relative mt-1.5 h-4 text-[11px] text-muted">
          <span className="absolute left-0">{min}°</span>
          <span className="absolute -translate-x-1/2" style={{ left: `${pos(40)}%` }}>
            Soft
          </span>
          <span className="absolute -translate-x-1/2" style={{ left: `${pos(46)}%` }}>
            Medium
          </span>
          <span className="absolute -translate-x-1/2" style={{ left: `${pos(52)}%` }}>
            Hard
          </span>
          <span className="absolute right-0">{max}°</span>
        </div>
      )}
    </div>
  );
}

/* ---------- Bewertungssterne (Shop-Bewertung) ---------- */
export function Stars({ value = 5, size = 14 }: { value?: number; size?: number }) {
  return (
    <span className="inline-flex text-gold">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={size} className={i < Math.round(value) ? 'fill-current' : ''} />
      ))}
    </span>
  );
}

/* ---------- Mengenwahl ---------- */
export function QtyStepper({ value, onChange, min = 1, compact }: { value: number; onChange: (n: number) => void; min?: number; compact?: boolean }) {
  return (
    <div className={cx('inline-flex items-center rounded-full border border-line-2 bg-white', compact ? 'h-9' : 'h-12')}>
      <button
        type="button"
        className={cx('grid place-items-center rounded-full hover:bg-panel disabled:opacity-30', compact ? 'size-9' : 'size-12')}
        onClick={() => onChange(value - 1)}
        aria-label="Menge verringern"
        disabled={value <= min}
      >
        <Minus size={14} strokeWidth={2.2} />
      </button>
      <span className="num w-8 text-center text-[14px] font-semibold" aria-live="polite">
        {value}
      </span>
      <button type="button" className={cx('grid place-items-center rounded-full hover:bg-panel', compact ? 'size-9' : 'size-12')} onClick={() => onChange(value + 1)} aria-label="Menge erhöhen">
        <Plus size={14} strokeWidth={2.2} />
      </button>
    </div>
  );
}

/* ---------- Akkordeon ---------- */
export function Accordion({ title, children, defaultOpen, meta, className }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean; meta?: ReactNode; className?: string }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const id = useId();
  return (
    <div className={cx('border-b border-line', className)}>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 py-3.5 text-left">
        <span className="text-[14.5px] font-semibold">{title}</span>
        <span className="flex items-center gap-2 text-muted">
          {meta}
          <ChevronDown size={18} className={cx('transition-transform duration-200', open && 'rotate-180')} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={id} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function InfoHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button type="button" aria-label="Erklärung" onClick={() => setOpen(!open)} onBlur={() => setOpen(false)} className="text-subtle hover:text-ink">
        <Info size={14} />
      </button>
      {open && (
        <span className="absolute top-6 left-1/2 z-40 w-64 -translate-x-1/2 rounded-md bg-ink p-3 text-[12px] leading-snug font-normal tracking-normal text-white normal-case shadow-pop">{text}</span>
      )}
    </span>
  );
}

export function Breadcrumbs({ items }: { items: { to?: string; label: string }[] }) {
  return (
    <nav aria-label="Brotkrümel" className="no-scrollbar flex items-center gap-1 overflow-x-auto py-3 text-[12.5px] whitespace-nowrap text-muted">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} className="shrink-0" />}
          {it.to ? (
            <Link to={it.to} className="hover:text-ink hover:underline">
              {it.label}
            </Link>
          ) : (
            <span className="text-ink-2">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/* ---------- Einblenden beim Scrollen ---------- */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Hilfs-Hooks ---------- */
export function useLockBody(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const { overflow, paddingRight } = document.body.style;
    const sb = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (sb > 0) document.body.style.paddingRight = `${sb}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [active]);
}

export function useMedia(q: string) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const fn = () => setM(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [q]);
  return m;
}

/* ---------- Sheet: seitliches Panel (mobil vollbreit) ---------- */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  side = 'right',
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: 'right' | 'left';
  wide?: boolean;
}) {
  useLockBody(open);
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);
  const from = side === 'right' ? '100%' : '-100%';
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true">
          <motion.div className="absolute inset-0 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ x: from }}
            animate={{ x: 0 }}
            exit={{ x: from }}
            transition={{ type: 'tween', duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
            className={cx('absolute top-0 bottom-0 flex w-full flex-col bg-white shadow-pop', wide ? 'max-w-[560px]' : 'max-w-[420px]', side === 'right' ? 'right-0' : 'left-0')}
          >
            {title !== undefined && (
              <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line px-5">
                <div className="min-w-0 truncate text-[16px] font-bold tracking-[-0.01em]">{title}</div>
                <button type="button" className="icon-btn -mr-2" onClick={onClose} aria-label="Schließen">
                  <X size={20} />
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">{children}</div>
            {footer && <div className="safe-bottom shrink-0 border-t border-line bg-white px-5 py-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Zweifarbige Abschnittsüberschrift im Store-Stil: „Beläge. Tensor & Hybrid mit allen Daten.“ */
export function SectionHead({ title, sub, action, className }: { title: ReactNode; sub?: ReactNode; action?: ReactNode; className?: string }) {
  const t = typeof title === 'string' && sub && !/[.!?:…]$/.test(title) ? `${title}.` : title;
  return (
    <div className={cx('mb-5 flex flex-col gap-2 sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:gap-6', className)}>
      <h2 className="h2 max-w-[920px] min-w-0">
        {t}
        {sub && (
          <>
            {' '}
            <span className="text-muted">{sub}</span>
          </>
        )}
      </h2>
      {action && <div className="shrink-0 pb-1 text-[14px] sm:text-[15px] [&_a]:whitespace-nowrap">{action}</div>}
    </div>
  );
}

/** Zahlarten als kleine Karten mit den Markenfarben (statt grauer Textpillen) */
export function PaymentBadges({ className, dark }: { className?: string; dark?: boolean }) {
  const box = cx('inline-flex h-7 min-w-[46px] items-center justify-center rounded-[6px] px-2 text-[11px] leading-none font-bold', dark ? 'bg-white/95' : 'bg-white ring-1 ring-black/10');
  return (
    <div className={cx('flex flex-wrap gap-1.5', className)} aria-label="Zahlarten: PayPal, Apple Pay, Visa, Mastercard, Vorkasse, Rechnung für Vereine">
      <span className={box} title="PayPal">
        <i className="text-[12px] font-extrabold tracking-[-0.02em] text-[#003087] not-italic">
          Pay<span className="text-[#0070ba]">Pal</span>
        </i>
      </span>
      <span className={cx(box, 'text-[11.5px] font-semibold tracking-[-0.01em] text-black')} title="Apple Pay">
        Apple&nbsp;Pay
      </span>
      <span className={cx(box, 'text-[12.5px] font-black tracking-[0.02em] text-[#1a1f71] italic')} title="Visa">
        VISA
      </span>
      <span className={box} title="Mastercard">
        <svg viewBox="0 0 38 24" className="h-[15px] w-auto" aria-hidden="true">
          <circle cx="15" cy="12" r="9" fill="#eb001b" />
          <circle cx="23" cy="12" r="9" fill="#f79e1b" />
          <path d="M19 3.94a9 9 0 0 1 0 16.12a9 9 0 0 1 0-16.12z" fill="#ff5f00" />
        </svg>
      </span>
      <span className={cx(box, 'font-semibold text-ink-2')}>Vorkasse</span>
      <span className={cx(box, 'font-semibold text-ink-2')} title="Rechnung für Vereine, Schulen und Einrichtungen">
        Rechnung*
      </span>
    </div>
  );
}

export const thicknessLabel = (t: string) => (t === 'max' || t === 'OX' ? t : `${t} mm`);
