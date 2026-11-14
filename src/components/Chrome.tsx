import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, Check, Clock, GitCompareArrows, Mail, MapPin, PackageCheck, Phone, Search, TrendingUp, Truck, Wrench, X } from 'lucide-react';
import { BRANDS, CATEGORIES, crossSell, formatPrice, getProduct, search, SHOP, specLine } from '../lib/catalog';
import type { Guide } from '../lib/guides';
import { useCart, useCartTotals } from '../store/cart';
import { COMPARE_MAX, useSaved, useUI } from '../store/ui';
import { TABLE_COLORS } from '../three/tableSpec';
import { Accordion, cx, Img, Logo, PaymentBadges, Price, Sheet, Stars, useLockBody } from './ui';

/* ================= Footer ================= */
export function Footer() {
  const cols = [
    {
      title: 'Sortiment',
      links: CATEGORIES.map((c) => ({
        label: c.name,
        to: `/c/${c.id}`,
      })).concat([{ label: 'Marken A–Z', to: '/marken' }]),
    },
    {
      title: 'Service & Beratung',
      links: [
        { label: 'Material-Berater', to: '/berater' },
        { label: 'Ratgeber & Kaufberatung', to: '/ratgeber' },
        { label: 'Schläger-Konfigurator', to: '/konfigurator' },
        { label: 'Profi-Setups', to: '/profi-setups' },
        { label: 'Montage-Service', to: '/montage' },
        { label: 'Vereinsservice', to: '/verein' },
        { label: 'Produktvergleich', to: '/vergleich' },
        { label: 'Versand, Zahlung & Rabatte', to: '/service' },
        { label: 'Glossar', to: '/glossar' },
      ],
    },
    {
      title: 'TT-Shop.de',
      links: [
        { label: 'Fachgeschäft Dippoldiswalde', to: '/service' },
        { label: 'Firmenphilosophie', to: '/service' },
        { label: 'Nachhaltiges Handeln', to: '/service' },
        { label: 'Play for Africa', to: '/service' },
        { label: 'Tischtennis-Blog', to: '/service' },
      ],
    },
    {
      title: 'Rechtliches',
      links: [
        { label: 'AGB', to: '/service' },
        { label: 'Impressum', to: '/service' },
        { label: 'Widerrufsbelehrung', to: '/service' },
        { label: 'Datenschutz', to: '/service' },
        { label: 'Barrierefreiheit', to: '/service' },
      ],
    },
  ];
  return (
    <footer className="border-t border-line bg-panel text-[13px] text-muted">
      <div className="container-x">
        <div className="grid gap-6 border-b border-line py-9 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Truck, 'Versandkostenfrei ab 69 €', 'Darunter 5,90 € innerhalb Deutschlands'],
            [PackageCheck, 'Versand in 1–2 Werktagen', 'Mit DPD, Tische per Spedition'],
            [Wrench, 'Montage vom Fachhändler', 'Beläge inkl. Kantenband für 2,00 €'],
            [Phone, 'Persönliche Beratung', `${SHOP.phone} · ${SHOP.hours}`],
          ].map(([Icon, t, s]) => {
            const I = Icon as typeof Truck;
            return (
              <div key={t as string} className="flex items-start gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-ink shadow-[var(--shadow-card)]">
                  <I size={18} strokeWidth={1.8} />
                </span>
                <div>
                  <div className="text-[14px] font-semibold text-ink">{t as string}</div>
                  <div className="text-[13px]">{s as string}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-10 py-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed">
              Dein Tischtennis-Fachhändler: große Auswahl, Montage-Service und persönliche Beratung – für Hobby, Verein, Schulen und Unternehmen.
            </p>
            <div className="mt-5 space-y-2 text-[14px]">
              <a href={SHOP.phoneHref} className="flex items-center gap-2.5 text-ink hover:text-info">
                <Phone size={15} /> {SHOP.phone} <span className="text-muted">{SHOP.hours}</span>
              </a>
              <a href={`mailto:${SHOP.email}`} className="flex items-center gap-2.5 text-ink hover:text-info">
                <Mail size={15} /> {SHOP.email}
              </a>
              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="mt-0.5 shrink-0" /> {SHOP.address.join(', ')}
              </div>
            </div>
            <div className="mt-5 inline-flex items-center gap-3 rounded-[14px] bg-white px-4 py-2.5 text-[13px] text-ink shadow-[var(--shadow-card)]">
              <Stars size={13} />
              <span>
                <b>{SHOP.rating.value.toLocaleString('de-DE')}</b>/5 · {SHOP.rating.count} Bewertungen · Trusted Shops
              </span>
            </div>
          </div>
          <div className="hidden gap-8 md:grid md:grid-cols-4 lg:col-span-8">
            {cols.map((c) => (
              <div key={c.title}>
                <div className="mb-3 text-[13px] font-semibold text-ink">{c.title}</div>
                <ul className="space-y-2">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className="text-[13px] hover:text-ink hover:underline">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="md:hidden">
            {cols.map((c) => (
              <Accordion key={c.title} title={c.title}>
                <ul className="space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className="text-[14px]">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Accordion>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-line pt-6 lg:flex-row lg:items-center lg:justify-between">
          <PaymentBadges />
          <Link to="/widerruf" className="btn btn-outline btn-sm self-start lg:self-auto">
            Vertrag widerrufen
          </Link>
        </div>
        <p className="mt-6 text-[12px] leading-relaxed">
          * Alle Preise inkl. MwSt., zzgl. Versandkosten (5,90 € innerhalb Deutschlands, versandkostenfrei ab 69 €). Rechnungskauf für Vereine, Schulen und öffentliche Einrichtungen. Prototyp –
          Produktdaten und Bilder: tt-shop.de, Fotos: Unsplash und Pexels.
        </p>
        <div className="mt-4 flex flex-col gap-2 border-t border-line py-5 text-[12px] sm:flex-row sm:items-center sm:justify-between">
          <span>
            Copyright © {new Date().getFullYear()} {SHOP.address[0]}. Alle Rechte vorbehalten.
          </span>
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            {['Datenschutz', 'AGB', 'Impressum', 'Barrierefreiheit'].map((l) => (
              <Link key={l} to="/service" className="hover:text-ink hover:underline">
                {l}
              </Link>
            ))}
            <span className="text-ink">Deutschland</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ================= Suche ================= */
const POPULAR = ['Tibhar Evolution', 'Xiom Vega', 'Andro Rasanter', 'lange Noppen', 'Carbon Holz', 'Bälle 3 Stern', 'Roboter'];

function Highlight({ text, q }: { text: string; q: string }) {
  const terms = q
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!terms.length) return <>{text}</>;
  const re = new RegExp(`(${terms.join('|')})`, 'gi');
  return (
    <>
      {text.split(re).map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-sm bg-[#fff1a8] px-0.5 text-ink">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function SearchOverlay() {
  const open = useUI((s) => s.searchOpen);
  const setSearch = useUI((s) => s.setSearch);
  const { searches, searched, clearSearches } = useSaved();
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const nav = useNavigate();
  useLockBody(open);
  const results = useMemo(() => search(q, 8), [q]);
  const all = useMemo(() => search(q, 400), [q]);
  const brandHits = useMemo(() => (q.trim().length < 2 ? [] : BRANDS.filter((b) => b.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 4)), [q]);
  const [kb, setKb] = useState<{
    guides: Guide[];
    glossary: { term: string; text: string }[];
  } | null>(null);
  useEffect(() => {
    if (open && !kb) void import('../lib/guides').then((m) => setKb({ guides: m.GUIDES, glossary: m.GLOSSARY }));
  }, [open, kb]);
  const knowledge = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!kb || t.length < 2)
      return {
        guides: [] as Guide[],
        terms: [] as { term: string; text: string }[],
      };
    const words = t.split(/\s+/);
    const hay = (g: Guide) => [g.title, g.teaser, ...g.sections.map((x) => `${x.h ?? ''} ${(x.p ?? []).join(' ')}`)].join(' ').toLowerCase();
    return {
      guides: kb.guides.filter((g) => words.every((w) => hay(g).includes(w))).slice(0, 3),
      terms: kb.glossary.filter((g) => g.term.toLowerCase().startsWith(t) || (t.length > 3 && g.term.toLowerCase().includes(t))).slice(0, 3),
    };
  }, [kb, q]);
  const catHits = useMemo(() => {
    const m = new Map<string, number>();
    all.forEach((p) => m.set(p.cat, (m.get(p.cat) || 0) + 1));
    return [...m.entries()].map(([id, n]) => ({ c: CATEGORIES.find((c) => c.id === id)!, n })).sort((a, b) => b.n - a.n);
  }, [all]);

  useEffect(() => {
    if (open) {
      setQ('');
      setTimeout(() => input.current?.focus(), 50);
    }
  }, [open]);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearch(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [setSearch]);

  const go = (term: string) => {
    if (!term.trim()) return;
    searched(term.trim());
    setSearch(false);
    nav(`/suche?q=${encodeURIComponent(term.trim())}`);
  };
  const close = () => setSearch(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[90] bg-black/35 backdrop-blur-[2px]"
          onClick={close}
        >
          <div onClick={(e) => e.stopPropagation()} className="flex h-dvh flex-col bg-white md:h-auto md:max-h-[85vh] md:rounded-b-[28px] md:shadow-[0_30px_80px_-30px_rgb(0_0_0/0.4)]">
            <form
              className="container-x flex shrink-0 items-center gap-3 py-3 md:py-5"
              onSubmit={(e) => {
                e.preventDefault();
                go(q);
              }}
            >
              <div className="flex h-12 flex-1 items-center gap-3 rounded-[14px] bg-black/[0.05] px-4 focus-within:bg-white focus-within:ring-2 focus-within:ring-info/40 md:h-14">
                <Search size={19} className="shrink-0 text-muted" />
                <input
                  ref={input}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  type="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  placeholder="Belag, Holz, Marke, Artikelnummer …"
                  className="h-full w-full bg-transparent text-[17px] tracking-[-0.01em] outline-none placeholder:text-subtle md:text-[20px]"
                  aria-label="Suchbegriff"
                />
                {q && (
                  <button type="button" onClick={() => setQ('')} aria-label="Eingabe löschen" className="text-muted">
                    <X size={18} />
                  </button>
                )}
              </div>
              <button type="button" className="text-[15px] text-info" onClick={close}>
                Abbrechen
              </button>
            </form>
            <div className="container-x min-h-0 flex-1 overflow-y-auto pt-2 pb-8">
              {!q.trim() ? (
                <div className="grid gap-8 md:grid-cols-3">
                  {searches.length > 0 && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="overline">Zuletzt gesucht</div>
                        <button type="button" className="text-[12px] text-muted underline" onClick={clearSearches}>
                          Löschen
                        </button>
                      </div>
                      {searches.map((s) => (
                        <button key={s} type="button" onClick={() => go(s)} className="flex w-full items-center gap-2.5 py-2 text-left text-[15px] text-ink-2 hover:text-info">
                          <Clock size={15} className="text-muted" /> {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <div>
                    <div className="overline mb-2">Suchvorschläge</div>
                    {POPULAR.map((s) => (
                      <button key={s} type="button" onClick={() => go(s)} className="flex w-full items-center gap-2.5 py-2 text-left text-[15px] text-ink-2 hover:text-info">
                        <TrendingUp size={15} className="text-muted" /> {s}
                      </button>
                    ))}
                  </div>
                  <div>
                    <div className="overline mb-2">Kategorien</div>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map((c) => (
                        <Link key={c.id} to={`/c/${c.id}`} onClick={close} className="chip">
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : results.length === 0 && brandHits.length === 0 && knowledge.guides.length + knowledge.terms.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="text-[16px] font-semibold">Keine Treffer für „{q}“</div>
                  <p className="mt-1 text-[14px] text-muted">Prüfe die Schreibweise oder ruf uns an – wir finden das passende Material.</p>
                  <a href={SHOP.phoneHref} className="btn btn-outline btn-sm mt-4">
                    <Phone size={15} /> {SHOP.phone}
                  </a>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-[240px_1fr]">
                  <div className="space-y-5">
                    {catHits.length > 0 && (
                      <div>
                        <div className="overline mb-2">In Kategorien</div>
                        {catHits.map(({ c, n }) => (
                          <Link
                            key={c.id}
                            to={`/suche?q=${encodeURIComponent(q)}&kategorie=${encodeURIComponent(c.name)}`}
                            onClick={() => searched(q.trim())}
                            className="flex items-center justify-between py-1.5 text-[14px] text-ink-2 hover:text-info"
                          >
                            {c.name} <span className="num text-[12px] text-muted">{n}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    {brandHits.length > 0 && (
                      <div>
                        <div className="overline mb-2">Marken</div>
                        {brandHits.map((b) => (
                          <Link key={b.slug} to={`/marke/${b.slug}`} onClick={close} className="flex items-center justify-between py-1.5 text-[14px] text-ink-2 hover:text-info">
                            {b.name} <span className="num text-[12px] text-muted">{b.count}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    {knowledge.terms.length + knowledge.guides.length > 0 && (
                      <div>
                        <div className="overline mb-2">Wissen</div>
                        {knowledge.terms.map((g) => (
                          <Link key={g.term} to={`/glossar#${encodeURIComponent(g.term)}`} onClick={close} className="block rounded-md py-1.5 text-[13.5px] hover:underline">
                            <span className="font-semibold">{g.term}</span> <span className="text-muted">– {g.text.length > 70 ? `${g.text.slice(0, 70)}…` : g.text}</span>
                          </Link>
                        ))}
                        {knowledge.guides.map((g) => (
                          <Link key={g.slug} to={`/ratgeber/${g.slug}`} onClick={close} className="flex items-start gap-2 py-1.5 text-[13.5px] hover:underline">
                            <BookOpen size={14} className="mt-0.5 shrink-0 text-muted" /> {g.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  {results.length > 0 ? (
                    <div>
                      <div className="overline mb-2">Produkte</div>
                      <ul className="grid gap-x-6 sm:grid-cols-2">
                        {results.map((p) => (
                          <li key={p.id}>
                            <Link to={`/p/${p.id}`} onClick={() => searched(q.trim())} className="flex items-center gap-3 rounded-[14px] p-1.5 transition-colors hover:bg-panel">
                              <div className="tile size-14 shrink-0 rounded-[12px] p-1.5">
                                <Img thumb src={p.images[0]} alt="" className="size-full object-contain" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-[14px] font-medium">
                                  <Highlight text={p.title} q={q} />
                                </div>
                                <div className="truncate text-[12px] text-muted">{[p.brand, ...specLine(p)].join(' · ')}</div>
                              </div>
                              <Price p={p} size="sm" className="shrink-0 flex-col items-end gap-0" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <button type="button" onClick={() => go(q)} className="btn btn-dark btn-sm mt-5">
                        Alle {all.length} Ergebnisse anzeigen
                      </button>
                    </div>
                  ) : (
                    <div className="text-[14px] text-muted">Keine passenden Produkte – vielleicht hilft einer der Wissensartikel.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================= „In den Warenkorb gelegt“ ================= */
export function AddedSheet() {
  const added = useUI((s) => s.added);
  const close = useUI((s) => s.closeAdded);
  const t = useCartTotals();
  const add = useCart((s) => s.add);
  const notify = useUI((s) => s.notify);
  const p = added ? getProduct(added.id) : null;
  const recs = p ? crossSell(p, 4) : [];
  const extra = added?.opts?.reduce((n, o) => n + o.delta, 0) ?? 0;
  return (
    <Sheet
      open={!!added && !!p}
      onClose={close}
      title={
        <span className="flex items-center gap-2">
          <span className="grid size-5 place-items-center rounded-full bg-ok text-white">
            <Check size={12} strokeWidth={3} />
          </span>
          In den Warenkorb gelegt
        </span>
      }
      footer={
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-outline" onClick={close}>
            Weiter einkaufen
          </button>
          <Link to="/warenkorb" onClick={close} className="btn btn-primary">
            Zum Warenkorb
          </Link>
        </div>
      }
    >
      {p && added && (
        <div className="py-4">
          <div className="flex gap-3">
            <div className="tile size-20 shrink-0 rounded-[14px] p-1.5">
              <Img thumb src={p.images[0]} alt="" className="size-full object-contain" />
            </div>
            <div className="min-w-0 text-[13px]">
              <div className="text-[14px] leading-snug font-semibold">{p.title}</div>
              {added.color && <div className="text-muted">Farbe: {TABLE_COLORS[added.color].label}</div>}
              {added.opts?.map((o) => (
                <div key={o.group} className="text-muted">
                  {o.group}: {o.value}
                  {o.delta > 0 && ` (+${formatPrice(o.delta)})`}
                </div>
              ))}
              <div className="text-muted">Menge: {added.qty}</div>
              <Price p={p} extra={extra} size="sm" className="mt-1" />
            </div>
          </div>
          <FreeShippingMeter left={t.freeShippingLeft} className="mt-4" />
          {t.nudge && <p className="mt-3 text-[13.5px] font-medium text-red-dark">{t.nudge}</p>}
          <div className="mt-4 flex justify-between border-t border-line pt-3 text-[14px]">
            <span>Warenkorb ({t.count} Artikel)</span>
            <span className="num font-semibold">{formatPrice(t.total)}</span>
          </div>
          {recs.length > 0 && (
            <>
              <div className="mt-7 mb-2 text-[17px] font-semibold tracking-[-0.015em]">Passendes Zubehör</div>
              <ul className="divide-y divide-line border-y border-line">
                {recs.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 py-2.5">
                    <Link to={`/p/${r.id}`} onClick={close} className="tile size-12 shrink-0 rounded-[10px] p-1">
                      <Img thumb src={r.images[0]} alt="" className="size-full object-contain" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">{r.title}</div>
                      <Price p={r} size="sm" />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (r.hasRequired) return;
                        add(r.id, 1);
                        notify(`${r.title} hinzugefügt`);
                      }}
                      className={cx('btn btn-outline btn-sm', r.hasRequired && 'hidden')}
                    >
                      + Hinzufügen
                    </button>
                    {r.hasRequired && (
                      <Link to={`/p/${r.id}`} onClick={close} className="btn btn-outline btn-sm">
                        Auswählen
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}

export function FreeShippingMeter({ left, className }: { left: number; className?: string }) {
  const pct = Math.min(100, ((SHOP.freeShippingFrom - left) / SHOP.freeShippingFrom) * 100);
  return (
    <div className={cx('rounded-[14px] bg-panel px-4 py-3', className)}>
      <div className="text-[13.5px]">
        {left > 0 ? (
          <>
            Noch <b className="num">{formatPrice(left)}</b> bis zur versandkostenfreien Lieferung
          </>
        ) : (
          <span className="flex items-center gap-1.5 font-medium text-ok">
            <Check size={15} strokeWidth={3} /> Versandkostenfreie Lieferung
          </span>
        )}
      </div>
      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-black/[0.08]">
        <motion.div className={cx('h-full rounded-full', left > 0 ? 'bg-ink' : 'bg-ok')} initial={false} animate={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ================= Vergleichsleiste ================= */
export function CompareBar() {
  const ids = useSaved((s) => s.compare);
  const toggle = useSaved((s) => s.toggleCompare);
  const clear = useSaved((s) => s.clearCompare);
  const { pathname } = useLocation();
  const items = ids.map((id) => getProduct(id)).filter(Boolean) as NonNullable<ReturnType<typeof getProduct>>[];
  const hidden = !items.length || pathname.startsWith('/vergleich') || pathname.startsWith('/kasse') || pathname.startsWith('/konfigurator');
  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'tween', duration: 0.2 }}
          className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/85 shadow-bar backdrop-blur-xl"
        >
          <div className="container-x flex items-center gap-3 py-2.5">
            <GitCompareArrows size={20} strokeWidth={1.75} className="hidden shrink-0 text-muted sm:block" />
            <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
              {items.map((p) => (
                <div key={p.id} className="relative flex h-12 shrink-0 items-center gap-2 rounded-[12px] bg-panel pr-7 pl-1.5">
                  <div className="size-9 shrink-0 mix-blend-multiply">
                    <Img thumb src={p.images[0]} alt="" className="size-full object-contain" />
                  </div>
                  <span className="hidden max-w-[140px] truncate text-[12.5px] md:block">{p.title}</span>
                  <button type="button" aria-label="Entfernen" onClick={() => toggle(p.id)} className="absolute top-1 right-1 text-muted hover:text-ink">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => clear()} className="hidden text-[13px] text-muted underline sm:block">
              Leeren
            </button>
            <Link to="/vergleich" className={cx('btn btn-dark btn-sm h-10 shrink-0', items.length < 2 && 'pointer-events-none opacity-40')}>
              Vergleichen ({items.length}/{COMPARE_MAX})
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================= Toast ================= */
export function Toast() {
  const toast = useUI((s) => s.toast);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(t);
  }, [toast]);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[95] flex justify-center px-4">
      <AnimatePresence>
        {visible && toast && (
          <motion.div
            key={toast.at}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-full bg-ink/90 px-5 py-3 text-[13.5px] font-medium text-white shadow-pop backdrop-blur-xl"
          >
            <Check size={15} strokeWidth={2.6} className="text-[#7ee2a8]" /> {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================= Scroll-Wiederherstellung ================= */
export function ScrollManager() {
  const { pathname, search: qs, hash } = useLocation();
  // Sprungmarken (#…) auch bei nachgeladenen Seiten anfahren
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    const t = window.setInterval(() => {
      const el = document.getElementById(id);
      if (el || ++tries > 30) {
        window.clearInterval(t);
        el?.scrollIntoView({ block: 'start' });
      }
    }, 60);
    return () => window.clearInterval(t);
  }, [pathname, hash]);
  const positions = useRef(new Map<string, number>());
  const prev = useRef(pathname + qs);
  const pop = useRef(false);
  useEffect(() => {
    const fn = () => (pop.current = true);
    window.addEventListener('popstate', fn);
    return () => window.removeEventListener('popstate', fn);
  }, []);
  useEffect(() => {
    const key = pathname + qs;
    const prevPath = prev.current.split('?')[0];
    positions.current.set(prev.current, window.scrollY);
    prev.current = key;
    const saved = positions.current.get(key);
    if (pop.current && saved !== undefined) requestAnimationFrame(() => window.scrollTo(0, saved));
    else if (prevPath !== pathname && !window.location.hash) window.scrollTo(0, 0);
    pop.current = false;
  }, [pathname, qs]);
  return null;
}
