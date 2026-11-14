import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { useMemo } from 'react';
import { getProduct, SHOP, type Product } from '../lib/catalog';
import type { TableColor } from '../three/tableSpec';

export interface LineOption {
  group: string;
  value: string;
  delta: number;
}

export interface CartLine {
  key: string;
  id: string;
  qty: number;
  color?: TableColor;
  opts?: LineOption[];
  /** gemeinsame ID, wenn Teile im Schläger-Konfigurator zusammengestellt wurden */
  bundle?: string;
  note?: string;
}

export interface AddExtras {
  color?: TableColor;
  opts?: LineOption[];
  bundle?: string;
  note?: string;
}

const keyOf = (id: string, x: AddExtras = {}) => [id, x.color ?? '', (x.opts ?? []).map((o) => `${o.group}=${o.value}`).join('|'), x.bundle ?? '', x.note ?? ''].join('::');

interface CartState {
  lines: CartLine[];
  add: (id: string, qty?: number, extras?: AddExtras) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  removeBundle: (bundle: string) => void;
  /** Optionen einer Position ersetzen (z. B. Montage nachträglich hinzufügen) */
  setOpts: (key: string, opts: LineOption[]) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (id, qty = 1, extras = {}) =>
        set((s) => {
          const key = keyOf(id, extras);
          const existing = s.lines.find((l) => l.key === key);
          if (existing)
            return {
              lines: s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(99, l.qty + qty) } : l)),
            };
          return { lines: [...s.lines, { key, id, qty, ...extras }] };
        }),
      setQty: (key, qty) =>
        set((s) => ({
          lines: qty <= 0 ? s.lines.filter((l) => l.key !== key) : s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(99, qty) } : l)),
        })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      removeBundle: (bundle) => set((s) => ({ lines: s.lines.filter((l) => l.bundle !== bundle) })),
      setOpts: (key, opts) =>
        set((s) => ({
          lines: s.lines.map((l) =>
            l.key === key
              ? {
                  ...l,
                  opts,
                  key: keyOf(l.id, {
                    color: l.color,
                    opts,
                    bundle: l.bundle,
                    note: l.note,
                  }),
                }
              : l,
          ),
        })),
      clear: () => set({ lines: [] }),
    }),
    { name: 'tt-cart-v2' },
  ),
);

export interface PricedLine extends CartLine {
  product: Product;
  unit: number;
  lineTotal: number;
  discount: number;
  discountLabel: string | null;
}

export interface CartTotals {
  lines: PricedLine[];
  count: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  vat: number;
  freeShippingLeft: number;
  hasFreight: boolean;
  nudge: string | null;
}

/**
 * Rabattlogik laut tt-shop.de/de/rabattsystem:
 * – 10 % auf nicht reduzierte Hölzer
 * – 15 % ab zwei Belägen auf die nicht reduzierten Beläge
 * – versandkostenfrei ab 69 €, sonst 5,90 €
 * Rabatte gelten auf den Artikelpreis, nicht auf Services (Montage, Versiegelung).
 */
export function computeTotals(lines: CartLine[]): CartTotals {
  const resolved = lines.flatMap((l) => {
    const product = getProduct(l.id);
    return product ? [{ ...l, product }] : [];
  });
  const rubberCount = resolved.filter((l) => l.product.cat === 'belaege').reduce((n, l) => n + l.qty, 0);
  const priced: PricedLine[] = resolved.map((l) => {
    const extra = (l.opts ?? []).reduce((n, o) => n + o.delta, 0);
    const unit = l.product.price + extra;
    const lineTotal = unit * l.qty;
    let rate = 0;
    let label: string | null = null;
    if (!l.product.sale && l.product.cat === 'hoelzer') {
      rate = 0.1;
      label = '10 % Holz-Rabatt';
    }
    if (!l.product.sale && l.product.cat === 'belaege' && rubberCount >= 2) {
      rate = 0.15;
      label = '15 % ab 2 Belägen';
    }
    return {
      ...l,
      unit,
      lineTotal,
      discount: Math.round(l.product.price * l.qty * rate * 100) / 100,
      discountLabel: label,
    };
  });
  const subtotal = priced.reduce((n, l) => n + l.lineTotal, 0);
  const discount = priced.reduce((n, l) => n + l.discount, 0);
  const net = subtotal - discount;
  const shipping = priced.length === 0 || net >= SHOP.freeShippingFrom ? 0 : SHOP.shippingFee;
  const total = net + shipping;
  const nudge = rubberCount === 1 && priced.some((l) => l.product.cat === 'belaege' && !l.product.sale) ? 'Noch ein Belag dazu – dann sparst du 15 % auf deine Beläge.' : null;
  return {
    lines: priced,
    count: priced.reduce((n, l) => n + l.qty, 0),
    subtotal,
    discount,
    shipping,
    total,
    vat: total - total / 1.19,
    freeShippingLeft: Math.max(0, SHOP.freeShippingFrom - net),
    hasFreight: priced.some((l) => l.product.freight),
    nudge,
  };
}

export function useCartTotals(): CartTotals {
  const lines = useCart(useShallow((s) => s.lines));
  return useMemo(() => computeTotals(lines), [lines]);
}

export const useCartCount = () => useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));

/* ---------- Warenkorb als Link teilen (z. B. Materialliste vom Trainer) ---------- */
type Packed = [string, number, [string, string, number][]?, string?, string?];

const b64url = (str: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const unb64url = (b: string) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

export function packCart(lines: CartLine[]): string {
  const packed: Packed[] = lines.map((l) => {
    const row: Packed = [l.id, l.qty];
    if (l.opts?.length || l.bundle || l.note) row.push((l.opts ?? []).map((o) => [o.group, o.value, o.delta]));
    if (l.bundle || l.note) row.push(l.bundle ?? '');
    if (l.note) row.push(l.note);
    return row;
  });
  return b64url(JSON.stringify(packed));
}

export function unpackCart(code: string): CartLine[] {
  try {
    const rows = JSON.parse(unb64url(code)) as Packed[];
    if (!Array.isArray(rows)) return [];
    return rows.flatMap((r) => {
      const [id, qty, opts, bundle, note] = r;
      if (typeof id !== 'string' || !getProduct(id)) return [];
      const o = (opts ?? []).map(([group, value, delta]) => ({
        group: String(group),
        value: String(value),
        delta: Number(delta) || 0,
      }));
      const extras: AddExtras = {
        opts: o.length ? o : undefined,
        bundle: bundle || undefined,
        note: note || undefined,
      };
      return [
        {
          key: keyOf(id, extras),
          id,
          qty: Math.max(1, Math.min(99, Number(qty) || 1)),
          ...extras,
        },
      ];
    });
  } catch {
    return [];
  }
}

/** Mehrere Positionen auf einmal übernehmen (Mengen werden bei gleicher Konfiguration addiert) */
export function addLines(lines: CartLine[]) {
  const st = useCart.getState();
  for (const l of lines)
    st.add(l.id, l.qty, {
      color: l.color,
      opts: l.opts,
      bundle: l.bundle,
      note: l.note,
    });
}
