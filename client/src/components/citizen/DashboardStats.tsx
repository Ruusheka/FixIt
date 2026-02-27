import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import { supabase } from '../../services/supabase';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    TrendingUp,
    Users,
    Shield,
    Target
} from 'lucide-react';

interface Stats {
    total: number;
    resolved: number;
    inProgress: number;
    highRisk: number;
    citizens: number;
    workers: number;
}

const AnimatedNumber = ({ value }: { value: number }) => {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return <motion.span>{display}</motion.span>;
};

const StatCard = ({ label, value, icon: Icon, color, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay }}
        className="minimal-card p-8 bg-white/50 border-brand-secondary/5 hover:border-brand-secondary/20 transition-all group"
    >
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-opacity-100`}>
                <Icon size={24} />
            </div>
            <TrendingUp size={16} className="text-brand-secondary/10 group-hover:text-brand-secondary/30 transition-colors" />
        </div>
        <div>
            <div className="text-4xl font-black text-brand-secondary tracking-tighter mb-1">
                <AnimatedNumber value={value} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary/40 whitespace-nowrap">
                {label}
            </p>
        </div>
    </motion.div>
);

export const DashboardStats: React.FC = () => {
    const [stats, setStats] = useState<Stats>({
        total: 0,
        resolved: 0,
        inProgress: 0,
        highRisk: 0,
        citizens: 0,
        workers: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Total Issues
                const { count: total } = await supabase.from('issues').select('*', { count: 'exact', head: true });

                // Resolved
                const { count: resolved } = await supabase.from('issues').select('*', { count: 'exact', head: true })
                    .in('status', ['resolved', 'RESOLVED', 'closed', 'CLOSED']);

                // In Progress
                const { count: inProgress } = await supabase.from('issues').select('*', { count: 'exact', head: true })
                    .eq('status', 'in_progress');

                // High Risk
                const { count: highRisk } = await supabase.from('issues').select('*', { count: 'exact', head: true })
                    .gt('risk_score', 0.7);

                // Active Citizens
                const { count: citizens } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
                    .eq('role', 'citizen');

                // Active Workers
                const { count: workers } = await supabase.from('workers').select('*', { count: 'exact', head: true });

                setStats({
                    total: total || 0,
                    resolved: resolved || 0,
                    inProgress: inProgress || 0,
                    highRisk: highRisk || 0,
                    citizens: citizens || 0,
                    workers: workers || 0
                });
            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <StatCard
                label="Issues Reported"
                value={stats.total}
                icon={AlertCircle}
                color="text-brand-secondary bg-brand-secondary"
                delay={0}
            />
            <StatCard
                label="Issues Resolved"
                value={stats.resolved}
                icon={CheckCircle2}
                color="text-green-500 bg-green-500"
                delay={0.1}
            />
            <StatCard
                label="In Progress"
                value={stats.inProgress}
                icon={Clock}
                color="text-blue-500 bg-blue-500"
                delay={0.2}
            />
            <StatCard
                label="High Risk"
                value={stats.highRisk}
                icon={Shield}
                color="text-red-500 bg-red-500"
                delay={0.3}
            />
            <StatCard
                label="Active Citizens"
                value={stats.citizens}
                icon={Users}
                color="text-purple-500 bg-purple-500"
                delay={0.4}
            />
            <StatCard
                label="Active Workers"
                value={stats.workers}
                icon={Target}
                color="text-brand-secondary bg-brand-secondary"
                delay={0.5}
            />
        </div>
    );
};
