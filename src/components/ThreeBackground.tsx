import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Cloud, Sky, Trail } from '@react-three/drei';
import { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useLocation } from 'react-router-dom';
import { useStore } from '../lib/store';
import type { PageType, BackgroundTheme } from '../types';

// 1. CherryBlossomSystem
function CherryBlossomSystem() {
  const count = 100;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 40,
        y: Math.random() * 20 + 10,
        z: (Math.random() - 0.5) * 20 - 10,
        speed: Math.random() * 0.02 + 0.01,
        wind: Math.random() * 0.02,
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
        rz: Math.random() * Math.PI,
        rs: Math.random() * 0.02 - 0.01,
        scale: Math.random() * 0.5 + 0.5
      });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    if (!mesh.current) return;
    particles.forEach((p, i) => {
      p.y -= p.speed;
      p.x += Math.sin(p.y * 0.5) * p.wind + 0.01;
      p.rx += p.rs;
      p.ry += p.rs;
      
      if (p.y < -10) {
        p.y = 20;
        p.x = (Math.random() - 0.5) * 40;
      }

      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rx, p.ry, p.rz);
      dummy.scale.set(p.scale, p.scale, p.scale);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.2, 0.2]} />
      <meshBasicMaterial color="#ffb7c5" side={THREE.DoubleSide} transparent opacity={0.8} />
    </instancedMesh>
  );
}

// 2. CometSystem
function CometSystem() {
  const cometRef = useRef<THREE.Group>(null);
  const [active, setActive] = useState(false);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (time % 20 < 10) {
      if (!active) setActive(true);
      if (cometRef.current) {
        const progress = (time % 20) / 10;
        cometRef.current.position.x = -30 + progress * 60;
        cometRef.current.position.y = 20 - progress * 20;
        cometRef.current.position.z = -20;
      }
    } else {
      if (active) setActive(false);
    }
  });

  if (!active) return null;

  return (
    <group ref={cometRef}>
      <Trail width={2} length={20} color={new THREE.Color('#ffaa55')} attenuation={(t) => t * t}>
        <mesh>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </Trail>
      <pointLight color="#ffaa55" intensity={2} distance={50} />
    </group>
  );
}

// 3. TrainSystem
function TrainSystem() {
  const trainRef = useRef<THREE.Group>(null);
  const [active, setActive] = useState(false);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (time % 30 < 15) {
      if (!active) setActive(true);
      if (trainRef.current) {
        const progress = (time % 30) / 15;
        trainRef.current.position.x = 40 - progress * 80;
        trainRef.current.position.y = -5;
        trainRef.current.position.z = -15;
      }
    } else {
      if (active) setActive(false);
    }
  });

  if (!active) return null;

  return (
    <group ref={trainRef}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[20, 2, 1]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[-8 + i * 1.8, 0.2, 0.51]}>
          <planeGeometry args={[0.8, 0.6]} />
          <meshBasicMaterial color="#ffdd88" />
        </mesh>
      ))}
    </group>
  );
}

// 4. RainSystem
function RainSystem() {
  const count = 1000;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 40,
        y: Math.random() * 40 - 10,
        z: (Math.random() - 0.5) * 20 - 10,
        speed: Math.random() * 0.2 + 0.2,
      });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    if (!mesh.current) return;
    particles.forEach((p, i) => {
      p.y -= p.speed;
      p.x -= p.speed * 0.1;
      
      if (p.y < -10) {
        p.y = 30;
        p.x = (Math.random() - 0.5) * 40;
      }

      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.z = 0.1;
      dummy.scale.set(1, Math.random() * 2 + 1, 1);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.02, 0.5]} />
      <meshBasicMaterial color="#aaccff" transparent opacity={0.4} />
    </instancedMesh>
  );
}

// 5. SunRaySystem
function SunRaySystem() {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.05) * 0.05;
    }
  });

  return (
    <group ref={group} position={[10, 15, -20]}>
      {Array.from({ length: 5 }).map((_, i) => (
        <group key={i} rotation={[0, 0, (i / 5) * Math.PI * 0.4 - Math.PI * 0.2]}>
          <mesh>
            <planeGeometry args={[1, 50]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.03} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <mesh>
            <planeGeometry args={[3, 50]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.015} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <mesh>
            <planeGeometry args={[6, 50]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.005} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// 6. FogSystem
function FogSystem() {
  return (
    <group>
      <Cloud position={[-10, -5, -15]} speed={0.1} opacity={0.3} color="#ffffff" scale={[2, 1, 1]} />
      <Cloud position={[10, -6, -10]} speed={0.15} opacity={0.2} color="#ffffff" scale={[2, 1, 1]} />
    </group>
  );
}

// 7. BirdSystem
function BirdSystem() {
  const group = useRef<THREE.Group>(null);
  const [active, setActive] = useState(false);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (time % 25 < 10) {
      if (!active) setActive(true);
      if (group.current) {
        const progress = (time % 25) / 10;
        group.current.position.x = -20 + progress * 40;
        group.current.position.y = 5 + Math.sin(progress * Math.PI) * 2;
        group.current.position.z = -15;
      }
    } else {
      if (active) setActive(false);
    }
  });

  if (!active) return null;

  return (
    <group ref={group}>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[(i % 3) * 0.5, Math.floor(i / 3) * 0.5, 0]} rotation={[0, 0, -0.2]}>
          <planeGeometry args={[0.4, 0.1]} />
          <meshBasicMaterial color="#222222" />
        </mesh>
      ))}
    </group>
  );
}

