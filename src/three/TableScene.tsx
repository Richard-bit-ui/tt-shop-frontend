import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { buildTable, createNetTexture, TABLE, type TableConfig } from './tableModel';
import type { FoldMode } from './tableSpec';

/**
 * Kompakter 3D-Produktviewer für Tischtennisplatten: drehen, zoomen, Maße einblenden,
 * Spiel-/Playback-/Parkposition. (Kein Raumplaner – bewusst schlank gehalten.)
 */

const FOLD: Record<FoldMode, [number, number]> = { play: [0, 0], playback: [0, 1], park: [1, 1] };
const approach = (v: number, target: number, step: number) => (Math.abs(target - v) <= step ? target : v + Math.sign(target - v) * step);
const cm = (v: number) => `${(v * 100).toLocaleString('de-DE', { maximumFractionDigits: 1 })} cm`;

function Table({ config, mode }: { config: TableConfig; mode: FoldMode }) {
  const netTex = useMemo(() => createNetTexture(), []);
  const handle = useMemo(() => buildTable(config, { netTexture: netTex }), [config.kind, config.thicknessMm]); // eslint-disable-line react-hooks/exhaustive-deps
  const cur = useRef<{ a: number; b: number } | null>(null);
  useEffect(() => () => handle.dispose(), [handle]);
  useEffect(() => handle.setColor(config.color), [handle, config.color]);
  useFrame((_, dt) => {
    const [ta, tb] = FOLD[mode];
    if (!cur.current) {
      cur.current = { a: ta, b: tb };
      handle.setFold(ta, tb);
      return;
    }
    const step = Math.min(dt, 0.05) * 0.8;
    const a = approach(cur.current.a, ta, step);
    const b = approach(cur.current.b, tb, step);
    if (a !== cur.current.a || b !== cur.current.b) {
      cur.current = { a, b };
      handle.setFold(a, b);
    }
  });
  return <primitive object={handle.root} />;
}

/** Maß-Label: projiziert eine 3D-Position pro Frame auf ein DOM-Element über dem Canvas */
function Label({ position, text }: { position: [number, number, number]; text: string }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const anchor = useRef<THREE.Group>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  const el = useMemo(() => {
    const d = document.createElement('div');
    d.className = 'pointer-events-none absolute top-0 left-0 z-[5] rounded bg-ink px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white';
    d.style.display = 'none';
    return d;
  }, []);
  useEffect(() => {
    el.textContent = text;
  }, [el, text]);
  useEffect(() => {
    gl.domElement.parentElement?.appendChild(el);
    return () => el.remove();
  }, [gl, el]);
  useFrame(() => {
    if (!anchor.current) return;
    anchor.current.getWorldPosition(v).project(camera);
    el.style.display = v.z > 1 || v.z < -1 ? 'none' : 'block';
    el.style.transform = `translate3d(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px, 0) translate(-50%, -50%)`;
  });
  return <group ref={anchor} position={position} />;
}

function DimLine({ a, b, label }: { a: [number, number, number]; b: [number, number, number]; label: string }) {
  const mid: [number, number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const d = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)).normalize();
  const n = Math.abs(d.y) > 0.9 ? new THREE.Vector3(0.06, 0, 0) : new THREE.Vector3(0, 0.06, 0);
  const tick = (p: [number, number, number]): [number, number, number][] => [
    [p[0] - n.x, p[1] - n.y, p[2] - n.z],
    [p[0] + n.x, p[1] + n.y, p[2] + n.z],
  ];
  return (
    <group>
      <Line points={[a, b]} color="#111111" lineWidth={1.4} />
      <Line points={tick(a)} color="#111111" lineWidth={1.4} />
      <Line points={tick(b)} color="#111111" lineWidth={1.4} />
      <Label position={mid} text={label} />
    </group>
  );
}

