'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Points, PointMaterial, Sparkles } from '@react-three/drei';
import {
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import * as THREE from 'three';
import type { MotionValue } from 'framer-motion';

type DragState = {
  active: boolean;
  lastX: number;
  lastY: number;
  rot: number;
  tilt: number;
  vel: number;
};

function Network({
  progress,
  drag,
}: {
  progress?: MotionValue<number>;
  drag: MutableRefObject<DragState>;
}) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Group>(null);
  const ring2 = useRef<THREE.Group>(null);
  const ring3 = useRef<THREE.Group>(null);
  const satellites = useRef<THREE.Group>(null);
  const reduceMotion = useRef(false);

  const small = typeof window !== 'undefined' && window.innerWidth < 650;

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reduceMotion.current = preference.matches;
    };
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  const points = useMemo(
    () =>
      Array.from({ length: 76 }, (_, i) => {
        const angle = (i / 76) * Math.PI * 2;
        const radius = 1.15 + Math.sin(i * 2.17) * 0.48;

        return new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.78,
          Math.sin(i * 1.73) * 0.65
        );
      }),
    []
  );

  const positions = useMemo(
    () =>
      new Float32Array(points.flatMap((point) => [point.x, point.y, point.z])),
    [points]
  );

  // all links in ONE line batch (one draw call instead of ~200)
  const linkPositions = useMemo(() => {
    const out: number[] = [];
    points.forEach((point, index) => {
      points.slice(index + 1).forEach((other) => {
        if (point.distanceTo(other) < 0.82) {
          out.push(point.x, point.y, point.z, other.x, other.y, other.z);
        }
      });
    });
    return new Float32Array(out);
  }, [points]);

  const satellitePositions = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return new THREE.Vector3(
          Math.cos(angle) * 1.05,
          Math.sin(angle) * 0.65,
          Math.sin(angle * 2) * 0.4
        );
      }),
    []
  );

  useFrame((state, delta) => {
    // user-controlled spin (works even with reduced motion, but no inertia then)
    const d = drag.current;
    if (d.active) {
      d.vel *= 0.8;
    } else {
      if (!reduceMotion.current) {
        d.rot += d.vel;
        d.vel *= 0.94;
      }
      d.tilt *= 0.95;
    }
    if (spin.current) {
      spin.current.rotation.y = d.rot;
      spin.current.rotation.x = d.tilt;
    }

    if (reduceMotion.current) return;

    const elapsed = state.clock.elapsedTime;
    const speed = Math.min(delta, 0.05);
    const p = progress ? progress.get() : 0;

    if (group.current) {
      const targetY = state.pointer.x * 0.2 + p * Math.PI * 1.1;
      const targetX = -state.pointer.y * 0.14;

      group.current.rotation.y +=
        (targetY + Math.sin(elapsed * 0.16) * 0.08 -
          group.current.rotation.y) * speed * 2;

      group.current.rotation.x +=
        (targetX + Math.cos(elapsed * 0.14) * 0.05 -
          group.current.rotation.x) * speed * 2;

      group.current.position.y = p * 0.45;
      group.current.scale.setScalar(1 - p * 0.16);
    }

    [ring1, ring2, ring3].forEach((r, i) =>
      r.current?.scale.setScalar(1 + p * (0.3 + i * 0.12))
    );

    if (core.current) {
      const pulse = 1 + Math.sin(elapsed * 1.6) * 0.04;
      core.current.scale.setScalar(pulse);
      core.current.rotation.y += speed * 0.18;
    }

    if (glow.current) {
      glow.current.scale.setScalar(1 + Math.sin(elapsed * 1.6) * 0.07);
    }

    if (ring1.current) {
      ring1.current.rotation.z += speed * 0.22;
      ring1.current.rotation.x = 0.9 + Math.sin(elapsed * 0.3) * 0.08;
    }

    if (ring2.current) {
      ring2.current.rotation.y += speed * 0.28;
      ring2.current.rotation.x = 1.1;
    }

    if (ring3.current) {
      ring3.current.rotation.z -= speed * 0.16;
      ring3.current.rotation.y = 0.5 + Math.cos(elapsed * 0.25) * 0.08;
    }

    if (satellites.current) {
      satellites.current.rotation.y -= speed * 0.32;
      satellites.current.rotation.z += speed * 0.12;
    }
  });

  return (
    <group ref={group}>
      <group ref={spin}>
        <Float speed={0.8} rotationIntensity={0.05} floatIntensity={0.1}>
          <Points positions={positions} stride={3}>
            <PointMaterial
              transparent
              color="#c6d0dc"
              size={0.043}
              sizeAttenuation
              depthWrite={false}
            />
          </Points>

          <lineSegments>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[linkPositions, 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#91a4ba" transparent opacity={0.3} />
          </lineSegments>
        </Float>

        {/* Pearl-white outer glow */}
        <mesh ref={glow}>
          <sphereGeometry args={[0.82, 48, 48]} />
          <meshBasicMaterial color="#a9c3dc" transparent opacity={0.075} />
        </mesh>

        {/* Main metallic neural core */}
        <mesh ref={core}>
          <icosahedronGeometry args={[0.65, 4]} />
          <meshPhysicalMaterial
            color="#e1e4e8"
            emissive="#718eae"
            emissiveIntensity={0.75}
            roughness={0.2}
            metalness={0.38}
            clearcoat={1}
            clearcoatRoughness={0.12}
          />
        </mesh>

        {/* Fine wireframe shell */}
        <mesh>
          <icosahedronGeometry args={[0.71, 2]} />
          <meshBasicMaterial
            color="#d7e1eb"
            wireframe
            transparent
            opacity={0.32}
          />
        </mesh>

        {/* Orbital rings */}
        <group ref={ring1}>
          <mesh>
            <torusGeometry args={[0.98, 0.007, 8, 120]} />
            <meshBasicMaterial color="#c5d8e9" transparent opacity={0.8} />
          </mesh>
        </group>

        <group ref={ring2}>
          <mesh>
            <torusGeometry args={[1.14, 0.006, 8, 120]} />
            <meshBasicMaterial color="#b6a78e" transparent opacity={0.7} />
          </mesh>
        </group>

        <group ref={ring3}>
          <mesh>
            <torusGeometry args={[0.85, 0.005, 8, 120]} />
            <meshBasicMaterial color="#a4b2cb" transparent opacity={0.55} />
          </mesh>
        </group>

        {/* Orbiting nodes */}
        <group ref={satellites}>
          {satellitePositions.map((position, index) => (
            <group key={index} position={position}>
              <mesh>
                <sphereGeometry args={[0.052, 20, 20]} />
                <meshStandardMaterial
                  color="#eee4d2"
                  emissive="#b6c9df"
                  emissiveIntensity={1.5}
                />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.105, 16, 16]} />
                <meshBasicMaterial color="#b8d1e8" transparent opacity={0.12} />
              </mesh>
            </group>
          ))}
        </group>

        <Sparkles
          count={small ? 40 : 75}
          scale={3.8}
          size={2}
          speed={0.2}
          opacity={0.65}
          color="#d6e2ef"
        />

        <pointLight
          position={[0, 0, 0]}
          color="#a9c9e8"
          intensity={2.3}
          distance={3.5}
        />

        <pointLight
          position={[2, 2, 2]}
          color="#e4d2b4"
          intensity={0.8}
          distance={5}
        />
      </group>
    </group>
  );
}

export default function NeuralScene({
  progress,
}: {
  progress?: MotionValue<number>;
}) {
  const drag = useRef<DragState>({
    active: false,
    lastX: 0,
    lastY: 0,
    rot: 0,
    tilt: 0,
    vel: 0,
  });

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    d.active = true;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    d.vel = 0;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    d.rot += dx * 0.012;
    d.vel = dx * 0.012;
    if (e.pointerType === 'mouse') {
      d.tilt = Math.max(-0.6, Math.min(0.6, d.tilt + dy * 0.008));
    }
  };

  const end = () => {
    drag.current.active = false;
  };

  return (
    <div
      className="neural-canvas"
      aria-hidden="true"
      style={{ touchAction: 'pan-y', pointerEvents: 'auto' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        }}
      >
        <ambientLight intensity={0.65} />
        <Network progress={progress} drag={drag} />
      </Canvas>
    </div>
  );
}