import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Heart, Link2, Lock, MessageCircle, Phone, Printer, ShoppingCart, Trash2, Truck, Users, Wrench } from 'lucide-react';
import { featured, formatPrice, SHOP, useOptions } from '../lib/catalog';
import { deliveryWindow } from '../lib/delivery';
import { addLines, computeTotals, packCart, unpackCart, useCart, useCartTotals, type CartTotals, type PricedLine } from '../store/cart';
import { useSaved, useUI } from '../store/ui';
import { openChat } from '../store/chat';
import { FreeShippingMeter } from '../components/Chrome';
import { ProductRail } from '../components/ProductCard';
import { Accordion, Breadcrumbs, cx, Img, Logo, PaymentBadges, QtyStepper, SectionHead } from '../components/ui';
import { usePageMeta } from '../lib/seo';

import { pageUrl } from '../lib/asset';
export function Summary({ t, compact }: { t: CartTotals; compact?: boolean }) {
  return (
    <dl className={cx('space-y-2 text-[14px]', compact && 'text-[13.5px]')}>
      <div className="flex justify-between">
        <dt className="text-ink-2">Zwischensumme</dt>
        <dd className="num">{formatPrice(t.subtotal)}</dd>
      </div>
      {t.discount > 0 && (
        <div className="flex justify-between text-ok">
          <dt>Rabatte</dt>
          <dd className="num">−{formatPrice(t.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-ink-2">Versand{t.hasFreight ? ' (inkl. Spedition)' : ''}</dt>
        <dd className="num">{t.shipping === 0 ? <span className="text-ok">kostenlos</span> : formatPrice(t.shipping)}</dd>
      </div>
      <div className="flex items-baseline justify-between border-t border-black/[0.08] pt-3">
        <dt className="text-[16px] font-semibold">Gesamtsumme</dt>
        <dd className="num text-[24px] font-semibold tracking-[-0.02em]">{formatPrice(t.total)}</dd>
      </div>
      <div className="flex justify-between text-[12px] text-muted">
        <dt>enthaltene MwSt. (19 %)</dt>
        <dd className="num">{formatPrice(t.vat)}</dd>
      </div>
    </dl>
  );
}

function Line({ l }: { l: PricedLine }) {
  const { setQty, remove } = useCart();
  const toggleWish = useSaved((s) => s.toggleWish);
  const wishlist = useSaved((s) => s.wishlist);
  const notify = useUI((s) => s.notify);
  return (
    <div className="flex gap-4 py-5">
      <Link to={`/p/${l.id}`} className="tile size-20 shrink-0 rounded-[16px] p-2 sm:size-28">
        <Img thumb src={l.product.images[0]} alt="" className="size-full object-contain" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[12.5px] text-muted">{l.product.brand}</div>
            <Link to={`/p/${l.id}`} className="line-clamp-2 text-[16px] leading-snug font-semibold tracking-[-0.012em] hover:text-info">
              {l.product.title}
            </Link>
            {l.opts?.map((o) => (
              <div key={o.group} className="text-[12.5px] text-muted">
                {o.group}: {o.value}
                {o.delta > 0 && <span className="num"> (+{formatPrice(o.delta)})</span>}
              </div>
            ))}
            <div className="mt-0.5 flex items-center gap-1 text-[12.5px] text-muted">
              <Truck size={13} /> {deliveryWindow(l.product).label}
            </div>
            {l.discountLabel && <span className="mt-1.5 inline-block text-[12.5px] font-medium text-ok">{l.discountLabel}</span>}
          </div>
          <div className="text-right">
            <div className="num text-[16px] font-semibold tracking-[-0.01em]">{formatPrice(l.lineTotal - l.discount)}</div>
            {l.discount > 0 && <div className="num text-[12px] text-muted line-through">{formatPrice(l.lineTotal)}</div>}
            {l.qty > 1 && <div className="num text-[12px] text-muted">je {formatPrice(l.unit)}</div>}
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          {l.bundle ? (
            <span className="text-[12.5px] text-muted">Menge: 1</span>
          ) : (
            <>
              <span data-print-hide>
                <QtyStepper compact value={l.qty} min={0} onChange={(n) => setQty(l.key, n)} />
              </span>
              <span className="num hidden text-[12.5px] print:inline">Menge: {l.qty}</span>
            </>
          )}
          <div className="flex items-center gap-1">
            {!l.bundle && (
              <button
                type="button"
                className="icon-btn size-9"
                aria-label="Auf die Merkliste verschieben"
                onClick={() => {
                  if (!wishlist.includes(l.id)) toggleWish(l.id);
                  remove(l.key);
                  notify('Auf die Merkliste verschoben');
                }}
              >
                <Heart size={17} />
              </button>
            )}
            {!l.bundle && (
              <button type="button" className="icon-btn size-9" aria-label="Entfernen" onClick={() => remove(l.key)}>
                <Trash2 size={17} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AssemblyHint({ lines }: { lines: PricedLine[] }) {
  useOptions();
  const setOpts = useCart((s) => s.setOpts);
  const notify = useUI((s) => s.notify);
  const blade = lines.find((l) => !l.bundle && l.product.cat === 'hoelzer' && !l.opts?.some((o) => /montage/i.test(o.group) && /montier/i.test(o.value)));
  const rubbers = lines.filter((l) => !l.bundle && l.product.cat === 'belaege').reduce((n, l) => n + l.qty, 0);
  const group = blade?.product.options.find((o) => o.kind === 'assembly');
  const value = group?.values.find((v) => /rot auf VH/i.test(v.label)) ?? group?.values.find((v) => /montier/i.test(v.label));
  if (!blade || rubbers < 2 || !group || !value) return null;
  return (
    <div className="mt-3 flex flex-col gap-3 rounded-[16px] bg-panel p-4 sm:flex-row sm:items-center">
      <Wrench size={20} strokeWidth={1.75} className="shrink-0 text-red" />
      <div className="flex-1 text-[13.5px]">
        <div className="font-semibold">Sollen wir deine Beläge aufkleben?</div>
        <div className="text-ink-2">
          Montage auf {blade.product.title} inkl. Kantenband für {formatPrice(value.delta)} – du bekommst einen spielfertigen Schläger.
        </div>
      </div>
      <button
        type="button"
        className="btn btn-dark btn-sm"
        onClick={() => {
          setOpts(blade.key, [...(blade.opts ?? []).filter((o) => !/montage/i.test(o.group)), { group: group.name, value: value.label, delta: value.delta }]);
          notify('Montage hinzugefügt');
        }}
      >
        Montage hinzufügen
      </button>
    </div>
  );
}

/** Geteilte Materialliste (?liste=…) übernehmen */
function SharedList() {
  const [sp, setSp] = useSearchParams();
  const code = sp.get('liste');
  const lines = useMemo(() => (code ? unpackCart(code) : []), [code]);
  const totals = useMemo(() => computeTotals(lines), [lines]);
  const notify = useUI((s) => s.notify);
  if (!code) return null;
  const dismiss = () => {
    sp.delete('liste');
    setSp(sp, { replace: true });
  };
  if (!lines.length) {
    return (
      <div className="mb-5 rounded-[14px] bg-warn-soft px-4 py-3 text-[14px] text-warn" data-print-hide>
        Dieser Link enthält keine gültige Materialliste.{' '}
        <button type="button" onClick={dismiss} className="font-semibold underline">
          Ausblenden
        </button>
      </div>
    );
  }
  return (
    <div className="mb-6 rounded-[18px] bg-info/[0.06] p-5" data-print-hide>
      <div className="flex items-start gap-3">
        <Users size={20} className="mt-0.5 shrink-0 text-info" />
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold">
            Geteilte Materialliste · {totals.count} Artikel · {formatPrice(totals.total)}
          </div>
          <ul className="mt-2 space-y-1 text-[13.5px] text-ink-2">
            {totals.lines.map((l) => (
              <li key={l.key} className="flex gap-2">
                <span className="num w-7 shrink-0 text-muted">{l.qty}×</span>
                <span className="min-w-0">
                  {l.product.title}
                  {l.opts?.length ? <span className="text-muted"> · {l.opts.map((o) => o.value).join(', ')}</span> : null}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-dark btn-sm"
              onClick={() => {
                addLines(lines);
                notify(`${totals.count} Artikel in den Warenkorb übernommen`);
                dismiss();
              }}
            >
              <ShoppingCart size={14} /> In meinen Warenkorb übernehmen
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={dismiss}>
              Ignorieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareTools({ t }: { t: CartTotals }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = pageUrl(`/warenkorb?liste=${packCart(t.lines)}`);
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: 'Materialliste TT-Shop', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt('Link zur Materialliste kopieren:', url);
    }
  };
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4" data-print-hide>
      <button type="button" onClick={share} className="btn btn-outline btn-sm px-2">
        {copied ? <Check size={14} className="text-ok" /> : <Link2 size={14} />} {copied ? 'Link kopiert' : 'Liste teilen'}
      </button>
      <button type="button" onClick={() => window.print()} className="btn btn-outline btn-sm px-2">
        <Printer size={14} /> Angebot drucken
      </button>
      <p className="col-span-2 text-[11.5px] leading-snug text-muted">Ideal für Trainer und Vereine: Materialliste per Link verschicken oder als Angebot für die Kasse ausdrucken.</p>
    </div>
  );
}

/** Kopf nur für den Ausdruck („Angebot / Materialliste“) */
function PrintHead() {
  const date = new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(new Date());
  return (
    <div className="mb-6 hidden items-start justify-between border-b border-line pb-4 print:flex">
      <div>
        <Logo />
        <div className="mt-2 text-[11px] leading-snug text-ink-2">
          {SHOP.address.join(' · ')}
          <br />
          Tel. {SHOP.phone} · {SHOP.email}
        </div>
      </div>
      <div className="text-right text-[12px]">
        <div className="text-[16px] font-semibold">Unverbindliches Angebot</div>
        <div>Stand: {date}</div>
        <div className="text-muted">Preise inkl. 19 % MwSt.; gültig, solange der Vorrat reicht</div>
      </div>
    </div>
  );
}

/** Häufige Fragen unter dem Warenkorb (wie im Apple Store) */
function CartHelp() {
  const items = [
    {
      q: 'Was kostet der Versand und wann kommt meine Bestellung?',
      a: `Innerhalb Deutschlands ${formatPrice(SHOP.shippingFee)}, versandkostenfrei ab ${formatPrice(SHOP.freeShippingFrom)}. Lagerware geht in 1–2 Werktagen mit DPD raus; Bestellungen bis 12 Uhr an Werktagen zählen noch für den aktuellen Tag. Tische kommen per Spedition.`,
    },
    { q: 'Wie kann ich bezahlen?', a: 'PayPal, Apple Pay, Visa, Mastercard oder Vorkasse. Kauf auf Rechnung für Vereine, Schulen und öffentliche Einrichtungen.' },
    {
      q: 'Wie werden die Rabatte berechnet?',
      a: '15 % auf alle nicht reduzierten Beläge, sobald mindestens zwei Beläge im Warenkorb liegen (reduzierte zählen mit), und 10 % auf nicht reduzierte Hölzer – automatisch.',
    },
    {
      q: 'Kann ich zurückgeben?',
      a: 'Du hast 14 Tage Widerrufsrecht. Ausgenommen sind nach deinen Vorgaben montierte Schläger (§ 312g Abs. 2 Nr. 1 BGB). Den Widerruf kannst du online erklären.',
    },
  ];
  return (
    <section className="mt-14 grid gap-8 border-t border-line pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div>
        <h2 className="h2">
          Hast du noch Fragen? <span className="text-muted">Wir helfen gern.</span>
        </h2>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => openChat('Ich habe eine Frage zu meiner Bestellung.')} className="btn btn-dark btn-sm">
            <MessageCircle size={15} /> Assistent fragen
          </button>
          <a href={SHOP.phoneHref} className="btn btn-outline btn-sm">
            <Phone size={15} /> {SHOP.phone}
          </a>
        </div>
        <p className="mt-2 text-[13px] text-muted">{SHOP.hours}</p>
      </div>
      <div>
        {items.map((it) => (
          <Accordion key={it.q} title={it.q}>
            <p className="text-[14.5px] leading-relaxed text-ink-2">{it.a}</p>
            {it.q.startsWith('Kann ich') && (
              <Link to="/widerruf" className="link mt-2 inline-block text-[14px]">
                Vertrag widerrufen
              </Link>
            )}
          </Accordion>
        ))}
      </div>
    </section>
  );
}

export default function Cart() {
  usePageMeta('Warenkorb');
  const t = useCartTotals();
  const removeBundle = useCart((s) => s.removeBundle);
  const nav = useNavigate();

  if (!t.lines.length) {
    return (
      <div className="container-x">
        <Breadcrumbs items={[{ to: '/', label: 'Startseite' }, { label: 'Warenkorb' }]} />
        <SharedList />
        <div className="px-2 py-14 text-center sm:py-20">
          <h1 className="h1">Dein Warenkorb ist leer.</h1>
          <p className="mx-auto mt-3 max-w-md text-[17px] text-muted">Stöbere im Sortiment oder stell dir einen Schläger zusammen – wir montieren ihn für dich.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/c/belaege" className="btn btn-primary">
              Einkauf fortsetzen
            </Link>
            <Link to="/konfigurator" className="btn btn-outline">
              Schläger konfigurieren
            </Link>
          </div>
        </div>
        <CartHelp />
        <section className="mt-14">
          <SectionHead title="Beläge entdecken" sub="Tensor & Hybrid mit allen Daten." />
          <ProductRail items={featured.rubbers()} />
        </section>
      </div>
    );
  }

  const bundles = [...new Set(t.lines.filter((l) => l.bundle).map((l) => l.bundle!))];
  const singles = t.lines.filter((l) => !l.bundle);

  return (
    <div className="container-x pb-32 lg:pb-10">
      <div data-print-hide>
        <Breadcrumbs items={[{ to: '/', label: 'Startseite' }, { label: 'Warenkorb' }]} />
      </div>
      <PrintHead />
      <SharedList />
      <div className="pt-2 pb-2 text-center sm:pt-6">
        <h1 className="h1">
          Dein Warenkorb: <span className="num">{formatPrice(t.total)}</span>.
        </h1>
        <p className="mt-3 text-[17px] text-muted">
          <span className="num">{t.count}</span> {t.count === 1 ? 'Artikel' : 'Artikel'} · {t.shipping === 0 ? 'Versandkostenfrei' : `Versandkostenfrei ab ${formatPrice(SHOP.freeShippingFrom)}`} ·
          Versand mit DPD
        </p>
        <button type="button" onClick={() => nav('/kasse')} className="btn btn-blue mt-5 hidden px-10 lg:inline-flex" data-print-hide>
          Zur Kasse
        </button>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <div data-print-hide>
            <FreeShippingMeter left={t.freeShippingLeft} />
          </div>
          {t.nudge && (
            <Link to="/c/belaege" className="mt-3 block rounded-[14px] bg-red-soft px-4 py-3 text-[14px] font-medium text-red-dark hover:underline print:hidden">
              {t.nudge}
            </Link>
          )}
          <div data-print-hide>
            <AssemblyHint lines={t.lines} />
          </div>
          {bundles.map((b) => {
            const parts = t.lines.filter((l) => l.bundle === b);
            const sum = parts.reduce((n, l) => n + l.lineTotal - l.discount, 0);
            const cfg = parts.find((l) => l.note?.startsWith('konfig:'))?.note?.slice(7);
            return (
              <div key={b} className="mt-4 overflow-hidden rounded-[18px] border border-line">
                <div className="flex items-center justify-between gap-3 border-b border-line bg-panel px-4 py-3">
                  <div className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em]">
                    <Wrench size={16} className="text-red" /> Schläger-Konfiguration
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="num text-[15px] font-semibold">{formatPrice(sum)}</span>
                    {cfg !== undefined && (
                      <Link to={`/konfigurator?${cfg}${cfg ? '&' : ''}ersetze=${b}`} className="text-[13px] text-info hover:underline" data-print-hide>
                        Bearbeiten
                      </Link>
                    )}
                    <button type="button" onClick={() => removeBundle(b)} className="text-[13px] text-info hover:underline" data-print-hide>
                      Entfernen
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-line px-4">
                  {parts.map((l) => (
                    <Line key={l.key} l={l} />
                  ))}
                </div>
              </div>
            );
          })}
          {singles.length > 0 && (
            <div className="mt-4 divide-y divide-line border-y border-line">
              {singles.map((l) => (
                <Line key={l.key} l={l} />
              ))}
            </div>
          )}
        </div>

        <aside className="min-w-0">
          <div className="rounded-[22px] bg-panel p-6 lg:sticky lg:top-[calc(var(--hdr)+24px)]">
            <div className="mb-4 text-[20px] font-semibold tracking-[-0.02em]">Zusammenfassung</div>
            <Summary t={t} />
            <button type="button" onClick={() => nav('/kasse')} className="btn btn-primary btn-lg mt-5 hidden w-full lg:flex">
              <Lock size={16} /> Zur Kasse
            </button>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => nav('/kasse?express=paypal')} className="btn h-11 bg-[#ffc439] text-[14px] font-bold text-[#003087] hover:brightness-95">
                PayPal
              </button>
              <button type="button" onClick={() => nav('/kasse?express=applepay')} className="btn btn-dark h-11">
                Apple Pay
              </button>
            </div>
            <div data-print-hide>
              <PaymentBadges className="mt-4" />
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-muted print:hidden">
              Rabatte auf Beläge und Hölzer werden automatisch berechnet. Rechnungskauf für Vereine, Schulen und Einrichtungen – Anfragen unter {SHOP.phone}.
            </p>
            <ShareTools t={t} />
          </div>
        </aside>
      </div>
      <div data-print-hide>
        <CartHelp />
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.06] bg-white/85 px-4 py-2.5 shadow-bar backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-[12px] text-muted">Gesamt inkl. MwSt.</div>
            <div className="num text-[19px] font-semibold tracking-[-0.02em]">{formatPrice(t.total)}</div>
          </div>
          <button type="button" onClick={() => nav('/kasse')} className="btn btn-blue h-11 px-6">
            <Lock size={16} /> Zur Kasse
          </button>
        </div>
      </div>
    </div>
  );
}
