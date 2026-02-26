import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin } from 'lucide-react';

export const HeroScene: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section className="relative w-full h-full overflow-hidden rounded-3xl bg-brand-primary">
            {/* Static Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/src/assets/image.png"
                    alt="Civic Infrastructure"
                    className="w-full h-full object-cover opacity-30 grayscale mix-blend-multiply"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary via-brand-primary/80 to-transparent" />
            </div>

            {/* Content overlay */}
            <div className="relative z-10 h-full flex flex-col justify-center px-10 md:px-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="max-w-2xl"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-brand-secondary/5 border border-brand-secondary/10 text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary">
                        <span className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-pulse" />
                        Next-Gen Civic Infrastructure
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.85] tracking-tighter text-brand-secondary">
                        RESTORING<br />
                        <span className="text-brand-secondary/30">COMMUNITY</span><br />
                        ELEGANCE.
                    </h1>

                    <p className="text-xl text-brand-secondary/60 max-w-md mb-12 leading-relaxed font-bold">
                        A minimalistic approach to urban problem solving. Report issues with precision and track real-time resolution.
                    </p>

                    <div className="flex flex-wrap gap-5">
                        <button
                            onClick={() => navigate('/citizen/report')}
                            className="btn-primary px-10 py-5 text-sm uppercase font-black tracking-widest shadow-xl shadow-brand-secondary/20 flex items-center gap-3"
                        >
                            <Camera size={18} />
                            Report Instance
                        </button>
                        <button
                            className="btn-secondary px-10 py-5 text-sm uppercase font-black tracking-widest flex items-center gap-3"
                        >
                            <MapPin size={18} />
                            Explore Map
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Subtle Texture Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-10 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/asfalt-light.png')]" />
        </section>
    );
};
