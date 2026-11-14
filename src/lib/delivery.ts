import { useEffect, useState } from 'react';
import type { Product } from './catalog';

/** Feiertage Sachsen (Versand aus Dippoldiswalde) – genügt für den Prototyp */
const HOLIDAYS = new Set([
  '2026-11-18', // Buß- und Bettag (Sachsen)
  '2026-12-24',
  '2026-12-25',
  '2026-12-26',
  '2026-12-31',
  '2027-01-01',
  '2027-03-26',
  '2027-03-29',
  '2027-05-01',
  '2027-05-06',
  '2027-05-17',
]);

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const isWorkday = (d: Date) => d.getDay() !== 0 && d.getDay() !== 6 && !HOLIDAYS.has(iso(d));

function addWorkdays(start: Date, n: number): Date {
  const d = new Date(start);
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (isWorkday(d)) left--;
  }
  return d;
}

const fmt = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
});
const fmtDay = (d: Date) => fmt.format(d).replace(',', '');

export interface DeliveryInfo {
  from: Date;
  to: Date;
  label: string;
  hint: string;
  method: 'DPD-Paket' | 'Spedition';
}

/**
 * Lieferfenster laut tt-shop.de/de/lieferung: Lagerware 1–2 Werktage bis Übergabe + DPD-Laufzeit,
 * nicht lagernde Ware 2–5 Werktage, Tische 5–10 Werktage per Spedition (Bestellung vor 12 Uhr zählt).
 */
export function deliveryWindow(p: Pick<Product, 'freight' | 'inStock' | 'delivery'>, now = new Date()): DeliveryInfo {
  const m = p.delivery?.match(/(\d+)\s*-\s*(\d+)\s*Werktage/);
  const weeks = p.delivery?.match(/(\d+)\s*Wochen/);
  let min: number;
  let max: number;
  if (weeks) {
    min = (+weeks[1] - 1) * 5;
    max = +weeks[1] * 5;
  } else if (m) {
    min = +m[1];
    max = +m[2];
  } else if (p.inStock) {
    min = 2;
    max = 3;
  } else {
    min = 3;
    max = 6;
  }
  const countsToday = now.getHours() < 12 && isWorkday(now);
  const base = new Date(now);
  if (countsToday) base.setDate(base.getDate() - 1);
  const from = addWorkdays(base, min);
  const to = addWorkdays(base, max);
  return {
    from,
    to,
    label: `${fmtDay(from)} – ${fmtDay(to)}`,
    hint: countsToday ? 'Bis 12:00 Uhr bestellt – heute zählt als erster Tag.' : 'Bestellungen ab 12:00 Uhr zählen ab dem nächsten Werktag.',
    method: p.freight ? 'Spedition' : 'DPD-Paket',
  };
}

/** Minuten bis zum Bestell-Stichtag 12:00 Uhr (nur an Werktagen), sonst null – aktualisiert sich minütlich. */
export function useCutoff(): number | null {
  const calc = () => {
    const now = new Date();
    if (!isWorkday(now)) return null;
    const cut = new Date(now);
    cut.setHours(12, 0, 0, 0);
    const min = Math.ceil((cut.getTime() - now.getTime()) / 60000);
    return min > 0 ? min : null;
  };
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    const t = window.setInterval(() => setLeft(calc()), 30000);
    return () => window.clearInterval(t);
  }, []);
  return left;
}

export const fmtDuration = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} Std. ${min % 60} Min.` : `${min} Min.`);
