'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Skin and clothing colors for the placeholder mannequin. */
const SKIN_COLOR     = '#e8c4a0';
const CLOTHING_COLOR = '#3b4a6b';
const EYE_COLOR      = '#2a5298';

/**
 * A simple 3D mannequin head used when no GLB model is present.
 * Has the same idle head-sway so the scene doesn't look frozen.
 * Has NO morph targets — all animation hooks are no-ops on it,
 * which is intentional: the system degrades gracefully.
 */
export function PlaceholderAvatar() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.rotation.y = Math.sin(t * 0.30) * 0.10;
    groupRef.current.rotation.x = Math.sin(t * 0.20) * 0.05;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Head sphere */}
      <mesh position={[0, 0.10, 0]} castShadow>
        <sphereGeometry args={[0.50, 48, 48]} />
        <meshStandardMaterial color={SKIN_COLOR} roughness={0.75} metalness={0.05} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, -0.54, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.14, 0.28, 20]} />
        <meshStandardMaterial color={SKIN_COLOR} roughness={0.75} metalness={0.05} />
      </mesh>

      {/* Shoulders */}
      <mesh position={[0, -0.88, 0]} castShadow>
        <cylinderGeometry args={[0.44, 0.34, 0.38, 20]} />
        <meshStandardMaterial color={CLOTHING_COLOR} roughness={0.70} />
      </mesh>

      {/* Left eye */}
      <mesh position={[-0.17, 0.16, 0.44]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial color={EYE_COLOR} roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Right eye */}
      <mesh position={[0.17, 0.16, 0.44]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial color={EYE_COLOR} roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Nose bridge (subtle bump) */}
      <mesh position={[0, 0.05, 0.47]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} />
      </mesh>
    </group>
  );
}