function Dimensions({ mode }: { mode: FoldMode }) {
  const W = TABLE.W;
  if (mode === 'park')
    return (
      <group>
        <DimLine a={[-0.4, 0.01, W / 2 + 0.25]} b={[0.4, 0.01, W / 2 + 0.25]} label={`Tiefe ${cm(TABLE.PARK.D)}`} />
        <DimLine a={[0.55, 0.01, -W / 2]} b={[0.55, 0.01, W / 2]} label={`Breite ${cm(TABLE.PARK.W)}`} />
        <DimLine a={[0.55, 0, -W / 2 - 0.15]} b={[0.55, TABLE.PARK.H, -W / 2 - 0.15]} label={`Höhe ${cm(TABLE.PARK.H)}`} />
      </group>
    );
  return (
    <group>
      <DimLine a={[-TABLE.L / 2, 0.01, W / 2 + 0.3]} b={[TABLE.L / 2, 0.01, W / 2 + 0.3]} label={`Länge ${cm(TABLE.L)}`} />
      <DimLine a={[TABLE.L / 2 + 0.3, 0.01, -W / 2]} b={[TABLE.L / 2 + 0.3, 0.01, W / 2]} label={`Breite ${cm(TABLE.W)}`} />
      <DimLine a={[-TABLE.L / 2 - 0.2, 0, -W / 2]} b={[-TABLE.L / 2 - 0.2, TABLE.H, -W / 2]} label={`Höhe ${cm(TABLE.H)}`} />
      <DimLine a={[0, TABLE.H, -W / 2 - 0.22]} b={[0, TABLE.H + TABLE.NET_H, -W / 2 - 0.22]} label={`Netz ${cm(TABLE.NET_H)}`} />
    </group>
  );
}

function CameraRig({ mode, offset }: { mode: FoldMode; offset: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const size = useThree((s) => s.size);
  const goal = useRef<{ pos: THREE.Vector3; look: THREE.Vector3 } | null>(null);
  const jump = useRef(true);

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const tanV = Math.tan((camera.fov * Math.PI) / 360);
    const d = Math.max(4.6, (1.65 / Math.min(tanV, tanV * aspect)) * 1.18);
    const look = new THREE.Vector3(0, (mode === 'park' ? 0.7 : 0.45) + offset, 0);
    goal.current = { pos: new THREE.Vector3(d * 0.55, d * 0.46, d * 0.66), look };
  }, [size.width, size.height, mode, offset, camera]);

  useFrame((_, dt) => {
    if (!goal.current || !controls) return;
    if (jump.current) {
      camera.position.copy(goal.current.pos);
      controls.target.copy(goal.current.look);
      controls.update();
      goal.current = null;
      jump.current = false;
      return;
    }
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 4.5);
    camera.position.lerp(goal.current.pos, k);
    controls.target.lerp(goal.current.look, k);
    controls.update();
    if (camera.position.distanceTo(goal.current.pos) < 0.01) goal.current = null;
  });

  useEffect(() => {
    if (!controls) return;
    const stop = () => (goal.current = null);
    controls.addEventListener('start', stop);
    return () => controls.removeEventListener('start', stop);
  }, [controls]);
  return null;
}

export default function TableScene({ config, mode, showDims, className, frameOffset = -0.25 }: { config: TableConfig; mode: FoldMode; showDims?: boolean; className?: string; frameOffset?: number }) {
  return (
    <div className={className} style={{ touchAction: 'pan-y' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [3.4, 2.5, 4], fov: 32, near: 0.05, far: 100 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NeutralToneMapping;
        }}
        style={{ touchAction: 'pan-y' }}
      >
        <Suspense fallback={null}>
          <hemisphereLight args={['#ffffff', '#d9d4ca', 0.55]} />
          <directionalLight
            position={[3, 6, 3]}
            intensity={1.6}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-4}
            shadow-camera-right={4}
            shadow-camera-top={4}
            shadow-camera-bottom={-4}
            shadow-bias={-0.0004}
            shadow-normalBias={0.02}
          />
          <Environment resolution={256} frames={1}>
            <Lightformer intensity={2.2} position={[0, 5, -1]} rotation-x={Math.PI / 2} scale={[10, 6, 1]} />
            <Lightformer intensity={1.4} position={[-5, 2, 1]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
            <Lightformer intensity={1.4} position={[5, 2, -1]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
          </Environment>
          <mesh rotation-x={-Math.PI / 2} receiveShadow position={[0, -0.001, 0]}>
            <circleGeometry args={[9, 64]} />
            <shadowMaterial opacity={0.14} />
          </mesh>
          <Table config={config} mode={mode} />
          {showDims && <Dimensions mode={mode} />}
          <ContactShadows position={[0, 0.003, 0]} scale={4} blur={2.4} far={1.2} opacity={0.4} frames={Infinity} resolution={512} />
          <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.08} minDistance={2.4} maxDistance={11} maxPolarAngle={Math.PI / 2 - 0.06} />
          <CameraRig mode={mode} offset={frameOffset} />
        </Suspense>
      </Canvas>
    </div>
  );
}
