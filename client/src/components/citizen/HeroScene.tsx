import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Camera, TicketCheck, Users } from 'lucide-react';

/* ── 3D Building ── */
const Building: React.FC<{ position: [number, number, number]; height: number; width?: number; color?: string }> = ({
    position, height, width = 1, color = '#1a2744'
}) => (
    <mesh position={[position[0], height / 2 + position[1], position[2]]}>
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
    </mesh>
);

/* ── Streetlight ── */
const Streetlight: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <group position={position}>
        <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.03, 0.05, 3, 8]} />
            <meshStandardMaterial color="#4a5568" metalness={0.6} />
        </mesh>
        <mesh position={[0.3, 3, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
            <meshStandardMaterial color="#4a5568" />
        </mesh>
        <pointLight position={[0.3, 2.9, 0]} intensity={0.8} distance={5} color="#fbbf24" />
    </group>
);

/* ── Road ── */
const Road: React.FC = () => (
    <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <planeGeometry args={[4, 20]} />
            <meshStandardMaterial color="#1e1e2e" roughness={0.9} />
        </mesh>
        {/* Center line dashes */}
        {Array.from({ length: 10 }).map((_, i) => (
            <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -8 + i * 2]}>
                <planeGeometry args={[0.08, 0.8]} />
                <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} />
            </mesh>
        ))}
    </group>
);

/* ── Pothole with Glow ── */
const Pothole: React.FC = () => {
    const glowRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (glowRef.current) {
            const s = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.15;
            glowRef.current.scale.set(s, s, 1);
            (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
                0.4 + Math.sin(clock.getElapsedTime() * 2) * 0.3;
        }
    });

    return (
        <group position={[0.8, 0.02, 1]}>
            {/* Glow ring */}
            <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <ringGeometry args={[0.3, 0.5, 32]} />
                <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.5} transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
            {/* Crater */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.35, 32]} />
                <meshStandardMaterial color="#0d0d15" roughness={1} />
            </mesh>
        </group>
    );
};

/* ── Floating Icon ── */
const FloatingIcon: React.FC<{ position: [number, number, number]; color: string }> = ({ position, color }) => (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={1}>
        <mesh position={position}>
            <octahedronGeometry args={[0.15, 0]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.8} />
        </mesh>
    </Float>
);

/* ── Particles ── */
const LightParticles: React.FC = () => {
    const count = 50;
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 15;
            pos[i * 3 + 1] = Math.random() * 6;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
        }
        return pos;
    }, []);

    const ref = useRef<THREE.Points>(null);
    useFrame(({ clock }) => {
        if (ref.current) {
            ref.current.rotation.y = clock.getElapsedTime() * 0.02;
        }
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.04} color="#f97316" transparent opacity={0.6} sizeAttenuation />
        </points>
    );
};

/* ── City Scene ── */
const CityScene: React.FC = () => (
    <>
        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 8, 3]} intensity={0.4} color="#cbd5e1" />
        <fog attach="fog" args={['#0a0e1a', 5, 20]} />
        <Stars radius={30} depth={50} count={800} factor={2} saturation={0} fade speed={0.5} />

        <Road />
        <Pothole />

        {/* Buildings left */}
        <Building position={[-3.5, 0, -4]} height={4} color="#1a2744" />
        <Building position={[-3, 0, -1]} height={2.5} width={1.2} color="#1e2d4a" />
        <Building position={[-3.5, 0, 3]} height={3.5} color="#162038" />
        <Building position={[-4, 0, 6]} height={2} width={1.5} color="#1a2744" />

        {/* Buildings right */}
        <Building position={[3.5, 0, -3]} height={3} color="#1e2d4a" />
        <Building position={[3, 0, 1]} height={5} width={1.3} color="#162038" />
        <Building position={[3.5, 0, 5]} height={2.8} color="#1a2744" />

        {/* Streetlights */}
        <Streetlight position={[-1.8, 0, -3]} />
        <Streetlight position={[-1.8, 0, 3]} />
        <Streetlight position={[1.8, 0, -5]} />
        <Streetlight position={[1.8, 0, 1]} />

        {/* Floating civic icons */}
        <FloatingIcon position={[-2, 3.5, -2]} color="#f97316" />
        <FloatingIcon position={[2.5, 4, 0]} color="#3b82f6" />
        <FloatingIcon position={[-1, 4.5, 4]} color="#a855f7" />
        <FloatingIcon position={[1, 3, -4]} color="#22c55e" />

        <LightParticles />

        <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.3}
            maxPolarAngle={Math.PI / 2.2}
            minPolarAngle={Math.PI / 4}
        />
    </>
);

/* ── Main Component ── */
export const HeroScene: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section className="relative w-full h-screen overflow-hidden">
            {/* 3D Canvas */}
            <div className="absolute inset-0">
                <Suspense fallback={
                    <div className="w-full h-full bg-gradient-to-br from-civic-dark via-[#0f172a] to-[#1e1b4b] flex items-center justify-center">
                        <div className="w-16 h-16 border-2 border-civic-orange border-t-transparent rounded-full animate-spin" />
                    </div>
                }>
                    <Canvas
                        camera={{ position: [4, 3, 6], fov: 50 }}
                        gl={{ antialias: true, alpha: false }}
                        dpr={[1, 1.5]}
                    >
                        <CityScene />
                    </Canvas>
                </Suspense>
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-civic-dark via-civic-dark/40 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-civic-dark/60 to-transparent pointer-events-none" />

            {/* Content overlay */}
            <div className="relative z-10 h-full flex flex-col justify-end pb-16 px-6 md:px-12 lg:px-20">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                    className="max-w-3xl"
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full glass-card text-xs font-medium text-civic-orange"
                    >
                        <span className="w-2 h-2 bg-civic-orange rounded-full animate-pulse" />
                        AI-Powered Civic Intelligence Platform
                    </motion.div>

                    {/* Tagline */}
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
                        <span className="text-white">See it. Report it. </span>
                        <span className="text-gradient-civic">FixIt.</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-base md:text-lg text-civic-muted max-w-xl mb-8 leading-relaxed">
                        Building smarter cities through citizen collaboration and AI-powered civic intelligence.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap gap-4">
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/citizen/report')}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-civic-orange to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-civic-orange/25 hover:shadow-civic-orange/40 transition-shadow"
                        >
                            <Camera className="w-5 h-5" />
                            Report an Issue
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 px-6 py-3 glass-card text-white font-semibold hover:bg-white/10 transition-colors"
                        >
                            <TicketCheck className="w-5 h-5" />
                            View My Tickets
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 px-6 py-3 glass-card text-white font-semibold hover:bg-white/10 transition-colors"
                        >
                            <Users className="w-5 h-5" />
                            Explore Community
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
