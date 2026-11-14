import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, CheckCircle2, Heart, Mail, Package, Phone, Truck, User } from 'lucide-react';
import { BRANDS, CATEGORIES, featured, formatPrice, getProduct, inCat, SHOP } from '../lib/catalog';
import { useSaved } from '../store/ui';
import { ProductCard, ProductRail } from '../components/ProductCard';
import { Breadcrumbs, Img, SectionHead } from '../components/ui';
import { usePageMeta } from '../lib/seo';
import { BRAND_LOGOS } from '../lib/brandLogos';

/* ---------------- Sortiment ---------------- */
function ShopOverview() {
  return (
    <div className="container-x">
      <Breadcrumbs items={[{ to: '/', label: 'Startseite' }, { label: 'Sortiment' }]} />
      <h1 className="h1">Sortiment.</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => {
          const first = inCat(c.id)[0];
          return (
            <div key={c.id} className="card p-4">
              <Link to={`/c/${c.id}`} className="flex items-center gap-4">
                <div className="size-16 shrink-0 tile rounded-[12px] p-1.5">{first && <Img thumb src={first.images[0]} alt="" className="size-full object-contain" />}</div>
                <div>
                  <div className="text-[16px] font-semibold hover:underline">{c.name}</div>
                  <div className="num text-[13px] text-muted">{inCat(c.id).length} Artikel</div>
                </div>
              </Link>
              {c.subs.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.subs.map((s) => (
                    <Link key={s.id} to={`/c/${c.id}/${s.id}`} className="chip">
                      {s.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Marken A–Z ---------------- */
function Brands() {
  const sorted = [...BRANDS].sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const letters = [...new Set(sorted.map((b) => b.name[0].toUpperCase()))];
  const top = BRANDS.filter((b) => BRAND_LOGOS[b.name]);
  return (
    <div className="container-x">
      <Breadcrumbs items={[{ to: '/', label: 'Startseite' }, { label: 'Marken' }]} />
      <h1 className="h1">Marken.</h1>
      <p className="mt-3 text-[17px] text-muted sm:text-[19px]">
        <span className="font-semibold text-ink">{BRANDS.length} Hersteller im Sortiment.</span> Von Andro bis Yasaka.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {top.map((b) => (
          <Link key={b.slug} to={`/marke/${b.slug}`} className="store-card group/logo flex h-28 flex-col items-center justify-center gap-2.5 px-6">
            <img src={BRAND_LOGOS[b.name]} alt={b.name} loading="lazy" className="h-10 w-full object-contain opacity-75 transition-opacity group-hover/logo:opacity-100" />
            <span className="num text-[12px] text-muted">{b.count} Artikel</span>
          </Link>
        ))}
      </div>
      <h2 className="h2 mt-14">Alle Marken von A bis Z.</h2>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {letters.map((l) => (
          <a key={l} href={`#marke-${l}`} className="grid size-10 place-items-center rounded-full bg-panel text-[14px] font-semibold transition-colors hover:bg-ink hover:text-white">
            {l}
          </a>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
        {letters.map((l) => (
          <div key={l} id={`marke-${l}`} className="scroll-mt-28 border-t border-line py-5">
            <div className="text-[22px] font-semibold tracking-[-0.02em] text-subtle">{l}</div>
            <ul className="mt-2 space-y-0.5">
              {sorted
                .filter((b) => b.name[0].toUpperCase() === l)
                .map((b) => (
                  <li key={b.slug}>
                    <Link to={`/marke/${b.slug}`} className="group flex items-baseline justify-between gap-4 py-1.5">
                      <span className="shrink-0 text-[16px] font-medium group-hover:text-info">{b.name}</span>
                      <span className="num min-w-0 truncate text-right text-[12.5px] text-muted">
                        {b.count} · {b.cats.map((c) => CATEGORIES.find((x) => x.id === c)?.name).join(', ')}
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Merkliste ---------------- */
function Wishlist() {
  const ids = useSaved((s) => s.wishlist);
  const items = ids.map((id) => getProduct(id)).filter(Boolean) as NonNullable<ReturnType<typeof getProduct>>[];
  return (
    <div className="container-x">
      <Breadcrumbs items={[{ to: '/', label: 'Startseite' }, { label: 'Merkliste' }]} />
      <h1 className="h1">
        Merkliste.{' '}
        <span className="num text-muted">
          {items.length} {items.length === 1 ? 'Artikel' : 'Artikel'}
        </span>
      </h1>
      {items.length === 0 ? (
        <div className="panel mt-6 px-6 py-14 text-center">
          <Heart size={28} className="mx-auto text-muted" />
          <div className="mt-3 text-[16px] font-semibold">Deine Merkliste ist leer</div>
          <p className="mx-auto mt-1 max-w-sm text-[14px] text-muted">Klicke auf das Herz an einem Artikel, um ihn für später zu speichern.</p>
          <Link to="/c/belaege" className="btn btn-dark btn-sm mt-5">
            Beläge entdecken
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {items.map((p) => (
            <li key={p.id} className="flex">
              <ProductCard p={p} className="w-full" />
            </li>
          ))}
        </ul>
      )}
      <section className="mt-12">
        <SectionHead title="Beläge entdecken" />
        <ProductRail items={featured.rubbers()} />
      </section>
    </div>
  );
}

/* ---------------- Bestellbestätigung ---------------- */
function Success() {
  const [o, setO] = useState<{
    order: string;
    email: string;
    name: string;
    total: number;
    delivery?: string;
    items: number;
  } | null>(null);
  useEffect(() => {
    const raw = sessionStorage.getItem('tt-last-order');
    if (raw) setO(JSON.parse(raw));
  }, []);
  const steps = [
    {
      icon: CheckCircle2,
      title: 'Bestellung eingegangen',
      text: 'Bestätigung per E-Mail',
    },
    {
      icon: Package,
      title: 'Kommissionierung & Montage',
      text: 'Innerhalb von 1–2 Werktagen',
    },
    {
      icon: Truck,
      title: 'Versand',
      text: o?.delivery ? `Voraussichtlich ${o.delivery}` : 'DPD bzw. Spedition',
    },
  ];
  return (
    <div className="container-x py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-ok text-white">
            <Check size={24} strokeWidth={3} />
          </span>
          <h1 className="h1">Vielen Dank für deine Bestellung{o?.name ? `, ${o.name}` : ''}!</h1>
        </div>
        <div className="card mt-6 divide-y divide-line">
          <div className="grid gap-1 p-5 text-[14px] sm:grid-cols-2">
            <div>
              <div className="text-muted">Bestellnummer</div>
              <div className="num text-[16px] font-semibold">{o?.order ?? '–'}</div>
            </div>
            <div>
              <div className="text-muted">Gesamtbetrag</div>
              <div className="num text-[16px] font-semibold">{o ? formatPrice(o.total) : '–'}</div>
            </div>
            <div className="mt-2 sm:col-span-2">
              Die Bestellbestätigung geht an <b>{o?.email ?? 'deine E-Mail-Adresse'}</b>.
            </div>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title}>
                <s.icon size={20} className={i === 0 ? 'text-ok' : 'text-muted'} />
                <div className="mt-1.5 text-[14px] font-semibold">{s.title}</div>
                <div className="text-[13px] text-muted">{s.text}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 rounded-[18px] bg-panel p-5 sm:flex-row sm:items-center">
          <User size={20} className="shrink-0 text-muted" />
          <div className="flex-1 text-[14px]">
            <div className="font-semibold">Kundenkonto anlegen</div>
            <div className="text-muted">Bestellstatus verfolgen, Vereinskonditionen nutzen, schneller nachbestellen.</div>
          </div>
          <Link to="/konto" className="btn btn-outline btn-sm">
            Konto erstellen
          </Link>
        </div>
        <p className="mt-4 text-[12px] text-muted">Prototyp – es wurde keine echte Bestellung ausgelöst.</p>
        <Link to="/" className="btn btn-dark mt-4">
          Weiter einkaufen
        </Link>
      </div>
    </div>
  );
}

/* ---------------- Widerrufsbutton (§ 356a BGB) ---------------- */
function Widerruf() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [f, setF] = useState({ name: '', order: '', email: '', reason: '' });
  const valid = f.name.trim() && f.order.trim() && /\S+@\S+\.\S+/.test(f.email);
  const now = new Date();
  return (
    <div className="container-x">
      <Breadcrumbs items={[{ to: '/', label: 'Startseite' }, { label: 'Vertrag widerrufen' }]} />
      <div className="max-w-xl">
        <h1 className="h1">Vertrag widerrufen.</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          Hier erklärst du den Widerruf deines Vertrags mit der Tikotec UG (haftungsbeschränkt) elektronisch. Pflichtangaben: Name, Bestellnummer, E-Mail.
        </p>
        {step === 1 && (
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (valid) setStep(2);
            }}
          >
            {[
              ['name', 'Name', 'name', 'text'],
              ['order', 'Bestellnummer', 'off', 'text'],
              ['email', 'E-Mail-Adresse', 'email', 'email'],
            ].map(([k, label, ac, type]) => (
              <label key={k} className="block">
                <span className="label">{label}</span>
                <input className="input" type={type} autoComplete={ac} value={f[k as keyof typeof f]} onChange={(e) => setF({ ...f, [k]: e.target.value })} required />
              </label>
            ))}
            <label className="block">
              <span className="label">Grund (freiwillig)</span>
              <textarea className="input h-24 py-2.5" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
            </label>
            <button type="submit" disabled={!valid} className="btn btn-dark w-full">
              Widerruf erklären
            </button>
          </form>
        )}
        {step === 2 && (
          <div className="card mt-6 p-5">
            <div className="text-[16px] font-semibold">Bitte bestätige deinen Widerruf</div>
            <dl className="mt-3 space-y-1 text-[14px]">
              <div>Name: {f.name}</div>
              <div>Bestellung: {f.order}</div>
              <div>E-Mail: {f.email}</div>
            </dl>
            <div className="mt-5 flex gap-2">
              <button type="button" className="btn btn-outline flex-1" onClick={() => setStep(1)}>
                Zurück
              </button>
              <button type="button" className="btn btn-primary flex-1" onClick={() => setStep(3)}>
                Widerruf bestätigen
              </button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="mt-6 rounded-lg border border-ok/30 bg-ok-soft p-5">
            <CheckCircle2 className="text-ok" size={24} />
            <div className="mt-2 text-[16px] font-semibold">Widerruf eingegangen</div>
            <p className="mt-1 text-[14px] text-ink-2">
              Eingang am {now.toLocaleDateString('de-DE')} um{' '}
              {now.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              Uhr. Eine Bestätigung geht an {f.email}. (Prototyp – nichts wurde gesendet.)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Konto ---------------- */
function Account() {
  return (
    <div className="container-x">
      <Breadcrumbs items={[{ to: '/', label: 'Startseite' }, { label: 'Mein Konto' }]} />
      <div className="grid max-w-4xl gap-8 md:grid-cols-2">
        <div className="card p-6">
          <h1 className="h2">Anmelden</h1>
          <form className="mt-4 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <label className="block">
              <span className="label">E-Mail-Adresse</span>
              <input className="input" type="email" autoComplete="email" />
            </label>
            <label className="block">
              <span className="label">Passwort</span>
              <input className="input" type="password" autoComplete="current-password" />
            </label>
            <button className="btn btn-dark w-full">Anmelden</button>
          </form>
          <p className="mt-3 text-[12px] text-muted">Prototyp – Login wird an das OpenMage-Kundenkonto angebunden.</p>
        </div>
        <div className="card p-6">
          <div className="h2">Neu bei TT-Shop.de?</div>
          <ul className="mt-4 space-y-2.5 text-[14px]">
            {[
              'Bestellstatus & Sendungsverfolgung',
              'Schnell nachbestellen – z. B. deine Beläge in gleicher Stärke',
              'Vereinskonditionen für Sammelbesteller',
              'Merkliste und Vergleich auf allen Geräten',
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <Check size={17} className="mt-0.5 shrink-0 text-ok" /> {t}
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-outline mt-5 w-full">
            Kundenkonto erstellen
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Service ---------------- */
function Service() {
  const blocks: { title: string; body: ReactNode }[] = [
    {
      title: 'Versand & Lieferung',
      body: (
        <>
          Versand mit DPD innerhalb von 1–2 Werktagen. Innerhalb Deutschlands {formatPrice(SHOP.shippingFee)}, ab {formatPrice(SHOP.freeShippingFrom)} kostenlos. Tische per Spedition in 5–10
          Werktagen; Bestellungen vor 12 Uhr zählen am selben Tag. DHL-Packstation auf Wunsch.
        </>
      ),
    },
    {
      title: 'Zahlungsarten',
      body: <>Vorkasse, PayPal, Apple Pay (über Mollie), Kreditkarte (über PayPal). Rechnungskauf für Vereine, Schulen, öffentliche Einrichtungen und – nach Absprache – Unternehmen.</>,
    },
    {
      title: 'Rabattsystem',
      body: <>10 % auf nicht reduzierte Tischtennishölzer, 15 % ab zwei Tischtennisbelägen – automatisch im Warenkorb. Sammelbesteller-Rabatte und Textil-Staffelpreise für Vereine auf Anfrage.</>,
    },
    {
      title: 'Montage-Service',
      body: <>Belagmontage inkl. Kantenband 2,00 €, Holzversiegelung Standard 2,50 € / Profi 5,00 €. Eingeschickte Schläger belegen wir ebenfalls neu.</>,
    },
    {
      title: 'Rücksendungen',
      body: <>14 Tage Widerrufsrecht. Den Widerruf erklärst du online über „Vertrag widerrufen“ oder per E-Mail an {SHOP.email}.</>,
    },
    {
      title: 'Fachgeschäft',
      body: (
        <>
          {SHOP.address.join(', ')} · Telefon {SHOP.phone} ({SHOP.hours}).
        </>
      ),
    },
  ];
  return (
    <div className="container-x">
      <Breadcrumbs items={[{ to: '/', label: 'Startseite' }, { label: 'Service & Beratung' }]} />
      <h1 className="h1">Service & Beratung.</h1>
      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {blocks.map((b) => (
          <div key={b.title} className="card p-5">
            <div className="text-[15px] font-semibold">{b.title}</div>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{b.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-3 rounded-lg bg-ink p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[16px] font-semibold">Persönliche Fachberatung</div>
          <div className="text-[14px] text-white/70">{SHOP.hours}</div>
        </div>
        <div className="flex gap-2">
          <a href={SHOP.phoneHref} className="btn btn-sm bg-white text-ink">
            <Phone size={14} /> {SHOP.phone}
          </a>
          <a href={`mailto:${SHOP.email}`} className="btn btn-sm border border-white/30 text-white">
            <Mail size={14} /> E-Mail
          </a>
        </div>
      </div>
      <p className="mt-4 text-[12px] text-muted">Rechtstexte (AGB, Impressum, Datenschutz, Widerrufsbelehrung) kommen im Live-Betrieb aus den CMS-Seiten von OpenMage.</p>
    </div>
  );
}

function NotFound() {
  return (
    <div className="container-x py-20 text-center">
      <div className="num text-[64px] font-bold text-line-2">404</div>
      <h1 className="h1">Diese Seite gibt es nicht.</h1>
      <p className="mt-3 text-[17px] text-muted">Vielleicht hilft die Suche oder ein Blick ins Sortiment.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link to="/" className="btn btn-dark">
          Zur Startseite
        </Link>
        <Link to="/shop" className="btn btn-outline">
          Sortiment
        </Link>
      </div>
    </div>
  );
}

const META: Record<string, [string, string?]> = {
  shop: ['Sortiment', 'Alle Kategorien im TT-Shop: Beläge, Hölzer, Schläger, Tische, Bälle, Roboter, Schuhe, Bekleidung und Zubehör.'],
  brands: ['Marken A–Z', 'Alle Tischtennis-Marken im TT-Shop – von Andro, Donic und Butterfly bis Xiom und Yasaka.'],
  wishlist: ['Merkliste'],
  success: ['Vielen Dank für deine Bestellung'],
  widerruf: ['Vertrag widerrufen', 'Widerruf deines Kaufvertrags online erklären – schnell und ohne Begründung.'],
  account: ['Anmelden / Kundenkonto'],
  service: ['Service & Beratung', 'Telefonische Fachberatung, Versand, Zahlung, Montage-Service und Rücksendung beim TT-Shop.'],
  '404': ['Seite nicht gefunden'],
};

export default function Misc({ page }: { page: 'shop' | 'brands' | 'wishlist' | 'success' | 'widerruf' | 'account' | 'service' | '404' }) {
  usePageMeta(...META[page]);
  switch (page) {
    case 'shop':
      return <ShopOverview />;
    case 'brands':
      return <Brands />;
    case 'wishlist':
      return <Wishlist />;
    case 'success':
      return <Success />;
    case 'widerruf':
      return <Widerruf />;
    case 'account':
      return <Account />;
    case 'service':
      return <Service />;
    default:
      return <NotFound />;
  }
}
