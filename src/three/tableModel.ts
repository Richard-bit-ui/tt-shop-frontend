/**
 * Prozedurales 3D-Modell einer Tischtennisplatte (Maße nach ITTF: 274 × 152,5 × 76 cm).
 *
 * Reines three.js ohne React – wird sowohl vom Live-Viewer (react-three-fiber) als auch vom
 * Node-Skript scripts/build-models.ts (GLB-Export für AR) verwendet. Deshalb nur
 * "erasable" TypeScript-Syntax (keine enums/namespaces), damit Node die Datei direkt ausführen kann.
 *
 * Koordinaten: Meter, Y nach oben, Längsachse = X, Netz bei X = 0.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

import { TABLE, TABLE_COLORS, type TableColor, type TableConfig } from './tableSpec.ts';
export * from './tableSpec.ts';

export interface TableHandle {
  root: THREE.Group;
  /** 0 = Spielposition, 1 = hochgeklappt. a = linke Hälfte (mit Netz), b = rechte Hälfte */
  setFold(a: number, b: number): void;
  setColor(color: TableColor): void;
  /** Alle Meshes, z. B. für Raycasting beim Verschieben im Raumplaner */
  meshes: THREE.Mesh[];
  dispose(): void;
}

interface Mats {
  top: THREE.MeshPhysicalMaterial;
  line: THREE.MeshStandardMaterial;
  frame: THREE.MeshStandardMaterial;
  leg: THREE.MeshStandardMaterial;
  plastic: THREE.MeshStandardMaterial;
  rubber: THREE.MeshStandardMaterial;
  chrome: THREE.MeshStandardMaterial;
  net: THREE.MeshStandardMaterial;
  netBand: THREE.MeshStandardMaterial;
}

const HALF = TABLE.L / 2 - 0.0015; // kleiner Spalt in der Mitte
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

function makeMaterials(cfg: TableConfig, netTexture?: THREE.Texture): Mats {
  const outdoor = cfg.kind === 'outdoor';
  return {
    top: new THREE.MeshPhysicalMaterial({
      name: 'Spielfläche',
      color: TABLE_COLORS[cfg.color].hex,
      roughness: outdoor ? 0.38 : 0.5,
      clearcoat: outdoor ? 0.35 : 0.12,
      clearcoatRoughness: 0.55,
    }),
    line: new THREE.MeshStandardMaterial({ name: 'Linien', color: '#f4f4f2', roughness: 0.45 }),
    frame: new THREE.MeshStandardMaterial({
      name: 'Rahmen',
      color: cfg.kind === 'indoor' ? '#9aa1aa' : '#2a2d32',
      metalness: 0.55,
      roughness: 0.42,
    }),
    leg: new THREE.MeshStandardMaterial({
      name: 'Gestell',
      color: cfg.kind === 'competition' ? '#1d1f23' : cfg.kind === 'indoor' ? '#b9bec5' : '#33363c',
      metalness: 0.6,
      roughness: 0.38,
    }),
    plastic: new THREE.MeshStandardMaterial({ name: 'Kunststoff', color: '#141517', roughness: 0.62 }),
    rubber: new THREE.MeshStandardMaterial({ name: 'Gummi', color: '#0d0d0e', roughness: 0.92 }),
    chrome: new THREE.MeshStandardMaterial({ name: 'Chrom', color: '#d9dde2', metalness: 0.95, roughness: 0.18 }),
    net: new THREE.MeshStandardMaterial({
      name: 'Netz',
      color: '#0f1a2e',
      roughness: 0.9,
      transparent: true,
      opacity: netTexture ? 1 : 0.62,
      alphaMap: netTexture ?? null,
      alphaTest: netTexture ? 0.35 : 0,
      side: THREE.DoubleSide,
      depthWrite: !netTexture ? false : true,
    }),
    netBand: new THREE.MeshStandardMaterial({ name: 'Netzband', color: '#fafafa', roughness: 0.6 }),
  };
}

/** Rasterförmige Alpha-Textur fürs Netz (nur im Browser) */
export function createNetTexture(): THREE.Texture | undefined {
  if (typeof document === 'undefined') return undefined;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, 64, 64);
  g.strokeStyle = '#fff';
  g.lineWidth = 7;
  g.strokeRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1.83 / 0.013, 0.1525 / 0.013);
  t.anisotropy = 4;
  return t;
}

function box(w: number, h: number, d: number, mat: THREE.Material, r = 0): THREE.Mesh {
  const geo = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cylinder(r: number, h: number, mat: THREE.Material, seg = 20): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
  m.castShadow = true;
  return m;
}

function wheel(mats: Mats, radius: number): THREE.Group {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.78, radius * 0.24, 10, 28), mats.rubber);
  const hub = cylinder(radius * 0.6, radius * 0.5, mats.plastic, 18);
  hub.rotation.x = Math.PI / 2;
  const fork = box(radius * 0.5, radius * 1.3, radius * 0.75, mats.leg);
  fork.position.y = radius * 0.75;
  g.add(tire, hub, fork);
  tire.castShadow = true;
  return g;
}

