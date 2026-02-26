import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    AlertTriangle, CheckCircle2, Clock, Activity,
    Shield, Zap, TrendingUp
} from 'lucide-react';

interface StatsData {
    totalActive: number;
    reportedToday: number;
    resolvedToday: number;
    avgResolutionHrs: number;
    criticalZones: number;
}

interface CommandHeroProps {
    stats: StatsData;
}

const defaultStats: StatsData = {
    totalActive: 42,
    reportedToday: 12,
    resolvedToday: 8,
    avgResolutionHrs: 18.5,
    criticalZones: 3,
};

/* Animated counter */
const AnimatedCounter: React.FC<{ value: number; suffix?: string; decimals?: number }> = ({
    value, suffix = '', decimals = 0
}) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        const duration = 1200;
        const start = Date.now();
        const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(eased * value);
            if (progress < 1) requestAnimationFrame(tick);
        };
        tick();
    }, [value]);
    return <>{decimals > 0 ? display.toFixed(decimals) : Math.round(display)}{suffix}</>;
};

const getCityStatus = (critical: number) => {
    if (critical >= 5) return { label: 'Operational Warning', color: 'text-red-500', bg: 'bg-red-500/5', dot: 'bg-red-500' };
    if (critical >= 2) return { label: 'Elevated Load', color: 'text-brand-secondary', bg: 'bg-brand-secondary/5', dot: 'bg-brand-secondary' };
    return { label: 'System Stable', color: 'text-brand-secondary', bg: 'bg-brand-secondary/5', dot: 'bg-brand-secondary' };
};

export const CommandHero: React.FC<CommandHeroProps> = ({ stats: s }) => {
    const d = s || defaultStats;
    const status = getCityStatus(d.criticalZones);

    const statCards = [
        { label: 'Active Reports', value: d.totalActive, icon: <AlertTriangle className="w-4 h-4" />, color: 'text-brand-secondary' },
        { label: 'Ingress Today', value: d.reportedToday, icon: <Zap className="w-4 h-4" />, color: 'text-brand-secondary' },
        { label: 'Resolved', value: d.resolvedToday, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-brand-secondary' },
        { label: 'Avg SLA', value: d.avgResolutionHrs, suffix: 'h', decimals: 1, icon: <Clock className="w-4 h-4" />, color: 'text-brand-secondary' },
    ];

    return (
        <section className="mb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-1"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-secondary rounded-xl">
                            <Shield className="w-6 h-6 text-brand-primary" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter text-brand-secondary uppercase">
                            Command Hub
                        </h1>
                    </div>
                    <p className="text-brand-secondary/40 text-xs font-bold uppercase tracking-widest ml-12">
                        Civic Intelligence & Tactical Operations
                    </p>
                </motion.div>

                {/* City status indicator */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl ${status.bg} border border-brand-secondary/10`}
                >
                    <span className={`w-2.5 h-2.5 rounded-full ${status.dot} animate-pulse shadow-[0_0_10px_rgba(84,0,35,0.3)]`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${status.color}`}>{status.label}</span>
                    <Activity className={`w-4 h-4 ${status.color} opacity-40`} />
                </motion.div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="minimal-card p-6 border-b border-brand-secondary/5 group hover:bg-brand-secondary transition-all cursor-default"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] text-brand-secondary/40 font-black uppercase tracking-widest group-hover:text-brand-primary/40 transition-colors">
                                {card.label}
                            </span>
                            <div className="p-1.5 rounded-lg bg-brand-secondary/5 text-brand-secondary group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all">
                                {card.icon}
                            </div>
                        </div>
                        <div className="text-4xl font-black text-brand-secondary group-hover:text-brand-primary tracking-tighter transition-colors">
                            <AnimatedCounter value={card.value} suffix={card.suffix} decimals={card.decimals} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 overflow-hidden">
                            <div className="h-0.5 w-full bg-brand-secondary/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-brand-secondary group-hover:bg-brand-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: '65%' }}
                                    transition={{ duration: 1.5, delay: 0.5 }}
                                />
                            </div>
                            <span className="text-[9px] font-bold text-brand-secondary/30 group-hover:text-brand-primary/30 whitespace-nowrap">
                                +12%
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};
