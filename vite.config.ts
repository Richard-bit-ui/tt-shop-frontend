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

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  define: { __LAN_IP__: JSON.stringify(lanIp()) },
  build: { chunkSizeWarningLimit: 1600 },
});
