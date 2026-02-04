"use client";

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, MeshWobbleMaterial, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

function BackgroundShapes() {
  return (
    <group>
      <Float speed={2} rotationIntensity={2} floatIntensity={2}>
        <Sphere args={[1.5, 64, 64]} position={[-4, 2, -5]}>
          <MeshDistortMaterial
            color="#74b602"
            speed={4}
            distort={0.5}
            radius={1}
            emissive="#74b602"
            emissiveIntensity={0.5}
          />
        </Sphere>
      </Float>
      
      <Float speed={3} rotationIntensity={3} floatIntensity={2}>
        <mesh position={[5, -3, -4]} rotation={[0.5, 0.5, 0.5]}>
          <octahedronGeometry args={[2, 0]} />
          <MeshWobbleMaterial
            color="#ffffff"
            speed={3}
            factor={0.8}
            wireframe
          />
        </mesh>
      </Float>

      <Float speed={1.5} rotationIntensity={1} floatIntensity={1.5}>
        <mesh position={[0, 0, -8]}>
          <torusKnotGeometry args={[5, 0.8, 256, 64]} />
          <meshStandardMaterial
            color="#74b602"
            roughness={0.1}
            metalness={0.9}
            transparent
            opacity={0.2}
            wireframe
          />
        </mesh>
      </Float>

      <Float speed={4} rotationIntensity={2} floatIntensity={3}>
        <mesh position={[-6, -4, -2]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#74b602" emissive="#74b602" emissiveIntensity={1} />
        </mesh>
      </Float>
    </group>
  );
}

function FloatingParticles() {
  const points = useMemo(() => {
    const p = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000; i++) {
      p[i * 3] = (Math.random() - 0.5) * 30;
      p[i * 3 + 1] = (Math.random() - 0.5) * 30;
      p[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return p;
  }, []);

  const ref = useRef<any>();
  useFrame((state) => {
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    ref.current.rotation.x = state.clock.getElapsedTime() * 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#74b602"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function PreBookScene() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#74b602" />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#ffffff" />
        
        <PresentationControls
          global
          config={{ mass: 2, tension: 500 }}
          snap={{ mass: 4, tension: 1500 }}
          rotation={[0, 0, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 1.4]}
        >
          <BackgroundShapes />
        </PresentationControls>
        
        <FloatingParticles />
        
        <fog attach="fog" args={['#000', 5, 20]} />
      </Canvas>
    </div>
  );
}
