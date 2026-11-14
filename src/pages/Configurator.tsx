import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import NumberFlow from '@number-flow/react';
import { ChevronRight, Info, Link2, Loader2, MessageCircle, Phone, RotateCcw, Search, ShoppingBag } from 'lucide-react';
import { COLOR_HEX, formatPrice, getProduct, inCat, RUBBER_TYPES, SHOP, specLine, useOptions, type Product } from '../lib/catalog';
import { deliveryWindow } from '../lib/delivery';
import { computeTotals, useCart, type CartLine, type LineOption } from '../store/cart';
import { useUI } from '../store/ui';
import { openChat } from '../store/chat';
import { StepTitle, tileCls } from '../components/Options';
import { Breadcrumbs, ColorDot, cx, Img, thicknessLabel } from '../components/ui';
import type { HandleShape, RacketLook } from '../three/racketModel';
import { usePageMeta } from '../lib/seo';

const RacketScene = lazy(() => import('../three/RacketScene'));

/**
 * Schläger-Konfigurator im Stil eines Apple-Kaufablaufs:
 * Holz → Griff → Vorhand → Rückhand → Service, live-3D-Vorschau, Zusammenfassung „Stimmt alles?“.
 * Die komplette Auswahl steht in der URL (teilbar, Zurück-Taste funktioniert).
 * Preise der Services aus den Produktoptionen von tt-shop.de (Montage inkl. Kantenband 2,00 €,
 * Versiegelung 2,50 € / 5,00 €). Regel: eine Seite schwarz, die andere farbig.
 */
const BLADES = inCat('hoelzer');
const RUBBERS = inCat('belaege').filter((p) => p.hasVariants);

interface RubberPick {
  id: string;
  color?: string;
  thickness?: string;
}

const mm = (t?: string) => (!t ? 2 : t === 'max' ? 2.2 : t === 'OX' ? 0 : parseFloat(t.replace(',', '.')) || 2);
const handleShape = (label?: string): HandleShape => (!label ? 'FL' : /gerade|straight/i.test(label) ? 'ST' : /anatom/i.test(label) ? 'AN' : 'FL');
const colorsOf = (p?: Product) => [...new Set((p?.options.find((o) => o.kind === 'variant')?.values ?? []).map((v) => v.color).filter(Boolean))] as string[];
const variantOf = (pick?: RubberPick) =>
  pick
    ? getProduct(pick.id)
        ?.options.find((o) => o.kind === 'variant')
        ?.values.find((v) => v.color === pick.color && v.thickness === pick.thickness)
    : undefined;
/** Regel: eine Seite schwarz, die andere farbig */
const allowedFor = (other?: string) => (c: string) => (!other ? true : other === 'schwarz' ? c !== 'schwarz' : c === 'schwarz');
const autoColor = (p: Product | undefined, other?: string) => {
  const ok = colorsOf(p).filter(allowedFor(other));
  return ok.includes('rot') ? 'rot' : ok[0];
};

/* ---------------- Bausteine ---------------- */
function Step({
  id,
  title,
  question,
  help,
  locked,
  lockedText,
  children,
}: {
  id: string;
  title: string;
  question: string;
  help?: ReactNode;
  locked?: boolean;
  lockedText?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cx('scroll-mt-32 border-t border-line pt-8 transition-opacity', locked && 'pointer-events-none opacity-40')} aria-disabled={locked}>
      <h2 className="text-[24px] leading-tight font-semibold tracking-[-0.02em] sm:text-[28px]">
        {title}. <span className="text-muted">{question}</span>
      </h2>
      {locked && lockedText ? <p className="mt-2 text-[14px] text-muted">{lockedText}</p> : null}
      <div className="mt-5">{children}</div>
      {help && !locked && <div className="mt-5">{help}</div>}
    </section>
  );
}

