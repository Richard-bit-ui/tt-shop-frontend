import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, ChevronLeft, ChevronRight, GitCompareArrows, Heart, Menu, Phone, Search, ShoppingBag, Sparkles, Tags, User, Wrench } from 'lucide-react';
import { CATEGORIES, formatPrice, inCat, SHOP, topBrands, topSeries, type CatId } from '../lib/catalog';
import { FACETS, facetValues } from '../lib/facets';
import { useCartTotals } from '../store/cart';
import { useSaved, useUI } from '../store/ui';
import { cx, Logo, Sheet, Stars } from './ui';

/* ================= Navigationsmodell ================= */
export interface NavLinkItem {
  label: string;
  to: string;
  count?: number;
}
export interface NavCol {
  title: string;
  links: NavLinkItem[];
}

const q = (cat: CatId, key: string, value: string) => `/c/${cat}?${key}=${encodeURIComponent(value)}`;

function facetLinks(cat: CatId, id: string, limit = 9): NavLinkItem[] {
  const f = FACETS[cat].find((x) => x.id === id);
  if (!f) return [];
  return facetValues(inCat(cat), f)
    .slice(0, limit)
    .map((v) => ({ label: f.format ? f.format(v.value) : v.value, to: q(cat, id, v.value), count: v.count }));
}
const subLinks = (cat: CatId, ids?: string[]): NavLinkItem[] =>
  CATEGORIES.find((c) => c.id === cat)!
    .subs.filter((s) => !ids || ids.includes(s.id))
    .map((s) => ({ label: s.name, to: `/c/${cat}/${s.id}`, count: inCat(cat, s.id).length }));
const brandLinks = (cat: CatId, n = 9): NavLinkItem[] => topBrands(cat, n).map((b) => ({ label: b.name, to: q(cat, 'marke', b.name), count: b.count }));

export function megaFor(cat: CatId): NavCol[] {
  switch (cat) {
    case 'belaege':
      return [
        { title: 'Belagart', links: facetLinks('belaege', 'typ') },
        { title: 'Härte', links: facetLinks('belaege', 'haerte') },
        { title: 'Schwammstärke', links: facetLinks('belaege', 'staerke', 20).filter((l) => ['OX', '1,0 mm', '1,5 mm', '1,8 mm', '2,0 mm', '2,1 mm', 'max'].includes(l.label)) },
        { title: 'Marken', links: brandLinks('belaege') },
        { title: 'Serien', links: topSeries('belaege', 9).map((s) => ({ label: `${s.brand} ${s.series}`, to: q('belaege', 'serie', `${s.brand} ${s.series}`), count: s.count })) },
      ];
    case 'hoelzer':
      return [
        { title: 'Material', links: facetLinks('hoelzer', 'material') },
        { title: 'Griffform', links: facetLinks('hoelzer', 'griff') },
        { title: 'Bauform', links: subLinks('hoelzer') },
        { title: 'Marken', links: brandLinks('hoelzer') },
        { title: 'Serien', links: topSeries('hoelzer', 9).map((s) => ({ label: `${s.brand} ${s.series}`, to: q('hoelzer', 'serie', `${s.brand} ${s.series}`), count: s.count })) },
      ];
    case 'schlaeger':
      return [
        { title: 'Schlägerart', links: subLinks('schlaeger') },
        {
          title: 'Service',
          links: [
            { label: 'Schläger-Konfigurator', to: '/konfigurator' },
            { label: 'Profi-Setups der Stars', to: '/profi-setups' },
            { label: 'Montage-Service', to: '/montage' },
            { label: 'Vereinsservice', to: '/verein' },
          ],
        },
        { title: 'Marken', links: brandLinks('schlaeger') },
      ];
    case 'baelle':
      return [
        { title: 'Einsatz', links: subLinks('baelle') },
        { title: 'Qualität', links: facetLinks('baelle', 'sterne') },
        { title: 'Packungsgröße', links: facetLinks('baelle', 'packung') },
        { title: 'Marken', links: brandLinks('baelle') },
      ];
    case 'tische':
      return [
        { title: 'Tische & Platten', links: subLinks('tische', ['wettkampf', 'indoor', 'outdoor']) },
        { title: 'Zubehör', links: subLinks('tische', ['netze', 'huellen']) },
        { title: 'Einsatzort', links: facetLinks('tische', 'einsatz') },
        { title: 'Marken', links: brandLinks('tische') },
      ];
    case 'zubehoer':
      return [
        { title: 'Montage & Pflege', links: subLinks('zubehoer', ['kleber', 'reiniger', 'kantenbaender', 'versiegelung']) },
        { title: 'Transport', links: subLinks('zubehoer', ['huellen', 'koffer', 'taschen', 'rucksaecke']) },
        { title: 'Training & Halle', links: subLinks('zubehoer', ['training', 'zaehlgeraete', 'umrandungen', 'handtuecher']) },
        { title: 'Marken', links: brandLinks('zubehoer') },
      ];
    default:
      return [...(CATEGORIES.find((c) => c.id === cat)!.subs.length ? [{ title: 'Kategorien', links: subLinks(cat) }] : []), { title: 'Marken', links: brandLinks(cat) }];
  }
}

