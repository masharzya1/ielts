"use client";

import { Canvas } from "@react-three/fiber";
import { Float, OrbitControls, PerspectiveCamera, Text3D, Center, MeshDistortMaterial } from "@react-three/drei";
import { Suspense } from "react";

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
      
      <Float speed={3} rotationIntensity={2} floatIntensity={2}>
        <Center>
          <mesh>
            <sphereGeometry args={[1.2, 64, 64]} />
            <MeshDistortMaterial
              color="#88ce02"
              speed={4}
              distort={0.5}
              radius={1}
            />
          </mesh>
        </Center>
      </Float>

      <OrbitControls enableZoom={false} makeDefault />
    </>
  );
}

export function ThreeHero() {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full">
      <Suspense fallback={null}>
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}
