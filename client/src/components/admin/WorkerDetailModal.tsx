import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, CheckCircle2, AlertTriangle, TrendingUp, Clock, MapPin } from 'lucide-react';
import { Worker } from '../../types/reports';

interface WorkerDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    worker: Worker | null;
}

export const WorkerDetailModal: React.FC<WorkerDetailModalProps> = ({
    isOpen,
    onClose,
    worker
}) => {
    if (!worker) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-brand-secondary/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden border border-brand-secondary/5"
                    >
                        {/* Header Banner */}
                        <div className="h-32 bg-brand-secondary relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10">
                                <Activity className="w-64 h-64 -rotate-12 absolute -right-10 -top-10" />
                            </div>
                            <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white z-20">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-10 pb-10 -mt-12 relative z-10">
                            <div className="flex flex-col md:flex-row items-end gap-6 mb-10">
                                <div className="w-24 h-24 rounded-[32px] bg-white border-8 border-white shadow-xl flex items-center justify-center font-black text-3xl text-brand-secondary overflow-hidden">
                                    {worker.profile?.avatar_url ? (
                                        <img src={worker.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        (worker.profile?.full_name?.[0] || 'W').toUpperCase()
                                    )}
                                </div>
                                <div className="pb-2">
                                    <h3 className="text-3xl font-black text-brand-secondary tracking-tighter uppercase">{worker.profile?.full_name || 'Personnel'}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-secondary/5 border border-brand-secondary/10 rounded-full text-[9px] font-black uppercase tracking-widest text-brand-secondary">
                                            <Briefcase size={10} /> {worker.department?.name || 'FIELD OPS'}
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[9px] font-black uppercase tracking-widest text-green-600">
                                            Status: {worker.status}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                                <StatCard label="Resolved" value={worker.metrics?.total_resolved || 0} icon={CheckCircle2} />
                                <StatCard label="Active missions" value={worker.metrics?.total_assigned || 0} icon={Briefcase} />
                                <StatCard label="Overdue" value={worker.metrics?.total_overdue || 0} icon={AlertTriangle} color="text-red-600" />
                                <StatCard label="Perf Score" value={`${worker.metrics?.performance_score || 0}%`} icon={TrendingUp} />
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] border-b border-brand-secondary/5 pb-4">Operational History & Metrics</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-bold text-brand-secondary/40">Efficiency Rating</span>
                                            <span className="font-black text-brand-secondary text-lg">A+</span>
                                        </div>
                                        <div className="h-2 bg-brand-primary/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-brand-secondary w-[92%]" />
                                        </div>
                                        <p className="text-[10px] text-brand-secondary/30 font-bold uppercase leading-relaxed font-black">
                                            Top 5% of resolution efficiency in the {worker.department?.name} sector.
                                        </p>
                                    </div>
                                    <div className="bg-brand-primary/5 rounded-3xl p-6 border border-brand-secondary/5 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-brand-secondary/40" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/60">Avg Response Time</span>
                                        </div>
                                        <p className="text-3xl font-black text-brand-secondary tracking-tight">{worker.metrics?.avg_resolution_time || '4.2h'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: any; color?: string }> = ({ label, value, icon: Icon, color }) => (
    <div className="p-4 bg-brand-primary/5 rounded-3xl border border-brand-secondary/5">
        <label className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] flex items-center gap-1.5 mb-2">
            <Icon size={10} /> {label}
        </label>
        <p className={`text-xl font-black text-brand-secondary tracking-tight ${color || ''}`}>{value}</p>
    </div>
);

import { Activity } from 'lucide-react';
