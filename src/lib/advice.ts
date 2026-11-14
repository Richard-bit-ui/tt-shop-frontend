import { formatPrice, products, type Product } from './catalog';

/**
 * TT-Shop-Einordnung: macht aus Belagart, Härte bzw. Holzklasse eine Kaufentscheidung
 * („Für wen ist das?“). Bewusst als abgeleitete Orientierung gekennzeichnet – keine
 * Herstellerangabe. Sobald Tempo/Spin/Kontrolle als Attribute in OpenMage gepflegt sind,
 * kann diese Logik verfeinert werden.
 */

export type Level = 'Einsteiger' | 'Fortgeschrittene' | 'Leistungsspieler' | 'Spezialisten';
export interface Suitability {
  code: string;
  style: string;
  level: Level;
  note: string;
}

export const SUIT_INFO =
  'TT-Shop-Einordnung, abgeleitet aus Belagart und Schwammhärte bzw. Holzklasse und Material. Orientierung – keine Herstellerangabe. OF = Offensiv, AR = Allround, DEF = Defensiv.';

export function suitability(p: Product): Suitability | null {
  const s = p.specs;
  if (p.cat === 'belaege') {
    const h = s.hardness;
    const t = s.rubberType;
    if (t === 'Lange Noppen') return { code: 'DEF / Stör', style: 'Abwehr- und Störspiel', level: 'Spezialisten', note: 'Rotationsumkehr – braucht Erfahrung mit Noppenmaterial.' };
    if (t === 'Halblange Noppen') return { code: 'Stör / Block', style: 'Störendes Blockspiel', level: 'Spezialisten', note: 'Mehr Eigenkontrolle als Langnoppen, aber deutlich störend.' };
    if (t === 'Kurze Noppen') return { code: 'OF / Block', style: 'Schnelles Kurznoppen-Angriffsspiel', level: 'Spezialisten', note: 'Direktes Tempospiel am Tisch, wenig spinanfällig.' };
    if (t === 'Anti' || t === 'Glanti') return { code: 'Stör / Block', style: 'Block- und Störspiel', level: 'Spezialisten', note: 'Neutralisiert Spin – typisch für Rückhand-Blockspieler.' };
    if (t === 'Klassisch') {
      if (/defense|def\b|defence/i.test(p.title)) return { code: 'DEF', style: 'Klassische Abwehr', level: 'Fortgeschrittene', note: 'Hohe Kontrolle für Unterschnittabwehr.' };
      return h && h >= 45
        ? { code: 'AR+', style: 'Kontrolliertes Allround-Spiel', level: 'Fortgeschrittene', note: 'Viel Kontrolle, solides Tempo ohne Katapult.' }
        : { code: 'AR', style: 'Allround & Technikaufbau', level: 'Einsteiger', note: 'Sehr kontrolliert – ideal zum Lernen und für Freizeitspieler.' };
    }
    if (t === 'Tensor' || t === 'Hybrid' || t === 'Klebrig') {
      const sticky = t !== 'Tensor';
      if (!h) return { code: 'OF', style: sticky ? 'Rotationsbetontes Offensivspiel' : 'Modernes Topspinspiel', level: 'Fortgeschrittene', note: 'Härte vom Hersteller nicht angegeben.' };
      if (h <= 42) return { code: 'AR+ / OF-', style: 'Kontrolliertes Offensivspiel', level: 'Einsteiger', note: 'Weicher Schwamm verzeiht Fehler – gut für Aufsteiger und die Rückhand.' };
      if (h <= 46) return { code: 'OF-', style: sticky ? 'Spinbetonter Aufbau' : 'Variables Offensivspiel', level: 'Fortgeschrittene', note: 'Ausgewogen zwischen Kontrolle und Tempo.' };
      if (h <= 49)
        return { code: 'OF', style: sticky ? 'Rotationsstarkes Topspinspiel' : 'Topspinspiel aus Halbdistanz', level: 'Fortgeschrittene', note: 'Braucht saubere Technik und Schlaggeschwindigkeit.' };
      return { code: 'OF+', style: 'Kompromissloses Offensivspiel', level: 'Leistungsspieler', note: 'Harter Schwamm entfaltet sich erst bei hoher Schlaggeschwindigkeit.' };
    }
    return null;
  }
  if (p.cat === 'hoelzer') {
    const c = s.class;
    if (c === 'DEF' || /defens|defplay|def\b/i.test(p.title)) return { code: 'DEF', style: 'Abwehrspiel', level: 'Fortgeschrittene', note: 'Langsames Holz mit viel Kontrolle für Unterschnitt.' };
    if (c?.startsWith('ALL')) return { code: c, style: 'Allround', level: 'Einsteiger', note: 'Kontrolliert und gutmütig – auch für Aufsteiger.' };
    if (c === 'OFF+' || s.material === 'ZLC' || s.material === 'ALC')
      return { code: 'OF+', style: 'Tempo-Offensive', level: 'Leistungsspieler', note: 'Schnell und direkt – verlangt saubere Technik.' };
    if (c?.startsWith('OFF') || s.material === 'Carbon')
      return {
        code: c ?? 'OF',
        style: 'Offensivspiel',
        level: 'Fortgeschrittene',
        note: s.material === 'Carbon' ? 'Carbon bringt Tempo und einen großen Sweet Spot.' : 'Offensives Allholz mit gutem Ballgefühl.',
      };
    if (s.material === 'Allholz' || s.material === 'Balsa')
      return {
        code: s.plies === 7 ? 'OF-' : 'AR / OF-',
        style: s.plies === 7 ? 'Kontrollierte Offensive' : 'Allround bis Offensiv',
        level: s.plies === 7 ? 'Fortgeschrittene' : 'Einsteiger',
        note: 'Allholz bietet viel Ballgefühl und Kontrolle.',
      };
    return null;
  }
  return null;
}

/** Stückpreis ab zwei Belägen (15 % Rabatt, nur nicht reduzierte Beläge) */
export function pairPrice(p: Product): { each: number; label: string } | null {
  if (p.cat !== 'belaege' || p.sale) return null;
  const each = Math.round(p.price * 0.85 * 100) / 100;
  return { each, label: `ab 2 Belägen je ${formatPrice(each)}` };
}

/** Weichere/kontrolliertere Alternativen, z. B. für Einsteiger */
export function easierAlternatives(p: Product, n = 3): Product[] {
  if (p.cat !== 'belaege' || !p.specs.hardness) return [];
  const sameSeries = products.filter((x) => x.cat === 'belaege' && x.brand === p.brand && x.series === p.series && x.id !== p.id && (x.specs.hardness ?? 99) < p.specs.hardness!);
  const sameType = products.filter((x) => x.cat === 'belaege' && x.specs.rubberType === p.specs.rubberType && x.id !== p.id && (x.specs.hardness ?? 99) <= p.specs.hardness! - 3);
  return [...new Map([...sameSeries, ...sameType].map((x) => [x.id, x])).values()].slice(0, n);
}
