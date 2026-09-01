"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Sculpture() {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const sculpture = group.current;
    if (!sculpture) return;

    const targetX = THREE.MathUtils.clamp(-state.pointer.y * 0.16, -0.16, 0.16);
    const targetY = THREE.MathUtils.clamp(state.pointer.x * 0.16, -0.16, 0.16);
    sculpture.rotation.x = THREE.MathUtils.damp(sculpture.rotation.x, targetX - 0.18, 4, delta);
    sculpture.rotation.y = THREE.MathUtils.damp(sculpture.rotation.y, targetY + 0.22, 4, delta);
    sculpture.rotation.z += delta * 0.075;
  });

  return (
    <group ref={group} rotation={[-0.18, 0.22, -0.28]}>
      <mesh castShadow receiveShadow>
        <torusKnotGeometry args={[1.18, 0.36, 240, 40, 2, 3]} />
        <meshStandardMaterial color="#d7d5cf" metalness={0.94} roughness={0.2} />
      </mesh>
      <mesh scale={1.035}>
        <torusKnotGeometry args={[1.18, 0.36, 160, 24, 2, 3]} />
        <meshBasicMaterial color="#f3f1ea" transparent opacity={0.09} wireframe />
      </mesh>
    </group>
  );
}

export function HeroScene() {
  return (
    <Canvas
      aria-hidden="true"
      camera={{ fov: 35, position: [0, 0, 5.2] }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      shadows
    >
      <ambientLight intensity={0.62} />
      <directionalLight color="#f3f1ea" intensity={4.2} position={[4, 5, 6]} castShadow />
      <pointLight color="#a3a3a3" intensity={12} position={[-4, -1, 3]} />
      <pointLight color="#ffffff" intensity={7} position={[0, -4, -2]} />
      <Sculpture />
    </Canvas>
  );
}