function MovingClouds({ theme }: { theme: BackgroundTheme }) {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (group.current) {
      group.current.position.x = Math.sin(state.clock.elapsedTime * 0.05) * 10;
      group.current.position.z = Math.cos(state.clock.elapsedTime * 0.05) * 10;
    }
  });

  let opacity = 0.5;
  let color = '#ffffff';

  if (theme === 'suzume_sunset') {
    opacity = 0.6;
    color = '#ffb380';
  } else if (theme === 'your_name_sky') {
    opacity = 0.2;
    color = '#a0a0ff';
  } else if (theme.includes('rain')) {
    opacity = 0.8;
    color = '#8899aa';
  }

  return (
    <group ref={group}>
      <Cloud position={[-10, 5, -20]} speed={0.2} opacity={opacity} color={color} />
      <Cloud position={[10, 8, -15]} speed={0.2} opacity={opacity} color={color} />
      <Cloud position={[0, 10, -25]} speed={0.2} opacity={opacity} color={color} />
    </group>
  );
}

export function ThreeBackground() {
  const location = useLocation();
  const { settings } = useStore();
  
  let pageType: PageType = 'dashboard';
  if (location.pathname === '/login' || location.pathname === '/register') {
    pageType = 'auth';
  } else if (location.pathname === '/log') {
    pageType = 'log';
  } else if (location.pathname === '/settings') {
    pageType = 'settings';
  }

  let theme = settings.backgrounds?.[pageType] || 'default';

  if (theme === 'default') {
    if (pageType === 'auth') theme = 'your_name_sky';
    else if (pageType === 'dashboard') theme = '5cm_sakura';
    else if (pageType === 'log') theme = 'weathering_rain';
    else theme = 'suzume_sunset';
  }

  const skyConfigs: Record<string, any> = {
    'your_name_sky': {
      sunPosition: [0, -0.05, -10], rayleigh: 3, turbidity: 10,
      gradient: 'from-[#0f172a] to-[#312e81]', overlay: 'from-transparent via-[#312e81]/30 to-[#0f172a]/80',
      ambient: 0.2, point: 0.5, stars: true,
      modules: ['CometSystem', 'CloudLayer', 'SunRaySystem']
    },
    'weathering_rain': {
      sunPosition: [0, -0.5, -10], rayleigh: 5, turbidity: 20,
      gradient: 'from-[#4b6cb7] to-[#182848]', overlay: 'from-transparent via-[#182848]/50 to-[#0f172a]/90',
      ambient: 0.2, point: 0.3, stars: false,
      modules: ['RainSystem', 'CloudLayer', 'SunRaySystem']
    },
    '5cm_sakura': {
      sunPosition: [5, 2, -10], rayleigh: 2, turbidity: 8,
      gradient: 'from-[#ffecd2] to-[#fcb69f]', overlay: 'from-transparent via-[#fcb69f]/20 to-[#ffecd2]/50',
      ambient: 0.6, point: 1, stars: false,
      modules: ['CherryBlossomSystem', 'TrainSystem', 'BirdSystem']
    },
    'garden_rain': {
      sunPosition: [0, 1, -10], rayleigh: 3, turbidity: 18,
      gradient: 'from-[#5c8a63] to-[#2c3e2e]', overlay: 'from-transparent via-[#2c3e2e]/40 to-[#1a241b]/80',
      ambient: 0.3, point: 0.5, stars: false,
      modules: ['RainSystem', 'FogSystem']
    },
    'suzume_sunset': {
      sunPosition: [0, -0.1, -10], rayleigh: 3, turbidity: 12,
      gradient: 'from-[#f83600] to-[#f9d423]', overlay: 'from-transparent via-[#f9d423]/30 to-[#f83600]/70',
      ambient: 0.5, point: 0.8, stars: false,
      modules: ['BirdSystem', 'CloudLayer', 'SunRaySystem']
    }
  };

  const config = skyConfigs[theme] || skyConfigs['your_name_sky'];
  const modules = config.modules || [];
  const customBackground = settings.custom_backgrounds?.[pageType];

  if (customBackground) {
    return (
      <div 
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat transition-all duration-1000"
        style={{ backgroundImage: `url(${customBackground})` }}
      >
        <div className="absolute inset-0 bg-black/40 pointer-events-none transition-colors duration-1000" />
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 -z-10 bg-gradient-to-b ${config.gradient} transition-colors duration-1000`}>
      <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
        <ambientLight intensity={config.ambient} />
        <pointLight position={[10, 10, 10]} intensity={config.point} />
        <Sky 
          distance={450000} 
          sunPosition={config.sunPosition}
          inclination={0.49} 
          azimuth={0.25} 
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
          rayleigh={config.rayleigh}
          turbidity={config.turbidity}
        />
        {config.stars && (
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        )}
        
        {modules.includes('CloudLayer') && <MovingClouds theme={theme} />}
        {modules.includes('CherryBlossomSystem') && <CherryBlossomSystem />}
        {modules.includes('CometSystem') && <CometSystem />}
        {modules.includes('TrainSystem') && <TrainSystem />}
        {modules.includes('RainSystem') && <RainSystem />}
        {modules.includes('FogSystem') && <FogSystem />}
        {modules.includes('BirdSystem') && <BirdSystem />}
        {modules.includes('SunRaySystem') && <SunRaySystem />}
      </Canvas>
      <div className={`absolute inset-0 bg-gradient-to-b ${config.overlay} pointer-events-none transition-colors duration-1000`} />
    </div>
  );
}


