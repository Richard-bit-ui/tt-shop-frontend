import { useEffect, useState, type ReactNode } from 'react';
import { formatPrice, type OptionGroup, type OptionValue, type Product } from '../lib/catalog';
import type { LineOption } from '../store/cart';
import { ColorDot, cx, InfoHint, thicknessLabel } from './ui';

/**
 * Optionsauswahl (Varianten, Griffform, Größe, Montage, Versiegelung, Zusatzartikel) –
 * gemeinsam genutzt von Produktseite und Schnellansicht.
 */
/* ---------------- Optionen ---------------- */
export type Sel = Record<string, OptionValue | undefined>;

/** Überschrift im Store-Stil: „Farbe. Welche soll es sein?“ – rechts die aktuelle Auswahl */
export function StepTitle({ title, question, value, extra }: { title: string; question?: string; value?: ReactNode; extra?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <div className="text-[17px] leading-snug font-semibold tracking-[-0.015em]">
        {title}. {question && <span className="text-muted">{question}</span>} {extra}
      </div>
      {value && <div className="shrink-0 text-[13.5px] text-muted">{value}</div>}
    </div>
  );
}

/** Auswahl-Kachel: blauer Rahmen bei Auswahl, nicht verfügbare Optionen bleiben sichtbar und nennen den Grund */
export const tileCls = (on: boolean, disabled?: boolean) =>
  cx(
    'relative rounded-[12px] border text-left transition-[border-color,box-shadow,background-color] duration-150',
    on ? 'border-info bg-white shadow-[0_0_0_1px_var(--color-info)]' : 'border-line-2 bg-white hover:border-muted',
    disabled && 'cursor-not-allowed border-dashed bg-panel/60 text-subtle hover:border-line-2',
  );

const errCls = 'rounded-[14px] ring-2 ring-red ring-offset-4';