function HelpBox({ q, text, to, chat }: { q: string; text: string; to?: string; chat: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[18px] bg-panel p-4">
      <MessageCircle size={20} className="mt-0.5 shrink-0 text-info" />
      <div className="min-w-0 flex-1 text-[14px]">
        <div className="font-semibold">{q}</div>
        <div className="mt-0.5 text-muted">{text}</div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <button type="button" onClick={() => openChat(chat)} className="link-arrow text-[14px]">
            Assistent fragen <ChevronRight size={14} />
          </button>
          {to && (
            <Link to={to} className="link-arrow text-[14px]">
              Ratgeber lesen <ChevronRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductPicker({
  items,
  value,
  onPick,
  facet,
}: {
  items: Product[];
  value?: string;
  onPick: (id: string) => void;
  facet: { get: (p: Product) => string | undefined; order?: readonly string[] };
}) {
  const [q, setQ] = useState('');
  const [f, setF] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const values = useMemo(() => {
    const s = [...new Set(items.map(facet.get).filter(Boolean))] as string[];
    return facet.order ? s.sort((a, b) => facet.order!.indexOf(a) - facet.order!.indexOf(b)) : s;
  }, [items, facet]);
  const list = items.filter((p) => (!f || facet.get(p) === f) && (!q || `${p.brand} ${p.title}`.toLowerCase().includes(q.toLowerCase())));
  const selected = value ? getProduct(value) : undefined;
  const shown = all || q ? list : [...(selected && !list.slice(0, 6).includes(selected) && list.includes(selected) ? [selected] : []), ...list.slice(0, 6)];
  return (
    <div>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <label className="flex h-10 items-center gap-2 rounded-full bg-panel px-4 sm:w-60">
          <Search size={16} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Suchen …" aria-label="Suchen" className="w-full bg-transparent text-[14px] outline-none" />
        </label>
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <button type="button" aria-pressed={!f} onClick={() => setF(null)} className="chip">
            Alle
          </button>
          {values.map((v) => (
            <button key={v} type="button" aria-pressed={f === v} onClick={() => setF(f === v ? null : v)} className="chip">
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {shown.map((p) => (
          <button key={p.id} type="button" onClick={() => onPick(p.id)} aria-pressed={value === p.id} className={cx(tileCls(value === p.id), 'flex items-center gap-3 p-3')}>
            <span className="tile size-14 shrink-0 rounded-[10px] p-1">
              <Img thumb src={p.images[0]} alt="" className="size-full object-contain" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold">{p.title}</span>
              <span className="block truncate text-[12px] text-muted">{[p.brand, ...specLine(p).slice(0, 3)].join(' · ')}</span>
              <span className="num mt-0.5 block text-[13px]">{formatPrice(p.price)}</span>
            </span>
          </button>
        ))}
        {!shown.length && <div className="rounded-[12px] bg-panel px-4 py-6 text-center text-[13px] text-muted sm:col-span-2">Keine Treffer.</div>}
      </div>
      {!all && !q && list.length > 6 && (
        <button type="button" onClick={() => setAll(true)} className="link-arrow mt-3 text-[14px]">
          Alle {list.length} anzeigen <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

function RubberVariant({ pick, onChange, other, side }: { pick: RubberPick; onChange: (p: RubberPick) => void; other?: string; side: string }) {
  const p = getProduct(pick.id)!;
  const g = p.options.find((o) => o.kind === 'variant');
  if (!g) return <div className="mt-5 h-28 animate-pulse rounded-[14px] bg-panel" />;
  const colors = colorsOf(p);
  const allowed = allowedFor(other);
  const avail = (c?: string, t?: string) => g.values.some((v) => (!c || v.color === c) && (!t || v.thickness === t));
  const thick = [...new Set(g.values.map((v) => v.thickness).filter(Boolean))] as string[];
  const minDelta = Math.min(...g.values.map((v) => v.delta ?? 0));
  return (
    <div className="mt-6 space-y-6">
      <div>
        <StepTitle title="Farbe" question={`Für deine ${side}.`} value={pick.color ? <span className="capitalize">{pick.color}</span> : undefined} />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {colors.map((c) => {
            const ok = allowed(c);
            return (
              <button
                key={c}
                type="button"
                disabled={!ok}
                onClick={() => onChange({ ...pick, color: c, thickness: pick.thickness && avail(c, pick.thickness) ? pick.thickness : undefined })}
                aria-pressed={pick.color === c}
                className={cx(tileCls(pick.color === c, !ok), 'flex h-14 items-center gap-3 px-4')}
              >
                <ColorDot color={c} size={22} />
                <span className="min-w-0">
                  <span className="block text-[14.5px] font-semibold capitalize">{c}</span>
                  {!ok && <span className="block text-[11px] leading-tight">Regel: eine Seite schwarz</span>}
                </span>
              </button>
            );
          })}
        </div>
        {colors.every((c) => !allowed(c)) && <p className="mt-2 text-[13px] text-warn">Dieser Belag ist nicht in der benötigten Farbe erhältlich – bitte einen anderen wählen.</p>}
      </div>
      <div>
        <StepTitle title="Schwammstärke" question="Mehr Tempo oder mehr Kontrolle?" value={pick.thickness ? thicknessLabel(pick.thickness) : undefined} />
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {thick.map((t) => {
            const ok = !pick.color || avail(pick.color, t);
            const delta = (g.values.find((v) => v.thickness === t && (!pick.color || v.color === pick.color))?.delta ?? 0) - minDelta;
            return (
              <button
                key={t}
                type="button"
                disabled={!ok || !pick.color}
                onClick={() => onChange({ ...pick, thickness: t })}
                aria-pressed={pick.thickness === t}
                className={cx(tileCls(pick.thickness === t, !ok), 'num flex min-h-[60px] flex-col items-center justify-center px-2 py-2', !pick.color && 'opacity-50')}
              >
                <span className="text-[15px] font-semibold">{thicknessLabel(t)}</span>
                <span className="mt-0.5 text-[11.5px] text-muted">{!ok ? `Nicht in ${pick.color}` : delta > 0 ? `+ ${formatPrice(delta)}` : 'Enthalten'}</span>
              </button>
            );
          })}
        </div>
        {!pick.color && <p className="mt-2 text-[13px] text-muted">Wähle zuerst die Farbe.</p>}
      </div>
    </div>
  );
}

/* ---------------- Seite ---------------- */
export default function Configurator() {
  useOptions();
  usePageMeta(
    'Schläger-Konfigurator: Holz und Beläge zusammenstellen',
    'Holz, Vorhand- und Rückhandbelag wählen – wir montieren inkl. Kantenband für 2,00 €. Rabatte auf Hölzer und Beläge automatisch.',
  );
  const add = useCart((s) => s.add);
  const removeBundle = useCart((s) => s.removeBundle);
  const notify = useUI((s) => s.notify);
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [side, setSide] = useState<'fh' | 'bh'>('fh');
  // 3D-Vorschau erst laden, wenn der Browser frei ist (schnellerer Seitenaufbau)
  const [show3d, setShow3d] = useState(false);
  useEffect(() => {
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (ric) ric(() => setShow3d(true), { timeout: 2500 });
    else window.setTimeout(() => setShow3d(true), 800);
  }, []);

  // Zustand komplett aus der URL
  const bladeId = BLADES.find((b) => b.id === sp.get('holz'))?.id;
  const blade = bladeId ? getProduct(bladeId) : undefined;
  const handle = sp.get('griff') ?? undefined;
  const fh: RubberPick | undefined = RUBBERS.some((r) => r.id === sp.get('vh')) ? { id: sp.get('vh')!, color: sp.get('vhf') ?? undefined, thickness: sp.get('vhs') ?? undefined } : undefined;
  const bh: RubberPick | undefined = RUBBERS.some((r) => r.id === sp.get('rh')) ? { id: sp.get('rh')!, color: sp.get('rhf') ?? undefined, thickness: sp.get('rhs') ?? undefined } : undefined;
  const assembly = sp.get('montage') !== '0';
  const sealing = sp.get('siegel') ?? undefined;

  const set = (patch: Record<string, string | undefined | null>) => {
    const n = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    setSp(n, { replace: true });
  };
  const setFh = (p?: RubberPick) => {
    setSide('fh');
    const patch: Record<string, string | undefined> = { vh: p?.id, vhf: p?.color, vhs: p?.thickness };
    // Farbregel: Rückhand automatisch anpassen
    if (bh && p?.color && bh.color && !allowedFor(p.color)(bh.color)) {
      const c = autoColor(getProduct(bh.id), p.color);
      patch.rhf = c;
      const g = getProduct(bh.id)?.options.find((o) => o.kind === 'variant');
      patch.rhs = bh.thickness && g?.values.some((v) => v.color === c && v.thickness === bh.thickness) ? bh.thickness : undefined;
      if (c) notify(`Rückhand automatisch auf ${c} gestellt – eine Seite muss schwarz sein`);
    }
    set(patch);
  };
  const setBh = (p?: RubberPick) => {
    setSide('bh');
    set({ rh: p?.id, rhf: p?.color, rhs: p?.thickness });
  };
  const pickBh = (id: string) => {
    const prod = getProduct(id);
    const c = autoColor(prod, fh?.color);
    setBh({ id, color: c });
  };

  const handleGroup = blade?.options.find((o) => o.kind === 'handle');
  const asmGroup = blade?.options.find((o) => o.kind === 'assembly');
  const sealGroup = blade?.options.find((o) => o.kind === 'sealing');
  const fhV = variantOf(fh);
  const bhV = variantOf(bh);
  const asmValue = useMemo(() => {
    if (!asmGroup || !assembly) return undefined;
    const mount = asmGroup.values.filter((v) => /montier/i.test(v.label));
    const want = fh?.color === 'schwarz' ? /schwarz auf VH/i : /rot auf VH/i;
    return mount.find((v) => want.test(v.label)) ?? mount[0];
  }, [asmGroup, assembly, fh?.color]);
  const sealValue = sealGroup?.values.find((v) => v.label === sealing) ?? sealGroup?.values.find((v) => !v.delta);

  const bladeDone = !!blade && (!handleGroup || !!handle);
  const fhDone = !!fhV;
  const bhDone = !!bhV;
  const complete = bladeDone && fhDone && bhDone;

  const lines: CartLine[] = useMemo(() => {
    const out: CartLine[] = [];
    if (blade) {
      const opts: LineOption[] = [];
      const hv = handleGroup?.values.find((v) => v.label === handle);
      if (hv) opts.push({ group: 'Griffform', value: hv.label, delta: hv.delta });
      if (asmValue) opts.push({ group: 'Schlägermontage', value: asmValue.label.replace(/^bestellte Beläge montieren\s*/, 'Montage '), delta: asmValue.delta });
      if (sealValue && sealValue.delta > 0) opts.push({ group: 'Holzversiegelung', value: sealValue.label, delta: sealValue.delta });
      out.push({ key: 'b', id: blade.id, qty: 1, opts });
    }
    if (fh && fhV) out.push({ key: 'f', id: fh.id, qty: 1, opts: [{ group: 'Ausführung (VH)', value: fhV.label, delta: fhV.delta }] });
    if (bh && bhV) out.push({ key: 'r', id: bh.id, qty: 1, opts: [{ group: 'Ausführung (RH)', value: bhV.label, delta: bhV.delta }] });
    return out;
  }, [blade, handle, handleGroup, asmValue, sealValue, fh, fhV, bh, bhV]);
  const totals = computeTotals(lines);
  const net = totals.subtotal - totals.discount;
  const parts = [blade, fh && getProduct(fh.id), bh && getProduct(bh.id)].filter(Boolean) as Product[];
  const slowest = parts.find((p) => !p.inStock) ?? parts[0];
  const delivery = slowest ? deliveryWindow(slowest) : null;

  const toCart = () => {
    if (!complete) return;
    const bundle = `schlaeger-${Date.now().toString(36)}`;
    const replace = sp.get('ersetze');
    if (replace) removeBundle(replace);
    const q = new URLSearchParams(sp);
    q.delete('ersetze');
    for (const l of lines) add(l.id, 1, { opts: l.opts, bundle, note: `konfig:${q}` });
    notify('Schläger-Konfiguration im Warenkorb');
    nav('/warenkorb');
  };
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ title: 'Mein Schläger – TT-Shop', url });
      else {
        await navigator.clipboard.writeText(url);
        notify('Link zur Konfiguration kopiert');
      }
    } catch {
      /* abgebrochen */
    }
  };
  const nextStep = !blade ? 'schritt-holz' : !bladeDone ? 'schritt-griff' : !fhDone ? 'schritt-vh' : !bhDone ? 'schritt-rh' : 'zusammenfassung';

  // 3D-Ansicht: Platzhalterfarben rot/schwarz, bis gewählt ist
  const look = useMemo<RacketLook>(
    () => ({
      fh: COLOR_HEX[fh?.color ?? (bh?.color && bh.color !== 'schwarz' ? 'schwarz' : 'rot')],
      bh: COLOR_HEX[bh?.color ?? (fh?.color === 'schwarz' ? 'rot' : 'schwarz')],
      fhMm: mm(fh?.thickness),
      bhMm: mm(bh?.thickness),
      plies: blade?.specs.plies && blade.specs.plies >= 3 && blade.specs.plies <= 9 ? blade.specs.plies : 5,
      carbon: /carbon|alc|zlc/i.test(blade?.specs.material ?? ''),
      handle: handleShape(handle),
      tape: assembly,
      bladeMm: blade?.specs.thickness && blade.specs.thickness > 4.5 && blade.specs.thickness < 8 ? blade.specs.thickness : 5.9,
    }),
    [fh?.color, bh?.color, fh?.thickness, bh?.thickness, blade?.specs.plies, blade?.specs.material, blade?.specs.thickness, handle, assembly],
  );
  useEffect(() => {
    if (sp.get('vh') && !sp.get('holz')) setSide('fh');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const caption = (label: string, p?: RubberPick) => (
    <div className="flex min-w-0 items-center gap-2 text-[13px]">
      <ColorDot color={p?.color ?? (label === 'Vorhand' ? 'rot' : 'schwarz')} size={11} />
      <span className="shrink-0 text-muted">{label}:</span>
      <span className="truncate font-medium">{p ? `${getProduct(p.id)?.title}${p.thickness ? ` · ${thicknessLabel(p.thickness)}` : ''}` : 'noch nicht gewählt'}</span>
    </div>
  );

  const viewer = (
    <div className="relative overflow-hidden rounded-[28px] bg-[radial-gradient(ellipse_at_50%_35%,#ffffff,#ececf0_75%)]">
      <Suspense
        fallback={
          <div className="grid size-full place-items-center text-[13px] text-muted">
            <span className="flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" /> 3D-Vorschau wird geladen …
            </span>
          </div>
        }
      >
        {show3d ? (
          <RacketScene look={look} side={side} className="absolute inset-0" />
        ) : (
          <div className="grid size-full place-items-center text-[13px] text-muted">
            <span className="flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" /> 3D-Vorschau wird geladen …
            </span>
          </div>
        )}
      </Suspense>
      <div className="absolute inset-x-0 bottom-4 flex justify-center">
        <div className="flex rounded-full bg-white/80 p-1 shadow-sm backdrop-blur" role="radiogroup" aria-label="Ansicht">
          {(['fh', 'bh'] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={side === s}
              onClick={() => setSide(s)}
              className={cx('h-8 rounded-full px-4 text-[13px] font-medium transition-colors', side === s ? 'bg-ink text-white' : 'text-ink-2 hover:text-ink')}
            >
              {s === 'fh' ? 'Vorhand' : 'Rückhand'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-32 lg:pb-16">
      <div className="container-x">
        <Breadcrumbs items={[{ to: '/', label: 'Startseite' }, { to: '/c/schlaeger', label: 'Schläger' }, { label: 'Schläger-Konfigurator' }]} />
        <div className="flex flex-wrap items-end justify-between gap-4 pt-2">
          <div>
            <p className="text-[15px] font-semibold text-red">Montage inklusive Kantenband für 2,00 €</p>
            <h1 className="h1 mt-1">Schläger konfigurieren.</h1>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={share} className="btn btn-ghost btn-sm">
              <Link2 size={15} /> Teilen
            </button>
            <button type="button" onClick={() => setSp(new URLSearchParams(), { replace: true })} className="btn btn-ghost btn-sm" aria-label="Konfiguration zurücksetzen">
              <RotateCcw size={15} /> <span className="hidden sm:inline">Neu starten</span>
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
          <div className="lg:sticky lg:top-[calc(var(--hdr)+24px)] lg:h-[calc(100dvh-var(--hdr)-48px)] lg:max-h-[760px]">
            <div className="h-[min(56vh,440px)] lg:h-[calc(100%-118px)] [&>div]:h-full">{viewer}</div>
            <div className="mt-3 space-y-1 rounded-[18px] bg-panel px-4 py-3">
              <div className="truncate text-[13px]">
                <span className="text-muted">Holz:</span> <span className="font-medium">{blade ? `${blade.title}${handle ? ` · ${handle}` : ''}` : 'noch nicht gewählt'}</span>
              </div>
              {caption('Vorhand', fh)}
              {caption('Rückhand', bh)}
            </div>
            <p className="mt-2 text-center text-[12px] text-muted">Ziehen zum Drehen · Darstellung schematisch, Farben nach Auswahl</p>
          </div>

          <div className="min-w-0 space-y-10">
            <Step
              id="schritt-holz"
              title="Holz"
              question="Welches passt zu deinem Spiel?"
              help={
                <HelpBox
                  q="Brauchst du Hilfe bei der Wahl des Holzes?"
                  text="Allholz, Carbon oder ALC – Tempo, Gefühl und Gewicht im Überblick."
                  to="/ratgeber/holzaufbau"
                  chat="Welches Holz passt zu mir?"
                />
              }
            >
              <ProductPicker
                items={BLADES}
                value={bladeId}
                onPick={(id) => set({ holz: id, griff: undefined })}
                facet={{ get: (p) => p.specs.material, order: ['Allholz', 'Carbon', 'ALC', 'ZLC', 'Balsa'] }}
              />
            </Step>

            {handleGroup && (
              <Step id="schritt-griff" title="Griff" question="Welche Form liegt dir?" locked={!blade} lockedText="Wähle zuerst ein Holz.">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {handleGroup.values.map((v) => (
                    <button
                      key={v.label}
                      type="button"
                      onClick={() => set({ griff: v.label })}
                      aria-pressed={handle === v.label}
                      className={cx(tileCls(handle === v.label), 'flex min-h-[60px] flex-col justify-center px-4 py-2')}
                    >
                      <span className="text-[14px] leading-tight font-semibold">{v.label}</span>
                      <span className="mt-0.5 text-[11.5px] text-muted">{v.delta > 0 ? `+ ${formatPrice(v.delta)}` : 'Enthalten'}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[13px] text-muted">Konkav (FL) ist am weitesten verbreitet, gerade (ST) erleichtert den Griffwechsel, anatomisch (AN) füllt die Hand.</p>
              </Step>
            )}

            <Step
              id="schritt-vh"
              title="Vorhand"
              question="Dein Belag für die Vorhand."
              locked={!bladeDone}
              lockedText={!blade ? 'Wähle zuerst ein Holz.' : 'Wähle zuerst die Griffform.'}
              help={
                <HelpBox
                  q="Unsicher bei Belagart und Härte?"
                  text="Tensor, Hybrid oder klebrig – und welche Schwammstärke zu deinem Niveau passt."
                  to="/ratgeber/belagarten"
                  chat="Welcher Vorhandbelag passt zu mir?"
                />
              }
            >
              <ProductPicker
                items={RUBBERS}
                value={fh?.id}
                onPick={(id) => setFh({ id, color: autoColor(getProduct(id), bh?.color) })}
                facet={{ get: (p) => p.specs.rubberType, order: RUBBER_TYPES }}
              />
              {fh && <RubberVariant pick={fh} onChange={setFh} other={undefined} side="Vorhand" />}
            </Step>

            <Step id="schritt-rh" title="Rückhand" question="Und für die Rückhand?" locked={!fhDone} lockedText="Wähle zuerst den Vorhandbelag mit Farbe und Stärke.">
              <div className="mb-4 flex gap-2.5 rounded-[14px] bg-info/[0.06] px-4 py-3 text-[13.5px] text-ink-2">
                <Info size={17} className="mt-0.5 shrink-0 text-info" />
                <span>
                  Eine Seite muss schwarz sein, die andere farbig.{' '}
                  {fh?.color ? (
                    <b>
                      Weil die Vorhand {fh.color} ist, wird die Rückhand {fh.color === 'schwarz' ? 'farbig' : 'schwarz'} – das stellen wir automatisch ein.
                    </b>
                  ) : null}
                </span>
              </div>
              {fh && (
                <button
                  type="button"
                  onClick={() => {
                    const c = autoColor(getProduct(fh.id), fh.color);
                    const g = getProduct(fh.id)?.options.find((o) => o.kind === 'variant');
                    setBh({ id: fh.id, color: c, thickness: c && g?.values.some((v) => v.color === c && v.thickness === fh.thickness) ? fh.thickness : undefined });
                  }}
                  aria-pressed={bh?.id === fh.id}
                  className={cx(tileCls(bh?.id === fh.id), 'mb-4 flex w-full items-center gap-3 p-3')}
                >
                  <span className="tile size-14 shrink-0 rounded-[10px] p-1">
                    <Img thumb src={getProduct(fh.id)!.images[0]} alt="" className="size-full object-contain" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold">Gleicher Belag wie Vorhand</span>
                    <span className="block truncate text-[12.5px] text-muted">{getProduct(fh.id)!.title} – in der passenden Farbe</span>
                  </span>
                </button>
              )}
              <ProductPicker items={RUBBERS} value={bh?.id} onPick={pickBh} facet={{ get: (p) => p.specs.rubberType, order: RUBBER_TYPES }} />
              {bh && <RubberVariant pick={bh} onChange={setBh} other={fh?.color} side="Rückhand" />}
            </Step>

            <Step id="schritt-service" title="Service" question="Sollen wir ihn für dich aufbauen?" locked={!blade} lockedText="Wähle zuerst ein Holz.">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <button type="button" onClick={() => set({ montage: undefined })} aria-pressed={assembly} className={cx(tileCls(assembly), 'flex min-h-[72px] flex-col justify-center px-4 py-3')}>
                  <span className="text-[14.5px] font-semibold">Montage inkl. Kantenband</span>
                  <span className="text-[12.5px] text-muted">Aufkleben, sauber zuschneiden, spielfertig · + {formatPrice(asmGroup?.values.find((v) => /montier/i.test(v.label))?.delta ?? 2)}</span>
                </button>
                <button type="button" onClick={() => set({ montage: '0' })} aria-pressed={!assembly} className={cx(tileCls(!assembly), 'flex min-h-[72px] flex-col justify-center px-4 py-3')}>
                  <span className="text-[14.5px] font-semibold">Nein, danke</span>
                  <span className="text-[12.5px] text-muted">Ich klebe selbst – Teile kommen einzeln</span>
                </button>
              </div>
              {sealGroup && (
                <div className="mt-6">
                  <StepTitle title="Versiegelung" question="Schutz für das Außenfurnier." value={sealValue?.label} />
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {sealGroup.values.map((v) => {
                      const on = sealValue?.label === v.label;
                      return (
                        <button
                          key={v.label}
                          type="button"
                          onClick={() => set({ siegel: v.delta ? v.label : undefined })}
                          aria-pressed={on}
                          className={cx(tileCls(on), 'flex min-h-[64px] flex-col justify-center px-4 py-2.5')}
                        >
                          <span className="text-[14px] leading-snug font-semibold">{v.delta ? v.label : 'Nein, danke'}</span>
                          <span className="num text-[12px] text-muted">{v.delta ? `+ ${formatPrice(v.delta)}` : 'Ohne Versiegelung'}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[13px] text-muted">Schützt das Außenfurnier beim späteren Belagwechsel vor Ausrissen.</p>
                </div>
              )}
            </Step>
          </div>
        </div>

        {/* Zusammenfassung */}
        <section id="zusammenfassung" className="mt-16 scroll-mt-32">
          <h2 className="h2">
            Dein neuer Schläger. <span className="text-muted">Stimmt alles?</span>
          </h2>
          <div className="mt-6 grid gap-6 rounded-[28px] bg-panel p-5 sm:p-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-10">
            <div className="divide-y divide-black/[0.06]">
              {[
                { k: 'Holz', p: blade, sub: [handle, blade?.specs.material, blade?.specs.weight ? `ca. ${blade.specs.weight} g` : null].filter(Boolean).join(' · '), extra: 0, step: 'schritt-holz' },
                { k: 'Vorhand', p: fh && getProduct(fh.id), sub: fhV?.label, extra: fhV?.delta ?? 0, step: 'schritt-vh' },
                { k: 'Rückhand', p: bh && getProduct(bh.id), sub: bhV?.label, extra: bhV?.delta ?? 0, step: 'schritt-rh' },
              ].map((r) => (
                <div key={r.k} className="flex items-center gap-4 py-4 first:pt-0">
                  <span className="grid size-16 shrink-0 place-items-center rounded-[14px] bg-white p-1.5">{r.p && <Img thumb src={r.p.images[0]} alt="" className="size-full object-contain" />}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] text-muted">{r.k}</div>
                    <div className="truncate text-[15px] font-semibold">{r.p ? r.p.title : <span className="font-normal text-subtle">noch nicht gewählt</span>}</div>
                    {r.sub && <div className="truncate text-[13px] text-muted">{r.sub}</div>}
                  </div>
                  {r.p ? (
                    <div className="num shrink-0 text-[15px]">{formatPrice(r.p.price + r.extra)}</div>
                  ) : (
                    <a href={`#${r.step}`} className="link shrink-0 text-[14px]">
                      Wählen
                    </a>
                  )}
                </div>
              ))}
              <div className="space-y-1.5 py-4 text-[14px]">
                <div className="flex justify-between">
                  <span>{asmValue ? 'Montage inkl. Kantenband' : 'Ohne Montage'}</span>
                  <span className="num">{asmValue ? formatPrice(asmValue.delta) : '–'}</span>
                </div>
                {sealValue && sealValue.delta > 0 && (
                  <div className="flex justify-between">
                    <span>Versiegelung {sealValue.label}</span>
                    <span className="num">{formatPrice(sealValue.delta)}</span>
                  </div>
                )}
                {totals.discount > 0 && (
                  <div className="flex justify-between text-ok">
                    <span>Rabatte (10 % Holz, 15 % ab 2 Belägen)</span>
                    <span className="num">−{formatPrice(totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Versand</span>
                  <span>{net >= SHOP.freeShippingFrom ? <span className="text-ok">kostenlos</span> : net > 0 ? formatPrice(SHOP.shippingFee) : '–'}</span>
                </div>
              </div>
              <p className="pt-4 text-[12.5px] leading-snug text-muted">
                Nicht enthalten: Schlägerhülle und Belagreiniger.{' '}
                <Link to="/c/zubehoer" className="link">
                  Zubehör ansehen
                </Link>
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-[22px] bg-white p-6 shadow-[var(--shadow-card)]">
              <div>
                <div className="text-[14px] text-muted">Gesamt</div>
                <div className="num text-[40px] leading-tight font-semibold tracking-[-0.03em]">
                  <NumberFlow value={net + (net > 0 && net < SHOP.freeShippingFrom ? SHOP.shippingFee : 0)} format={{ style: 'currency', currency: 'EUR' }} locales="de-DE" />
                </div>
                <div className="text-[12.5px] text-muted">inkl. MwSt.{net > 0 && net < SHOP.freeShippingFrom ? ' und Versand' : ', versandkostenfrei'}</div>
              </div>
              {delivery && complete && (
                <div className="rounded-[14px] bg-panel px-4 py-3 text-[13.5px]">
                  Lieferung voraussichtlich <b>{delivery.label}</b>
                  <div className="text-[12.5px] text-muted">{delivery.method}</div>
                </div>
              )}
              <button type="button" disabled={!complete} onClick={toCart} className="btn btn-primary btn-lg w-full">
                <ShoppingBag size={18} /> In den Warenkorb
              </button>
              {!complete && (
                <a href={`#${nextStep}`} className="link-arrow justify-center text-[14px]">
                  Noch offen: {nextStep === 'schritt-holz' ? 'Holz' : nextStep === 'schritt-griff' ? 'Griff' : nextStep === 'schritt-vh' ? 'Vorhandbelag' : 'Rückhandbelag'} <ChevronRight size={14} />
                </a>
              )}
              <button type="button" onClick={share} className="btn btn-outline w-full">
                <Link2 size={16} /> Konfiguration teilen
              </button>
              <p className="text-[12px] leading-snug text-muted">
                Nach deinen Vorgaben montierte Schläger sind vom Widerrufsrecht ausgenommen (§ 312g Abs. 2 Nr. 1 BGB). Einzelteile ohne Montage kannst du wie gewohnt widerrufen.{' '}
                <Link to="/service" className="link">
                  AGB
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Hilfe */}
        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[22px] bg-panel p-6">
            <h2 className="text-[20px] font-semibold tracking-[-0.02em]">Hast du noch Fragen?</h2>
            <p className="mt-1 text-[14px] text-muted">Unser Assistent kennt alle Hölzer und Beläge – die Fachberatung hilft persönlich weiter.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => openChat('Ich brauche Hilfe beim Schläger-Konfigurator.')} className="btn btn-dark btn-sm">
                <MessageCircle size={15} /> Assistent fragen
              </button>
              <a href={SHOP.phoneHref} className="btn btn-outline btn-sm">
                <Phone size={15} /> {SHOP.phone}
              </a>
            </div>
          </div>
          <Link to="/profi-setups" className="store-card group p-6">
            <h2 className="text-[20px] font-semibold tracking-[-0.02em]">Lieber ein Profi-Setup?</h2>
            <p className="mt-1 text-[14px] text-muted">Das Material von Calderano, Lebrun, Moregard & Co. – komplett montiert.</p>
            <span className="link-arrow mt-4 text-[14px]">
              Profi-Setups ansehen <ChevronRight size={14} />
            </span>
          </Link>
        </section>
      </div>

      {/* mobile Leiste */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/85 px-4 py-2.5 shadow-bar backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-muted">Dein Schläger</div>
            <div className="num text-[19px] font-semibold tracking-[-0.02em]">
              <NumberFlow value={net} format={{ style: 'currency', currency: 'EUR' }} locales="de-DE" />
            </div>
          </div>
          {complete ? (
            <button type="button" onClick={toCart} className="btn btn-primary h-11 px-5">
              <ShoppingBag size={17} /> In den Warenkorb
            </button>
          ) : (
            <a href={`#${nextStep}`} className="btn btn-blue h-11 px-5">
              Weiter <ChevronRight size={16} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
