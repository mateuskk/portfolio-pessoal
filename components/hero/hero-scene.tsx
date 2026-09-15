'use client';

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import {
  getNormalizedVisualPointer,
  getSculpturePointerPose,
  getSculptureRevealPose,
} from '@/lib/hero-sculpture-motion';
import { createStudioEnvironmentTexture } from '@/lib/studio-environment';

function StudioEnvironment() {
  const texture = useMemo(() => createStudioEnvironmentTexture(), []);

  useEffect(() => () => texture.dispose(), [texture]);

  return <primitive attach="environment" object={texture} />;
}

type PointerPosition = {
  active: boolean;
  x: number;
  y: number;
};

function Sculpture({
  active,
  pointer,
}: {
  active: boolean;
  pointer: RefObject<PointerPosition>;
}) {
  const group = useRef<THREE.Group>(null);
  const revealProgress = useRef(0);

  useFrame((state, delta) => {
    const sculpture = group.current;
    if (!sculpture) return;

    revealProgress.current = THREE.MathUtils.damp(
      revealProgress.current,
      active ? 1 : 0,
      3.2,
      delta,
    );
    const revealPose = getSculptureRevealPose(revealProgress.current);
    const pointerPose = getSculpturePointerPose(
      pointer.current.x,
      pointer.current.y,
      active && pointer.current.active,
    );

    sculpture.position.x = THREE.MathUtils.damp(
      sculpture.position.x,
      revealPose.x + pointerPose.x,
      4,
      delta,
    );
    sculpture.position.y = THREE.MathUtils.damp(
      sculpture.position.y,
      pointerPose.y,
      4,
      delta,
    );
    sculpture.scale.setScalar(revealPose.scale);
    sculpture.rotation.x = THREE.MathUtils.damp(
      sculpture.rotation.x,
      pointerPose.rotationX - 0.18,
      4,
      delta,
    );
    sculpture.rotation.y = THREE.MathUtils.damp(
      sculpture.rotation.y,
      pointerPose.rotationY + 0.22,
      4,
      delta,
    );
    sculpture.rotation.z += delta * revealPose.spin;
  });

  return (
    <group ref={group} rotation={[-0.18, 0.22, -0.28]}>
      <mesh castShadow receiveShadow>
        <torusKnotGeometry args={[1.18, 0.36, 240, 40, 2, 3]} />
        <meshStandardMaterial
          color="#d7d5cf"
          metalness={0.94}
          roughness={0.2}
        />
      </mesh>
      <mesh scale={1.035}>
        <torusKnotGeometry args={[1.18, 0.36, 160, 24, 2, 3]} />
        <meshBasicMaterial
          color="#f3f1ea"
          transparent
          opacity={0.09}
          wireframe
        />
      </mesh>
    </group>
  );
}

type HeroSceneProps = {
  active?: boolean;
  inView?: boolean;
  onReady?: () => void;
  pointerTarget?: RefObject<HTMLElement | null>;
};

export function HeroScene({
  active = true,
  inView = true,
  onReady,
  pointerTarget,
}: HeroSceneProps) {
  const pointer = useRef<PointerPosition>({ active: false, x: 0, y: 0 });

  useEffect(() => {
    const target = pointerTarget?.current;
    if (!target) return;

    const reset = () => {
      pointer.current = { active: false, x: 0, y: 0 };
    };
    const follow = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') {
        reset();
        return;
      }

      const bounds = target.getBoundingClientRect();
      const position = getNormalizedVisualPointer(
        event.clientX,
        event.clientY,
        bounds,
      );
      if (!position) {
        reset();
        return;
      }

      pointer.current = {
        active: true,
        ...position,
      };
    };

    window.addEventListener('pointermove', follow, { passive: true });
    window.addEventListener('blur', reset);
    document.documentElement.addEventListener('pointerleave', reset);

    return () => {
      window.removeEventListener('pointermove', follow);
      window.removeEventListener('blur', reset);
      document.documentElement.removeEventListener('pointerleave', reset);
    };
  }, [pointerTarget]);

  return (
    <Canvas
      aria-hidden="true"
      camera={{ fov: 35, position: [0, 0, 5.2] }}
      dpr={[1, 1.5]}
      frameloop={inView ? 'always' : 'never'}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      onCreated={onReady}
      shadows
    >
      <ambientLight intensity={0.62} />
      <directionalLight
        color="#f3f1ea"
        intensity={4.2}
        position={[4, 5, 6]}
        castShadow
      />
      <pointLight color="#a3a3a3" intensity={12} position={[-4, -1, 3]} />
      <pointLight color="#ffffff" intensity={7} position={[0, -4, -2]} />
      <StudioEnvironment />
      <Sculpture active={active} pointer={pointer} />
    </Canvas>
  );
}
