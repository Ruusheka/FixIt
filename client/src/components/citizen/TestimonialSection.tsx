import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Star, ChevronLeft, ChevronRight, Quote, CheckCircle2 } from 'lucide-react';

interface Testimonial {
    id: string;
    citizen_name: string;
    rating: number;
    message: string;
    before_image_url?: string;
    after_image_url?: string;
    report_id?: string;
}

export const TestimonialSection: React.FC = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTestimonials = async () => {
            const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
            if (data) setTestimonials(data);
        };
        fetchTestimonials();
    }, []);

    const next = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    const prev = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

    if (testimonials.length === 0) return null;

    const current = testimonials[currentIndex];

    return (
        <div className="relative">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
                {/* Visual Evidence */}
                <div className="w-full lg:w-1/2 grid grid-cols-2 gap-4 relative">
                    <div className="space-y-4">
                        <div className="h-64 rounded-[32px] overflow-hidden border border-brand-secondary/5 shadow-2xl relative group">
                            <div className="absolute inset-0 bg-brand-secondary/40 group-hover:bg-transparent transition-colors duration-500 z-10" />
                            {current.before_image_url ? (
                                <img src={current.before_image_url} alt="Before" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-brand-secondary/10 flex items-center justify-center text-[10px] font-black uppercase text-brand-secondary/30">Before Intel</div>
                            )}
                            <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest">Initial Breach</div>
                        </div>
                    </div>
                    <div className="space-y-4 mt-8">
                        <div className="h-64 rounded-[32px] overflow-hidden border border-brand-secondary/5 shadow-2xl relative group">
                            {current.after_image_url ? (
                                <img src={current.after_image_url} alt="After" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-brand-secondary/10 flex items-center justify-center text-[10px] font-black uppercase text-brand-secondary/30">After Intel</div>
                            )}
                            <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-green-500 rounded-full text-[8px] font-black text-white uppercase tracking-widest">Mission Success</div>
                            <div className="absolute inset-0 bg-green-500/10 pointer-events-none" />
                        </div>
                    </div>

                    {/* Floating Badge */}
                    <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl border border-brand-secondary/5"
                    >
                        <CheckCircle2 size={32} className="text-green-500" />
                    </motion.div>
                </div>

                {/* Content */}
                <div className="w-full lg:w-1/2 space-y-8">
                    <Quote size={48} className="text-brand-secondary/5" />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={14}
                                        fill={i < current.rating ? "currentColor" : "none"}
                                        className={i < current.rating ? "text-yellow-500" : "text-brand-secondary/10"}
                                    />
                                ))}
                            </div>

                            <h3 className="text-3xl font-black text-brand-secondary uppercase tracking-lighter leading-tight">
                                "{current.message}"
                            </h3>

                            <div className="flex items-center justify-between pt-8 border-t border-brand-secondary/5">
                                <div>
                                    <p className="text-sm font-black text-brand-secondary uppercase tracking-tight">{current.citizen_name}</p>
                                    <p className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-[0.2em]">Verified Resident</p>
                                </div>

                                {current.report_id && (
                                    <button
                                        onClick={() => navigate(`/citizen/reports/${current.report_id}`)}
                                        className="text-[10px] font-black text-brand-secondary uppercase tracking-widest px-6 py-3 bg-brand-secondary/5 rounded-2xl hover:bg-brand-secondary/10 transition-colors"
                                    >
                                        View Resolved Report
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex gap-4">
                        <button onClick={prev} className="p-4 rounded-full border border-brand-secondary/5 hover:bg-brand-secondary/5 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={next} className="p-4 rounded-full border border-brand-secondary/5 hover:bg-brand-secondary/10 bg-brand-secondary/5 transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
