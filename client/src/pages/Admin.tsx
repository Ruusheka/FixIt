import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../services/supabase';
import { socket } from '../services/socket';
import { useAuth } from '../hooks/useAuth';
import {
    BarChart3,
    Shield,
    ClipboardCheck,
    Radio,
    DollarSign,
    Users,
    AlertTriangle,
    Zap,
    CheckCircle2,
    TrendingDown,
    ArrowRight
} from 'lucide-react';
import { MinimalLayout } from '../components/MinimalLayout';

// Admin components
import { CommandHero } from '../components/admin/CommandHero';
import { ReportAnalytics } from '../components/admin/ReportAnalytics';
import { SLATracker } from '../components/admin/SLATracker';
import { LiveIssuePanel } from '../components/admin/LiveIssuePanel';
import { WorkerAssignModal } from '../components/admin/WorkerAssignModal';
import { VerificationPanel } from '../components/admin/VerificationPanel';
import { HeatmapSection } from '../components/admin/HeatmapSection';
import { AIDispatchPanel } from '../components/admin/AIDispatchPanel';
import { ResourceLoad } from '../components/admin/ResourceLoad';
import { BroadcastCenter } from '../components/admin/BroadcastCenter';
import { BudgetPanel } from '../components/admin/BudgetPanel';

/* ── Types ── */
interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    role: 'citizen' | 'worker' | 'admin';
    created_at: string;
}

const navItems = [
    { label: 'Overview', path: '/admin', icon: BarChart3 },
    { label: 'Reports Hub', path: '/reports', icon: ClipboardCheck },
    { label: 'Operations', path: '/admin#ops', icon: Shield },
    { label: 'Broadcast', path: '/admin#broadcast', icon: Radio },
    { label: 'Finances', path: '/admin#budget', icon: DollarSign },
    { label: 'Userbase', path: '/admin#users', icon: Users },
];

export const AdminDashboard: React.FC = () => {
    const { profile: adminProfile } = useAuth();
    const [issues, setIssues] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [activeSection, setActiveSection] = useState('overview');
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<any | null>(null);

    useEffect(() => {
        fetchIssues();
        fetchProfiles();

        socket.on('new_issue', (issue: any) => setIssues(prev => [issue, ...prev]));
        socket.on('issue_updated', (updated: any) =>
            setIssues(prev => prev.map(i => i.id === updated.id ? updated : i))
        );

        return () => {
            socket.off('new_issue');
            socket.off('issue_updated');
        };
    }, []);

    const fetchIssues = async () => {
        const { data } = await supabase.from('issues').select('*').order('created_at', { ascending: false });
        if (data) setIssues(data);
    };

    const fetchProfiles = async () => {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (data) setProfiles(data);
    };

    const updateStatus = async (id: string, status: string) => {
        await supabase.from('issues').update({ status }).eq('id', id);
        fetchIssues();
    };

    const updateUserRole = async (userId: string, newRole: 'citizen' | 'worker') => {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        if (!error) fetchProfiles();
    };

    const handleAssign = (issue: any) => {
        setSelectedIssue(issue);
        setAssignModalOpen(true);
    };

    const handleAssignSubmit = async (issueId: string, data: any) => {
        await supabase.from('issues').update({
            status: 'assigned',
            assigned_worker: data.worker,
        }).eq('id', issueId);
        fetchIssues();
    };

    const statsData = {
        totalActive: issues.filter(i => !['resolved', 'verified', 'rejected'].includes(i.status)).length,
        reportedToday: issues.filter(i => new Date(i.created_at).toDateString() === new Date().toDateString()).length,
        resolvedToday: issues.filter(i => i.status === 'resolved' && new Date(i.created_at).toDateString() === new Date().toDateString()).length,
        avgResolutionHrs: 18.5,
        criticalZones: issues.filter(i => (i.risk_score || 0) > 0.7 || (i.severity || 0) >= 8).length,
    };

    return (
        <MinimalLayout navItems={navItems} title="Admin Command Center">
            <div className="space-y-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Active Reports', value: statsData.totalActive, icon: Zap, trend: '-12% vs last week' },
                        { label: 'Critical Zones', value: statsData.criticalZones, icon: AlertTriangle, trend: '+2 new risk areas' },
                        { label: 'Resolved Today', value: statsData.resolvedToday, icon: CheckCircle2, trend: 'SLA: 98.4%' },
                        { label: 'Avg Latency', value: `${statsData.avgResolutionHrs}h`, icon: TrendingDown, trend: '-2.4h improvement' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="minimal-card p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-brand-secondary/5 rounded-xl border border-brand-secondary/10">
                                    <stat.icon size={20} className="text-brand-secondary" />
                                </div>
                                <span className="text-[10px] font-bold text-brand-secondary/30 uppercase tracking-widest leading-none mt-1">
                                    Live Metrics
                                </span>
                            </div>
                            <h4 className="text-3xl font-bold tracking-tight mb-1">{stat.value}</h4>
                            <p className="text-sm font-medium text-brand-secondary/40">{stat.label}</p>
                            <div className="mt-4 pt-4 border-t border-brand-secondary/5 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-brand-secondary/60">{stat.trend}</span>
                                <ArrowRight size={12} className="text-brand-secondary/20" />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content: Intelligence & Analytics */}
                <div className="space-y-12">
                    <section className="space-y-8">
                        <div className="flex items-center justify-between border-b border-brand-secondary/5 pb-6">
                            <div>
                                <h3 className="text-2xl font-black tracking-tighter text-brand-secondary uppercase">System Intelligence</h3>
                                <p className="text-[10px] font-bold text-brand-secondary/30 uppercase tracking-widest mt-1">Global performance & SLA response metrics</p>
                            </div>
                            <div className="flex gap-2">
                                {['24h', '7d', '30d'].map(t => (
                                    <button key={t} className="px-4 py-1.5 text-[10px] font-black border border-brand-secondary/10 rounded-xl hover:bg-brand-secondary/5 transition-all uppercase tracking-widest">
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <ReportAnalytics />
                    </section>

                    <section className="space-y-8">
                        <div className="flex items-center justify-between border-b border-brand-secondary/5 pb-6">
                            <div>
                                <h3 className="text-2xl font-black tracking-tighter text-brand-secondary uppercase">Active Operations</h3>
                                <p className="text-[10px] font-bold text-brand-secondary/30 uppercase tracking-widest mt-1">Real-time incident response queue</p>
                            </div>
                            <button className="text-[10px] font-black text-brand-secondary opacity-40 hover:opacity-100 uppercase tracking-widest flex items-center gap-2 transition-all">
                                Expand Repository <ArrowRight size={14} />
                            </button>
                        </div>
                        <LiveIssuePanel issues={issues} onAssign={handleAssign} onUpdateStatus={updateStatus} />
                    </section>
                </div>

                {/* Intelligence & Resources Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <AIDispatchPanel />
                    <ResourceLoad />
                </div>
            </div>

            <WorkerAssignModal
                isOpen={assignModalOpen}
                issue={selectedIssue}
                onClose={() => setAssignModalOpen(false)}
                onAssign={handleAssignSubmit}
            />
        </MinimalLayout >
    );
};