/** Eine Tischhälfte. side = -1 (links, mit Netz) oder +1 (rechts). Ursprung = Gelenk an der Innenkante, Oberkante Platte. */
function buildHalf(side: 1 | -1, cfg: TableConfig, mats: Mats, withNet: boolean) {
  const s = side;
  const t = Math.max(0.004, cfg.thicknessMm / 1000);
  const apronH = cfg.kind === 'outdoor' ? 0.05 : cfg.kind === 'indoor' ? 0.06 : 0.075;
  const W = TABLE.W;
  const pivot = new THREE.Group();
  pivot.name = s < 0 ? 'Hälfte A' : 'Hälfte B';

  // Spielfläche
  const top = box(HALF, t, W, mats.top, Math.min(0.0025, t / 2.2));
  top.position.set((s * HALF) / 2, -t / 2, 0);
  top.name = 'Platte';
  pivot.add(top);

  // weiße Linien: 2 cm Seiten-/Grundlinien, 3 mm Mittellinie
  const lh = 0.0007;
  const ly = lh / 2 + 0.0002;
  const endLine = box(0.02, lh, W, mats.line);
  endLine.position.set(s * (HALF - 0.01), ly, 0);
  const side1 = box(HALF, lh, 0.02, mats.line);
  side1.position.set((s * HALF) / 2, ly, W / 2 - 0.01);
  const side2 = side1.clone();
  side2.position.z = -W / 2 + 0.01;
  const center = box(HALF, lh, 0.003, mats.line);
  center.position.set((s * HALF) / 2, ly, 0);
  for (const l of [endLine, side1, side2, center]) {
    l.castShadow = false;
    pivot.add(l);
  }

  // Zarge / Rahmen unter der Platte
  const inset = cfg.kind === 'outdoor' ? 0.012 : 0.03;
  const fy = -t - apronH / 2;
  const fl = HALF - inset * 2;
  const rail1 = box(fl, apronH, 0.028, mats.frame);
  rail1.position.set((s * HALF) / 2, fy, W / 2 - inset - 0.014);
  const rail2 = rail1.clone();
  rail2.position.z = -(W / 2 - inset - 0.014);
  const rail3 = box(0.028, apronH, W - inset * 2, mats.frame);
  rail3.position.set(s * (HALF - inset - 0.014), fy, 0);
  const rail4 = rail3.clone();
  rail4.position.x = s * (inset + 0.06);
  const cross = box(0.03, apronH * 0.7, W - inset * 2, mats.frame);
  cross.position.set(s * HALF * 0.55, -t - apronH * 0.35, 0);
  pivot.add(rail1, rail2, rail3, rail4, cross);

  // Eckschutz (Outdoor)
  if (cfg.kind === 'outdoor') {
    for (const z of [1, -1]) {
      const cap = box(0.07, t + 0.034, 0.07, mats.plastic, 0.012);
      cap.position.set(s * (HALF - 0.03), -t / 2 - 0.012, z * (W / 2 - 0.03));
      pivot.add(cap);
    }
  }

  // Beine (klappen beim Hochstellen an die Unterseite)
  const legs = new THREE.Group();
  legs.name = 'Beine';
  const legTop = -t - apronH;
  legs.position.set(s * (HALF - 0.2), legTop, 0);
  const legLen = TABLE.H - t - apronH - 0.025;
  const legSize = cfg.kind === 'competition' ? 0.05 : 0.04;
  for (const z of [1, -1]) {
    const leg = box(legSize, legLen, legSize, mats.leg, 0.004);
    leg.position.set(0, -legLen / 2, z * (W / 2 - 0.16));
    const foot = cylinder(0.03, 0.025, mats.rubber);
    foot.position.set(0, -legLen - 0.0125, z * (W / 2 - 0.16));
    legs.add(leg, foot);
  }
  const brace = box(0.03, 0.03, W - 0.32, mats.leg);
  brace.position.set(0, -legLen * 0.62, 0);
  const brace2 = box(0.025, 0.025, W - 0.32, mats.leg);
  brace2.position.set(0, -0.04, 0);
  legs.add(brace, brace2);
  pivot.add(legs);

  // Netzgarnitur (nur an Hälfte A)
  let net: THREE.Group | null = null;
  if (withNet) {
    net = new THREE.Group();
    net.name = 'Netz';
    const span = W + TABLE.NET_OVERHANG * 2;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(span, TABLE.NET_H - 0.012), mats.net);
    mesh.rotation.y = Math.PI / 2;
    mesh.position.set(0, (TABLE.NET_H - 0.012) / 2, 0);
    const band = box(0.004, 0.014, span, mats.netBand);
    band.position.set(0, TABLE.NET_H - 0.007, 0);
    net.add(mesh, band);
    for (const z of [1, -1]) {
      const post = cylinder(0.008, TABLE.NET_H + 0.02, mats.chrome, 14);
      post.position.set(0, TABLE.NET_H / 2 - 0.01, z * (span / 2));
      const clamp = box(0.05, 0.05, 0.05, mats.plastic, 0.008);
      clamp.position.set(0, -t / 2 - 0.006, z * (W / 2 + 0.02));
      const arm = box(0.02, 0.012, TABLE.NET_OVERHANG, mats.chrome);
      arm.position.set(0, 0.006, z * (W / 2 + TABLE.NET_OVERHANG / 2));
      net.add(post, clamp, arm);
    }
    net.position.x = 0.0015;
    pivot.add(net);
  }

  // Lokaler Anschlusspunkt für die Streben des Fahrwerks
  const strutAnchor = new THREE.Vector3(s * 0.42, -t - apronH, 0);

  return { pivot, legs, net, strutAnchor };
}