export function VariantPicker({ g, sel, setSel, error }: { g: OptionGroup; sel: Sel; setSel: (v?: OptionValue) => void; error?: boolean }) {
  const colors = [...new Set(g.values.map((v) => v.color).filter(Boolean))] as string[];
  const thick = [...new Set(g.values.map((v) => v.thickness).filter(Boolean))] as string[];
  const cur = sel[g.name];
  const [color, setColor] = useState<string | undefined>(cur?.color ?? (colors.length === 1 ? colors[0] : undefined));
  const [t, setT] = useState<string | undefined>(cur?.thickness ?? (thick.length === 1 ? thick[0] : undefined));
  useEffect(() => {
    const match = g.values.find((v) => (!colors.length || v.color === color) && (!thick.length || v.thickness === t));
    setSel(match);
  }, [color, t]); // eslint-disable-line react-hooks/exhaustive-deps
  const available = (c?: string, th?: string) => g.values.some((v) => (!c || v.color === c) && (!th || v.thickness === th));
  const minDelta = Math.min(...g.values.map((v) => v.delta ?? 0));
  return (
    <div className={cx('space-y-6', error && errCls)}>
      {colors.length > 0 && (
        <div>
          <StepTitle title="Farbe" question="Welche soll es sein?" value={color ? <span className="capitalize">{color}</span> : undefined} />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {colors.map((c) => {
              const ok = !t || available(c, t);
              return (
                <button key={c} type="button" onClick={() => setColor(c)} aria-pressed={color === c} className={cx(tileCls(color === c), 'flex h-14 items-center gap-3 px-4')}>
                  <ColorDot color={c} size={22} />
                  <span className="min-w-0">
                    <span className="block text-[14.5px] font-semibold capitalize">{c}</span>
                    {!ok && <span className="block text-[11.5px] text-warn">Nicht in {thicknessLabel(t!)}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {thick.length > 0 && (
        <div>
          <StepTitle title="Schwammstärke" question="Wie viel Tempo und Katapult?" value={t ? thicknessLabel(t) : undefined} />
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {thick.map((x) => {
              const ok = available(color, x);
              const delta = (g.values.find((v) => v.thickness === x && (!color || v.color === color))?.delta ?? 0) - minDelta;
              return (
                <button
                  key={x}
                  type="button"
                  disabled={!ok}
                  onClick={() => setT(x)}
                  aria-pressed={t === x}
                  className={cx(tileCls(t === x, !ok), 'num flex min-h-[60px] flex-col items-center justify-center px-2 py-2 text-center')}
                >
                  <span className="text-[15px] font-semibold">{thicknessLabel(x)}</span>
                  <span className="mt-0.5 text-[11.5px] text-muted">{!ok ? `Nicht in ${color}` : delta > 0 ? `+ ${formatPrice(delta)}` : 'Enthalten'}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const KIND_COPY: Partial<Record<OptionGroup['kind'], { q: string; none: string; noneSub: string }>> = {
  assembly: { q: 'Sollen wir ihn für dich aufbauen?', none: 'Nein, danke', noneSub: 'Ich klebe selbst' },
  sealing: { q: 'Schutz für das Außenfurnier.', none: 'Nein, danke', noneSub: 'Ohne Versiegelung' },
  addon: { q: 'Passendes dazu?', none: 'Nein, danke', noneSub: 'Nur den Artikel' },
};

export function OptionPicker({ g, sel, setSel, error }: { g: OptionGroup; sel: Sel; setSel: (v?: OptionValue) => void; error?: boolean }) {
  const cur = sel[g.name];
  if (g.kind === 'variant') return <VariantPicker g={g} sel={sel} setSel={setSel} error={error} />;
  const hint =
    g.kind === 'assembly' ? (
      <InfoHint text="Wir kleben die mitbestellten Beläge auf dein Holz, schneiden sie sauber zu und bringen ein Kantenband an." />
    ) : g.kind === 'sealing' ? (
      <InfoHint text="Versiegelung schützt das Außenfurnier beim späteren Belagwechsel vor Ausrissen." />
    ) : null;
  const label = (
    <StepTitle
      title={g.name}
      question={g.kind === 'handle' ? 'Welche Form liegt dir?' : g.kind === 'size' ? 'Welche Größe brauchst du?' : KIND_COPY[g.kind]?.q}
      extra={
        <>
          {g.required ? <span className="text-red">*</span> : <span className="text-[13px] font-normal text-muted">(optional)</span>} {hint}
        </>
      }
      value={cur ? cur.label : undefined}
    />
  );
  if (g.kind === 'size') return <SizePicker g={g} cur={cur} setSel={setSel} label={label} error={error} />;
  if (g.kind === 'handle') {
    return (
      <div className={cx(error && errCls)}>
        {label}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {g.values.map((v) => (
            <button
              key={v.label}
              type="button"
              onClick={() => setSel(v)}
              aria-pressed={cur?.label === v.label}
              className={cx(tileCls(cur?.label === v.label), 'flex min-h-[56px] flex-col justify-center px-4 py-2')}
            >
              <span className="text-[14px] leading-tight font-semibold">{v.label}</span>
              <span className="mt-0.5 text-[11.5px] text-muted">{v.delta > 0 ? `+ ${formatPrice(v.delta)}` : 'Enthalten'}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  // Services & Zusatzartikel: Kacheln mit expliziter „Nein, danke“-Option (wenn nicht Pflicht)
  if (g.values.length <= 6) {
    const copy = KIND_COPY[g.kind];
    return (
      <div className={cx(error && errCls)}>
        {label}
        <div className="grid gap-2.5 sm:grid-cols-2">
          {!g.required && (
            <button type="button" onClick={() => setSel(undefined)} aria-pressed={!cur} className={cx(tileCls(!cur), 'flex min-h-[60px] flex-col justify-center px-4 py-2.5')}>
              <span className="text-[14px] font-semibold">{copy?.none ?? 'Nein, danke'}</span>
              <span className="text-[12px] text-muted">{copy?.noneSub ?? 'Ohne diese Option'}</span>
            </button>
          )}
          {g.values.map((v) => (
            <button
              key={v.label}
              type="button"
              onClick={() => setSel(v)}
              aria-pressed={cur?.label === v.label}
              className={cx(tileCls(cur?.label === v.label), 'flex min-h-[60px] flex-col justify-center px-4 py-2.5')}
            >
              <span className="text-[14px] leading-snug font-semibold">{v.label}</span>
              <span className="num text-[12px] text-muted">{v.delta ? `+ ${formatPrice(v.delta)}` : 'Enthalten'}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={cx(error && errCls)}>
      {label}
      <select value={cur?.label ?? ''} onChange={(e) => setSel(g.values.find((v) => v.label === e.target.value))} className={cx('select h-12 w-full', error && 'border-red')}>
        <option value="">{g.required ? 'Bitte wählen …' : 'Nein, danke'}</option>
        {g.values.map((v) => (
          <option key={v.label} value={v.label}>
            {v.label}
            {v.delta ? `  (+${formatPrice(v.delta)})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Hook: Auswahlzustand + Pflichtfeldprüfung + Umwandlung in Warenkorb-Optionen */
export function useOptionState(p: Product | undefined) {
  const [sel, setSelState] = useState<Sel>({});
  const [errors, setErrors] = useState<string[]>([]);
  useEffect(() => {
    setSelState({});
    setErrors([]);
  }, [p?.id]);
  const setSel = (name: string) => (v?: OptionValue) => {
    setSelState((s) => ({ ...s, [name]: v }));
    if (v) setErrors((e) => e.filter((x) => x !== name));
  };
  const extra = Object.values(sel).reduce((n, v) => n + (v?.delta ?? 0), 0);
  const validate = (): LineOption[] | null => {
    if (!p) return null;
    const missing = p.options.filter((g: OptionGroup) => g.required && !sel[g.name]).map((g) => g.name);
    if (missing.length) {
      setErrors(missing);
      return null;
    }
    return p.options.flatMap((g) =>
      sel[g.name]
        ? [
            {
              group: g.kind === 'variant' ? 'Ausführung' : g.name,
              value: sel[g.name]!.label,
              delta: sel[g.name]!.delta,
            },
          ]
        : [],
    );
  };
  return { sel, setSel, errors, extra, validate };
}

/* ---------------- Größen (Schuhe, Bekleidung, Socken) ----------------
 * Die Shop-Labels kombinieren oft Ausführung und Größe („weiß/blau, Größe 40,5“).
 * Wir trennen beides: erst Ausführung wählen (falls mehrere), dann kompakte Größen-Kacheln.
 */
function splitSize(label: string): {
  variant: string;
  size: string;
  note?: string;
} {
  const i = label.lastIndexOf(', ');
  const variant = i > 0 ? label.slice(0, i) : '';
  let size = (i > 0 ? label.slice(i + 2) : label).replace(/^(Größe|Gr\.)\s*/i, '');
  let note: string | undefined;
  const m = size.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (m) {
    size = m[1];
    note = m[2];
  }
  return { variant, size, note };
}

function SizePicker({ g, cur, setSel, label, error }: { g: OptionGroup; cur?: OptionValue; setSel: (v?: OptionValue) => void; label: ReactNode; error?: boolean }) {
  const parts = g.values.map((v) => ({ v, ...splitSize(v.label) }));
  const variants = [...new Set(parts.map((x) => x.variant))];
  const multi = variants.length > 1;
  const [variant, setVariant] = useState<string>(cur ? splitSize(cur.label).variant : variants.length === 1 ? variants[0] : '');
  const shown = parts.filter((x) => !multi || x.variant === variant);
  const compact = shown.every((x) => x.size.length <= 5);
  return (
    <div className={cx(error && errCls)}>
      {label}
      {multi ? (
        <div className="mb-3">
          <div className="mb-1.5 text-[13px] text-ink-2">
            Ausführung: <span className="font-medium text-ink">{variant || 'bitte wählen'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {variants.map((x) => (
              <button
                key={x}
                type="button"
                aria-pressed={variant === x}
                onClick={() => {
                  setVariant(x);
                  if (cur && splitSize(cur.label).variant !== x) setSel(undefined);
                }}
                className={cx(tileCls(variant === x), 'min-h-11 px-3.5 py-2 text-[13.5px] font-medium')}
              >
                {x}
              </button>
            ))}
          </div>
        </div>
      ) : (
        variants[0] && <div className="-mt-1 mb-2 text-[13px] text-muted">Ausführung: {variants[0]}</div>
      )}
      {(!multi || variant) && (
        <div className={cx(compact ? 'grid grid-cols-4 gap-2 sm:grid-cols-6' : 'flex flex-wrap gap-2')}>
          {shown.map(({ v, size, note }) => {
            const on = cur?.label === v.label;
            return (
              <button
                key={v.label}
                type="button"
                onClick={() => setSel(v)}
                aria-pressed={on}
                aria-label={v.label}
                title={v.label}
                className={cx(tileCls(on), 'num flex min-h-12 flex-col items-center justify-center px-2.5 py-1 text-[14px] leading-tight font-medium', note && !on && 'border-dashed')}
              >
                <span>{size}</span>
                {note && <span className="text-[10px] font-normal text-muted">{note}</span>}
                {v.delta > 0 && <span className="text-[10px] opacity-70">+{formatPrice(v.delta)}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