/* ================= Desktop-Megamenü (wie die Flyouts bei Apple) ================= */
const GUIDE_FOR: Partial<Record<CatId, string>> = {
  belaege: 'belagarten',
  hoelzer: 'holzaufbau',
  tische: 'tischtennisplatte-kaufen',
  baelle: 'tischtennisbaelle',
  zubehoer: 'kleben-und-pflege',
  schlaeger: 'materialregeln',
};
const PROMO_FOR: Partial<Record<CatId, string>> = { belaege: '15 % Rabatt ab 2 Belägen – automatisch im Warenkorb.', hoelzer: '10 % Rabatt auf alle nicht reduzierten Hölzer.' };

function MegaMenu({ cat, onClose }: { cat: CatId; onClose: () => void }) {
  const c = CATEGORIES.find((x) => x.id === cat)!;
  const cols = useMemo(() => megaFor(cat).slice(0, 4), [cat]);
  const guide = GUIDE_FOR[cat];
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
      className="absolute inset-x-0 top-full z-40 border-b border-black/[0.06] bg-white/95 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.35)] backdrop-blur-xl"
    >
      <div className="container-x grid grid-cols-[minmax(0,1.1fr)_repeat(4,minmax(0,1fr))_300px] gap-10 pt-9 pb-11">
        <div>
          <div className="mb-3 text-[12px] text-muted">{c.name} entdecken</div>
          <ul className="space-y-1.5">
            <li>
              <Link to={`/c/${cat}`} onClick={onClose} className="text-[24px] leading-tight font-semibold tracking-[-0.02em] hover:text-info">
                Alle {c.name}
              </Link>
            </li>
            {c.subs.slice(0, 5).map((s) => (
              <li key={s.id}>
                <Link to={`/c/${cat}/${s.id}`} onClick={onClose} className="text-[18px] leading-snug font-semibold tracking-[-0.015em] hover:text-info">
                  {s.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/c/sale" onClick={onClose} className="text-[18px] leading-snug font-semibold tracking-[-0.015em] text-red hover:text-red-dark">
                Sale
              </Link>
            </li>
          </ul>
        </div>
        {cols.map((col) => (
          <div key={col.title} className="min-w-0">
            <div className="mb-3 text-[12px] text-muted">{col.title}</div>
            <ul className="space-y-1">
              {col.links.slice(0, 9).map((l) => (
                <li key={l.label}>
                  <Link to={l.to} onClick={onClose} className="group flex items-baseline gap-1.5 py-0.5 text-[13.5px] font-medium text-ink-2 hover:text-info">
                    <span className="truncate">{l.label}</span>
                    {l.count !== undefined && <span className="num text-[11px] font-normal text-subtle group-hover:text-info/70">{l.count}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {Array.from({ length: Math.max(0, 4 - cols.length) }).map((_, i) => (
          <div key={i} />
        ))}
        <div className="flex flex-col gap-3">
          {(cat === 'belaege' || cat === 'hoelzer' || cat === 'schlaeger') && (
            <Link to="/konfigurator" onClick={onClose} className="group relative isolate block overflow-hidden rounded-[18px] bg-black p-5 text-white">
              <img src="/img/lifestyle/pro-rackets-sm.webp" alt="" className="absolute inset-0 -z-10 size-full object-cover opacity-55 transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 to-black/10" />
              <div className="pt-16 text-[12px] font-semibold text-[#ff4d5e]">Schläger-Konfigurator</div>
              <div className="mt-0.5 text-[17px] leading-snug font-semibold tracking-[-0.015em]">Holz + 2 Beläge. Wir montieren für 2,00&nbsp;€.</div>
            </Link>
          )}
          {PROMO_FOR[cat] && <p className="text-[13px] leading-snug font-medium text-red-dark">{PROMO_FOR[cat]}</p>}
          {guide && (
            <Link to={`/ratgeber/${guide}`} onClick={onClose} className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-info hover:underline">
              <BookOpen size={15} /> Ratgeber: {c.name} richtig wählen
            </Link>
          )}
          <Link to="/marken" onClick={onClose} className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-info hover:underline">
            Alle Marken A–Z <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ================= Mobiles Menü (Drill-down, große Links wie bei Apple) ================= */
function MobileMenu() {
  const open = useUI((s) => s.menuOpen);
  const setMenu = useUI((s) => s.setMenu);
  const [level, setLevel] = useState<CatId | null>(null);
  const close = () => {
    setMenu(false);
    setTimeout(() => setLevel(null), 250);
  };
  const cat = level ? CATEGORIES.find((c) => c.id === level)! : null;
  const cols = useMemo(() => (level ? megaFor(level) : []), [level]);
  const big = 'flex w-full items-center justify-between py-2.5 text-left text-[24px] leading-tight font-semibold tracking-[-0.02em]';
  return (
    <Sheet open={open} onClose={close} side="left" title={cat ? cat.name : <Logo />}>
      {!cat ? (
        <nav className="pt-3 pb-8">
          <ul>
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => setLevel(c.id)} className={big}>
                  {c.name}
                  <ChevronRight size={20} className="text-subtle" />
                </button>
              </li>
            ))}
            <li>
              <Link to="/c/sale" onClick={close} className={cx(big, 'text-red')}>
                Sale
              </Link>
            </li>
          </ul>
          <ul className="mt-6 space-y-0.5 border-t border-line pt-5">
            {[
              { to: '/konfigurator', icon: Wrench, label: 'Schläger-Konfigurator' },
              { to: '/berater', icon: Sparkles, label: 'Material-Berater' },
              { to: '/ratgeber', icon: BookOpen, label: 'Ratgeber & Glossar' },
              { to: '/marken', icon: Tags, label: 'Marken A–Z' },
              { to: '/vergleich', icon: GitCompareArrows, label: 'Produktvergleich' },
              { to: '/merkliste', icon: Heart, label: 'Merkliste' },
              { to: '/konto', icon: User, label: 'Mein Konto' },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} onClick={close} className="flex items-center gap-3 py-2.5 text-[16px] font-medium text-ink-2">
                  <l.icon size={18} strokeWidth={1.75} className="text-muted" /> {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-[18px] bg-panel p-4 text-[14px]">
            <div className="font-semibold">Fachberatung</div>
            <a href={SHOP.phoneHref} className="mt-0.5 flex items-center gap-2 text-[16px] text-info">
              <Phone size={15} /> {SHOP.phone}
            </a>
            <div className="text-[13px] text-muted">{SHOP.hours}</div>
          </div>
        </nav>
      ) : (
        <nav className="pt-2 pb-8">
          <button type="button" onClick={() => setLevel(null)} className="-ml-1 flex items-center gap-1 py-2 text-[15px] text-info">
            <ChevronLeft size={18} /> Alle Kategorien
          </button>
          <Link to={`/c/${cat.id}`} onClick={close} className={cx(big, 'mt-1')}>
            Alle {cat.name}
            <span className="num text-[15px] font-normal text-muted">{inCat(cat.id).length}</span>
          </Link>
          {cat.subs.length > 0 && (
            <ul className="mb-2">
              {cat.subs.map((s) => (
                <li key={s.id}>
                  <Link to={`/c/${cat.id}/${s.id}`} onClick={close} className="flex items-center justify-between py-2 text-[18px] font-semibold tracking-[-0.015em]">
                    {s.name} <span className="num text-[13px] font-normal text-muted">{inCat(cat.id, s.id).length}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {cols
            .filter((col) => col.title !== 'Kategorien' && col.title !== 'Schlägerart' && col.title !== 'Bauform')
            .map((col) => (
              <div key={col.title} className="border-t border-line py-4">
                <div className="mb-2.5 text-[12px] text-muted">{col.title}</div>
                <div className="flex flex-wrap gap-1.5">
                  {col.links.map((l) => (
                    <Link key={l.label} to={l.to} onClick={close} className="chip h-9">
                      {l.label}
                      {l.count !== undefined && <span className="num text-[11px] text-subtle">{l.count}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
        </nav>
      )}
    </Sheet>
  );
}

/* ================= Header ================= */
const USPS = ['Versandkostenfrei ab 69 €', '15 % Rabatt ab 2 Belägen · 10 % auf Hölzer', 'Schlägermontage inkl. Kantenband für 2,00 €', 'Fachgeschäft & Werkstatt in Dippoldiswalde'];

function UspTicker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % USPS.length), 4500);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="relative h-5 min-w-0 flex-1 overflow-hidden text-center md:max-w-[480px]" aria-live="off">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={i}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          className="absolute inset-0 flex items-center justify-center truncate"
        >
          {USPS[i]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function HeaderIcon({ to, icon: Icon, label, badge, className }: { to: string; icon: typeof User; label: string; badge?: number; className?: string }) {
  return (
    <Link
      to={to}
      aria-label={badge ? `${label} (${badge})` : label}
      title={label}
      className={cx('relative grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-black/[0.05]', className)}
    >
      <Icon size={20} strokeWidth={1.6} />
      {!!badge && (
        <span className="num absolute top-0.5 right-0 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-ink px-1 text-[10px] font-semibold text-white ring-2 ring-white">{badge}</span>
      )}
    </Link>
  );
}

export function Header() {
  const t = useCartTotals();
  const wish = useSaved((s) => s.wishlist.length);
  const cmp = useSaved((s) => s.compare.length);
  const setSearch = useUI((s) => s.setSearch);
  const setMenu = useUI((s) => s.setMenu);
  const [mega, setMega] = useState<CatId | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const loc = useLocation();
  useEffect(() => setMega(null), [loc.pathname, loc.search]);

  const enter = (id: CatId) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMega(id), mega ? 0 : 160);
  };
  const leave = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMega(null), 200);
  };

  return (
    <>
      {/* Servicezeile */}
      <div className="bg-panel text-[12px] text-ink-2" data-print-hide>
        <div className="container-x flex h-8 items-center justify-between gap-6">
          <a href={SHOP.phoneHref} className="hidden items-center gap-1.5 whitespace-nowrap hover:text-ink md:flex">
            <Phone size={12} /> Fachberatung {SHOP.phone}
          </a>
          <UspTicker />
          <span className="hidden items-center gap-1.5 whitespace-nowrap md:flex">
            <Stars size={11} /> <span className="font-semibold text-ink">{SHOP.rating.value.toLocaleString('de-DE')}</span> Trusted Shops
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-black/[0.07] bg-white/80 backdrop-blur-xl backdrop-saturate-[1.8]" onMouseLeave={leave}>
        <div className="container-x flex h-14 items-center gap-1 md:h-16 md:gap-6">
          <button type="button" className="icon-btn -ml-2 size-10 xl:hidden" aria-label="Menü öffnen" onClick={() => setMenu(true)}>
            <Menu size={21} strokeWidth={1.6} />
          </button>
          <Link to="/" className="shrink-0" aria-label="Zur Startseite">
            <Logo />
          </Link>

          {/* Kategorien (Desktop, eine Zeile) */}
          <nav className="hidden h-full min-w-0 flex-1 items-stretch justify-center xl:flex" aria-label="Kategorien">
            {CATEGORIES.map((c) => (
              <NavLink
                key={c.id}
                to={`/c/${c.id}`}
                onMouseEnter={() => enter(c.id)}
                onFocus={() => setMega(c.id)}
                onKeyDown={(e) => e.key === 'Escape' && setMega(null)}
                aria-haspopup="true"
                aria-expanded={mega === c.id}
                className={({ isActive }) => cx('relative flex items-center px-2.5 text-[13.5px] transition-colors 2xl:px-3.5', isActive || mega === c.id ? 'text-ink' : 'text-ink-2 hover:text-ink')}
              >
                {({ isActive }) => (
                  <>
                    {c.name}
                    <span
                      className={cx(
                        'absolute inset-x-2.5 bottom-0 h-[2px] rounded-full bg-ink transition-opacity duration-200 2xl:inset-x-3.5',
                        mega === c.id || isActive ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
            <NavLink to="/c/sale" onMouseEnter={leave} className="flex items-center px-2.5 text-[13.5px] font-medium text-red 2xl:px-3.5">
              Sale
            </NavLink>
          </nav>

          {/* Suche */}
          <button
            type="button"
            onClick={() => setSearch(true)}
            className="mx-auto hidden h-10 max-w-[520px] flex-1 items-center gap-2.5 rounded-full bg-black/[0.05] px-4 text-left text-[14px] text-muted transition-colors hover:bg-black/[0.08] md:flex xl:mx-0 xl:w-[210px] xl:max-w-none xl:flex-none 2xl:w-[260px]"
          >
            <Search size={16} className="text-ink" strokeWidth={2} />
            <span className="flex-1 truncate">
              <span className="xl:hidden">Suchen: Belag, Holz, Marke, Artikelnummer …</span>
              <span className="hidden xl:inline">Suchen</span>
            </span>
            <kbd className="hidden rounded-md bg-white px-1.5 py-0.5 font-sans text-[10.5px] font-semibold text-muted shadow-sm lg:block">Strg K</kbd>
          </button>

          <div className="ml-auto flex items-center md:ml-0">
            <HeaderIcon to="/konto" icon={User} label="Mein Konto" className="hidden md:grid" />
            <HeaderIcon to="/merkliste" icon={Heart} label="Merkliste" badge={wish} />
            <HeaderIcon to="/vergleich" icon={GitCompareArrows} label="Produktvergleich" badge={cmp} className="hidden md:grid" />
            <Link
              to="/warenkorb"
              aria-label={`Warenkorb: ${t.count} Artikel, ${formatPrice(t.total)}`}
              title="Warenkorb"
              className="relative -mr-2 grid size-10 place-items-center rounded-full transition-colors hover:bg-black/[0.05] md:mr-0"
            >
              <ShoppingBag size={20} strokeWidth={1.6} />
              {t.count > 0 && (
                <span className="num absolute top-0.5 right-0 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-red px-1 text-[10px] font-semibold text-white ring-2 ring-white">
                  {t.count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Suchfeld mobil */}
        <div className="container-x pb-2.5 md:hidden">
          <button type="button" onClick={() => setSearch(true)} className="flex h-11 w-full items-center gap-2.5 rounded-[12px] bg-black/[0.05] px-3.5 text-left text-[15px] text-muted">
            <Search size={17} className="text-ink" strokeWidth={2} /> Belag, Holz, Marke, Artikelnummer …
          </button>
        </div>

        <AnimatePresence>
          {mega && (
            <div className="hidden xl:block" onMouseEnter={() => window.clearTimeout(timer.current)}>
              <MegaMenu cat={mega} onClose={() => setMega(null)} />
            </div>
          )}
        </AnimatePresence>
      </header>
      <MobileMenu />
    </>
  );
}
