import React from 'react';
import { WorkerLayout } from '../../components/worker/WorkerLayout';
import { useWorkerData } from '../../hooks/useWorkerData';
import { TrendingUp, Shield, Target, Star, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export const WorkerPerformance: React.FC = () => {
    const { metrics, loading } = useWorkerData();

    if (loading) {
        return (
            <WorkerLayout title="Analytics & Telemetry">
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-brand-secondary/10 border-t-brand-secondary rounded-full animate-spin" />
                </div>
            </WorkerLayout>
        );
    }

    const completionRate = metrics?.total_assigned ? Math.round((metrics.total_resolved / metrics.total_assigned) * 100) : 0;
    const isHero = metrics?.badge_level === 'Real Hero';

    return (
        <WorkerLayout title="Performance Telemetry">
            <div className="max-w-5xl mx-auto py-8">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-brand-secondary tracking-tighter uppercase mb-2">Service Analytics</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/40">Real-time operative performance and HQ feedback metrics.</p>
                    </div>
                    {isHero && (
                        <div className="bg-yellow-400 text-brand-primary px-6 py-2 rounded-full shadow-lg flex items-center gap-2">
                            <Star size={16} fill="currentColor" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Highest Honors OP</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Primary Score */}
                    <div className={`p-10 rounded-[40px] shadow-2xl relative overflow-hidden text-center flex flex-col items-center justify-center ${isHero ? 'bg-brand-secondary text-white' : 'bg-white border border-brand-secondary/5'
                        }`}>
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                        <TrendingUp className={`w-16 h-16 mx-auto mb-6 ${isHero ? 'text-white/20' : 'text-brand-secondary/10'}`} />
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] mb-4 opacity-50">Overall Rating</h2>
                        <div className="text-7xl font-black tracking-tighter mb-2 flex items-center justify-center gap-2">
                            {metrics?.rating_avg || '0.00'}
                        </div>
                        <div className="flex gap-1 text-yellow-400 mt-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} size={24} fill={Number(metrics?.rating_avg) >= star ? "currentColor" : "none"} className={Number(metrics?.rating_avg) >= star ? "" : "text-brand-secondary/20"} />
                            ))}
                        </div>
                        <p className={`mt-6 text-[10px] font-black uppercase tracking-widest ${isHero ? 'text-white/40' : 'text-brand-secondary/40'}`}>
                            Badge Rank: {metrics?.badge_level || 'Probation'}
                        </p>
                    </div>

                    {/* Operational Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-[32px] p-6 border border-brand-secondary/5 shadow-soft text-center flex flex-col items-center justify-center">
                            <Target className="w-8 h-8 text-green-500 mb-3" />
                            <div className="text-4xl font-black text-brand-secondary">{completionRate}%</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/40 mt-1">Resolution Rate</div>
                        </div>
                        <div className="bg-white rounded-[32px] p-6 border border-brand-secondary/5 shadow-soft text-center flex flex-col items-center justify-center">
                            <Shield className="w-8 h-8 text-brand-secondary mb-3" />
                            <div className="text-4xl font-black text-brand-secondary">{metrics?.total_resolved || 0}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/40 mt-1">Total Clearances</div>
                        </div>
                        <div className="bg-white rounded-[32px] p-6 border border-brand-secondary/5 shadow-soft text-center flex flex-col items-center justify-center col-span-2">
                            <RefreshCcw className="w-8 h-8 text-amber-500 mb-3" />
                            <div className="text-4xl font-black text-amber-500">{metrics?.rework_count || 0}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/40 mt-1">Required Reworks (Penalty)</div>
                        </div>
                    </div>
                </div>

                <div className="bg-brand-secondary/5 rounded-[40px] p-8 border border-brand-secondary/10">
                    <h3 className="text-xl font-black text-brand-secondary tracking-tighter uppercase mb-4">HQ Performance Notes</h3>
                    <p className="text-sm font-medium text-brand-secondary/80 leading-relaxed">
                        To achieve the <strong>Real Hero</strong> badge, maintain an average rating above 4.8 and keep rework requests essentially at zero.
                        <strong>Field Champion</strong> status requires a 4.0 average. If your rework penalty count exceeds 3 in a given period, expect closer supervision from HQ Operations.
                    </p>
                </div>
            </div>
        </WorkerLayout>
    );
};
