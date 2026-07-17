'use client';

import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Particle field inside the Canvas ──────────────────────────────── */
const PARTICLE_COUNT = 250;

function Particles() {
  const meshRef = useRef<THREE.Points>(null);
  const mouse = useRef({ x: 0, y: 0 });

  const { viewport } = useThree();

  // Generate random particle positions & colors once
  const [positions, colors, speeds] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const spd = new Float32Array(PARTICLE_COUNT);

    const blue = new THREE.Color('#3B82F6');
    const purple = new THREE.Color('#8B5CF6');

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Spread particles in a 3D box
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;

      // Randomly blend blue ↔ purple
      const t = Math.random();
      const c = blue.clone().lerp(purple, t);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      spd[i] = 0.1 + Math.random() * 0.3;
    }
    return [pos, col, spd];
  }, []);

  // Track mouse in NDC
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    },
    [],
  );

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [handlePointerMove]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3;
      const iy = ix + 1;
      const iz = ix + 2;

      // Slow drift upward
      arr[iy] += speeds[i] * delta * 0.4;

      // Wrap around
      if (arr[iy] > 7) arr[iy] = -7;

      // Gentle sway
      arr[ix] += Math.sin(arr[iy] * 0.3 + i) * delta * 0.05;

      // Mouse influence (subtle)
      arr[ix] += (mouse.current.x * viewport.width * 0.15 - arr[ix]) * delta * 0.008;
      arr[iy] += (mouse.current.y * viewport.height * 0.15 - arr[iy]) * delta * 0.008;
    }

    posAttr.needsUpdate = true;

    // Slow global rotation
    meshRef.current.rotation.y += delta * 0.02;
    meshRef.current.rotation.x += delta * 0.005;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ── Exported component (wraps Canvas + fallback) ─────────────────── */
export default function HeroBackground() {
  const [hasFailed, setHasFailed] = useState(false);

  if (hasFailed) {
    return <FallbackGradient />;
  }

  return (
    <div className="absolute inset-0 -z-0 overflow-hidden">
      <ErrorBoundary onError={() => setHasFailed(true)}>
        <Canvas
          camera={{ position: [0, 0, 6], fov: 60 }}
          dpr={[1, 1.5]}
          style={{ background: 'transparent' }}
          gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        >
          <Particles />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}

/* ── CSS gradient fallback ────────────────────────────────────────── */
function FallbackGradient() {
  return (
    <div
      className="absolute inset-0 -z-0 animate-pulse"
      style={{
        background:
          'radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(139,92,246,0.10) 0%, transparent 50%)',
      }}
    />
  );
}

/* ── Minimal error boundary ───────────────────────────────────────── */
import { Component, type ReactNode, type ErrorInfo } from 'react';

interface EBProps {
  children: ReactNode;
  onError: () => void;
}
interface EBState {
  hasError: boolean;
}

class ErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onError();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
