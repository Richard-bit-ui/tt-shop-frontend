import * as THREE from 'three';

/**
 * Prozedurales, lizenzfreies 3D-Modell eines Tischtennisschlägers (eigene Geometrie).
 * Maße in Millimetern nach typischen Wettkampfhölzern (Blatt ca. 157 × 152 mm, Griff ca. 100 mm),
 * skaliert auf 1 Einheit = 100 mm.
 */
export type HandleShape = 'FL' | 'ST' | 'AN';

export interface RacketLook {
  fh?: string | null; // Belagfarbe Vorhand (Hex) – null = kein Belag
  bh?: string | null;
  fhMm?: number; // Schwammstärke in mm (0 = OX)
  bhMm?: number;
  plies?: number;
  carbon?: boolean;
  handle?: HandleShape;
  tape?: boolean;
  bladeMm?: number;
}

export const S = 0.01;
const TOP_MM = 0.35; // Obergummi
const CUT = -75; // Unterkante der Beläge (mm)
const HANDLE_TOP = -93;
const HANDLE_LEN = 100;

/** Blattkontur (Superellipse, unten leicht schmaler), von unten rechts über oben nach unten links */
export function headOutline(): THREE.Vector2[] {
  const A = 76;
  const B = 79;
  const n = 2.45;
  const pts: THREE.Vector2[] = [];
  const steps = 240;
  for (let i = 0; i <= steps; i++) {
    const th = -Math.PI / 2 + (i / steps) * Math.PI * 2;
    const c = Math.cos(th);
    const s = Math.sin(th);
    let x = A * Math.sign(c) * Math.abs(c) ** (2 / n);
    let y = B * Math.sign(s) * Math.abs(s) ** (2 / n);
    if (y < 0) x *= 1 - 0.09 * (-y / B);
    y += 4;
    if (y >= CUT) pts.push(new THREE.Vector2(x * S, y * S));
  }
  return pts;
}

function bladeShape(outline: THREE.Vector2[]) {
  const sh = new THREE.Shape();
  const first = outline[0];
  const last = outline[outline.length - 1];
  sh.moveTo(first.x, first.y);
  for (let i = 1; i < outline.length; i++) sh.lineTo(outline[i].x, outline[i].y);
  // Hals: konkav vom Blatt zum Griff
  sh.quadraticCurveTo(-15 * S, (CUT - 4) * S, -12.5 * S, HANDLE_TOP * S);
  sh.lineTo(12.5 * S, HANDLE_TOP * S);
  sh.quadraticCurveTo(15 * S, (CUT - 4) * S, first.x, first.y);
  void last;
  return sh;
}

function rubberShape(outline: THREE.Vector2[]) {
  const sh = new THREE.Shape();
  sh.moveTo(outline[0].x, outline[0].y);
  for (let i = 1; i < outline.length; i++) sh.lineTo(outline[i].x, outline[i].y);
  sh.closePath();
  return sh;
}

/** Seitenflächen einer Extrusion bekommen v = Tiefe (0..1), damit Streifen-Texturen Schichten zeigen */
function depthUVs(geo: THREE.ExtrudeGeometry) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const side = geo.groups.find((g) => g.materialIndex === 1);
  if (!side) return;
  for (let i = side.start; i < side.start + side.count; i++) {
    const vi = geo.index ? geo.index.getX(i) : i;
    uv.setXY(vi, 0.5, (pos.getZ(vi) - bb.min.z) / (bb.max.z - bb.min.z || 1));
  }
  uv.needsUpdate = true;
}

