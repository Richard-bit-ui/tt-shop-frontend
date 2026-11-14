/**
 * Pfade zu Dateien aus public/ und App-Links – berücksichtigt den Unterordner, unter dem die Seite
 * ausgeliefert wird (lokal „/“, auf GitHub Pages „/tt-shop-frontend/“, siehe vite.config.ts → base).
 */
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

/** „/img/p/x.webp“ → „/tt-shop-frontend/img/p/x.webp“ (externe und relative URLs bleiben unverändert) */
export const asset = (p: string) => (p.startsWith('/') && !p.startsWith('//') && !p.startsWith(`${BASE_PATH}/`) ? BASE_PATH + p : p);

/** srcset-Angabe mit mehreren Kandidaten („/a.webp 720w, /b.webp 1200w“) */
export const srcset = (s: string) =>
  s
    .split(',')
    .map((c) => {
      const [url, ...rest] = c.trim().split(/\s+/);
      return [asset(url), ...rest].join(' ');
    })
    .join(', ');

/** Vollständige URL einer App-Seite, z. B. für Teilen-Links und strukturierte Daten */
export const pageUrl = (path: string) => `${window.location.origin}${BASE_PATH}${path}`;

/** Öffentliche Vorschau (GitHub Pages): Hinweis „Prototyp“ einblenden */
export const IS_PUBLIC_PREVIEW = import.meta.env.VITE_PUBLIC_PREVIEW === '1';
