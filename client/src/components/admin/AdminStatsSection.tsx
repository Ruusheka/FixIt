import React from 'react';
import { motion } from 'framer-motion';
import {
    ClipboardCheck,
    Clock,
    CheckCircle2,
    AlertCircle,
    ShieldAlert,
    Zap
} from 'lucide-react';
import { Report } from '../../types/reports';

interface StatCardProps {
    label: string;
    value: number | string;
    icon: React.ElementType;
    color: string;
    delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: 'easeOut' }}
        whileHover={{ y: -5 }}
        className="minimal-card p-6 flex flex-col justify-between"
    >
        <div className="flex items-start justify-between">
            <div className={`p-3 rounded-xl bg-opacity-10 ${color}`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-[0.2em]">FixIt Hub</span>
                <div className={`h-1.5 w-1.5 rounded-full mt-1 ${color}`} />
            </div>
        </div>

        <div className="mt-4">
            <motion.h4
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="text-4xl font-black tracking-tighter text-brand-secondary"
            >
                {value}
            </motion.h4>
            <p className="text-sm font-bold text-brand-secondary/40 uppercase tracking-widest mt-1">
                {label}
            </p>
        </div>
    </motion.div>
);

interface AdminStatsSectionProps {
    reports: Report[];
}

export const AdminStatsSection: React.FC<AdminStatsSectionProps> = ({ reports }) => {
    const total = reports.length;
    const open = reports.filter(r => r.status === 'reported').length;
    const inProgress = reports.filter(r => r.status === 'in_progress').length;
    const resolved = reports.filter(r => r.status === 'resolved').length;

    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const overdue = reports.filter(r =>
        r.status !== 'resolved' && new Date(r.created_at) < seventyTwoHoursAgo
    ).length;

    const escalated = reports.filter(r => r.is_escalated).length;

    const stats = [
        { label: 'Total Reports', value: total, icon: ClipboardCheck, color: 'bg-brand-secondary' },
        { label: 'Open', value: open, icon: Zap, color: 'bg-brand-secondary' },
        { label: 'In Progress', value: inProgress, icon: Clock, color: 'bg-brand-secondary' },
        { label: 'Resolved', value: resolved, icon: CheckCircle2, color: 'bg-green-500' },
        { label: 'Overdue', value: overdue, icon: AlertCircle, color: 'bg-red-500' },
        { label: 'Escalated', value: escalated, icon: ShieldAlert, color: 'bg-red-700' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {stats.map((stat, i) => (
                <StatCard
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    icon={stat.icon}
                    color={stat.color}
                    delay={i * 0.1}
                />
            ))}
        </div>
    );
};
