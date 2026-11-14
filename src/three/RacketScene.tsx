import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { buildRacket, type RacketLook } from './racketModel';

function Racket({ look, side }: { look: RacketLook; side: 'fh' | 'bh' }) {
  const parts = useMemo(() => buildRacket(look), [look]);
  useEffect(() => () => parts.dispose(), [parts]);
  const pivot = useRef<THREE.Group>(null);
  const t0 = useRef(0);
  useFrame((state, dt) => {
    const g = pivot.current;
    if (!g) return;
    t0.current += dt;
    const target = (side === 'fh' ? 0 : Math.PI) + Math.sin(t0.current * 0.6) * 0.22;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, target, 4, dt);
    g.position.y = Math.sin(t0.current * 0.9) * 0.025;
    void state;
  });
  return (
    <group rotation={[-0.12, 0, -0.42]}>
      <group ref={pivot}>
        <primitive object={parts.group} />
      </group>
    </group>
  );
}

export default function RacketScene({ look, side, className }: { look: RacketLook; side: 'fh' | 'bh'; className?: string }) {
  return (
    <div className={className}>
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0.2, 7.1], fov: 30, near: 0.1, far: 50 }} gl={{ antialias: true, preserveDrawingBuffer: false }}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 5]} intensity={1.6} />
        <directionalLight position={[-4, 1, -3]} intensity={0.6} />
        <Environment resolution={128} frames={1}>
          <Lightformer intensity={2.4} position={[0, 4, 3]} rotation-x={Math.PI / 2.5} scale={[6, 3, 1]} />
          <Lightformer intensity={1.2} position={[-4, 0, 2]} rotation-y={Math.PI / 2} scale={[4, 6, 1]} />
          <Lightformer intensity={1.2} position={[4, 0, -2]} rotation-y={-Math.PI / 2} scale={[4, 6, 1]} />
        </Environment>
        <Racket look={look} side={side} />
        <ContactShadows position={[0, -1.45, 0]} scale={5} blur={2.8} far={2.4} opacity={0.28} resolution={256} frames={1} />
        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={(2 * Math.PI) / 3} rotateSpeed={0.6} />
      </Canvas>
    </div>
  );
}
