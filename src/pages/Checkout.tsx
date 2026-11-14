import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, CreditCard, Landmark, Lock, ReceiptText, ShieldCheck, Smartphone, Wallet } from 'lucide-react';
import { formatPrice, SHOP } from '../lib/catalog';
import { deliveryWindow } from '../lib/delivery';
import { useCart, useCartTotals } from '../store/cart';
import { TABLE_COLORS } from '../three/tableSpec';
import { cx, Img, Logo } from '../components/ui';
import { Summary } from './Cart';
import { usePageMeta } from '../lib/seo';

type Pay = 'paypal' | 'applepay' | 'card' | 'vorkasse' | 'rechnung';
const PAYMENTS: { id: Pay; label: string; text: string; icon: typeof Wallet }[] = [
  { id: 'paypal', label: 'PayPal', text: 'Du wirst nach der Bestellung zu PayPal weitergeleitet.', icon: Wallet },
  { id: 'applepay', label: 'Apple Pay', text: 'Bezahlen mit Face ID oder Touch ID (über Mollie).', icon: Smartphone },
  { id: 'card', label: 'Kreditkarte', text: 'Visa, Mastercard, American Express – sicher über PayPal.', icon: CreditCard },
  { id: 'vorkasse', label: 'Vorkasse', text: 'Überweisung; der Versand startet nach Zahlungseingang.', icon: Landmark },
  { id: 'rechnung', label: 'Rechnung', text: 'Für Vereine, Schulen, Einrichtungen und Unternehmen.', icon: ReceiptText },
];

interface Form {
  email: string;
  first: string;
  last: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  phone: string;
  org: string;
}

const EMPTY: Form = { email: '', first: '', last: '', street: '', zip: '', city: '', country: 'DE', phone: '', org: '' };

function validate(f: Form, pay: Pay, freight: boolean): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) e.email = 'Bitte gib eine gültige E-Mail-Adresse ein.';
  if (!f.first.trim()) e.first = 'Bitte gib deinen Vornamen ein.';
  if (!f.last.trim()) e.last = 'Bitte gib deinen Nachnamen ein.';
  if (!/\d/.test(f.street)) e.street = 'Bitte gib Straße und Hausnummer ein.';
  if (f.country === 'DE' ? !/^\d{5}$/.test(f.zip.trim()) : f.zip.trim().length < 4) e.zip = f.country === 'DE' ? 'Die PLZ hat 5 Ziffern.' : 'Bitte gib eine gültige PLZ ein.';
  if (!f.city.trim()) e.city = 'Bitte gib deinen Ort ein.';
  if (freight && f.phone.replace(/\D/g, '').length < 6) e.phone = 'Die Spedition kündigt die Lieferung telefonisch an.';
  if (pay === 'rechnung' && !f.org.trim()) e.org = 'Rechnungskauf ist für Vereine, Schulen und Firmen möglich.';
  return e;
}