function stripes(layers: { color: string; w: number }[]) {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const total = layers.reduce((n, l) => n + l.w, 0);
  let y = 0;
  for (const l of layers) {
    const h = (l.w / total) * 256;
    ctx.fillStyle = l.color;
    ctx.fillRect(0, 256 - y - h, 4, h + 0.5);
    y += h;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  return t;
}

/** Holzmaserung als Canvas-Textur */
function grain(base: string, dark: string, seed = 1) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 512);
  let r = seed;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 70; i++) {
    const x = rnd() * 256;
    ctx.strokeStyle = dark;
    ctx.globalAlpha = 0.05 + rnd() * 0.12;
    ctx.lineWidth = 0.5 + rnd() * 2.2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= 512; y += 32) ctx.lineTo(x + Math.sin(y / 60 + i) * 3 + (rnd() - 0.5) * 2, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function plyLayers(plies: number, carbon: boolean) {
  const woods = ['#e3c08f', '#cfa56f'];
  const out: { color: string; w: number }[] = [];
  for (let i = 0; i < plies; i++) {
    const outer = i === 0 || i === plies - 1;
    const core = i === Math.floor(plies / 2);
    const isCarbon = carbon && (i === 1 || i === plies - 2);
    out.push({ color: isCarbon ? '#2a2a2c' : woods[i % 2], w: isCarbon ? 0.35 : outer ? 0.6 : core ? 2.2 : 1 });
  }
  return out;
}

export interface RacketParts {
  group: THREE.Group;
  dispose: () => void;
}

function handleProfile(shape: HandleShape) {
  // Breite (mm) in Abhängigkeit von t = 0 (oben) … 1 (Griffende)
  const w = (t: number) => {
    if (shape === 'FL') return 25 - 3 * Math.sin(t * Math.PI * 0.9) + 9 * Math.max(0, t - 0.55) ** 1.6 * 2.6;
    if (shape === 'AN') return 25 + 5 * Math.sin(t * Math.PI) ** 1.3 - 1 * t;
    return 25.5;
  };
  const sh = new THREE.Shape();
  const N = 30;
  const right: THREE.Vector2[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    right.push(new THREE.Vector2((w(t) / 2) * S, (HANDLE_TOP - t * HANDLE_LEN) * S));
  }
  sh.moveTo(-right[0].x, right[0].y);
  sh.lineTo(right[0].x, right[0].y);
  for (let i = 1; i < right.length; i++) sh.lineTo(right[i].x, right[i].y);
  const endY = right[N].y;
  const endW = right[N].x;
  sh.quadraticCurveTo(endW, endY - 3 * S, 0, endY - 3.5 * S);
  sh.quadraticCurveTo(-endW, endY - 3 * S, -endW, endY);
  for (let i = N - 1; i >= 0; i--) sh.lineTo(-right[i].x, right[i].y);
  return sh;
}

export function buildRacket(look: RacketLook): RacketParts {
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);
  const group = new THREE.Group();
  const outline = headOutline();
  const tb = (look.bladeMm ?? 5.9) * S;

  // Holz (Blatt + Hals)
  const bladeGeo = track(new THREE.ExtrudeGeometry(bladeShape(outline), { depth: tb, bevelEnabled: true, bevelThickness: 0.15 * S, bevelSize: 0.25 * S, bevelSegments: 2, curveSegments: 24 }));
  bladeGeo.translate(0, 0, -tb / 2);
  depthUVs(bladeGeo);
  const woodTex = track(grain('#e0bd8a', '#8a5a2b', 3));
  woodTex.repeat.set(1.4, 1.4);
  const faceMat = track(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.62 }));
  const plyTex = track(stripes(plyLayers(look.plies ?? 5, !!look.carbon)));
  const plyMat = track(new THREE.MeshStandardMaterial({ map: plyTex, roughness: 0.7 }));
  group.add(new THREE.Mesh(bladeGeo, [faceMat, plyMat]));

  // Beläge
  const rShape = rubberShape(outline);
  const addRubber = (hex: string, mm: number, front: boolean) => {
    const depth = (Math.max(0, mm) + TOP_MM) * S;
    const geo = track(new THREE.ExtrudeGeometry(rShape, { depth, bevelEnabled: false, curveSegments: 24 }));
    depthUVs(geo);
    geo.translate(0, 0, front ? tb / 2 + 0.02 * S : -tb / 2 - depth - 0.02 * S);
    const top = track(new THREE.MeshStandardMaterial({ color: hex, roughness: hex === '#151515' ? 0.48 : 0.4, metalness: 0.02 }));
    const layers =
      mm > 0
        ? [
            { color: '#e9c46a', w: mm },
            { color: hex, w: TOP_MM },
          ]
        : [{ color: hex, w: 1 }];
    if (!front) layers.reverse();
    const sideTex = track(stripes(layers));
    const side = track(new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.85 }));
    group.add(new THREE.Mesh(geo, [top, side]));
    return depth;
  };
  const df = look.fh ? addRubber(look.fh, look.fhMm ?? 2, true) : 0;
  const db = look.bh ? addRubber(look.bh, look.bhMm ?? 2, false) : 0;

  // Kantenband um den Blattrand
  if (look.tape) {
    const z0 = -tb / 2 - db - 0.3 * S;
    const z1 = tb / 2 + df + 0.3 * S;
    const off = 0.55 * S;
    const pos: number[] = [];
    const idx: number[] = [];
    const cx = 0;
    const cy = 4 * S;
    outline.forEach((p, i) => {
      const prev = outline[Math.max(0, i - 1)];
      const next = outline[Math.min(outline.length - 1, i + 1)];
      const tx = next.x - prev.x;
      const ty = next.y - prev.y;
      let nx = ty;
      let ny = -tx;
      const len = Math.hypot(nx, ny) || 1;
      nx /= len;
      ny /= len;
      if ((p.x - cx) * nx + (p.y - cy) * ny < 0) {
        nx = -nx;
        ny = -ny;
      }
      pos.push(p.x + nx * off, p.y + ny * off, z0, p.x + nx * off, p.y + ny * off, z1);
      if (i > 0) {
        const a = (i - 1) * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    });
    const tg = track(new THREE.BufferGeometry());
    tg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    tg.setIndex(idx);
    tg.computeVertexNormals();
    const tm = track(new THREE.MeshStandardMaterial({ color: '#1b1b1d', roughness: 0.4, metalness: 0.15, side: THREE.DoubleSide }));
    group.add(new THREE.Mesh(tg, tm));
  }

  // Griff
  const hDepth = 21 * S;
  const hBevel = 2.6 * S;
  const handleGeo = track(
    new THREE.ExtrudeGeometry(handleProfile(look.handle ?? 'FL'), { depth: hDepth, bevelEnabled: true, bevelThickness: hBevel, bevelSize: hBevel * 0.9, bevelSegments: 5, curveSegments: 16 }),
  );
  handleGeo.translate(0, 0, -hDepth / 2);
  const hTex = track(grain('#c8955c', '#6b3f1d', 7));
  hTex.repeat.set(1, 0.6);
  const handleMat = track(new THREE.MeshStandardMaterial({ map: hTex, roughness: 0.55 }));
  group.add(new THREE.Mesh(handleGeo, handleMat));
  // Griffplakette (ohne Markenlogo)
  const plate = track(new THREE.CapsuleGeometry(5.5 * S, 12 * S, 6, 16));
  const plateMat = track(new THREE.MeshStandardMaterial({ color: '#1d1d1f', roughness: 0.3, metalness: 0.4 }));
  for (const z of [1, -1]) {
    const m = new THREE.Mesh(plate, plateMat);
    m.scale.set(1, 1, 0.12);
    m.position.set(0, (HANDLE_TOP - 38) * S, z * (hDepth / 2 + hBevel - 0.2 * S));
    group.add(m);
  }

  // Mittelpunkt des Schlägers auf den Ursprung legen
  group.position.y = 0.62;
  return { group, dispose: () => disposables.forEach((d) => d.dispose()) };
}