/** Strebe zwischen zwei Punkten (Zylinder entlang Y, wird ausgerichtet) */
function placeStrut(mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) {
  const d = new THREE.Vector3().subVectors(b, a);
  const len = d.length();
  mesh.position.copy(a).addScaledVector(d, 0.5);
  mesh.scale.set(1, len, 1);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
}

export function buildTable(cfg: TableConfig, opts: { netTexture?: THREE.Texture } = {}): TableHandle {
  const mats = makeMaterials(cfg, opts.netTexture);
  const root = new THREE.Group();
  root.name = 'Tischtennisplatte';

  const A = buildHalf(-1, cfg, mats, true);
  const B = buildHalf(1, cfg, mats, false);
  root.add(A.pivot, B.pivot);

  // Zentrales Fahrwerk mit 4 Doppelrollen
  const chassis = new THREE.Group();
  chassis.name = 'Fahrwerk';
  const wheelR = cfg.kind === 'competition' ? 0.05 : 0.064;
  const baseY = wheelR * 2 + 0.02;
  const bx = 0.3;
  const bz = 0.56;
  for (const z of [1, -1]) {
    const rail = box(bx * 2 + 0.04, 0.04, 0.04, mats.leg, 0.006);
    rail.position.set(0, baseY, z * bz);
    chassis.add(rail);
    for (const x of [1, -1]) {
      const w = wheel(mats, wheelR);
      w.position.set(x * bx, wheelR * 1.02, z * bz);
      chassis.add(w);
    }
  }
  for (const x of [1, -1]) {
    const rail = box(0.04, 0.04, bz * 2, mats.leg, 0.006);
    rail.position.set(x * bx, baseY, 0);
    chassis.add(rail);
  }
  // Mittelsäule mit Sicherungsmechanik
  const column = box(0.07, 0.24, 0.12, mats.plastic, 0.012);
  column.position.set(0, baseY + 0.12, 0);
  chassis.add(column);
  root.add(chassis);

  // Streben (Fahrwerk ↔ Hälften), werden in setFold neu ausgerichtet
  const strutGeo = new THREE.CylinderGeometry(0.013, 0.013, 1, 12);
  const struts = [-1, 1].flatMap((s) =>
    [1, -1].map((z) => {
      const m = new THREE.Mesh(strutGeo, mats.leg);
      m.castShadow = true;
      root.add(m);
      return { m, s, z };
    }),
  );

  const tmp = new THREE.Vector3();
  const tmpA = new THREE.Vector3();

  function poseHalf(h: ReturnType<typeof buildHalf>, s: number, f: number) {
    const e = smooth(clamp01(f));
    // Rotation läuft etwas voraus, das Absenken folgt → keine Kollision mit dem Fahrwerk
    const rot = smooth(clamp01(f * 1.15));
    h.pivot.position.set(s * (0.0015 + e * 0.3), TABLE.H - e * (TABLE.H - 0.26), 0);
    h.pivot.rotation.z = s * rot * (Math.PI / 2);
    h.legs.rotation.z = -h.pivot.rotation.z; // Beine bleiben lotrecht → liegen geklappt an der Unterseite
    if (h.net) {
      const k = clamp01(1 - f * 6);
      h.net.scale.set(1, Math.max(0.001, k), 1);
      h.net.visible = k > 0.01;
    }
  }

  function updateStruts() {
    for (const { m, s, z } of struts) {
      const h = s < 0 ? A : B;
      h.pivot.updateMatrixWorld(true);
      tmp.copy(h.strutAnchor).setZ(z * 0.5);
      // in Root-Koordinaten (root kann verschoben sein → lokale Matrix der Hälfte verwenden)
      tmp.applyMatrix4(h.pivot.matrix);
      tmpA.set(s * bx, baseY + 0.02, z * 0.5);
      placeStrut(m, tmpA, tmp);
    }
  }

  const handle: TableHandle = {
    root,
    meshes: [],
    setFold(a: number, b: number) {
      poseHalf(A, -1, a);
      poseHalf(B, 1, b);
      updateStruts();
    },
    setColor(color: TableColor) {
      mats.top.color.set(TABLE_COLORS[color].hex);
    },
    dispose() {
      root.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).geometry.dispose();
      });
      Object.values(mats).forEach((m) => m.dispose());
    },
  };
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) handle.meshes.push(o as THREE.Mesh);
  });
  handle.setFold(0, 0);
  return handle;
}
