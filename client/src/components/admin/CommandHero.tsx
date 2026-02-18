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
    if (critical >= 5) return { label: 'Critical Zones Detected', color: 'text-red-400', bg: 'bg-red-500/20', dot: 'bg-red-500' };
    if (critical >= 2) return { label: 'Moderate Load', color: 'text-orange-400', bg: 'bg-orange-500/20', dot: 'bg-orange-500' };
    return { label: 'Stable', color: 'text-green-400', bg: 'bg-green-500/20', dot: 'bg-green-500' };
};

export const CommandHero: React.FC<CommandHeroProps> = ({ stats: s }) => {
    const d = s || defaultStats;
    const status = getCityStatus(d.criticalZones);

    const statCards = [
        { label: 'Active Issues', value: d.totalActive, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-400', border: 'border-red-500/20' },
        { label: 'Reported Today', value: d.reportedToday, icon: <Zap className="w-5 h-5" />, color: 'text-orange-400', border: 'border-orange-500/20' },
        { label: 'Resolved Today', value: d.resolvedToday, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-green-400', border: 'border-green-500/20' },
        { label: 'Avg Resolution', value: d.avgResolutionHrs, suffix: 'h', decimals: 1, icon: <Clock className="w-5 h-5" />, color: 'text-blue-400', border: 'border-blue-500/20' },
    ];

    return (
        <section className="mb-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-3 mb-1">
                        <Shield className="w-7 h-7 text-civic-orange" />
                        <h1 className="text-2xl md:text-3xl font-bold text-white">FixIt Command Center</h1>
                    </div>
                    <p className="text-civic-muted text-sm ml-10">Real-time civic intelligence & operational control</p>
                </motion.div>

                {/* City status indicator */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl ${status.bg} border border-white/5`}
                >
                    <span className={`w-2.5 h-2.5 rounded-full ${status.dot} animate-pulse`} />
                    <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
                    <Activity className={`w-4 h-4 ${status.color}`} />
                </motion.div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className={`glass-card p-5 border-l-2 ${card.border}`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-civic-muted font-medium uppercase tracking-wider">{card.label}</span>
                            <span className={card.color}>{card.icon}</span>
                        </div>
                        <div className="text-3xl font-bold text-white">
                            <AnimatedCounter value={card.value} suffix={card.suffix} decimals={card.decimals} />
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-civic-muted">
                            <TrendingUp className="w-3 h-3 text-green-400" />
                            <span>vs yesterday</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};