function Field({ label, error, children, hint, className }: { label: string; error?: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="label">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="mt-1.5 block text-[12.5px] font-medium text-red">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-[12px] text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

function Step({ n, title, children, aside }: { n: number; title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="border-b border-line py-7 first:pt-2">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[24px] font-semibold tracking-[-0.02em]">
          <span className="num text-muted">{n}.</span> {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export default function Checkout() {
  usePageMeta('Kasse');
  const t = useCartTotals();
  const clear = useCart((s) => s.clear);
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [f, setF] = useState<Form>(EMPTY);
  const [pay, setPay] = useState<Pay>(sp.get('express') === 'applepay' ? 'applepay' : 'paypal');
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const errors = useMemo(() => validate(f, pay, t.hasFreight), [f, pay, t.hasFreight]);
  const show = (k: keyof Form) => (submitted || touched[k] ? errors[k] : undefined);
  const bind = (k: keyof Form) => ({
    value: f[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value }),
    onBlur: () => setTouched({ ...touched, [k]: true }),
    'aria-invalid': !!show(k),
    className: cx('input', show(k) && 'border-red'),
  });
  const delivery = t.lines.length ? t.lines.map((l) => deliveryWindow(l.product)).sort((a, b) => b.to.getTime() - a.to.getTime())[0] : null;

  if (!t.lines.length) {
    return (
      <div className="container-x py-24 text-center">
        <Logo className="mx-auto" />
        <h1 className="h1 mt-10">Nichts zu bezahlen</h1>
        <p className="mt-2 text-muted">Dein Warenkorb ist leer.</p>
        <Link to="/shop" className="btn btn-primary mt-6">
          Zum Shop
        </Link>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const first = Object.keys(errors)[0];
    if (first) {
      document.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      return;
    }
    const order = `TT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 899999)}`;
    const summary = { order, email: f.email, name: f.first, total: t.total, pay, delivery: delivery?.label, items: t.count };
    sessionStorage.setItem('tt-last-order', JSON.stringify(summary));
    clear();
    nav('/bestellung/danke', { replace: true });
  };

  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-line">
        <div className="container-x flex h-16 items-center justify-between">
          <Link to="/warenkorb" className="flex items-center gap-1 text-[14px] font-medium">
            <ChevronLeft size={18} /> <span className="hidden sm:inline">Warenkorb</span>
          </Link>
          <Link to="/">
            <Logo />
          </Link>
          <span className="flex items-center gap-1.5 text-[13px] font-medium text-ok">
            <Lock size={15} /> <span className="hidden sm:inline">Sichere Kasse</span>
          </span>
        </div>
      </header>

      <form noValidate onSubmit={submit} className="container-x grid gap-10 pb-32 lg:grid-cols-12 lg:pb-16">
        <div className="min-w-0 lg:col-span-7">
          <h1 className="h1 mt-8">Kasse</h1>
          <p className="mt-1 text-[14px] text-muted">Als Gast bestellen – ein Kundenkonto kannst du danach mit einem Klick anlegen.</p>

          <div className="mt-6">
            <Step n={1} title="Kontakt">
              <Field label="E-Mail-Adresse" error={show('email')} hint="Für Bestellbestätigung und Sendungsverfolgung.">
                <input name="email" type="email" inputMode="email" autoComplete="email" placeholder="name@beispiel.de" {...bind('email')} />
              </Field>
            </Step>

            <Step n={2} title="Lieferadresse">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Vorname" error={show('first')}>
                  <input name="first" autoComplete="given-name" {...bind('first')} />
                </Field>
                <Field label="Nachname" error={show('last')}>
                  <input name="last" autoComplete="family-name" {...bind('last')} />
                </Field>
                <Field label="Straße und Hausnummer" error={show('street')} className="col-span-2">
                  <input name="street" autoComplete="address-line1" {...bind('street')} />
                </Field>
                <Field label="PLZ" error={show('zip')}>
                  <input name="zip" autoComplete="postal-code" inputMode="numeric" maxLength={5} {...bind('zip')} />
                </Field>
                <Field label="Ort" error={show('city')}>
                  <input name="city" autoComplete="address-level2" {...bind('city')} />
                </Field>
                <Field label="Land" className="col-span-2">
                  <select name="country" autoComplete="country" {...bind('country')}>
                    <option value="DE">Deutschland</option>
                    <option value="AT">Österreich</option>
                    <option value="CH">Schweiz</option>
                    <option value="NL">Niederlande</option>
                    <option value="PL">Polen</option>
                    <option value="CZ">Tschechien</option>
                  </select>
                </Field>
                <Field label={t.hasFreight ? 'Telefon (für die Spedition)' : 'Telefon (optional)'} error={show('phone')} className="col-span-2">
                  <input name="phone" type="tel" inputMode="tel" autoComplete="tel" {...bind('phone')} />
                </Field>
              </div>
            </Step>

            <Step n={3} title="Versand">
              <div className="flex items-start gap-4 rounded-[14px] border border-info bg-white p-4 shadow-[0_0_0_1px_var(--color-info)]">
                <span className="mt-1 grid size-5 place-items-center rounded-full border-2 border-info">
                  <span className="size-2.5 rounded-full bg-info" />
                </span>
                <div className="flex-1">
                  <div className="flex justify-between gap-3 text-[15px] font-semibold">
                    <span>{t.hasFreight ? 'DPD + Spedition (Tisch)' : 'DPD Standard'}</span>
                    <span>{t.shipping === 0 ? 'Kostenlos' : formatPrice(t.shipping)}</span>
                  </div>
                  <div className="mt-0.5 text-[13px] text-muted">
                    Voraussichtlich {delivery?.label}
                    {t.hasFreight ? ' · Lieferung frei Bordsteinkante, telefonische Avisierung' : ' · DHL-Packstation auf Wunsch per E-Mail'}
                  </div>
                </div>
              </div>
            </Step>

            <Step n={4} title="Zahlung" aside={<ShieldCheck size={20} className="text-ok" />}>
              <div className="grid gap-2.5" role="radiogroup">
                {PAYMENTS.map((p) => {
                  const on = pay === p.id;
                  return (
                    <label
                      key={p.id}
                      className={cx(
                        'flex cursor-pointer items-start gap-4 rounded-[14px] border bg-white p-4 transition-[border-color,box-shadow]',
                        on ? 'border-info shadow-[0_0_0_1px_var(--color-info)]' : 'border-line-2 hover:border-muted',
                      )}
                    >
                      <input type="radio" name="pay" value={p.id} checked={on} onChange={() => setPay(p.id)} className="sr-only" />
                      <span className={cx('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2', on ? 'border-info' : 'border-line-2')}>
                        {on && <span className="size-2.5 rounded-full bg-info" />}
                      </span>
                      <span className="flex-1">
                        <span className="flex items-center justify-between gap-2 text-[15px] font-semibold">
                          {p.label} <p.icon size={20} className="text-ink-2" />
                        </span>
                        <span className="mt-0.5 block text-[13px] text-muted">{p.text}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {pay === 'rechnung' && (
                <Field label="Verein / Schule / Firma" error={show('org')} className="mt-4">
                  <input name="org" autoComplete="organization" {...bind('org')} />
                </Field>
              )}
            </Step>
          </div>
        </div>

        <aside className="min-w-0 lg:col-span-5">
          <div className="rounded-[22px] bg-panel p-6 lg:sticky lg:top-6 lg:mt-8">
            <div className="mb-4 text-[20px] font-semibold tracking-[-0.02em]">Deine Bestellung</div>
            <ul className="mb-5 max-h-[300px] space-y-3 overflow-y-auto pr-1">
              {t.lines.map((l) => (
                <li key={l.key} className="flex items-center gap-3">
                  <div className="relative size-14 shrink-0 rounded-[12px] bg-white">
                    <Img thumb src={l.product.images[0]} alt="" className="size-full object-contain p-1.5" />
                    <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-ink text-[10px] font-bold text-white">{l.qty}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium">{l.product.title}</div>
                    {l.color && <div className="text-[12px] text-muted">{TABLE_COLORS[l.color].label}</div>}
                    {l.opts?.map((o) => (
                      <div key={o.group} className="truncate text-[11.5px] text-muted">
                        {o.group}: {o.value}
                      </div>
                    ))}
                    {l.discountLabel && <div className="text-[11.5px] font-medium text-ok">{l.discountLabel}</div>}
                  </div>
                  <div className="price text-[13.5px] font-semibold">{formatPrice(l.lineTotal - l.discount)}</div>
                </li>
              ))}
            </ul>
            <Summary t={t} compact />
            <button type="submit" className="btn btn-primary mt-6 hidden w-full lg:flex">
              <Lock size={16} /> Zahlungspflichtig bestellen
            </button>
            <p className="mt-4 text-[11.5px] leading-relaxed text-muted">
              Mit deiner Bestellung erklärst du dich mit unseren{' '}
              <Link to="/service" className="link">
                AGB
              </Link>{' '}
              einverstanden. Informationen zu deinem{' '}
              <Link to="/service" className="link">
                Widerrufsrecht
              </Link>{' '}
              und zum{' '}
              <Link to="/service" className="link">
                Datenschutz
              </Link>
              . Fragen? {SHOP.phone}
            </p>
            <p className="mt-3 rounded-lg bg-white px-3 py-2 text-[11.5px] text-muted">Prototyp: Es wird keine echte Bestellung ausgelöst und keine Zahlung durchgeführt.</p>
          </div>
        </aside>

        <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-[12px] whitespace-nowrap text-muted">Gesamt inkl. MwSt.</div>
              <div className="price text-[19px] font-semibold">{formatPrice(t.total)}</div>
            </div>
            <button type="submit" className="btn btn-primary h-12 px-4 text-[14px]">
              Zahlungspflichtig bestellen
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
