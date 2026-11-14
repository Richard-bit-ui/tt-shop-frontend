import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import os from 'node:os';

/** Erste LAN-IPv4-Adresse – damit der QR-Code für AR aufs Handy zeigt. */
function lanIp(): string {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const ni of list ?? []) {
      if (ni.family === 'IPv4' && !ni.internal && !ni.address.startsWith('169.254')) return ni.address;
    }
  }
  return 'localhost';
}

/** Öffentliche Vorschau (GitHub Pages): für Suchmaschinen sperren, damit sie nicht mit tt-shop.de konkurriert */
const preview = process.env.VITE_PUBLIC_PREVIEW === '1';
const noindex = {
  name: 'noindex-preview',
  transformIndexHtml: (html: string) => (preview ? html.replace('<head>', '<head>\n    <meta name="robots" content="noindex, nofollow" />') : html),
};

export default defineConfig({
  // Unterordner der Auslieferung: lokal „/“, auf GitHub Pages „/tt-shop-frontend/“
  base: process.env.GH_PAGES_BASE ?? '/',
  plugins: [react(), tailwindcss(), noindex],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  define: { __LAN_IP__: JSON.stringify(lanIp()) },
  build: { chunkSizeWarningLimit: 1600 },
});
