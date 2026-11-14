import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NumberFlow from '@number-flow/react';
import { ArrowRight, BookOpen, Building2, ChevronRight, GraduationCap, Percent, Phone, Store, Trophy, Truck, Users, Wrench } from 'lucide-react';
import { BRANDS, featured, formatPrice, getProduct, HARDNESS_CLASSES, inCat, PRO_RACKETS, products, RUBBER_TYPES, SHOP, type Product } from '../lib/catalog';
import { applyFilters, FACETS } from '../lib/facets';
import { useSaved } from '../store/ui';
import { ProductRail } from '../components/ProductCard';
import { cx, Img, Reveal, SectionHead, Stars } from '../components/ui';
import { usePageMeta } from '../lib/seo';
import { BRAND_LOGOS } from '../lib/brandLogos';

import { asset, srcset } from '../lib/asset';
const SALE = products.filter((p) => p.sale);

/** Je Kategorie der hochwertigste reduzierte Artikel für die Deal-Kacheln im Hero */
function heroDeals(): Product[] {
  return ['roboter', 'schlaeger', 'belaege', 'hoelzer'].map((c) => SALE.filter((x) => x.cat === c && x.images[0]).sort((x, y) => y.price - x.price)[0]).filter(Boolean) as Product[];
}

/* ---------------- Hero ---------------- */
function Hero() {
  const deals = useMemo(heroDeals, []);
  return (
    <section className="relative isolate overflow-hidden bg-[#0a0a0b] text-white">
      <h1 className="sr-only">TT-Shop – der Tischtennis-Fachhändler: Beläge, Hölzer, Schläger und Tische</h1>
      <img
        src={asset('/img/lifestyle/hero-net-md.webp')}
        srcSet={srcset('/img/lifestyle/hero-net-sm.webp 720w, /img/lifestyle/hero-net-md.webp 1200w, /img/lifestyle/hero-net.webp 1920w')}
        sizes="100vw"
        width={1920}
        height={1280}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 -z-30 size-full object-cover opacity-[0.28]"
      />
      <div className="absolute top-[-30%] left-1/2 -z-20 h-[120%] w-[110%] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(214,0,28,0.3),rgba(214,0,28,0.08)_55%,transparent)] lg:left-[28%] lg:w-[70%]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,10,11,0.2)_0%,rgba(10,10,11,0.55)_55%,#0a0a0b_100%)]" />

      <div className="container-x grid items-center gap-10 pt-12 pb-12 sm:pt-16 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-16 lg:py-20">
        <div className="text-center lg:text-left">
          <p className="animate-rise text-[15px] font-semibold text-[#ff5a68] sm:text-[17px]">Nur für kurze Zeit</p>
          <h2 className="display mt-2 animate-rise text-[60px] leading-[0.95] [animation-delay:40ms] sm:text-[92px] lg:text-[108px]">Black Weeks.</h2>
          <p className="mx-auto mt-5 max-w-[540px] animate-rise text-[19px] leading-[1.35] tracking-[-0.015em] text-white/70 [animation-delay:80ms] sm:text-[23px] lg:mx-0">
            <span className="font-semibold text-white">{SALE.length} Artikel reduziert.</span> Roboter, Schläger, Beläge, Schuhe und Platten.
          </p>
          <div className="mt-8 flex animate-rise flex-wrap justify-center gap-3 [animation-delay:120ms] lg:justify-start">
            <Link to="/c/sale" className="btn btn-light">
              Zum Sale
            </Link>
            <Link to="/konfigurator" className="btn btn-outline-light">
              Schläger konfigurieren
            </Link>
          </div>
        </div>

        {deals.length > 0 && (
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:ml-auto lg:w-full lg:max-w-[620px]">
            {deals.map((p, i) => (
              <Link
                key={p.id}
                to={`/p/${p.id}`}
                style={{ animationDelay: `${160 + i * 50}ms` }}
                className="group flex w-[46vw] max-w-[260px] shrink-0 animate-rise snap-start flex-col rounded-[22px] bg-white p-2.5 text-ink shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] sm:w-auto sm:max-w-none sm:p-3"
              >
                <span className="tile block aspect-square rounded-[16px] p-[9%] sm:aspect-[4/3] sm:p-[7%]">
                  <Img thumb src={p.images[0]} alt="" className="size-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.05]" />
                </span>
                <span className="flex flex-1 flex-col px-1.5 pt-3 pb-1">
                  <span className="text-[12px] font-semibold text-red">Sale</span>
                  <span className="mt-0.5 line-clamp-2 text-[14.5px] leading-snug font-semibold tracking-[-0.01em]">{p.title}</span>
                  <span className="num mt-auto pt-1.5 text-[14px] text-muted">{formatPrice(p.price)}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- Kategorie-Reihe (wie die Produktreihe im Apple Store) ---------------- */
function CategoryRow() {
  const tiles = [
    { to: '/c/belaege', label: 'Beläge', id: 'xiom-vega-korea', cat: 'belaege' as const },
    { to: '/c/hoelzer', label: 'Hölzer', id: inCat('hoelzer')[0]?.id, cat: 'hoelzer' as const },
    { to: '/c/schlaeger', label: 'Schläger', id: inCat('schlaeger', 'profi')[0]?.id, cat: 'schlaeger' as const },
    { to: '/c/baelle', label: 'Bälle', id: inCat('baelle')[0]?.id, cat: 'baelle' as const },
    { to: '/c/tische', label: 'Tische', id: inCat('tische', 'wettkampf')[0]?.id, cat: 'tische' as const },
    { to: '/c/roboter', label: 'Roboter', id: inCat('roboter')[3]?.id, cat: 'roboter' as const },
    { to: '/c/schuhe', label: 'Schuhe', id: inCat('schuhe')[1]?.id, cat: 'schuhe' as const },
    { to: '/c/bekleidung', label: 'Bekleidung', id: inCat('bekleidung')[1]?.id, cat: 'bekleidung' as const },
    { to: '/c/zubehoer', label: 'Zubehör', id: (inCat('zubehoer', 'koffer')[0] ?? inCat('zubehoer', 'huellen')[0])?.id, cat: 'zubehoer' as const },
    { to: '/c/sale', label: 'Sale', id: SALE.find((p) => p.cat === 'roboter')?.id, cat: null },
  ];
  return (
    <section className="container-x pt-8 sm:pt-12" aria-label="Sortiment">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <h2 className="display text-[40px] leading-none sm:text-[56px]">
          Der <span className="text-red">Shop.</span>
        </h2>
        <p className="max-w-[360px] text-[17px] leading-snug font-semibold tracking-[-0.015em] text-muted sm:text-right sm:text-[19px]">
          <span className="text-ink">Material vom Fachhändler.</span> Mit Montage-Service und persönlicher Beratung.{' '}
          <a href={SHOP.phoneHref} className="link block text-[14px] font-normal sm:text-[15px]">
            Fachberatung: {SHOP.phone} <ChevronRight size={14} className="inline -translate-y-px" />
          </a>
        </p>
      </div>
      <nav className="no-scrollbar -mx-4 mt-8 flex gap-1 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:justify-between lg:px-0">
        {tiles.map((t) => {
          const p = t.id ? getProduct(t.id) : undefined;
          return (
            <Link key={t.to} to={t.to} className="group flex w-[92px] shrink-0 flex-col items-center gap-2 rounded-[14px] px-1 py-2 text-center sm:w-[108px]">
              <span className="tile grid size-[78px] place-items-center rounded-[16px] bg-white p-2 shadow-[var(--shadow-card)] transition-shadow group-hover:shadow-[var(--shadow-card-hover)] sm:size-[88px]">
                {p && <Img thumb src={p.images[0]} alt="" className="size-full object-contain transition-transform duration-300 group-hover:scale-110" />}
              </span>
              <span className={cx('text-[13.5px] font-semibold tracking-[-0.01em]', t.label === 'Sale' && 'text-red')}>{t.label}</span>
              {t.cat && <span className="num -mt-1.5 text-[11.5px] text-muted">{inCat(t.cat).length}</span>}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}

/* ---------------- Große Promo-Kacheln (Apple-Kachelraster) ---------------- */
function PromoTiles() {
  return (
    <section className="container-x mt-10 grid gap-4 sm:mt-14 lg:grid-cols-2">
      <Reveal>
        <Link
          to="/konfigurator"
          className="group relative isolate flex h-[520px] flex-col items-center overflow-hidden rounded-[28px] bg-black px-6 pt-10 text-center text-white sm:h-[600px] sm:pt-14"
        >
          <img
            src={asset('/img/lifestyle/pro-rackets-md.webp')}
            srcSet={srcset('/img/lifestyle/pro-rackets-sm.webp 800w, /img/lifestyle/pro-rackets-md.webp 1400w')}
            sizes="(min-width: 1024px) 50vw, 100vw"
            alt=""
            loading="lazy"
            className="absolute inset-0 -z-20 size-full object-cover object-bottom transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-x-0 top-0 -z-10 h-3/4 bg-gradient-to-b from-black/90 via-black/55 to-transparent" />
          <p className="text-[15px] font-semibold text-[#ff4d5e]">Schläger-Konfigurator</p>
          <h3 className="display mt-1.5 text-[36px] leading-[1.05] sm:text-[48px]">Dein Schläger. Spielfertig montiert.</h3>
          <p className="mt-3 max-w-[460px] text-[17px] leading-snug text-white/80 sm:text-[19px]">Holz und zwei Beläge wählen – wir kleben inklusive Kantenband für 2,00 €.</p>
          <span className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <span className="btn btn-light btn-sm h-10 px-5">Konfigurieren</span>
            <span className="inline-flex items-center gap-0.5 text-[15px] text-white/90 group-hover:underline">
              Profi-Setups <ChevronRight size={16} />
            </span>
          </span>
        </Link>
      </Reveal>
      <Reveal delay={0.08}>
        <Link to="/berater" className="group relative isolate flex h-[520px] flex-col items-center overflow-hidden rounded-[28px] bg-white px-6 pt-10 text-center sm:h-[600px] sm:pt-14">
          <img
            src={asset('/img/lifestyle/tournament-md.webp')}
            srcSet={srcset('/img/lifestyle/tournament-sm.webp 800w, /img/lifestyle/tournament-md.webp 1400w')}
            sizes="(min-width: 1024px) 50vw, 100vw"
            alt=""
            loading="lazy"
            className="absolute inset-0 -z-20 size-full object-cover object-[50%_70%] transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-x-0 top-0 -z-10 h-3/4 bg-gradient-to-b from-white via-white/85 to-transparent" />
          <p className="text-[15px] font-semibold text-red">Material-Berater</p>
          <h3 className="display mt-1.5 text-[36px] leading-[1.05] sm:text-[48px]">Welcher Belag passt zu deinem Spiel?</h3>
          <p className="mt-3 max-w-[460px] text-[17px] leading-snug text-ink-2 sm:text-[19px]">Vier Fragen – passende Beläge und Hölzer mit allen technischen Daten.</p>
          <span className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <span className="btn btn-dark btn-sm h-10 px-5">Berater starten</span>
            <span className="inline-flex items-center gap-0.5 text-[15px] text-info group-hover:underline">
              Ratgeber lesen <ChevronRight size={16} />
            </span>
          </span>
        </Link>
      </Reveal>
    </section>
  );
}

/* ---------------- Belag-Finder (Segment-Auswahl wie ein Konfigurator) ---------------- */
function Segments({ label, value, options, onChange }: { label: string; value: string; options: { v: string; l: string }[]; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label={label}>
      <div className="mb-2 text-[13px] font-semibold text-muted">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={value === o.v}
            onClick={() => onChange(value === o.v ? '' : o.v)}
            className={cx(
              'h-10 rounded-[12px] border px-3.5 text-[14px] transition-all',
              value === o.v ? 'border-info bg-info/[0.06] font-semibold text-ink ring-1 ring-info' : 'border-line-2 bg-white text-ink-2 hover:border-muted',
            )}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

function RubberFinder() {
  const nav = useNavigate();
  const [typ, setTyp] = useState('Tensor');
  const [haerte, setHaerte] = useState('');
  const [staerke, setStaerke] = useState('');
  const items = inCat('belaege');
  const facets = FACETS.belaege;
  const st = useMemo(() => {
    const s: Record<string, string[]> = {};
    if (typ) s.typ = [typ];
    if (haerte) s.haerte = [haerte];
    if (staerke) s.staerke = [staerke];
    return s;
  }, [typ, haerte, staerke]);
  const count = applyFilters(items, st, facets).length;
  const go = () => {
    const sp = new URLSearchParams();
    Object.entries(st).forEach(([k, v]) => sp.set(k, v.join('~')));
    nav(`/c/belaege?${sp}`);
  };
  return (
    <section className="container-x mt-16 sm:mt-20">
      <SectionHead title="Belag-Finder" sub="In drei Schritten zum passenden Belag." />
      <Reveal>
        <div className="grid gap-8 rounded-[28px] bg-white p-6 shadow-[var(--shadow-card)] sm:p-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
          <div className="space-y-6">
            <Segments label="1. Belagart" value={typ} onChange={setTyp} options={RUBBER_TYPES.map((t) => ({ v: t, l: t }))} />
            <Segments label="2. Härte" value={haerte} onChange={setHaerte} options={HARDNESS_CLASSES.map((t) => ({ v: t, l: t }))} />
            <Segments
              label="3. Schwammstärke"
              value={staerke}
              onChange={setStaerke}
              options={['OX', '1,0', '1,5', '1,8', '2,0', '2,1', 'max'].map((t) => ({ v: t, l: t === 'max' || t === 'OX' ? t : `${t} mm` }))}
            />
          </div>
          <div className="flex flex-col justify-between gap-6 rounded-[20px] bg-panel p-6">
            <div>
              <div className="text-[13px] font-semibold text-muted">Passende Beläge</div>
              <div className="num mt-1 text-[64px] leading-none font-semibold tracking-[-0.04em]">
                <NumberFlow value={count} locales="de-DE" />
              </div>
              <p className="mt-3 text-[14px] leading-snug text-muted">Jeder mit Härte, Schwammstärken, Farben und Preis – direkt vergleichbar.</p>
            </div>
            <div className="space-y-3">
              <button type="button" onClick={go} disabled={!count} className="btn btn-blue w-full">
                Beläge anzeigen
              </button>
              <Link to="/berater" className="link-arrow w-full justify-center text-[14px]">
                Unsicher? Material-Berater <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- Der TT-Shop-Unterschied ---------------- */
function Difference() {
  const items = [
    { icon: Truck, title: 'Versandkostenfrei ab 69 €', text: 'Darunter 5,90 € innerhalb Deutschlands. Versand mit DPD, Tische per Spedition.' },
    { icon: Wrench, title: 'Montage für 2,00 €', text: 'Beläge aufgeklebt inklusive Kantenband – dein Schläger kommt spielfertig.' },
    { icon: Percent, title: '15 % ab 2 Belägen', text: 'Und 10 % auf alle nicht reduzierten Hölzer. Wird automatisch im Warenkorb abgezogen.' },
    { icon: Phone, title: 'Fachberatung am Telefon', text: `${SHOP.phone} · ${SHOP.hours}. Wir helfen bei Material, Montage und Bestellung.` },
    { icon: Store, title: 'Fachgeschäft & Werkstatt', text: `${SHOP.address[1]}, ${SHOP.address[2]}.` },
    { icon: Users, title: 'Vereine & Schulen', text: 'Sammelbestellungen, Angebote und Kauf auf Rechnung für Einrichtungen.' },
  ];
  return (
    <section className="container-x mt-16 sm:mt-20">
      <SectionHead title="Der TT-Shop-Unterschied" sub="Noch mehr Gründe, bei uns zu kaufen." />
      <div
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 py-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-6"
        style={{ marginTop: '-1rem' }}
      >
        {items.map((it) => (
          <div key={it.title} className="store-card w-[72vw] max-w-[300px] shrink-0 snap-start p-6 sm:w-[44vw] lg:w-auto lg:max-w-none">
            <it.icon size={30} strokeWidth={1.6} className="text-red" />
            <div className="mt-5 text-[19px] leading-tight font-semibold tracking-[-0.02em]">{it.title}</div>
            <div className="mt-2 text-[14px] leading-snug text-muted">{it.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Marken-Laufband mit Logos ---------------- */
function Brands() {
  const list = BRANDS.filter((b) => BRAND_LOGOS[b.name]);
  const row = [...list, ...list];
  return (
    <section className="mt-20 sm:mt-24">
      <div className="container-x">
        <SectionHead
          title="Marken"
          sub={`${BRANDS.length} Hersteller im Sortiment.`}
          action={
            <Link to="/marken" className="link-arrow">
              Alle Marken A–Z <ChevronRight size={15} />
            </Link>
          }
        />
      </div>
      <div className="group relative overflow-hidden py-3 [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]">
        <div className="flex w-max animate-marquee gap-4 group-hover:[animation-play-state:paused]">
          {row.map((b, i) => (
            <Link
              key={`${b.slug}-${i}`}
              to={`/marke/${b.slug}`}
              aria-hidden={i >= list.length}
              tabIndex={i >= list.length ? -1 : undefined}
              aria-label={i < list.length ? `${b.name} – ${b.count} Artikel` : undefined}
              className="group/logo flex h-24 w-[188px] flex-col items-center justify-center gap-2 rounded-[20px] bg-white px-7 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]"
            >
              <img src={BRAND_LOGOS[b.name]} alt="" loading="lazy" className="h-9 w-full object-contain opacity-75 transition-opacity group-hover/logo:opacity-100" />
              <span className="num text-[11.5px] text-muted">{b.count} Artikel</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Ratgeber ---------------- */
function Guides() {
  const guides = [
    { to: '/ratgeber/belagarten', img: asset('/img/lifestyle/pro-rackets-sm.webp'), title: 'Belagarten erklärt', text: 'Tensor, Hybrid, klebrig oder Noppen außen – was passt zu deinem Spielsystem?' },
    { to: '/ratgeber/holzaufbau', img: asset('/img/lifestyle/player-sm.webp'), title: 'Holzaufbau: Allholz, Carbon, ALC', text: 'Furniere, Gewicht und Griffform – so findest du das richtige Holz.' },
    { to: '/ratgeber/haerte-und-staerke', img: asset('/img/lifestyle/tournament-sm.webp'), title: 'Schwammhärte & -stärke', text: 'Was bedeuten 40°, 47,5° oder „max“? So passt es zu deinem Niveau.' },
    {
      to: '/ratgeber/tischtennisplatte-kaufen',
      img: asset('/img/lifestyle/table-racket-sm.webp'),
      title: 'Tischtennisplatte kaufen',
      text: 'Indoor, Outdoor oder ITTF – Plattenstärke, Untergestell und Platzbedarf.',
    },
  ];
  return (
    <section className="container-x mt-16 sm:mt-20">
      <SectionHead
        title="Ratgeber"
        sub="Wissen, das dein Spiel besser macht."
        action={
          <Link to="/ratgeber" className="link-arrow">
            Alle Ratgeber <ChevronRight size={15} />
          </Link>
        }
      />
      <div
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 py-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0"
        style={{ marginTop: '-1rem' }}
      >
        {guides.map((g) => (
          <Link key={g.title} to={g.to} className="store-card group w-[76vw] max-w-[320px] shrink-0 snap-start sm:w-[44vw] lg:w-auto lg:max-w-none">
            <div className="aspect-[4/3] overflow-hidden">
              <Img thumb src={g.img} alt="" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-red">
                <BookOpen size={13} /> Ratgeber
              </div>
              <div className="mt-1.5 text-[18px] leading-snug font-semibold tracking-[-0.02em]">{g.title}</div>
              <div className="mt-1 text-[14px] leading-snug text-muted">{g.text}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Vereinsservice ---------------- */
function Teams() {
  const items = [
    { icon: Users, title: 'Vereine', text: 'Sammelbestellungen, Vereinsschläger-Service und Teamwear.' },
    { icon: Trophy, title: 'Trainer', text: 'Trainingsbälle in Großpackungen, Roboter und Trainingshilfen.' },
    { icon: GraduationCap, title: 'Schulen', text: 'Outdoor-Platten, Schläger-Sets und Bälle – auf Rechnung.' },
    { icon: Building2, title: 'Unternehmen', text: 'Tischtennis als Ausgleich im Büro oder für den Betriebssport.' },
  ];
  return (
    <section className="container-x mt-16 sm:mt-20">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-[28px] bg-black p-7 text-white sm:p-12">
          <img src={asset('/img/lifestyle/blue-table-sm.webp')} alt="" loading="lazy" className="absolute inset-0 -z-20 size-full object-cover opacity-35" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/85 to-black/40" />
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-center">
            <div>
              <p className="text-[15px] font-semibold text-[#ff4d5e]">Vereinsservice</p>
              <h2 className="display mt-1.5 text-[34px] leading-[1.05] sm:text-[46px]">Material für die ganze Mannschaft.</h2>
              <p className="mt-3 max-w-[460px] text-[17px] leading-snug text-white/75">Individuelle Angebote, Rechnungskauf und Sammelbestellungen – sprich uns direkt an.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/verein" className="btn btn-light">
                  Zum Vereinsservice
                </Link>
                <a href={SHOP.phoneHref} className="btn btn-outline-light">
                  <Phone size={16} /> {SHOP.phone}
                </a>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((it) => (
                <div key={it.title} className="rounded-[18px] bg-white/[0.07] p-5 ring-1 ring-white/10 backdrop-blur-sm">
                  <it.icon size={22} strokeWidth={1.7} className="text-[#ff4d5e]" />
                  <div className="mt-3 text-[16px] font-semibold">{it.title}</div>
                  <div className="mt-0.5 text-[13.5px] leading-snug text-white/65">{it.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Recently() {
  const recent = useSaved((s) => s.recent);
  const items = recent.map((id) => getProduct(id)).filter(Boolean) as Product[];
  if (items.length < 2) return null;
  return (
    <section className="container-x mt-16 sm:mt-20">
      <SectionHead title="Zuletzt angesehen" sub="Dort weitermachen, wo du aufgehört hast." />
      <ProductRail items={items} />
    </section>
  );
}

function AboutText() {
  const [open, setOpen] = useState(false);
  return (
    <section className="container-x mt-16 sm:mt-20">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-[28px] bg-white p-7 shadow-[var(--shadow-card)] sm:p-10">
          <h2 className="h2">TT-Shop.de – dein Tischtennis Online Shop für hochwertige Tischtennisprodukte</h2>
          <div className={open ? '' : 'relative max-h-[128px] overflow-hidden'}>
            <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-ink-2">
              <p>
                In unserem Tischtennis Shop findest du sämtliches Tischtennisequipment – von Belagklassikern bis zu modernen Tischtennisbelägen mit eingebautem Frischklebeeffekt. Auf den Produktseiten
                informieren wir dich ausführlich über die Eigenschaften der einzelnen Beläge.
              </p>
              <p>
                Tischtennishölzer bilden die Grundlage eines Tischtennisschlägers. Neben Vollhölzern mit 5- oder 7-schichtigem Aufbau werden Carbonhölzer immer interessanter. Wir bieten vormontierte
                Profischläger, die du nach deinen eigenen Bedürfnissen zusammenstellen kannst, sowie Fertigschläger für Hobby- und Gelegenheitsspieler.
              </p>
              <p>
                Dazu Tischtennisschuhe, Bekleidung, Bälle vom Trainingsball bis zum Wettkampfball, Outdoor- und Indoorplatten, ITTF-Wettkampftische, Netze und Tischtennisroboter – vom günstigen
                Tischroboter bis zur Ballmaschine mit App-Steuerung.
              </p>
            </div>
            {!open && <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white to-transparent" />}
          </div>
          <button type="button" onClick={() => setOpen(!open)} className="link mt-3 text-[15px]">
            {open ? 'Weniger anzeigen' : 'Weiterlesen'}
          </button>
        </div>
        <div className="flex flex-col justify-between gap-6 rounded-[28px] bg-white p-7 shadow-[var(--shadow-card)] sm:p-8">
          <div>
            <Stars size={18} />
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="num text-[48px] leading-none font-semibold tracking-[-0.04em]">{SHOP.rating.value.toLocaleString('de-DE')}</span>
              <span className="text-[15px] text-muted">/ 5,00</span>
            </div>
            <div className="mt-2 text-[16px] font-semibold">{SHOP.rating.label} bei Trusted Shops</div>
            <div className="text-[14px] text-muted">{SHOP.rating.count} Kundenbewertungen</div>
          </div>
          <div className="border-t border-line pt-5 text-[14px]">
            <div className="font-semibold">Fachgeschäft & Werkstatt</div>
            <div className="text-muted">{SHOP.address.slice(1).join(', ')}</div>
            <a href={SHOP.phoneHref} className="link mt-2 inline-flex items-center gap-1.5 text-[15px]">
              <Phone size={14} /> {SHOP.phone}
            </a>
            <div className="text-[13px] text-muted">{SHOP.hours}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Rail({ title, sub, to, label, items }: { title: string; sub: string; to: string; label: string; items: Product[] }) {
  return (
    <section className="container-x mt-16 sm:mt-20">
      <SectionHead
        title={title}
        sub={sub}
        action={
          <Link to={to} className="link-arrow">
            {label} <ChevronRight size={15} />
          </Link>
        }
      />
      <ProductRail items={items} />
    </section>
  );
}

export default function Home() {
  usePageMeta('TT-Shop.de');
  return (
    <div className="bg-panel pb-4">
      <Hero />
      <CategoryRow />
      <PromoTiles />
      <Rail title="Beläge" sub="Tensor & Hybrid im Überblick." to="/c/belaege?typ=Tensor~Hybrid" label="Alle anzeigen" items={featured.rubbers()} />
      <Difference />
      <Rail title="Profi-Setups" sub="Das Material der Stars." to="/profi-setups" label="Alle Setups" items={PRO_RACKETS} />
      <RubberFinder />
      <Rail title="Hölzer" sub="10 % Rabatt auf alle nicht reduzierten Hölzer." to="/c/hoelzer" label={`Alle ${inCat('hoelzer').length} Hölzer`} items={featured.blades()} />
      <Rail title="Black Weeks" sub="Alle reduzierten Artikel." to="/c/sale" label="Zum Sale" items={featured.sale()} />
      <Brands />
      <Guides />
      <Teams />
      <Recently />
      <AboutText />
      <div className="container-x mt-10 flex justify-center">
        <Link to="/c/belaege" className="link-arrow">
          Zum gesamten Sortiment <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
