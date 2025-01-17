import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import React from 'react';

export const PlanetRings = () => {
  const ringsRef = useRef<THREE.Mesh>(null);
  
  // Store the initial rotation values
  const rotationRef = useRef({
    x: Math.PI / 3,
    y: 0
  });

  useFrame(({ clock }) => {
    if (ringsRef.current) {
      // Update both X and Y rotations
      rotationRef.current.y += 0.05 * clock.getDelta(); // Smooth Y rotation
      rotationRef.current.x = Math.PI / 3 + Math.sin(clock.getElapsedTime() * 0.5) * 0.1; // Gentle X oscillation

      // Apply rotations
      ringsRef.current.rotation.x = rotationRef.current.x;
      ringsRef.current.rotation.y = rotationRef.current.y;
    }
  });

  return (
    <mesh ref={ringsRef}>
      <ringGeometry args={[3, 3.6, 64]} />
      <meshPhongMaterial
        color="#4a90e2"
        side={THREE.DoubleSide}
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};