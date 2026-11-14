/**
 * Exportiert die prozedurale Platte als GLB-Dateien für AR ("In deinem Raum ansehen").
 * Eine Datei pro Farbe × Bauart, weil Scene Viewer (Android) die Datei neu lädt und
 * Laufzeit-Farbwechsel sonst verloren gingen.
 *
 * Aufruf: npm run build:models   (Node ≥ 23 führt TypeScript direkt aus)
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { buildTable, TABLE_COLORS } from '../src/three/tableModel.ts';
import type { TableColor, TableKind } from '../src/three/tableModel.ts';

// Minimaler FileReader-Ersatz – GLTFExporter nutzt ihn für das Binärformat
class NodeFileReader {
  result: ArrayBuffer | string | null = null;
  onload: ((e: unknown) => void) | null = null;
  onloadend: ((e: unknown) => void) | null = null;
  readAsArrayBuffer(blob: Blob) {
    void blob.arrayBuffer().then((b) => this.done(b));
  }
  readAsDataURL(blob: Blob) {
    void blob.arrayBuffer().then((b) => this.done(`data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(b).toString('base64')}`));
  }
  private done(r: ArrayBuffer | string) {
    this.result = r;
    this.onload?.({ target: this });
    this.onloadend?.({ target: this });
  }
}
(globalThis as Record<string, unknown>).FileReader = NodeFileReader;

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'models');
const KINDS: Record<TableKind, number> = { outdoor: 6, indoor: 22, competition: 25 };

await mkdir(OUT, { recursive: true });
const exporter = new GLTFExporter();
for (const kind of Object.keys(KINDS) as TableKind[]) {
  for (const color of Object.keys(TABLE_COLORS) as TableColor[]) {
    const table = buildTable({ kind, color, thicknessMm: KINDS[kind] });
    const scene = new THREE.Scene();
    scene.add(table.root);
    const glb = (await exporter.parseAsync(scene, { binary: true })) as ArrayBuffer;
    const file = `platte-${kind}-${color}.glb`;
    await writeFile(join(OUT, file), Buffer.from(glb));
    console.log('✔', file, (glb.byteLength / 1024).toFixed(0) + ' KB');
    table.dispose();
  }
}
