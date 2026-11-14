/**
 * Reine Daten/Typen zur Tischtennisplatte – bewusst OHNE three.js-Import,
 * damit Katalog und UI sie nutzen können, ohne three.js ins Start-Bundle zu ziehen.
 */
export type TableColor = 'blau' | 'gruen' | 'anthrazit' | 'schwarz';
export type TableKind = 'outdoor' | 'indoor' | 'competition';

export interface TableConfig {
  color: TableColor;
  kind: TableKind;
  /** Plattenstärke in mm (Outdoor 4–10, Indoor 19–28) */
  thicknessMm: number;
}

export const TABLE = {
  L: 2.74,
  W: 1.525,
  H: 0.76,
  NET_H: 0.1525,
  NET_OVERHANG: 0.1525,
  /** Abstellmaße in Parkposition (B × T × H) */
  PARK: { W: 1.525, D: 0.69, H: 1.63 },
} as const;

export const TABLE_COLORS: Record<TableColor, { hex: string; label: string }> = {
  blau: { hex: '#1f5294', label: 'Blau' },
  gruen: { hex: '#1c5a3d', label: 'Grün' },
  anthrazit: { hex: '#3b4048', label: 'Anthrazit' },
  schwarz: { hex: '#17191c', label: 'Schwarz' },
};

/** Leitet aus Shop-Attributen eine 3D-Konfiguration ab */
export function configFromAttrs(attrs: Record<string, string>, group: string, preferredColor?: TableColor): TableConfig | null {
  const ort = (attrs['Verwendungsort'] || '').toLowerCase();
  const kind: TableKind = attrs['ITTF Zulassung'] === 'Ja' || group === 'wettkampftische' ? 'competition' : ort.includes('outdoor') ? 'outdoor' : 'indoor';
  const mm = parseFloat((attrs['Plattenstärke'] || '').replace(',', '.'));
  const thicknessMm = Number.isFinite(mm) ? mm : kind === 'outdoor' ? 6 : 25;
  return { kind, thicknessMm, color: preferredColor ?? colorsFromAttrs(attrs)[0] ?? 'blau' };
}

export function colorsFromAttrs(attrs: Record<string, string>): TableColor[] {
  const f = (attrs['Farben'] || '').toLowerCase();
  const out: TableColor[] = [];
  if (f.includes('blau')) out.push('blau');
  if (f.includes('grün') || f.includes('gruen')) out.push('gruen');
  if (f.includes('anthrazit') || f.includes('grau')) out.push('anthrazit');
  if (f.includes('schwarz')) out.push('schwarz');
  return out.length ? out : ['blau'];
}

/** Klappzustand der Platte im Produkt-Viewer */
export type FoldMode = 'play' | 'playback' | 'park';
